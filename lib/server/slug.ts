export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Dry Fruits & Nuts" → "dry-fruits-nuts" (lowercase a-z0-9 and dashes only). */
export const slugify = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

/** Web address name made from the name; repeats get -2, -3… so the admin never has to pick one. */
export async function uniqueSlug(name: string, fallback: string, taken: (slug: string) => Promise<unknown>) {
  const base = slugify(name) || fallback;
  let slug = base;
  for (let n = 2; await taken(slug); n++) slug = `${base}-${n}`;
  return slug;
}

export const isObjectId = (s: string) => /^[0-9a-f]{24}$/i.test(s);
