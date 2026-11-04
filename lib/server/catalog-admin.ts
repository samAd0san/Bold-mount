import 'server-only';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { PRODUCT_TAGS } from '@/lib/types';
import { notify } from '@/lib/server/live';
import { slugify } from '@/lib/server/slug';

/** After any category/product change: drop the cached shop pages, then tell open pages (shop and admin) to refresh live. */
export function refreshStorefront() {
  try {
    revalidatePath('/', 'layout');
  } catch (err) {
    console.error('[catalog] revalidate failed', err);
  }
  notify('catalog', 'changed');
}

const text = (max: number) => z.string().trim().max(max);
// The shop can only show the site's own /images and pictures stored on Cloudinary (next.config remotePatterns); pasted links are copied there first.
const isPicture = (v: string) => /^\/(?!\/)/.test(v) || v.startsWith('https://res.cloudinary.com/');
const PICTURE_ERROR = 'Add pictures with the Upload button or the link box, so they are saved to the shop.';
const url = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || isPicture(v), PICTURE_ERROR);

// No slug field: the web address is made from the name when the item is created and then never changes.
export const CategoryInput = z.object({
  name: z.string('Please enter a name.').trim().min(1, 'Please enter a name.').max(80),
  short: text(40).optional(),
  tagline: text(120).optional(),
  blurb: text(400).optional(),
  image: url.optional(),
  active: z.boolean().optional(),
  sort: z.number().int().optional(),
});

export const CategoryPatch = CategoryInput.partial();

// Blank / zero / null means "not set" for the optional compare-at price.
const optionalPrice = z.preprocess(
  (v) => (v === null || v === '' || v === 0 ? undefined : v),
  z.number('Prices must be numbers.').int('Prices are whole rupees.').positive().optional(),
);

// The size/pack label is optional for a single price (a book has no size), but needed to tell several apart.
const Variant = z
  .object({
    id: text(60).optional(),
    label: text(60).default(''),
    price: z.number('Every size needs a price.').int('Prices are whole rupees.').positive('Every price must be more than 0.'),
    compareAt: optionalPrice,
  })
  .refine((v) => v.compareAt === undefined || v.compareAt > v.price, { message: 'The old price must be higher than the selling price.', path: ['compareAt'] });

const Variants = z
  .array(Variant)
  .min(1, 'Add a price.')
  .max(20)
  .refine((vs) => vs.length === 1 || vs.every((v) => v.label), 'With more than one price, name each size or pack so customers can choose.');

const Image = z.object({
  src: z.string('Every photo needs a link.').trim().min(1, 'Every photo needs a link.').max(500).refine(isPicture, PICTURE_ERROR),
  alt: text(200).default(''),
  cover: z.boolean().optional(),
});

// No `.default()` here on purpose: PATCH reuses this shape via .partial() and a default would reset fields that were not sent.
export const ProductInput = z.object({
  name: z.string('Please enter a name.').trim().min(1, 'Please enter a name.').max(120),
  category: z.string('Please choose a category.').trim().min(1, 'Please choose a category.'),
  tags: z.array(z.enum(PRODUCT_TAGS, 'Unknown tag.')).max(5).optional(),
  tagline: text(200).optional(),
  description: text(3000).optional(),
  highlights: z.array(z.string().trim().max(200)).max(20).transform((a) => a.filter(Boolean)).optional(),
  details: z
    .array(z.object({ label: text(80), value: text(300) }))
    .max(30)
    .transform((a) => a.filter((d) => d.label || d.value))
    .optional(),
  images: z.array(Image).max(12).optional(),
  variants: Variants,
  origin: text(80).optional(),
  badge: text(40).optional(),
  active: z.boolean().optional(),
  sort: z.number().int().optional(),
});

export const ProductPatch = ProductInput.partial();

/** Gives every size a stable id from its label ("500 g" → "500-g"; no label → "standard"); repeats get -2, -3… */
export function withVariantIds<T extends { id?: string; label: string }>(variants: T[]): (T & { id: string })[] {
  const seen = new Set<string>();
  return variants.map((v) => {
    const base = slugify(v.id || v.label) || 'standard';
    let id = base;
    for (let n = 2; seen.has(id); n++) id = `${base}-${n}`;
    seen.add(id);
    return { ...v, id };
  });
}
