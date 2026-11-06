'use client';

import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { adminFetch, useFetch } from '@/components/admin/api';
import { Button, Card, CardTitle, Checkbox, ErrorNote, Field, InfoTip, Input, Skeleton } from '@/components/admin/ui';
import { DEFAULT_DELIVERY, deliveryWords, MAX_FEE, MAX_FREE_ABOVE, parseDelivery, type DeliverySettings } from '@/lib/delivery';

const inr = (n: number) => n.toLocaleString('en-IN');

function DeliveryForm({ initial }: { initial: DeliverySettings }) {
  const [fee, setFee] = React.useState(String(initial.fee));
  const [offer, setOffer] = React.useState(initial.freeAbove !== null);
  const [above, setAbove] = React.useState(String(initial.freeAbove ?? DEFAULT_DELIVERY.freeAbove));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);

  const checked = parseDelivery({ fee, freeAbove: offer ? above : null });
  // What customers will read, worked out from the boxes as they are now.
  const preview = 'settings' in checked ? deliveryWords(checked.settings).sentence : null;
  const edit = (fn: () => void) => {
    fn();
    setDone(null);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDone(null);
    if ('error' in checked) return setError(checked.error);
    setBusy(true);
    setError(null);
    try {
      const saved = await adminFetch<DeliverySettings>('/api/admin/delivery', { method: 'PUT', body: JSON.stringify(checked.settings) });
      setDone(`Delivery saved. ${deliveryWords(saved).sentence}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field
        label="Delivery fee for every order (₹)"
        hint={`Whole rupees, 0 to ${inr(MAX_FEE)}. Use 0 for free delivery on every order.`}
        tip="One charge for every order, whatever is in it. It is not set per item."
        className="sm:max-w-xs"
      >
        <Input inputMode="numeric" autoComplete="off" value={fee} onChange={(e) => edit(() => setFee(e.target.value))} />
      </Field>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <Checkbox checked={offer} onChange={(v) => edit(() => setOffer(v))}>Free delivery on bigger orders</Checkbox>
          <InfoTip label="What is “Free delivery on bigger orders”?">Orders worth this much or more are delivered free. Untick it to charge the fee on every order.</InfoTip>
        </div>
        {offer && (
          <Field
            label="Free when the order total is at least (₹)"
            hint={fee.trim() === '0' ? 'Not needed while the fee is 0: every order is free.' : `Whole rupees, 1 to ${inr(MAX_FREE_ABOVE)}. The delivery fee itself is not counted.`}
            className="sm:max-w-xs"
          >
            <Input inputMode="numeric" autoComplete="off" value={above} onChange={(e) => edit(() => setAbove(e.target.value))} />
          </Field>
        )}
      </div>

      {preview && <p className="text-sm text-ink-soft">Customers will see: “{preview}”</p>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {done && (
        <p role="status" className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {done}
        </p>
      )}
      <div>
        <Button type="submit" variant="gold" busy={busy} className="w-full sm:w-auto">Save delivery</Button>
      </div>
    </form>
  );
}

/** Admin → Settings → Delivery: the one fee for every order and the optional "free above" amount. */
export function DeliveryCard() {
  const saved = useFetch<DeliverySettings>('/api/admin/delivery');
  return (
    <Card>
      <CardTitle>Delivery</CardTitle>
      <p className="mt-0.5 mb-4 text-[13px] text-ink-soft">The delivery charge is the same for every order. The shop, carts and checkout follow what you save here.</p>
      {saved.data ? <DeliveryForm initial={saved.data} /> : saved.error ? <ErrorNote onRetry={saved.reload}>{saved.error}</ErrorNote> : <Skeleton rows={1} className="h-32" />}
    </Card>
  );
}
