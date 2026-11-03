export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Dry Fruits & Nuts" → "dry-fruits-nuts" (lowercase a-z0-9 and dashes only). */
export const slugify = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export const isObjectId = (s: string) => /^[0-9a-f]{24}$/i.test(s);
