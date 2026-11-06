'use client';

import * as React from 'react';
import { useAdmin } from '@/components/admin/admin-gate';
import { adminFetch, clock, type ApiError } from '@/components/admin/api';
import { Button, Checkbox, ErrorNote, Field, Input, Modal, Textarea } from '@/components/admin/ui';
import { formatINR } from '@/lib/format';
import type { Order } from '@/lib/types';

/** Asks before cancelling a paid order (online or cash); "refund now" is ticked by default. */
export function CancelDialog({ order, onClose, onConfirm }: { order: Order; onClose: () => void; onConfirm: (refund: boolean) => Promise<void> }) {
  const [refund, setRefund] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const cash = order.method === 'cod';

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(refund);
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Modal open onOpenChange={(o) => { if (!o && !busy) onClose(); }} title={`Cancel order ${order.number}?`} description={cash ? 'This customer already paid in cash.' : 'This customer already paid online.'}>
      <div className="space-y-4">
        <div>
          <Checkbox checked={refund} onChange={setRefund}>{cash ? `Record a refund of ${formatINR(order.total)} (I paid it back by cash or UPI)` : `Refund ${formatINR(order.total)} to the customer now`}</Checkbox>
          {!refund && <p className="mt-1 text-xs text-ink-soft">{cash ? 'No refund will be recorded.' : 'No money will be sent back.'} You can refund later from the order.</p>}
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={busy} onClick={onClose}>Keep it</Button>
          <Button variant="danger" busy={busy} onClick={() => void run()}>Cancel order</Button>
        </div>
      </div>
    </Modal>
  );
}

type Step = 'amount' | 'confirm' | 'decline' | null;

/** Refund area of an expanded order: answer a request, refund by hand, retry a failed one, or see what was sent. */
export function RefundPanel({ order, onSaved, onFailed }: { order: Order; onSaved: (o: Order) => void; onFailed: () => void }) {
  const { refreshAttention } = useAdmin();
  const r = order.refund;
  const requested = r?.status === 'requested';
  const cash = order.method === 'cod';
  const canRefund = order.payment === 'paid' && (cash || !!order.razorpayPaymentId) && r?.status !== 'refunded';
  const [step, setStep] = React.useState<Step>(null);
  const [amount, setAmount] = React.useState(String(order.total));
  const [reply, setReply] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const n = Number(amount);
  const valid = amount.trim() !== '' && Number.isInteger(n) && n >= 1 && n <= order.total;
  const showForm = canRefund && (requested ? step !== 'decline' : step === 'amount' || step === 'confirm');

  const send = async (path: 'refund' | 'refund/decline', body: object) => {
    setBusy(true);
    setError(null);
    try {
      const res = await adminFetch<{ order: Order }>(`/api/admin/orders/${order.id}/${path}`, { method: 'POST', body: JSON.stringify(body) });
      onSaved(res.order);
      setStep(null);
    } catch (e) {
      setError((e as Error).message);
      // A 502 means Razorpay said no and the order now says "failed"; load it so the badge and the retry button show.
      if ((e as ApiError).status === 502) { setStep(null); onFailed(); } else if (step === 'confirm') setStep('amount');
    } finally {
      setBusy(false);
      refreshAttention();
    }
  };

  if (!r && !canRefund) return null;

  return (
    <div className="space-y-3 rounded-xl border border-line bg-white p-3">
      <p className="text-xs font-semibold text-ink-soft">Refund</p>

      {r?.status === 'requested' && (
        <div className="space-y-1">
          <p className="font-semibold text-ink">Customer asked for a refund <span className="font-normal text-ink-soft">· {clock(r.requestedAt)}</span></p>
          <p className="text-ink">{r.reason}</p>
          {r.note && <p className="break-words whitespace-pre-wrap text-ink-soft">“{r.note}”</p>}
        </div>
      )}
      {r?.status === 'failed' && <p className="text-red-800">The {formatINR(r.amount)} refund didn’t go through. Reason for refund: {r.reason}.</p>}
      {r?.status === 'declined' && (
        <p className="break-words text-ink">You declined this refund{r.reply ? <span className="text-ink-soft"> · “{r.reply}”</span> : null}</p>
      )}
      {r?.status === 'refunded' && (
        <div className="space-y-1">
          <p className="break-words text-ink">
            Refunded {formatINR(r.amount)}{r.amount < order.total ? ` of ${formatINR(order.total)}` : ''} on {clock(r.updatedAt, false)}{r.razorpayRefundId ? ` · ${r.razorpayRefundId}` : r.by === 'hand' ? ' · paid back by hand' : ''}
          </p>
          {r.amount < order.total && <p className="text-xs text-ink-soft">An order can only be refunded once, so the other {formatINR(order.total - r.amount)} can’t be refunded later.</p>}
        </div>
      )}

      {showForm && step === 'confirm' && (
        <div className="space-y-3">
          <p className="text-ink">
            {cash ? `Record a refund of ${formatINR(n)}? Only do this once you have paid it back. This can’t be undone.` : `Send ${formatINR(n)} back to the customer through Razorpay? This can’t be undone.`}
            {n < order.total && ` An order can only be refunded once, so the other ${formatINR(order.total - n)} can’t be refunded later.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" busy={busy} onClick={() => void send('refund', { amount: n })}>Yes, refund {formatINR(n)}</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setStep('amount')}>Go back</Button>
          </div>
        </div>
      )}

      {showForm && step !== 'confirm' && (
        <div className="space-y-3">
          <Field label="Amount to refund (₹)" hint={`Up to ${formatINR(order.total)}`}>
            <Input type="number" inputMode="numeric" min={1} max={order.total} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="sm:max-w-40" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={!valid} onClick={() => { setError(null); setStep('confirm'); }}>Refund{valid ? ` ${formatINR(n)}` : ''}</Button>
            {requested ? (
              <Button size="sm" variant="outline" onClick={() => { setError(null); setStep('decline'); }}>Decline</Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setStep(null)}>Cancel</Button>
            )}
          </div>
        </div>
      )}

      {canRefund && !requested && !showForm && (
        <Button size="sm" variant="outline" onClick={() => { setError(null); setStep('amount'); }}>{r?.status === 'failed' ? 'Try refund again' : 'Refund'}</Button>
      )}

      {cash && canRefund && step !== 'confirm' && <p className="text-xs text-ink-soft">Cash on delivery: pay this back by cash or UPI, then press Refund to record it.</p>}

      {requested && step === 'decline' && (
        <div className="space-y-3">
          <Field label="Your reply to the customer" hint="They will see this. Keep it short and kind.">
            <Textarea rows={3} maxLength={300} value={reply} onChange={(e) => setReply(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="danger" busy={busy} disabled={!reply.trim()} onClick={() => void send('refund/decline', { reply: reply.trim() })}>Decline refund</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setStep(null)}>Back</Button>
          </div>
        </div>
      )}

      {error && <ErrorNote>{error}</ErrorNote>}
    </div>
  );
}
