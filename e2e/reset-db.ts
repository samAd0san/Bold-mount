// Empties the test database (boldmount_e2e, or boldmount_e2e_<suffix> for a parallel copy) before a test run.
import 'dotenv/config';
import mongoose from 'mongoose';

const DB = process.env.MONGODB_DB;
if (!/^boldmount_e2e(_[a-z0-9]+)?$/.test(DB ?? '')) throw new Error(`refusing: MONGODB_DB is "${DB}", not a boldmount_e2e test database`);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, { dbName: DB, serverSelectionTimeoutMS: 10000 });
  const cols = await mongoose.connection.db!.collections();
  for (const c of cols) await c.deleteMany({});
  console.log(`db "${DB}": emptied ${cols.length} collections`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
