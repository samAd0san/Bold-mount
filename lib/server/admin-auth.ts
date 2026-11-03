import 'server-only';
import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { statsDb } from '@/lib/server/analytics';
import { rejectCrossSite } from '@/lib/server/auth';
import { fail } from '@/lib/server/http';

const COOKIE = 'bm_admin';
const SESSION_MS = 12 * 60 * 60 * 1000;
const DEFAULT_PIN = '1111';
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TRIES = 5;
// Backstop for a spoofed x-forwarded-for: a 4-digit PIN must not be guessable by rotating "clients".
const MAX_TRIES_ALL = 30;

export const PIN_RE = /^\d{4,8}$/;

type AdminSettings = { _id: string; pinHash: string; pinSalt: string; pinLength: number; secret: string; updatedAt: Date };

const hashPin = (pin: string, salt: string) =>
  new Promise<string>((resolve, reject) =>
    scrypt(pin, salt, 64, (err, key) => (err ? reject(err) : resolve(key.toString('hex')))),
  );

const sameHex = (a: string, b: string) => {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && timingSafeEqual(x, y);
};

async function settingsCol() {
  return (await statsDb()).collection<AdminSettings>('settings');
}

async function freshSecrets(pin: string) {
  const pinSalt = randomBytes(16).toString('hex');
  return { pinSalt, pinHash: await hashPin(pin, pinSalt), pinLength: pin.length, secret: randomBytes(32).toString('hex'), updatedAt: new Date() };
}

/** The admin settings doc; created with the default PIN on first use. */
async function settings(): Promise<AdminSettings> {
  const col = await settingsCol();
  const found = await col.findOne({ _id: 'admin' });
  if (found) return found;
  await col.updateOne({ _id: 'admin' }, { $setOnInsert: await freshSecrets(DEFAULT_PIN) }, { upsert: true });
  return (await col.findOne({ _id: 'admin' }))!;
}

export async function pinLength() {
  return (await settings()).pinLength;
}

const sign = (secret: string, exp: number) => createHmac('sha256', secret).update(`admin:${exp}`).digest('base64url');

async function setSession(secret: string) {
  const exp = Date.now() + SESSION_MS;
  (await cookies()).set(COOKIE, `${exp}.${sign(secret, exp)}`, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MS / 1000,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

/** True when the request carries a valid, unexpired admin cookie signed with the current secret. */
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  const m = token?.match(/^(\d{13})\.([\w-]{43})$/);
  if (!m || Number(m[1]) < Date.now()) return false;
  const { secret } = await settings();
  const want = Buffer.from(sign(secret, Number(m[1])));
  const got = Buffer.from(m[2]);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** Gate for admin routes: null when allowed, else the 401 (no PIN session) or 403 (write from another site) response. */
export async function adminOnly(req: Request, write = false): Promise<Response | null> {
  if (!(await isAdmin())) return fail(401, 'Please enter your PIN.');
  return write ? rejectCrossSite(req) : null;
}

/** Rate-limit key: a hash of IP + user agent, so raw IPs are never stored. */
async function clientKey() {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local';
  return createHash('sha256').update(`${ip}|${h.get('user-agent') ?? ''}`).digest('hex').slice(0, 32);
}

export type Guard = { ok: true; key: string; left: number } | { ok: false; waitMinutes: number };

/** Sliding window: max 5 wrong PINs per 10 minutes per client. */
export async function checkTries(): Promise<Guard> {
  const key = await clientKey();
  const attempts = (await statsDb()).collection<{ key: string; ts: Date }>('admin_attempts');
  const since = new Date(Date.now() - WINDOW_MS);
  const [mine, all] = await Promise.all([
    attempts.find({ key, ts: { $gte: since } }).sort({ ts: 1 }).limit(MAX_TRIES).toArray(),
    attempts.countDocuments({ ts: { $gte: since } }),
  ]);
  if (mine.length >= MAX_TRIES) return { ok: false, waitMinutes: minutesUntil(mine[0].ts) };
  if (all >= MAX_TRIES_ALL) {
    const oldest = await attempts.find({ ts: { $gte: since } }).sort({ ts: 1 }).limit(1).next();
    return { ok: false, waitMinutes: minutesUntil(oldest?.ts ?? new Date()) };
  }
  return { ok: true, key, left: MAX_TRIES - mine.length };
}

const minutesUntil = (oldest: Date) => Math.max(1, Math.ceil((oldest.getTime() + WINDOW_MS - Date.now()) / 60000));

export const tooMany = (minutes: number) => `Too many tries. Wait ${minutes} minute${minutes === 1 ? '' : 's'}.`;

/** Records a wrong PIN; returns tries left (0 = now locked) and the wait if locked. */
export async function failTry(guard: { key: string; left: number }) {
  await (await statsDb()).collection('admin_attempts').insertOne({ key: guard.key, ts: new Date() });
  const left = guard.left - 1;
  return { left, waitMinutes: left > 0 ? 0 : 10 };
}

async function clearTries(key: string) {
  await (await statsDb()).collection('admin_attempts').deleteMany({ key });
}

export async function pinMatches(pin: string) {
  if (!PIN_RE.test(pin)) return false;
  const s = await settings();
  return sameHex(await hashPin(pin, s.pinSalt), s.pinHash);
}

/** Correct PIN → session cookie. Caller has already passed checkTries(). */
export async function logIn(key: string) {
  await clearTries(key);
  await setSession((await settings()).secret);
}

/** New PIN + new signing secret (signs out every other session), then re-signs this one. */
export async function changePin(key: string, next: string) {
  const fresh = await freshSecrets(next);
  await (await settingsCol()).updateOne({ _id: 'admin' }, { $set: fresh });
  await clearTries(key);
  await setSession(fresh.secret);
}
