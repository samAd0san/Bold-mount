'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Plus, Trash2 } from 'lucide-react';
import { adminFetch, useFetch } from '@/components/admin/api';
import { ImagesEditor } from '@/components/admin/image-fields';
import { Button, btn, Card, Checkbox, ConfirmDelete, ErrorNote, Field, Input, PageHead, Select, Skeleton, Switch, Textarea } from '@/components/admin/ui';
import { PRODUCT_TAGS, type Category, type Product, type ProductImage, type ProductTag } from '@/lib/types';

let rowId = 0;
const rid = () => `r${++rowId}`;

type VariantRow = { key: string; id?: string; label: string; price: string; compareAt: string };
type DetailRow = { key: string; label: string; value: string };
type Draft = {
  name: string;
  category: string;
  tagline: string;
  description: string;
  highlights: string;
  details: DetailRow[];
  images: ProductImage[];
  variants: VariantRow[];
  tags: ProductTag[];
  badge: string;
  origin: string;
  active: boolean;
  sort: string;
};
type Errors = Record<string, string>;
const NONE: Errors = {};

const TAG_LABEL: Record<ProductTag, string> = { bestseller: 'Bestseller', gift: 'Gift', new: 'New' };

const blank = (category: string): Draft => ({
  name: '', category, tagline: '', description: '', highlights: '', details: [], images: [],
  variants: [{ key: rid(), label: '', price: '', compareAt: '' }], tags: [], badge: '', origin: '', active: true, sort: '',
});

const draftFrom = (p: Product): Draft => ({
  name: p.name,
  category: p.category,
  tagline: p.tagline ?? '',
  description: p.description ?? '',
  highlights: (p.highlights ?? []).join('\n'),
  details: (p.details ?? []).map((d) => ({ key: rid(), ...d })),
  images: (p.images ?? []).map((i) => ({ ...i })),
  variants: p.variants.map((v) => ({ key: rid(), id: v.id, label: v.label, price: String(v.price), compareAt: v.compareAt ? String(v.compareAt) : '' })),
  tags: p.tags ?? [],
  badge: p.badge ?? '',
  origin: p.origin ?? '',
  active: p.active,
  sort: String(p.sort ?? ''),
});

/** Loads what the form needs (categories, and the product when editing) and then shows it. */
export function ProductEditor({ id }: { id?: string }) {
  const cats = useFetch<{ categories: Category[] }>('/api/admin/categories');
  const prod = useFetch<{ product: Product }>(id ? `/api/admin/products/${id}` : null);
  const error = cats.error ?? prod.error;
  const ready = cats.data && (!id || prod.data);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      {!ready ? (
        <>
          <PageHead title={id ? 'Edit product' : 'New product'} />
          {error ? <ErrorNote>{error}</ErrorNote> : <Skeleton rows={4} className="h-40" />}
          {error && <Link href="/admin/products" className={btn('outline', 'sm', 'self-start')}>Back to products</Link>}
        </>
      ) : (
        <ProductForm
          key={prod.data?.product.id ?? 'new'}
          id={id}
          categories={cats.data!.categories}
          initial={prod.data ? draftFrom(prod.data.product) : blank(cats.data!.categories[0]?.slug ?? '')}
        />
      )}
    </div>
  );
}

