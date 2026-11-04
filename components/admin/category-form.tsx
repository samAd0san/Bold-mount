'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { adminFetch, useFetch } from '@/components/admin/api';
import { SingleImage } from '@/components/admin/image-fields';
import { PreviewFrame } from '@/components/admin/product-preview';
import { Button, btn, Card, CardTitle, ConfirmDelete, ErrorNote, Field, Input, Modal, PageHead, Skeleton, Switch, Textarea, TipLabel } from '@/components/admin/ui';
import { CategoriesProvider } from '@/components/layout/categories-context';
import { ProductCard } from '@/components/product/product-card';
import { ShopCategoryTiles } from '@/components/shop/shop-category-tiles';
import { buttonClass } from '@/components/ui/button-styles';
import type { Category, Product } from '@/lib/types';

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

/** Loads the categories (and, when editing, this category's products for the preview), then shows the form. */
export function CategoryEditor({ id }: { id?: string }) {
  const cats = useFetch<{ categories: Row[] }>('/api/admin/categories');
  const category = id ? cats.data?.categories.find((c) => c.id === id) : undefined;
  const prods = useFetch<{ products: Product[] }>(category ? `/api/admin/products?category=${encodeURIComponent(category.slug)}` : null);
  const missing = id && cats.data && !category;
  const error = cats.error ?? (missing ? 'This category no longer exists.' : null);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 xl:max-w-none">
      {!cats.data || missing ? (
        <>
          <PageHead title={id ? 'Edit category' : 'New category'} />
          {error ? <ErrorNote>{error}</ErrorNote> : <Skeleton rows={3} className="h-40" />}
          {error && <Link href="/admin/categories" className={btn('outline', 'sm', 'self-start')}>Back to categories</Link>}
        </>
      ) : (
        <CategoryForm
          key={category?.id ?? 'new'}
          category={category}
          others={cats.data.categories.filter((c) => c.id !== id)}
          products={prods.data?.products.filter((p) => p.active) ?? []}
          initial={category ? draftFrom(category) : blank}
        />
      )}
    </div>
  );
}

