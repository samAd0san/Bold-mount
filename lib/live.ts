'use client';

import { useEffect, useRef } from 'react';
import type * as Ably from 'ably';

/** catalog = shop changes (everyone), admin = orders/forms/users (admin PIN), orders = this customer's own orders. */
export type LiveTopic = 'catalog' | 'admin' | 'orders';
type Grant = { tokenRequest: Ably.TokenRequest; prefix: string; uid: string | null; admin: boolean };
type Live = { client: Ably.Realtime; grant: () => Grant };
type Handler = (name: string, data: unknown) => void;

async function fetchGrant(): Promise<Grant | null> {
  const res = await fetch('/api/live/token', { cache: 'no-store', credentials: 'same-origin' }).catch(() => null);
  // Always read the body, even for the 503 "live updates are off", so the request finishes.
  const body = await res?.json().catch(() => null);
  return res?.ok ? body : null;
}

let live: Promise<Live | null> | null = null;
const resyncs = new Set<() => void>();
const listening = new Set<LiveTopic>();

/** One Ably connection per tab, opened on first use; null when live updates are off (no key) or unreachable. */
function connect(): Promise<Live | null> {
  live ??= (async () => {
    let grant = await fetchGrant();
    if (!grant) return null;
    const { Realtime } = await import('ably');
    let fresh: Grant | null = grant;
    const client = new Realtime({
      // Tokens last an hour; Ably asks again on its own, and the new one follows the current sign-in.
      authCallback: (_params, done) => {
        const give = (g: Grant | null) => (g ? ((grant = g), done(null, g.tokenRequest)) : done('Live updates are off', null));
        if (fresh) {
          give(fresh);
          fresh = null;
        } else void fetchGrant().then(give, (e) => done(String(e), null));
      },
    });
    // After a drop (sleep, lost signal) messages may have been missed, so every listener refetches once.
    let dropped = false;
    client.connection.on((s) => {
      if (s.current === 'disconnected' || s.current === 'suspended') dropped = true;
      if (s.current === 'connected' && dropped) {
        dropped = false;
        resyncs.forEach((r) => r());
      }
    });
    return { client, grant: () => grant! };
  })();
  return live;
}

function channelOf(g: Grant, topic: LiveTopic) {
  if (topic === 'catalog') return `${g.prefix}:catalog`;
  if (topic === 'admin') return g.admin ? `${g.prefix}:admin` : null;
  return g.uid ? `${g.prefix}:orders:${g.uid}` : null;
}

/** Calls `onMessage(name, data)` whenever the server says something on this topic changed (and once after a reconnect, with name "resync"). */
export function useLive(topic: LiveTopic | null, onMessage: Handler) {
  const handler = useRef(onMessage);
  useEffect(() => {
    handler.current = onMessage;
  });

  useEffect(() => {
    if (!topic) return;
    let stopped = false;
    let channel: Ably.RealtimeChannel | null = null;
    const listener = (m: Ably.Message) => handler.current(m.name ?? '', m.data);
    const resync = () => handler.current('resync', null);
    void (async () => {
      const l = await connect().catch(() => null);
      if (!l || stopped) return;
      let name = channelOf(l.grant(), topic);
      // The PIN is entered without a page load, so an older token may not cover the admin channel yet.
      if (!name && topic === 'admin') {
        await l.client.auth.authorize().catch(() => null);
        name = channelOf(l.grant(), topic);
      }
      if (!name || stopped) return;
      channel = l.client.channels.get(name);
      resyncs.add(resync);
      await channel.subscribe(listener);
      // Lets tests (and anyone debugging) see what the page is listening to, e.g. <html data-live="catalog orders">.
      listening.add(topic);
      document.documentElement.dataset.live = [...listening].join(' ');
    })().catch(() => {}); // offline or blocked: the focus/30s refetches still keep pages fresh
    return () => {
      stopped = true;
      resyncs.delete(resync);
      channel?.unsubscribe(listener);
    };
  }, [topic]);
}
