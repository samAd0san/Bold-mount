'use client';

import * as React from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { adminFetch, useFetch } from '@/components/admin/api';
import { SingleImage } from '@/components/admin/image-fields';
import { Badge, Button, ConfirmDelete, Empty, ErrorNote, Field, Input, Modal, PageHead, Skeleton, Switch, Textarea, Thumb } from '@/components/admin/ui';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

type Row = Category & { products: number };
type Draft = { name: string; short: string; tagline: string; blurb: string; image: string; active: boolean; sort: string };

const blank: Draft = { name: '', short: '', tagline: '', blurb: '', image: '', active: true, sort: '' };
const draftFrom = (c: Row): Draft => ({ name: c.name, short: c.short, tagline: c.tagline, blurb: c.blurb, image: c.image, active: c.active, sort: String(c.sort) });

export function CategoriesList() {
  const { data, error, reload, mutate } = useFetch<{ categories: Row[] }>('/api/admin/categories');
  const [editing, setEditing] = React.useState<Row | 'new' | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);

  const toggle = async (c: Row, active: boolean) => {
    setProblem(null);
    mutate((d) => ({ categories: d.categories.map((x) => (x.id === c.id ? { ...x, active } : x)) }));
    try {
      await adminFetch(`/api/admin/categories/${c.id}`, { method: 'PATCH', body: JSON.stringify({ active }) });
    } catch (e) {
      setProblem((e as Error).message);
      reload();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Categories" sub="The groups products live in." action={<Button variant="gold" size="sm" className="py-2" onClick={() => setEditing('new')}><Plus className="size-4" />Add category</Button>} />
      {(error || problem) && <ErrorNote onRetry={error ? reload : undefined}>{error ?? problem}</ErrorNote>}

      {!data ? (
        error ? null : <Skeleton rows={5} className="h-[4.5rem]" />
      ) : data.categories.length === 0 ? (
        <Empty>No categories yet.</Empty>
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-pearl shadow-card">
          {data.categories.map((c) => (
            <li key={c.id} className={cn('flex items-center gap-3 border-b px-3 py-3 last:border-0 sm:gap-4 sm:px-4', !c.active && 'bg-ink/[0.03]')}>
              <Thumb src={c.image} alt={c.name} size={56} cover className={cn(!c.active && 'opacity-50')} />
              <div className="min-w-0 flex-1">
                <p className={cn('truncate font-semibold text-ink', !c.active && 'text-ink-soft')}>{c.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-soft">
                  <span>/{c.slug}</span>
                  <span className="font-semibold text-navy">{c.products} product{c.products === 1 ? '' : 's'}</span>
                  <span>Sort {c.sort}</span>
                  {!c.active && <Badge>Hidden</Badge>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Switch checked={c.active} onChange={(v) => void toggle(c, v)} label={`${c.name} is shown in the shop`} />
                <Button variant="outline" size="sm" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}><Pencil className="size-3.5" /><span className="hidden sm:inline">Edit</span></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <CategoryDialog
          key={editing === 'new' ? 'new' : editing.id}
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}

function CategoryDialog({ category, onClose, onSaved }: { category: Row | null; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = React.useState<Draft>(category ? draftFrom(category) : blank);
  const [tried, setTried] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((s) => ({ ...s, [k]: v }));

  const errors: Record<string, string> = {};
  if (tried && !d.name.trim()) errors.name = 'Give the category a name.';

  const save = async () => {
    setTried(true);
    if (!d.name.trim()) return;
    setProblem(null);
    setSaving(true);
    const payload = {
      name: d.name.trim(),
      short: d.short.trim() || d.name.trim(),
      tagline: d.tagline.trim(),
      blurb: d.blurb.trim(),
      image: d.image,
      active: d.active,
      ...(d.sort.trim() !== '' ? { sort: Number(d.sort) } : {}),
    };
    try {
      await adminFetch(category ? `/api/admin/categories/${category.id}` : '/api/admin/categories', { method: category ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      onSaved();
    } catch (err) {
      setProblem((err as Error).message);
      setSaving(false);
    }
  };

  const remove = async () => {
    await adminFetch(`/api/admin/categories/${category!.id}`, { method: 'DELETE' });
    onSaved();
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={category ? 'Edit category' : 'Add category'}>
      <form onSubmit={(e) => { e.preventDefault(); void save(); }} noValidate className="flex flex-col gap-4">
        {problem && <ErrorNote>{problem}</ErrorNote>}
        <Field label="Name" error={errors.name}>
          <Input value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Premium Dates" autoComplete="off" />
        </Field>
        <Field label="Short label" hint="Used on small tabs.">
          <Input value={d.short} onChange={(e) => set('short', e.target.value)} placeholder="e.g. Dates" />
        </Field>
        <Field label="Tagline">
          <Input value={d.tagline} onChange={(e) => set('tagline', e.target.value)} />
        </Field>
        <Field label="Blurb" hint="Two short lines about the category.">
          <Textarea rows={3} value={d.blurb} onChange={(e) => set('blurb', e.target.value)} />
        </Field>
        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-ink">Picture</p>
          <SingleImage value={d.image} onChange={(v) => set('image', v)} alt={d.name} />
        </div>
        <div className="grid grid-cols-2 items-end gap-4">
          <label className="flex items-center gap-3 rounded-xl border bg-white px-4 py-2.5">
            <Switch checked={d.active} onChange={(v) => set('active', v)} label="Show in the shop" />
            <span className="text-sm font-semibold text-ink">Active</span>
          </label>
          <Field label="Sort order">
            <Input type="number" inputMode="numeric" value={d.sort} onChange={(e) => set('sort', e.target.value)} placeholder="0" />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button type="submit" variant="gold" busy={saving}>{category ? 'Save' : 'Add category'}</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {category && <Button variant="danger" className="ml-auto" onClick={() => setDeleting(true)}><Trash2 className="size-4" />Delete</Button>}
        </div>
      </form>
      {category && (
        <ConfirmDelete open={deleting} onOpenChange={setDeleting} title="Delete this category?" description={`"${category.name}" will be removed. A category that still has products cannot be deleted.`} onConfirm={remove} />
      )}
    </Modal>
  );
}
