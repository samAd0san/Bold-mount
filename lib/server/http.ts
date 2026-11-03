import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

const NO_STORE = { 'Cache-Control': 'no-store' };

export const ok = <T>(data: T, status = 200) => NextResponse.json(data, { status, headers: NO_STORE });

/** Error reply `{ error, ...extra }`; extra carries things like `left` or `waitMinutes`. */
export const fail = (status: number, error: string, extra?: Record<string, unknown>) =>
  NextResponse.json({ error, ...extra }, { status, headers: NO_STORE });

/** Request body as JSON; an empty or broken body becomes `{}` so validation gives the error. */
export const readJson = (req: Request): Promise<unknown> => req.json().catch(() => ({}));

const DB_DOWN = /MONGODB|Mongo(?:Server|Network|Parse)|MongooseServer|ECONNREFUSED|querySrv|Server selection/i;

/** Wraps a route handler: bad input → 400, duplicate → 409, database down → 503, anything else → 500. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ZodError) return fail(400, err.issues[0]?.message || 'Some fields are not valid.');
      const e = err as { code?: number; name?: string; message?: string };
      if (e?.code === 11000) return fail(409, 'That name or link is already taken.');
      const msg = `${e?.name ?? ''} ${e?.message ?? String(err)}`;
      if (DB_DOWN.test(msg)) {
        console.error('[db]', msg);
        return fail(503, 'Could not reach the database. Please try again.');
      }
      console.error('[api]', err);
      return fail(500, 'Something went wrong on our side.');
    }
  };
}
