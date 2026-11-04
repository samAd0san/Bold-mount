import 'server-only';
import { after } from 'next/server';
import * as Ably from 'ably';
import { DB_NAME } from '@/lib/server/db';

// Live updates go through Ably (Vercel can't keep WebSockets open). Channels, prefixed with the db name so test runs never reach real visitors:
//   <db>:catalog       - anyone: a category or product changed
//   <db>:admin         - admin only: an "order", "form" or "user" changed
//   <db>:orders:<uid>  - that customer only: one of their orders changed
const key = () => process.env.ABLY_API_KEY?.trim() || null;

let rest: Ably.Rest | null = null;
const client = () => (rest ??= new Ably.Rest({ key: key()! }));
const ns = (channel: string) => `${DB_NAME}:${channel}`;

export const liveEnabled = () => !!key();

/** Sends a small "something changed" message after the response (never the data itself; pages refetch it with their own auth). */
export function notify(channel: string, name: string, data: Record<string, unknown> = {}) {
  if (!key()) return;
  const send = () => client().channels.get(ns(channel)).publish(name, data).catch((err: unknown) => console.error('[live]', channel, name, err));
  try {
    after(send);
  } catch {
    void send(); // outside a request (scripts)
  }
}

/** A short-lived token that lets this browser listen to the catalog, plus its own orders and/or the admin channel. */
export async function liveGrant(opts: { uid: string | null; admin: boolean }) {
  const capability: Record<string, ['subscribe']> = { [ns('catalog')]: ['subscribe'] };
  if (opts.uid) capability[ns(`orders:${opts.uid}`)] = ['subscribe'];
  if (opts.admin) capability[ns('admin')] = ['subscribe'];
  const tokenRequest = await client().auth.createTokenRequest({ capability: JSON.stringify(capability), ttl: 60 * 60 * 1000 });
  return { tokenRequest, prefix: DB_NAME, uid: opts.uid, admin: opts.admin };
}
