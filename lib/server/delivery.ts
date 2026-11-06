import 'server-only';
import { DEFAULT_DELIVERY, type DeliverySettings } from '@/lib/delivery';
import { db } from '@/lib/server/db';

type DeliveryDoc = DeliverySettings & { _id: 'delivery'; updatedAt: Date };
const settingsCol = async () => (await db()).collection<DeliveryDoc>('settings');

/** The one reader of the delivery settings: what the owner saved, or the defaults until they save once. */
export async function readDelivery(): Promise<DeliverySettings> {
  const doc = await (await settingsCol()).findOne({ _id: 'delivery' }, { projection: { fee: 1, freeAbove: 1 } });
  return doc ? { fee: doc.fee, freeAbove: doc.freeAbove } : { ...DEFAULT_DELIVERY };
}

/** Saves already-checked settings (see parseDelivery in lib/delivery.ts). */
export async function saveDelivery(next: DeliverySettings) {
  await (await settingsCol()).updateOne({ _id: 'delivery' }, { $set: { ...next, updatedAt: new Date() } }, { upsert: true });
}