function CategoryForm({ category, others, products, initial }: { category?: Row; others: Row[]; products: Product[]; initial: Draft }) {
  const router = useRouter();
  const [d, setD] = React.useState<Draft>(initial);
  const [tried, setTried] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState<Row | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [previewing, setPreviewing] = React.useState(false);
  const top = React.useRef<HTMLDivElement>(null);
  const draft = React.useDeferredValue(d);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((s) => ({ ...s, [k]: v })); setSaved(null); };
  const current = saved ?? category;

  const errors: Record<string, string> = {};
  if (tried && !d.name.trim()) errors.name = 'Give the category a name.';

  const save = async () => {
    setTried(true);
    setProblem(null);
    if (!d.name.trim()) {
      top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const payload = {
      name: d.name.trim(),
      short: d.short.trim() || d.name.trim(),
      tagline: d.tagline.trim(),
      blurb: d.blurb.trim(),
      image: d.image,
      active: d.active,
      ...(d.sort.trim() !== '' ? { sort: Number(d.sort) } : {}),
    };
    setSaving(true);
    try {
      const res = await adminFetch<{ category: Category }>(category ? `/api/admin/categories/${category.id}` : '/api/admin/categories', { method: category ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      if (category) {
        const row = { ...res.category, products: category.products };
        setD(draftFrom(row));
        setSaved(row);
      } else {
        router.push('/admin/categories');
      }
    } catch (err) {
      setProblem((err as Error).message);
      top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    await adminFetch(`/api/admin/categories/${category!.id}`, { method: 'DELETE' });
    router.push('/admin/categories');
  };

  const preview = <CategoryPreview d={draft} slug={current?.slug} others={others} products={products} />;

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} noValidate className="flex flex-col gap-5">
      <div ref={top} className="scroll-mt-32" />
      <PageHead
        title={category ? 'Edit category' : 'New category'}
        sub={category ? <>/{current?.slug} · {category.products} product{category.products === 1 ? '' : 's'}</> : 'A name is enough to start. Tap any ⓘ for help.'}
        action={<Link href="/admin/categories" className="text-sm font-semibold text-navy underline-offset-4 hover:underline">← All categories</Link>}
      />
      {(errors.name || problem) && <ErrorNote>{errors.name ? 'Please fix the highlighted fields.' : problem}</ErrorNote>}

      {/* 25rem leaves the preview about as wide as a phone screen. */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem] xl:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <Card className="flex flex-col gap-4">
            <CardTitle>Basics</CardTitle>
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
          </Card>

          <Card className="flex flex-col gap-3">
            <CardTitle tip={TIP.picture}>Picture</CardTitle>
            <p className="-mt-1 text-xs text-ink-soft">Upload from your phone or computer, or paste a picture link.</p>
            <SingleImage value={d.image} onChange={(v) => set('image', v)} alt={d.name} />
          </Card>

          <Card className="flex flex-col gap-4">
            <CardTitle>Shop settings</CardTitle>
            <Field label="Sort order" tip={TIP.sort} hint="Lower shows first.">
              <Input type="number" inputMode="numeric" value={d.sort} onChange={(e) => set('sort', e.target.value)} placeholder="0" />
            </Field>
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
              <span className="min-w-0">
                <TipLabel tip={TIP.active} className="text-sm">Show in the shop</TipLabel>
                <span className="block text-xs text-ink-soft">Turn off to hide it without deleting.</span>
              </span>
              <Switch checked={d.active} onChange={(v) => set('active', v)} label="Show in the shop" />
            </div>
          </Card>
        </div>

        <aside aria-label="Preview" className="hidden xl:sticky xl:top-6 xl:block xl:max-h-[calc(100dvh-3rem)] xl:overflow-y-auto xl:overscroll-contain xl:rounded-2xl">
          <Card className="flex flex-col gap-4">
            <div>
              <h2 className="text-[15px] font-semibold text-navy">Preview</h2>
              <p className="text-xs text-ink-soft">How customers will see it. Updates as you type.</p>
            </div>
            {preview}
          </Card>
        </aside>
      </div>

      <div className="sticky bottom-0 z-30 -mx-4 flex items-center gap-2 border-t bg-cream/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <Button type="submit" variant="gold" busy={saving}>{category ? 'Save changes' : 'Add category'}</Button>
        <Button variant="outline" className="xl:hidden" onClick={() => setPreviewing(true)}><Eye className="size-4" />Preview</Button>
        <Link href="/admin/categories" className={btn('ghost', 'md', 'max-sm:hidden')}>Cancel</Link>
        {saved && <span role="status" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700"><Check className="size-4" /><span className="max-sm:sr-only">Saved</span></span>}
        {category && <Button variant="danger" className="ml-auto max-sm:px-3" aria-label="Delete" onClick={() => setDeleting(true)}><Trash2 className="size-4" /><span className="max-sm:hidden">Delete</span></Button>}
      </div>

      <Modal open={previewing} onOpenChange={setPreviewing} title="Preview" description="How customers will see it. Close to keep editing.">
        {preview}
      </Modal>
      {category && (
        <ConfirmDelete open={deleting} onOpenChange={setDeleting} title="Delete this category?" description={`"${category.name}" will be removed. A category that still has products cannot be deleted; move or delete its products first.`} onConfirm={remove} />
      )}
    </form>
  );
}

/** The category as the shop shows it: its round button among the others, the top of its page, and its products. Tapping works like the shop. */
function CategoryPreview({ d, slug = 'new-category', others, products }: { d: Draft; slug?: string; others: Row[]; products: Product[] }) {
  const name = d.name.trim() || 'Category name';
  const short = d.short.trim() || name;
  const sort = d.sort.trim() === '' ? Number.MAX_SAFE_INTEGER : Number(d.sort);
  const self: Category = { id: 'preview', slug, name, short, tagline: d.tagline.trim(), blurb: d.blurb.trim(), image: d.image, active: d.active, sort };
  // The shop lists shown categories by sort order, then name.
  const shown = [...others.filter((c) => c.active), ...(d.active ? [self] : [])].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
  const heroRef = React.useRef<HTMLElement>(null);
  const productsRef = React.useRef<HTMLElement>(null);

  // Its own round button opens its page; "Shop …" jumps to its products, like on the site.
  const onLink = (a: HTMLAnchorElement) => {
    const target = a.getAttribute('aria-current') === 'true' ? heroRef : a.hash === '#products' ? productsRef : null;
    target?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return !!target;
  };

  return (
    <CategoriesProvider categories={shown}>
      <PreviewFrame testId="category-preview" onLink={onLink}>
        <section>
          <p className="mb-1 text-xs font-semibold text-ink-soft">Round buttons in the shop (tap yours to see its page)</p>
          {d.active ? (
            <div className="overflow-hidden">
              <ShopCategoryTiles query={{ filter: slug, sort: 'featured', price: 'any', sale: false, gift: false }} categories={shown} />
            </div>
          ) : (
            <p className="rounded-xl bg-ink/[0.05] px-3 py-2.5 text-xs text-ink-soft">Hidden: customers won’t see this button or page. Turn on “Show in the shop” to show it.</p>
          )}
        </section>

        <section ref={heroRef} className="scroll-mt-4">
          <p className="mb-2 text-xs font-semibold text-ink-soft">Top of its page (as on a phone)</p>
          <div className="relative isolate overflow-hidden rounded-2xl bg-night text-on-night">
            {d.image && <Image src={d.image} alt="" fill sizes="400px" className="-z-10 object-cover opacity-90" />}
            <div className="absolute inset-0 -z-10 scrim-l" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night/70 to-transparent" />
            <div className="flex min-h-64 flex-col justify-end p-5">
              <p className="mb-4 flex flex-wrap items-center gap-1 text-[11px] text-on-night-soft">Home <ChevronRight size={10} /> Shop <ChevronRight size={10} /> <span className="text-on-night">{short}</span></p>
              {self.tagline && <p className="eyebrow text-gold">{self.tagline}</p>}
              <p className="mt-2 font-display text-3xl leading-[1.08] font-semibold tracking-tight break-words">{name}</p>
              {self.blurb && <p className="mt-3 text-sm text-on-night-soft">{self.blurb}</p>}
              <a href="#products" className={buttonClass('gold', 'mt-5 self-start px-5 py-2.5 text-sm')}>Shop {short}</a>
            </div>
          </div>
        </section>

        <section ref={productsRef} className="scroll-mt-4">
          <p className="eyebrow">{products.length} {products.length === 1 ? 'product' : 'products'}</p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Shop {short}</p>
          {products.length ? (
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed px-4 py-6 text-center text-sm text-ink-soft">No products yet. Add a product and choose “{name}” as its category.</p>
          )}
        </section>
      </PreviewFrame>
    </CategoriesProvider>
  );
}
