'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { adminFetch, SIGNED_OUT, SignedOut } from '@/components/admin/api';
import { AdminShell } from '@/components/admin/admin-shell';
import { PinScreen } from '@/components/admin/pin-screen';
import { Button } from '@/components/admin/ui';

type Session = { admin: boolean; pinLength: number };
type Ctx = {
  pinLength: number;
  unread: number;
  setUnread: (n: number) => void;
  attention: number;
  refreshAttention: () => void;
  recheck: () => Promise<void>;
  logout: () => Promise<void>;
};

const AdminCtx = React.createContext<Ctx | null>(null);

async function loadSession(): Promise<Session> {
  const res = await fetch('/api/admin/session', { cache: 'no-store' });
  if (!res.ok) throw new Error('bad status');
  const s = await res.json();
  return { admin: !!s.admin, pinLength: Number(s.pinLength) || 4 };
}
export function useAdmin() {
  const ctx = React.useContext(AdminCtx);
  if (!ctx) throw new Error('useAdmin must be used inside AdminGate');
  return ctx;
}

/** Asks /api/admin/session who is looking: shows the PIN pad or the admin. Any 401 later sends you back to the pad. */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [down, setDown] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const [attention, setAttention] = React.useState(0);

  const recheck = React.useCallback(
    () =>
      loadSession().then(
        (s) => { setSession(s); setDown(false); },
        () => setDown(true),
      ),
    [],
  );

  React.useEffect(() => {
    let alive = true;
    loadSession().then(
      (s) => { if (alive) setSession(s); },
      () => { if (alive) setDown(true); },
    );
    const h = () => void recheck();
    window.addEventListener(SIGNED_OUT, h);
    return () => {
      alive = false;
      window.removeEventListener(SIGNED_OUT, h);
    };
  }, [recheck]);

  // Orders with a refund waiting or failed; the Orders page calls this again after each change.
  const refreshAttention = React.useCallback(() => {
    adminFetch<{ count: number }>('/api/admin/orders/attention')
      .then((d) => setAttention(d.count))
      .catch((e) => { if (!(e instanceof SignedOut)) setAttention(0); });
  }, []);

  const logout = React.useCallback(async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    await recheck();
  }, [recheck]);

  if (down && !session) {
    return (
      <main className="grid min-h-dvh place-items-center bg-cream px-4 text-center">
        <div>
          <p className="font-semibold text-navy">Can&apos;t reach the server.</p>
          <p className="mt-1 text-sm text-ink-soft">Check your connection and try again.</p>
          <Button className="mt-4" onClick={() => void recheck()}>Try again</Button>
        </div>
      </main>
    );
  }
  if (!session) {
    return (
      <main className="grid min-h-dvh place-items-center bg-cream" aria-busy>
        <Loader2 className="size-6 animate-spin text-navy/60" />
      </main>
    );
  }
  if (!session.admin) return <PinScreen length={session.pinLength} onDone={recheck} />;

  return (
    <AdminCtx.Provider value={{ pinLength: session.pinLength, unread, setUnread, attention, refreshAttention, recheck, logout }}>
      <AdminShell>{children}</AdminShell>
    </AdminCtx.Provider>
  );
}
