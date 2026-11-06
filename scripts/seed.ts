// Loads the original categories and products into MongoDB (npm run seed). Only adds what's missing — never overwrites admin edits.
import 'dotenv/config';
import mongoose from 'mongoose';
import { SEED_CATEGORIES } from '../lib/seed/categories';
import { SEED_PRODUCTS } from '../lib/seed/products';

const DB = process.env.MONGODB_DB || 'boldmount';
if (!/^boldmount([-_][a-z0-9]+){0,2}$/i.test(DB)) throw new Error(`refusing: MONGODB_DB is "${DB}", not boldmount`);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, { dbName: DB, serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db!;
  const now = new Date();
  const added = { categories: 0, products: 0 };

  for (const c of SEED_CATEGORIES) {
    const r = await db.collection('categories').updateOne(
      { slug: c.slug },
      { $setOnInsert: { ...c, active: true, createdAt: now, updatedAt: now } },
      { upsert: true },
    );
    added.categories += r.upsertedCount;
  }
  for (const [i, p] of SEED_PRODUCTS.entries()) {
    const r = await db.collection('products').updateOne(
      { slug: p.slug },
      { $setOnInsert: { ...p, details: p.details ?? [], active: true, sort: i + 1, createdAt: now, updatedAt: now } },
      { upsert: true },
    );
    added.products += r.upsertedCount;
  }
  console.log(`db "${DB}": added ${added.categories} categories, ${added.products} products`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
