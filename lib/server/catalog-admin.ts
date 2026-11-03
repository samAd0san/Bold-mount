import 'server-only';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { PRODUCT_TAGS } from '@/lib/types';
import { slugify } from '@/lib/server/slug';

/** Makes pages served from this process show catalog edits straight away (on Vercel they refresh within a minute on their own). */
export function refreshStorefront() {
  try {
    revalidatePath('/', 'layout');
  } catch (err) {
    console.error('[catalog] revalidate failed', err);
  }
}

const text = (max: number) => z.string().trim().max(max);
const url = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || v.startsWith('/') || /^https:\/\//.test(v), 'Image links must start with https:// or /.');

// An empty slug is allowed; the route fills it in from the name.
const slugField = text(80).transform((v) => slugify(v));

export const CategoryInput = z.object({
  slug: slugField.optional(),
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

const Variant = z
  .object({
    id: text(60).optional(),
    label: z.string('Every size needs a label.').trim().min(1, 'Every size needs a label.').max(60),
    price: z.number('Every size needs a price.').int('Prices are whole rupees.').positive('Every price must be more than 0.'),
    compareAt: optionalPrice,
  })
  .refine((v) => v.compareAt === undefined || v.compareAt > v.price, { message: 'The old price must be higher than the selling price.', path: ['compareAt'] });

const Image = z.object({
  src: z.string('Every photo needs a link.').trim().min(1, 'Every photo needs a link.').max(500)
    .refine((v) => v.startsWith('/') || /^https:\/\//.test(v), 'Photo links must start with https:// or /.'),
  alt: text(200).default(''),
  cover: z.boolean().optional(),
});

// No `.default()` here on purpose: PATCH reuses this shape via .partial() and a default would reset fields that were not sent.
export const ProductInput = z.object({
  slug: slugField.optional(),
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
  variants: z.array(Variant).min(1, 'Add at least one size with a price.').max(20),
  origin: text(80).optional(),
  badge: text(40).optional(),
  active: z.boolean().optional(),
  sort: z.number().int().optional(),
});

export const ProductPatch = ProductInput.partial();

/** Gives every size a stable id from its label ("500 g" → "500-g"); repeats get -2, -3… */
export function withVariantIds<T extends { id?: string; label: string }>(variants: T[]): (T & { id: string })[] {
  const seen = new Set<string>();
  return variants.map((v) => {
    const base = slugify(v.id || v.label) || 'size';
    let id = base;
    for (let n = 2; seen.has(id); n++) id = `${base}-${n}`;
    seen.add(id);
    return { ...v, id };
  });
}
