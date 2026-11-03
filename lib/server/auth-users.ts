import 'server-only';
import { connectDb } from '@/lib/server/db';
import { UserModel } from '@/lib/server/models';
import { isObjectId } from '@/lib/server/slug';
import type { Customer } from '@/lib/types';

export type GoogleProfile = { sub: string; email: string; name: string; picture: string | null };

type UserLike = { _id: unknown; name?: string | null; email: string; avatar?: string | null };

export const toCustomer = (u: UserLike): Customer => ({
  id: String(u._id), name: u.name || u.email.split('@')[0], email: u.email, ...(u.avatar ? { avatar: u.avatar } : {}),
});

export async function findUserById(id: string): Promise<Customer | null> {
  if (!isObjectId(id)) return null;
  await connectDb();
  const u = await UserModel.findById(id).lean();
  return u ? toCustomer(u) : null;
}

/** Finds the customer by Google id (or email), creates them on first sign-in, and refreshes name / photo / last login. */
export async function upsertGoogleUser(p: GoogleProfile): Promise<Customer> {
  await connectDb();
  const set = { name: p.name, googleId: p.sub, lastLoginAt: new Date(), ...(p.picture ? { avatar: p.picture } : {}) };
  const existing = (await UserModel.findOne({ googleId: p.sub })) ?? (await UserModel.findOne({ email: p.email }));
  if (existing) {
    existing.set(set);
    await existing.save();
    return toCustomer(existing);
  }
  const created = await UserModel.create({ email: p.email, ...set });
  return toCustomer(created);
}
