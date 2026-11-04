'use client';

import Image from 'next/image';
import { Users } from 'lucide-react';
import { clock, useFetch } from '@/components/admin/api';
import { Empty, ErrorNote, PageHead, Skeleton } from '@/components/admin/ui';
import { useLive } from '@/lib/live';

type Row = { id: string; name: string; email: string; avatar?: string; createdAt: string; lastLoginAt?: string; orders: number };
type Data = { total: number; newWeek: number; users: Row[] };

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl border bg-pearl p-4 shadow-card sm:p-5">
      <p className="text-[13px] font-semibold text-ink-soft">{label}</p>
      <p className="mt-2 text-[28px] leading-none font-semibold tracking-tight text-navy tabular-nums">{value ?? '—'}</p>
    </div>
  );
}

function Avatar({ user }: { user: Row }) {
  const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase();
  if (user.avatar) {
    return <Image src={user.avatar} alt="" width={40} height={40} unoptimized referrerPolicy="no-referrer" className="size-10 shrink-0 rounded-full bg-sand object-cover" />;
  }
  return <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy text-sm font-semibold text-gold" aria-hidden>{initial}</span>;
}

export function UsersList() {
  const { data, error, reload } = useFetch<Data>('/api/admin/users');
  useLive('admin', (name) => { if (name === 'user' || name === 'resync') reload(); });
  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Users" sub="People who signed in with Google." />
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Stat label="Total" value={data?.total} />
        <Stat label="New this week" value={data?.newWeek} />
      </div>
      {!data ? (
        error ? null : <Skeleton rows={4} className="h-16" />
      ) : data.users.length === 0 ? (
        <Empty><Users className="mx-auto mb-2 size-6 text-ink-soft/60" />No one has signed up yet.</Empty>
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-pearl shadow-card">
          {data.users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-0">
              <Avatar user={u} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{u.name || u.email}</p>
                {u.name && <p className="truncate text-xs text-ink-soft">{u.email}</p>}
                <p className="mt-0.5 text-xs text-ink-soft sm:hidden">Joined {clock(u.createdAt, false)}</p>
              </div>
              <div className="hidden text-right text-xs text-ink-soft sm:block">
                <p>Joined {clock(u.createdAt, false)}</p>
                <p>Last sign-in {clock(u.lastLoginAt)}</p>
              </div>
              <div className="w-16 shrink-0 text-right">
                <p className="text-sm font-semibold text-navy tabular-nums">{u.orders}</p>
                <p className="text-xs text-ink-soft">order{u.orders === 1 ? '' : 's'}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
