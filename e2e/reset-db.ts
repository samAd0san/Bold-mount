// Empties the boldmount_e2e test database before a test run (npm run seed then reloads the catalog).
import 'dotenv/config';
import mongoose from 'mongoose';

const DB = process.env.MONGODB_DB;
if (DB !== 'boldmount_e2e') throw new Error(`refusing: MONGODB_DB is "${DB}", not boldmount_e2e`);

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
