'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminFetch, useFetch } from '@/components/admin/api';
import { SingleImage } from '@/components/admin/image-fields';
import { Badge, Button, ConfirmDelete, Empty, ErrorNote, Field, Input, Modal, PageHead, Skeleton, Switch, Textarea, Thumb, TipLabel } from '@/components/admin/ui';
import { buttonClass } from '@/components/ui/button-styles';
import { CUTOUT_IMAGES } from '@/lib/sections';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

type Row = Category & { products: number };
type Draft = { name: string; short: string; tagline: string; blurb: string; image: string; active: boolean; sort: string };

const blank: Draft = { name: '', short: '', tagline: '', blurb: '', image: '', active: true, sort: '' };
const draftFrom = (c: Row): Draft => ({ name: c.name, short: c.short, tagline: c.tagline, blurb: c.blurb, image: c.image, active: c.active, sort: String(c.sort) });

// Plain-words help behind each "i".
const TIP = {
  name: 'The category’s full name, shown as the big title on its page, e.g. “Premium Dates”. The web address is made from it for you.',
  short: 'A shorter name for small spaces: the round category buttons in the shop, the “Shop …” button and the small label on product tiles. If empty, the full name is used.',
  tagline: 'A short line shown in gold just above the title at the top of the category page.',
  blurb: 'One or two sentences under the title at the top of the category page. Google also shows it in search results.',
  picture: 'Shown in the round category button in the shop and as the big background photo at the top of the category page. A wide, bright photo works best.',
  active: 'Turn off to hide this category’s page and its round button from the shop. Nothing is deleted; its products stay listed under All unless you hide them too.',
  sort: 'The order of categories in the shop. Lower numbers come first (1 before 5).',
};

/** Look-only copy of how the category shows in the shop: its round button and the top of its page. */
function CategoryPreview({ d }: { d: Draft }) {
  const name = d.name.trim() || 'Category name';
  const short = d.short.trim() || name;
  const cutout = CUTOUT_IMAGES.has(d.image);
  return (
    <div inert data-testid="category-preview" className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold text-ink-soft">Round button in the shop</p>
        <span className="flex w-24 flex-col items-center gap-2 text-center">
          <span className="relative block size-20 overflow-hidden rounded-full bg-pearl ring-2 ring-gold ring-offset-2 ring-offset-cream">
            {d.image && <Image src={d.image} alt="" fill sizes="80px" className={cutout ? 'object-contain p-2' : 'object-cover'} />}
          </span>
          <span className="max-w-full truncate text-sm leading-tight font-bold text-ink">{short}</span>
        </span>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-ink-soft">Top of its page</p>
        <div className="relative isolate overflow-hidden rounded-2xl bg-night text-on-night">
          {d.image && <Image src={d.image} alt="" fill sizes="480px" className="-z-10 object-cover opacity-90" />}
          <div className="absolute inset-0 -z-10 scrim-l" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night/70 to-transparent" />
          <div className="flex min-h-56 flex-col justify-end p-5">
            <p className="mb-3 flex flex-wrap items-center gap-1 text-[11px] text-on-night-soft">Home <ChevronRight size={10} /> Shop <ChevronRight size={10} /> <span className="text-on-night">{short}</span></p>
            {d.tagline.trim() && <p className="eyebrow text-gold">{d.tagline.trim()}</p>}
            <p className="mt-2 font-display text-3xl leading-[1.08] font-semibold tracking-tight break-words">{name}</p>
            {d.blurb.trim() && <p className="mt-2 text-sm text-on-night-soft">{d.blurb.trim()}</p>}
            <span className={buttonClass('gold', 'mt-4 self-start px-4 py-2 text-sm')}>Shop {short}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const preview = React.useDeferredValue(d);
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
        <Field label="Name" tip={TIP.name} error={errors.name}>
          <Input value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Premium Dates" autoComplete="off" />
        </Field>
        <Field label="Short label" tip={TIP.short} hint="Used on small buttons.">
          <Input value={d.short} onChange={(e) => set('short', e.target.value)} placeholder="e.g. Dates" />
        </Field>
        <Field label="Tagline" tip={TIP.tagline}>
          <Input value={d.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="e.g. Hand-picked from Madinah" />
        </Field>
        <Field label="Blurb" tip={TIP.blurb} hint="Two short lines about the category.">
          <Textarea rows={3} value={d.blurb} onChange={(e) => set('blurb', e.target.value)} />
        </Field>
        <div>
          <TipLabel tip={TIP.picture} className="mb-1.5">Picture</TipLabel>
          <SingleImage value={d.image} onChange={(v) => set('image', v)} alt={d.name} />
        </div>
        <Field label="Sort order" tip={TIP.sort} hint="Lower shows first.">
          <Input type="number" inputMode="numeric" value={d.sort} onChange={(e) => set('sort', e.target.value)} placeholder="0" />
        </Field>
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
          <TipLabel tip={TIP.active} className="text-sm">Show in the shop</TipLabel>
          <Switch checked={d.active} onChange={(v) => set('active', v)} label="Show in the shop" />
        </div>
        <section className="rounded-2xl border bg-cream/60 p-4">
          <h3 className="text-[15px] font-semibold text-navy">Preview</h3>
          <p className="mb-3 text-xs text-ink-soft">How customers will see it. Updates as you type.</p>
          <CategoryPreview d={preview} />
        </section>
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
