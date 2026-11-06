import { expect, test, type Browser, type Page } from '@playwright/test';
import { adminLogin, api, CUSTOMER, signInAs } from './helpers';
import type { Order } from '../lib/types';

// Live updates over Ably WebSockets: every check below happens WITHOUT reloading the page that changes.
test.skip(!process.env.ABLY_API_KEY, 'ABLY_API_KEY is not set');

type Grant = { prefix: string; uid: string | null; admin: boolean; tokenRequest: { capability: string } };

/** Marks the page so we can prove it was updated in place, not reloaded. */
const mark = (page: Page) => page.evaluate(() => { (window as unknown as { __kept: boolean }).__kept = true; });
const notReloaded = async (page: Page) => expect(await page.evaluate(() => (window as unknown as { __kept?: boolean }).__kept)).toBe(true);
/** Waits until the page's live connection is subscribed, so the test doesn't publish before anyone is listening. */
const listening = (page: Page, topic: 'catalog' | 'admin' | 'orders') => expect(page.locator(`html[data-live~="${topic}"]`)).toHaveCount(1, { timeout: 15_000 });

async function adminPage(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await adminLogin(page);
  return page;
}

test('the token only lets each visitor listen to what is theirs', async ({ page, context, browser }) => {
  await page.goto('/');
  const guest = (await api<Grant>(page, '/api/live/token')).data;
  const db = process.env.MONGODB_DB!;
  expect(guest.prefix).toBe(db);
  expect(Object.keys(JSON.parse(guest.tokenRequest.capability))).toEqual([`${db}:catalog`]);

  const uid = await signInAs(context, { name: 'Maryam Siddiqui', email: 'maryam.siddiqui@example.com' });
  const customer = (await api<Grant>(page, '/api/live/token')).data;
  expect(Object.keys(JSON.parse(customer.tokenRequest.capability)).sort()).toEqual([`${db}:catalog`, `${db}:orders:${uid}`]);

  const admin = await adminPage(browser);
  const shop = (await api<Grant>(admin, '/api/live/token')).data;
  expect(Object.keys(JSON.parse(shop.tokenRequest.capability)).sort()).toEqual([`${db}:admin`, `${db}:catalog`]);
  await admin.context().close();
});

test('a new category and product appear on open shop pages and admin lists, without reloading', async ({ page, browser }) => {
  const admin = await adminPage(browser);
  await page.goto('/shop');
  await listening(page, 'catalog');
  await mark(page);

  await admin.goto('/admin/products');
  await listening(admin, 'catalog');
  await mark(admin);

  // Saved from somewhere else (a second admin tab, a phone): both open pages catch up on their own.
  const cat = await api<{ category: { slug: string } }>(admin, '/api/admin/categories', { method: 'POST', body: { name: 'Islamic Books', short: 'Books', image: '/images/products/gift-sunnah-trio.webp' } });
  const { data } = await api<{ product: { id: string; slug: string } }>(admin, '/api/admin/products', {
    method: 'POST',
    body: { name: 'Hisnul Muslim (pocket)', category: cat.data.category.slug, variants: [{ label: '', price: 120 }], images: [{ src: '/images/products/gift-sunnah-trio.webp', alt: '' }] },
  });
  await expect(page.getByRole('navigation', { name: 'Shop by category' })).toContainText('Books', { timeout: 10_000 });
  await expect(page.locator('main')).toContainText('Hisnul Muslim (pocket)', { timeout: 10_000 });
  await expect(admin.locator('main')).toContainText('Hisnul Muslim (pocket)', { timeout: 10_000 });
  await notReloaded(page);
  await notReloaded(admin);

  // A price change shows on the open product page.
  await page.goto(`/product/${data.product.slug}`);
  await listening(page, 'catalog');
  await mark(page);
  await api(admin, `/api/admin/products/${data.product.id}`, { method: 'PATCH', body: { variants: [{ label: '', price: 99 }] } });
  await expect(page.locator('main')).toContainText('₹99', { timeout: 10_000 });
  await notReloaded(page);

  await api(admin, `/api/admin/products/${data.product.id}`, { method: 'DELETE' });
  await admin.context().close();
});

test('order status set in the admin shows on the customer’s open tracking page; new orders reach the admin list', async ({ page, context, browser }) => {
  await signInAs(context, { name: 'Faisal Ahmed', email: 'faisal.ahmed@example.com' });
  const admin = await adminPage(browser);
  await admin.goto('/admin/orders');
  await listening(admin, 'admin');
  await mark(admin);

  // The customer orders on WhatsApp: the admin's open Orders page lists it straight away.
  await page.goto('/');
  const placed = await api<{ order: Order }>(page, '/api/orders', {
    method: 'POST',
    body: { method: 'whatsapp', items: [{ slug: 'premium-roasted-talbeenah', variantId: '500g', qty: 1 }], customer: { ...CUSTOMER, name: 'Faisal Ahmed', note: '' } },
  });
  expect(placed.status).toBe(201);
  const order = placed.data.order;
  await expect(admin.locator('main')).toContainText(order.number, { timeout: 10_000 });
  await notReloaded(admin);

  // The admin confirms, then dispatches: the customer's tracking page follows without a reload or a tab switch.
  await page.goto(`/orders/${order.id}`);
  await listening(page, 'orders');
  await mark(page);
  for (const [status, text] of [['confirmed', 'Confirmed'], ['dispatched', 'Dispatched']] as const) {
    await api(admin, `/api/admin/orders/${order.id}`, { method: 'PATCH', body: { status } });
    await expect(page.locator('main')).toContainText(`Status: ${text}`, { timeout: 10_000 });
  }
  await notReloaded(page);
  await admin.context().close();
});
