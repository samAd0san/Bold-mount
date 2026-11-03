import 'server-only';
import mongoose from 'mongoose';

export const DB_NAME = process.env.MONGODB_DB || 'boldmount';

// The Atlas cluster is shared with other projects; refuse to run against any database that isn't ours.
if (!/^boldmount([-_][a-z0-9]+)?$/i.test(DB_NAME)) {
  throw new Error(`MONGODB_DB must be "boldmount" (or boldmount-<suffix>), got "${DB_NAME}"`);
}

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = globalThis as unknown as { __bmMongo?: Cache };
const cache: Cache = g.__bmMongo ?? (g.__bmMongo = { conn: null, promise: null });

/** One shared connection per server process (dev hot-reload safe). */
export async function connectDb() {
  if (cache.conn) return cache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  cache.promise ??= mongoose.connect(uri, { dbName: DB_NAME, maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}

/** The raw driver db, for small collections without a model (visits, settings, counters). */
export async function db() {
  return (await connectDb()).connection.db!;
}
