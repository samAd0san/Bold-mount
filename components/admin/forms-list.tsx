'use client';

import * as React from 'react';
import { Inbox, Mail, MailOpen, MessageCircle, Phone, Trash2 } from 'lucide-react';
import { useAdmin } from '@/components/admin/admin-gate';
import { adminFetch, clock, looksLikePhone, telLink, useFetch, waLink } from '@/components/admin/api';
import { Button, ConfirmDelete, Empty, ErrorNote, PageHead, Skeleton } from '@/components/admin/ui';
import type { FormEntry } from '@/lib/types';
import { cn } from '@/lib/utils';

type Data = { unread: number; forms: FormEntry[] };

/** Everything people sent from the site's forms, newest first. */
export function FormsList() {
  const { setUnread } = useAdmin();
  const { data, error, reload, mutate } = useFetch<Data>('/api/admin/forms');
  const [deleting, setDeleting] = React.useState<FormEntry | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);

  React.useEffect(() => { if (data) setUnread(data.unread); }, [data, setUnread]);

  const setRead = async (f: FormEntry, read: boolean) => {
    setProblem(null);
    mutate((d) => ({ unread: Math.max(0, d.unread + (f.read === read ? 0 : read ? -1 : 1)), forms: d.forms.map((x) => (x.id === f.id ? { ...x, read } : x)) }));
    try {
      await adminFetch(`/api/admin/forms/${f.id}`, { method: 'PATCH', body: JSON.stringify({ read }) });
    } catch (e) {
      setProblem((e as Error).message);
      reload();
    }
  };

  const remove = async (f: FormEntry) => {
    await adminFetch(`/api/admin/forms/${f.id}`, { method: 'DELETE' });
    mutate((d) => ({ unread: Math.max(0, d.unread - (f.read ? 0 : 1)), forms: d.forms.filter((x) => x.id !== f.id) }));
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Forms" sub={data ? <>Newest first · <span className="font-semibold text-navy">{data.unread}</span> unread</> : 'Newest first'} />
      {(error || problem) && <ErrorNote onRetry={error ? reload : undefined}>{error ?? problem}</ErrorNote>}

      {!data ? (
        error ? null : <Skeleton rows={3} className="h-32" />
      ) : data.forms.length === 0 ? (
        <Empty><Inbox className="mx-auto mb-2 size-6 text-ink-soft/60" />Nothing yet. Contact, zakat, volunteer and other forms will land here.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.forms.map((f) => (
            <li key={f.id} className={cn('rounded-2xl border bg-pearl p-4 shadow-card sm:p-5', !f.read && 'border-gold-deep/60')}>
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <p className="flex min-w-0 items-center gap-2 font-semibold text-navy">
                  {!f.read && <span className="size-2.5 shrink-0 rounded-full bg-gold-deep" role="img" aria-label="Unread" />}
                  <span className="truncate">{f.form}</span>
                </p>
                <p className="text-xs text-ink-soft">{f.page} · {clock(f.createdAt)}</p>
              </div>

              <dl className="mt-3 flex flex-col gap-2 text-sm">
                {f.fields.map((x, i) => (
                  <div key={`${x.label}-${i}`} className="grid gap-x-3 sm:grid-cols-[9rem_1fr]">
                    <dt className="text-xs font-semibold text-ink-soft sm:pt-0.5">{x.label}</dt>
                    <dd className="min-w-0 break-words whitespace-pre-wrap text-ink">
                      {x.value || '—'}
                      {looksLikePhone(x.value) && (
                        <span className="mt-1 flex flex-wrap gap-2 sm:ml-3 sm:mt-0 sm:inline-flex">
                          <a href={telLink(x.value)} className="inline-flex items-center gap-1 rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-semibold text-navy hover:bg-navy/20"><Phone className="size-3" />Call</a>
                          <a href={waLink(x.value)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-whatsapp/15 px-2.5 py-0.5 text-xs font-semibold text-whatsapp-ink hover:bg-whatsapp/25"><MessageCircle className="size-3" />WhatsApp</a>
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => void setRead(f, !f.read)}>
                  {f.read ? <><Mail className="size-3.5" />Mark unread</> : <><MailOpen className="size-3.5" />Mark read</>}
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleting(f)}><Trash2 className="size-3.5" />Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this form?"
        description={deleting ? `"${deleting.form}" sent ${clock(deleting.createdAt)}. This cannot be undone.` : ''}
        onConfirm={() => remove(deleting!)}
      />
    </div>
  );
}
