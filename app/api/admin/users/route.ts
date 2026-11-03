import { adminOnly } from '@/lib/server/admin-auth';
import { periodRange } from '@/lib/server/admin-stats';
import { connectDb } from '@/lib/server/db';
import { handle, ok } from '@/lib/server/http';
import { OrderModel, UserModel } from '@/lib/server/models';

export const GET = handle(async (req: Request) => {
  const denied = await adminOnly(req);
  if (denied) return denied;
  await connectDb();
  const week = periodRange('week');
  const [total, newWeek, docs] = await Promise.all([
    UserModel.countDocuments({}),
    UserModel.countDocuments({ createdAt: { $gte: week.from, $lt: week.to } }),
    UserModel.find({}).sort({ createdAt: -1 }).limit(300).lean(),
  ]);
  const counts = await OrderModel.aggregate<{ _id: string; n: number }>([
    { $match: { userId: { $in: docs.map((u) => String(u._id)) } } },
    { $group: { _id: '$userId', n: { $sum: 1 } } },
  ]);
  const byUser = new Map(counts.map((c) => [c._id, c.n]));
  return ok({
    total,
    newWeek,
    users: docs.map((u) => ({
      id: String(u._id),
      name: u.name || u.email.split('@')[0],
      email: u.email,
      ...(u.avatar ? { avatar: u.avatar } : {}),
      createdAt: new Date(u.createdAt).toISOString(),
      ...(u.lastLoginAt ? { lastLoginAt: new Date(u.lastLoginAt).toISOString() } : {}),
      orders: byUser.get(String(u._id)) ?? 0,
    })),
  });
});
