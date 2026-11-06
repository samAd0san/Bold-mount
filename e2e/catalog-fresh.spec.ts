import { expect, test, type Request } from '@playwright/test';
import { api } from './helpers';

type Catalog = { categories: { slug: string; name: string }[]; products: { slug: string; category: string; origin?: string }[] };

test('All products lists each category’s products together, in menu order', async ({ page }) => {
  await page.goto('/shop');
  const { categories, products } = (await api<Catalog>(page, '/api/catalog')).data;
  const rank = new Map(categories.map((c, i) => [c.slug, i]));
  const categoryOf = new Map(products.map((p) => [p.slug, p.category]));

  const shown = await page.locator('main a[href^="/product/"]').evaluateAll((links) => [
    ...new Set(links.map((a) => a.getAttribute('href')!.replace('/product/', ''))),
  ]);
  expect(shown.length).toBe(products.length);
  const ranks = shown.map((slug) => rank.get(categoryOf.get(slug)!)!);
  expect(ranks).toEqual([...ranks].sort((a, b) => a - b));

  // Each category has its own heading (full name), holding only its own products.
  const withProducts = categories.filter((c) => products.some((p) => p.category === c.slug));
  const sections = page.locator('main section[aria-labelledby^="shop-"]');
  await expect(sections.locator('h3')).toHaveText(withProducts.map((c) => c.name));
  for (const c of withProducts) {
    const inSection = await page.locator(`main section[aria-labelledby="shop-${c.slug}"] a[href^="/product/"]`).evaluateAll((links) =>
      links.map((a) => a.getAttribute('href')!.replace('/product/', '')),
    );
    expect(new Set(inSection.map((s) => categoryOf.get(s)))).toEqual(new Set([c.slug]));
  }

  // A product with an origin still names its category at the top.
  const withOrigin = products.find((p) => p.origin)!;
  await page.goto(`/product/${withOrigin.slug}`);
  const catName = categories.find((c) => c.slug === withOrigin.category)!.name;
  await expect(page.locator('main .eyebrow').first()).toHaveText(new RegExp(catName, 'i'));
});

test('coming back to a shop tab after a while fetches fresh shop data', async ({ page }) => {
  await page.clock.install();
  await page.goto('/shop');
  await expect(page.locator('main a[href^="/product/"]').first()).toBeVisible();

  // A refresh of this page itself, not a prefetch of the product links on it.
  const isRefresh = (r: Request) =>
    r.headers()['rsc'] === '1' && !r.headers()['next-router-prefetch'] && new URL(r.url()).pathname === '/shop';
  const setHidden = (hidden: boolean) =>
    page.evaluate((h) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);

  // A short look away is not enough to refetch.
  let refetches = 0;
  page.on('request', (r) => { if (isRefresh(r)) refetches++; });
  await setHidden(true);
  await page.clock.fastForward(5_000);
  await setHidden(false);
  await page.waitForTimeout(1500);
  expect(refetches).toBe(0);

  await setHidden(true);
  await page.clock.fastForward(61_000);
  const refetch = page.waitForRequest(isRefresh, { timeout: 10_000 });
  await setHidden(false);
  await refetch;
});
