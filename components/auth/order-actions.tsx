'use client';

import { useId, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { REFUND_REASONS, type Order } from '@/lib/types';
import { postJson } from '@/lib/client-api';
import { formatINR } from '@/lib/format';
import { SITE } from '@/lib/site';
import { whatsappLink } from '@/lib/whatsapp';
import { buttonClass } from '@/components/ui/button-styles';
import { cn } from '@/lib/utils';

const FIELD =
  'w-full rounded-xl border border-line bg-cream px-4 py-3 text-base text-ink placeholder:text-ink-soft/70 transition-colors focus:border-navy focus:outline-none md:text-sm';
const LABEL = 'mb-1.5 block text-sm font-medium text-ink';
const LINK = 'font-semibold text-navy underline underline-offset-4';

/** Button that opens a confirm box: a bottom sheet on phones, centred on larger screens. Radix handles Esc and focus. */
function ActionDialog({ label, title, description, children }: { label: string; title: string; description: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={buttonClass('outline', 'min-h-11 px-5 py-2.5')}>
          {label}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-night/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-[81] max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-pearl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl outline-none',
            'sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-6',
            'data-[state=open]:animate-in data-[state=open]:duration-300 data-[state=open]:fade-in data-[state=open]:slide-in-from-bottom sm:data-[state=open]:slide-in-from-bottom-0',
            'data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=closed]:fade-out data-[state=closed]:slide-out-to-bottom sm:data-[state=closed]:slide-out-to-bottom-0',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-lg text-ink">{title}</Dialog.Title>
            <Dialog.Close aria-label="Close" className="-mt-1.5 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-sand/60">
              <X size={20} aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm leading-relaxed text-ink-soft">{description}</Dialog.Description>
          {children(() => setOpen(false))}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl bg-gold/15 p-4 text-sm font-medium text-gold-ink">
      <AlertCircle size={17} className="mt-px shrink-0" />
      <p>{message}</p>
    </div>
  );
}

// Says exactly what cancelling does for this kind of order.
function cancelNote(order: Order): string {
  if (order.payment === 'paid') {
    return `You’ll get a full refund of ${formatINR(order.total)}, including delivery, to your original payment method. Banks usually take 5–7 working days.`;
  }
  if (order.method === 'whatsapp') {
    return 'This order will simply be cancelled. If you already paid us by UPI or bank transfer, message us on WhatsApp and it goes back to the same account.';
  }
  return 'This order will be cancelled. No payment has been received for it.';
}

function CancelForm({ order, close, onDone }: { order: Order; close: () => void; onDone: (order: Order) => void }) {
  const id = useId();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const note = reason.trim();
    const res = await postJson<{ order: Order }>(`/api/orders/${order.id}/cancel`, note ? { reason: note } : {});
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    close();
    onDone(res.data.order);
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <div>
        <label htmlFor={id} className={LABEL}>
          Reason (optional)
        </label>
        <textarea id={id} rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us why, if you like" className={cn(FIELD, 'resize-y')} />
      </div>
      {error && <ErrorLine message={error} />}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={close} className={buttonClass('outline', 'min-h-11')}>
          Keep order
        </button>
        <button type="submit" disabled={busy} className={buttonClass('navy', 'min-h-11')}>
          {busy && <Loader2 size={16} className="animate-spin" />} Yes, cancel my order
        </button>
      </div>
    </form>
  );
}

/** "Cancel order": confirm box that says what happens, then cancels and hands back the updated order. */
export function CancelOrder({ order, onDone }: { order: Order; onDone: (order: Order) => void }) {
  return (
    <ActionDialog label="Cancel order" title="Cancel this order?" description={cancelNote(order)}>
      {(close) => <CancelForm order={order} close={close} onDone={onDone} />}
    </ActionDialog>
  );
}

function RefundForm({ order, close, onDone }: { order: Order; close: () => void; onDone: (order: Order) => void }) {
  const id = useId();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!reason) {
      setError('Choose a reason for your refund request.');
      return;
    }
    setBusy(true);
    setError('');
    const extra = note.trim();
    const res = await postJson<{ order: Order }>(`/api/orders/${order.id}/refund-request`, { reason, ...(extra && { note: extra }) });
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      return;
    }
    close();
    onDone(res.data.order);
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <div>
        <label htmlFor={`${id}-reason`} className={LABEL}>
          Reason <span className="text-gold-ink">*</span>
        </label>
        <select
          id={`${id}-reason`}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError('');
          }}
          className={FIELD}
        >
          <option value="" disabled>
            Choose a reason
          </option>
          {REFUND_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-note`} className={LABEL}>
          Note (optional)
        </label>
        <textarea id={`${id}-note`} rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What went wrong?" className={cn(FIELD, 'resize-y')} />
      </div>
      <div className="space-y-2 rounded-xl bg-cream p-3.5 text-sm leading-relaxed text-ink-soft">
        <p>
          Please send photos of the problem on WhatsApp to{' '}
          <a href={whatsappLink(`Assalamu alaikum Bold Mount, here are photos for my refund request, order ${order.number}.`)} target="_blank" rel="noopener noreferrer" className={cn(LINK, 'whitespace-nowrap')}>
            {SITE.phoneDisplay}
          </a>{' '}
          with order {order.number} — it helps us sort it quickly.
        </p>
        <p className="text-xs">
          Food items: tell us within 48 hours of delivery. Modest wear: within 7 days.{' '}
          <Link href="/policies/refund-cancellation" target="_blank" className={LINK}>
            Refund & Cancellation policy
          </Link>
        </p>
      </div>
      {error && <ErrorLine message={error} />}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={close} className={buttonClass('outline', 'min-h-11')}>
          Not now
        </button>
        <button type="submit" disabled={busy} className={buttonClass('navy', 'min-h-11')}>
          {busy && <Loader2 size={16} className="animate-spin" />} Send refund request
        </button>
      </div>
    </form>
  );
}

/** "Request a refund": small form (reason, note, WhatsApp photo hint) that posts the request and hands back the updated order. */
export function RequestRefund({ order, onDone }: { order: Order; onDone: (order: Order) => void }) {
  return (
    <ActionDialog label="Request a refund" title="Tell us what went wrong" description={`Order ${order.number}. We reply within 2 working days.`}>
      {(close) => <RefundForm order={order} close={close} onDone={onDone} />}
    </ActionDialog>
  );
}
