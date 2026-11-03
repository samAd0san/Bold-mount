'use client';

import * as React from 'react';
import { ChevronDown, MapPin, MessageCircle, Phone } from 'lucide-react';
import { adminFetch, clock, telLink, useFetch, waLink } from '@/components/admin/api';
import { Badge, Chips, Empty, ErrorNote, PageHead, Select, Skeleton } from '@/components/admin/ui';
import { formatINR } from '@/lib/format';
import { ORDER_STATUSES, type Order, type OrderStatus, type PaymentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<OrderStatus, string> = { new: 'New', confirmed: 'Confirmed', delivered: 'Delivered', cancelled: 'Cancelled' };
const PAY: Record<PaymentStatus, { label: string; tone: 'green' | 'amber' | 'red' | 'blue' }> = {
  paid: { label: 'Paid', tone: 'green' },
  pending: { label: 'Pending', tone: 'amber' },
  failed: { label: 'Failed', tone: 'red' },
  'on-whatsapp': { label: 'On WhatsApp', tone: 'blue' },
};
const FILTERS: { value: OrderStatus | 'all'; label: string }[] = [{ value: 'all', label: 'All' }, ...ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))];

const summary = (o: Order) => o.items.map((i) => `${i.qty} × ${i.name}${i.variant ? ` (${i.variant})` : ''}`).join(', ');

export function OrdersList() {
  const [filter, setFilter] = React.useState<OrderStatus | 'all'>('all');
  const { data, loading, error, reload, mutate } = useFetch<{ orders: Order[] }>(`/api/admin/orders${filter === 'all' ? '' : `?status=${filter}`}`);
  const [open, setOpen] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);

  const setStatus = async (o: Order, status: OrderStatus) => {
    setSaving(o.id);
    setProblem(null);
    try {
      const res = await adminFetch<{ order: Order }>(`/api/admin/orders/${o.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      mutate((d) => ({ ...d, orders: d.orders.map((x) => (x.id === o.id ? res.order : x)) }));
    } catch (e) {
      setProblem(`${o.number}: ${(e as Error).message}`);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Orders" sub={data ? `${data.orders.length} order${data.orders.length === 1 ? '' : 's'}, newest first` : 'Newest first'} />
      <Chips value={filter} options={FILTERS} onChange={setFilter} />
      {(error || problem) && <ErrorNote onRetry={error ? reload : undefined}>{error ?? problem}</ErrorNote>}

      {!data ? (
        error ? null : <Skeleton rows={4} className="h-32" />
      ) : data.orders.length === 0 ? (
        <Empty>{filter === 'all' ? 'No orders yet. They will show up here as soon as someone orders.' : `No ${STATUS_LABEL[filter].toLowerCase()} orders.`}</Empty>
      ) : (
        <ul className={cn('flex flex-col gap-3 transition-opacity', loading && 'opacity-55')}>
          {data.orders.map((o) => {
            const expanded = open === o.id;
            const pay = PAY[o.payment];
            const c = o.customer;
            return (
              <li key={o.id} className="rounded-2xl border bg-pearl shadow-card">
                <div
                  className="flex cursor-pointer flex-col gap-3 p-4"
                  onClick={(e) => { if (!(e.target as HTMLElement).closest('a, select')) setOpen(expanded ? null : o.id); }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-navy">{o.number}</span>
                        <Badge tone={pay.tone}>{pay.label}</Badge>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-soft">{clock(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-navy tabular-nums">{formatINR(o.total)}</span>
                      <button type="button" aria-expanded={expanded} aria-label={expanded ? 'Hide details' : 'Show details'} className="grid size-8 place-items-center rounded-full text-ink-soft hover:bg-navy/10">
                        <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="font-medium text-ink">{c.name}</span>
                    <a href={telLink(c.mobile)} className="inline-flex items-center gap-1 text-sm text-navy underline-offset-4 hover:underline"><Phone className="size-3.5" />{c.mobile}</a>
                    <a href={waLink(c.mobile)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-whatsapp/15 px-2.5 py-0.5 text-xs font-semibold text-whatsapp-ink hover:bg-whatsapp/25"><MessageCircle className="size-3.5" />WhatsApp</a>
                  </div>

                  <p className={cn('text-sm text-ink-soft', !expanded && 'line-clamp-2')}>{summary(o)}</p>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink-soft">Status</span>
                    <Select
                      aria-label={`Status of ${o.number}`}
                      value={o.status}
                      disabled={saving === o.id}
                      onChange={(e) => void setStatus(o, e.target.value as OrderStatus)}
                      className="w-auto min-w-36 py-1.5"
                    >
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </Select>
                  </div>
                </div>

                {expanded && (
                  <div className="space-y-4 border-t px-4 py-4 text-sm">
                    <table className="w-full">
                      <tbody>
                        {o.items.map((i, k) => (
                          <tr key={`${i.slug}-${k}`} className="border-b border-line/60 last:border-0">
                            <td className="py-1.5 pr-3 text-ink">{i.name}{i.variant ? <span className="text-ink-soft"> · {i.variant}</span> : null}</td>
                            <td className="py-1.5 pr-3 whitespace-nowrap text-ink-soft tabular-nums">{i.qty} × {formatINR(i.price)}</td>
                            <td className="py-1.5 text-right whitespace-nowrap font-medium text-ink tabular-nums">{formatINR(i.qty * i.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <dl className="grid max-w-xs grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-ink-soft">
                      <dt>Subtotal</dt><dd className="text-right tabular-nums">{formatINR(o.subtotal)}</dd>
                      <dt>Delivery</dt><dd className="text-right tabular-nums">{o.delivery ? formatINR(o.delivery) : 'Free'}</dd>
                      <dt className="font-semibold text-ink">Total</dt><dd className="text-right font-semibold text-ink tabular-nums">{formatINR(o.total)}</dd>
                    </dl>
                    <div>
                      <p className="text-xs font-semibold text-ink-soft">Deliver to</p>
                      <p className="mt-1 whitespace-pre-wrap text-ink">{c.address}</p>
                      <p className="text-ink">{c.city}{c.pincode ? ` – ${c.pincode}` : ''}</p>
                      {c.location && (
                        <a href={`https://www.google.com/maps?q=${c.location.lat},${c.location.lng}`} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-navy underline-offset-4 hover:underline">
                          <MapPin className="size-4" />Open on map
                        </a>
                      )}
                    </div>
                    {c.note && (
                      <div>
                        <p className="text-xs font-semibold text-ink-soft">Note from customer</p>
                        <p className="mt-1 whitespace-pre-wrap text-ink">{c.note}</p>
                      </div>
                    )}
                    <p className="text-xs text-ink-soft">
                      {o.method === 'online' ? 'Paid through the website' : 'Ordered on WhatsApp'}
                      {o.paidAt ? ` · paid ${clock(o.paidAt)}` : ''}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