function ProductForm({ id, categories, initial }: { id?: string; categories: Category[]; initial: Draft }) {
  const router = useRouter();
  const [d, setD] = React.useState<Draft>(initial);
  const [tried, setTried] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const top = React.useRef<HTMLDivElement>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((s) => ({ ...s, [k]: v })); setSaved(false); };
  const setVariant = (key: string, patch: Partial<VariantRow>) => set('variants', d.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  const setDetail = (key: string, patch: Partial<DetailRow>) => set('details', d.details.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const validate = (): Errors => {
    const e: Errors = {};
    if (!d.name.trim()) e.name = 'Give the product a name.';
    if (!d.category) e.category = 'Pick a category.';
    d.variants.forEach((v, i) => {
      const price = Number(v.price);
      const compare = Number(v.compareAt);
      if (!v.label.trim()) e[`v${i}.label`] = 'Name this size, e.g. 500 g.';
      if (!(price > 0)) e[`v${i}.price`] = 'Enter a price above 0.';
      else if (v.compareAt && !(compare > price)) e[`v${i}.compareAt`] = 'Must be higher than the price.';
    });
    return e;
  };
  // Once you press Save, errors follow your typing until they are fixed.
  const errors = tried ? validate() : NONE;
  const fixFields = Object.keys(errors).length > 0;

  const save = async () => {
    setTried(true);
    setProblem(null);
    if (Object.keys(validate()).length) {
      top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const payload = {
      name: d.name.trim(),
      category: d.category,
      tagline: d.tagline.trim(),
      description: d.description.trim(),
      highlights: d.highlights.split('\n').map((l) => l.trim()).filter(Boolean),
      details: d.details.map((x) => ({ label: x.label.trim(), value: x.value.trim() })).filter((x) => x.label && x.value),
      images: d.images.map((i) => ({ src: i.src, alt: i.alt.trim() || d.name.trim(), ...(i.cover ? { cover: true } : {}) })),
      variants: d.variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        label: v.label.trim(),
        price: Number(v.price),
        ...(v.compareAt ? { compareAt: Number(v.compareAt) } : {}),
      })),
      tags: d.tags,
      badge: d.badge.trim(),
      origin: d.origin.trim(),
      active: d.active,
      ...(d.sort.trim() !== '' ? { sort: Number(d.sort) } : {}),
    };
    setSaving(true);
    try {
      const res = await adminFetch<{ product: Product }>(id ? `/api/admin/products/${id}` : '/api/admin/products', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      if (id) {
        setD(draftFrom(res.product));
        setSaved(true);
      } else {
        router.push('/admin/products');
      }
    } catch (err) {
      setProblem((err as Error).message);
      top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    await adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    router.push('/admin/products');
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} noValidate className="flex flex-col gap-5">
      <div ref={top} className="scroll-mt-32" />
      <PageHead title={id ? 'Edit product' : 'New product'} sub={id ? d.name || undefined : 'Fill in the basics, add pictures and at least one price.'} action={<Link href="/admin/products" className="text-sm font-semibold text-navy underline-offset-4 hover:underline">← All products</Link>} />
      {(fixFields || problem) && <ErrorNote>{fixFields ? 'Please fix the highlighted fields.' : problem}</ErrorNote>}

      <Card className="flex flex-col gap-4">
        <h2 className="text-[15px] font-semibold text-navy">Basics</h2>
        <Field label="Name" error={errors.name}>
          <Input value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Ajwa Dates" autoComplete="off" />
        </Field>
        <Field label="Category" error={errors.category}>
          <Select value={d.category} onChange={(e) => set('category', e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}{c.active ? '' : ' (hidden)'}</option>)}
          </Select>
        </Field>
        <Field label="Tagline" hint="One short line under the name.">
          <Input value={d.tagline} onChange={(e) => set('tagline', e.target.value)} />
        </Field>
        <Field label="Description">
          <Textarea rows={5} value={d.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label="Highlights" hint="One per line.">
          <Textarea rows={4} value={d.highlights} onChange={(e) => set('highlights', e.target.value)} />
        </Field>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold text-navy">Prices</h2>
        <p className="-mt-1 text-xs text-ink-soft">One row for each size or pack. The strike-through price is optional.</p>
        {d.variants.map((v, i) => (
          <div key={v.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 rounded-xl border bg-white p-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
            <Field label="Size or pack" error={errors[`v${i}.label`]} className="col-span-2 sm:col-span-1">
              <Input value={v.label} onChange={(e) => setVariant(v.key, { label: e.target.value })} placeholder="e.g. 500 g" />
            </Field>
            <Field label="Price ₹" error={errors[`v${i}.price`]}>
              <Input type="number" inputMode="numeric" min={1} value={v.price} onChange={(e) => setVariant(v.key, { price: e.target.value })} placeholder="449" />
            </Field>
            <Field label="Was ₹ (optional)" error={errors[`v${i}.compareAt`]}>
              <Input type="number" inputMode="numeric" min={1} value={v.compareAt} onChange={(e) => setVariant(v.key, { compareAt: e.target.value })} placeholder="549" />
            </Field>
            <button
              type="button"
              disabled={d.variants.length === 1}
              onClick={() => set('variants', d.variants.filter((x) => x.key !== v.key))}
              aria-label={`Remove price row ${i + 1}`}
              className="col-span-2 grid size-10 place-items-center self-end justify-self-end rounded-full border border-red-700/30 text-red-700 hover:bg-red-700 hover:text-white disabled:opacity-30 sm:col-span-1"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        <div>
          <Button variant="outline" size="sm" onClick={() => set('variants', [...d.variants, { key: rid(), label: '', price: '', compareAt: '' }])}><Plus className="size-4" />Add a price</Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold text-navy">Pictures</h2>
        <p className="-mt-1 text-xs text-ink-soft">The first picture is the main one. &ldquo;Fill the tile&rdquo; is for full photos; leave it off for cut-out pouches and jars.</p>
        <ImagesEditor images={d.images} onChange={(v) => set('images', v)} defaultAlt={d.name.trim()} />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold text-navy">Details</h2>
        <p className="-mt-1 text-xs text-ink-soft">Small facts such as Storage or Ingredients.</p>
        {d.details.map((x) => (
          <div key={x.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
            <Input value={x.label} onChange={(e) => setDetail(x.key, { label: e.target.value })} placeholder="Label" aria-label="Detail label" />
            <button type="button" onClick={() => set('details', d.details.filter((y) => y.key !== x.key))} aria-label="Remove detail" className="grid size-10 place-items-center self-start rounded-full border border-red-700/30 text-red-700 hover:bg-red-700 hover:text-white sm:order-last"><Trash2 className="size-4" /></button>
            <Input value={x.value} onChange={(e) => setDetail(x.key, { value: e.target.value })} placeholder="Value" aria-label="Detail value" className="col-span-2 sm:col-span-1" />
          </div>
        ))}
        <div>
          <Button variant="outline" size="sm" onClick={() => set('details', [...d.details, { key: rid(), label: '', value: '' }])}><Plus className="size-4" />Add a detail</Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-[15px] font-semibold text-navy">Shop settings</h2>
        <div>
          <p className="mb-1 text-[13px] font-semibold text-ink">Tags</p>
          <div className="flex flex-wrap gap-x-5">
            {PRODUCT_TAGS.map((t) => (
              <Checkbox key={t} checked={d.tags.includes(t)} onChange={(on) => set('tags', on ? [...d.tags, t] : d.tags.filter((x) => x !== t))}>{TAG_LABEL[t]}</Checkbox>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Badge" hint="Small label on the card.">
            <Input value={d.badge} onChange={(e) => set('badge', e.target.value)} placeholder="e.g. Bestseller" />
          </Field>
          <Field label="Origin">
            <Input value={d.origin} onChange={(e) => set('origin', e.target.value)} placeholder="e.g. Madinah" />
          </Field>
          <Field label="Sort order" hint="Lower shows first.">
            <Input type="number" inputMode="numeric" value={d.sort} onChange={(e) => set('sort', e.target.value)} placeholder="0" />
          </Field>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
          <span>
            <span className="block text-sm font-semibold text-ink">Show in the shop</span>
            <span className="block text-xs text-ink-soft">Turn off to hide it without deleting.</span>
          </span>
          <Switch checked={d.active} onChange={(v) => set('active', v)} label="Show in the shop" />
        </label>
      </Card>

      <div className="sticky bottom-0 z-30 -mx-4 flex flex-wrap items-center gap-2 border-t bg-cream/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <Button type="submit" variant="gold" busy={saving}>{id ? 'Save changes' : 'Add product'}</Button>
        <Link href="/admin/products" className={btn('ghost')}>Cancel</Link>
        {saved && <span role="status" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700"><Check className="size-4" />Saved</span>}
        {id && <Button variant="danger" className="ml-auto" onClick={() => setDeleting(true)}><Trash2 className="size-4" />Delete</Button>}
      </div>

      <ConfirmDelete open={deleting} onOpenChange={setDeleting} title="Delete this product?" description={`"${d.name}" will be removed from the shop for good. To just hide it, turn off "Show in the shop" instead.`} onConfirm={remove} />
    </form>
  );
}
