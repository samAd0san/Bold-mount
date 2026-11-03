import { createHash } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { adminLogin, api, PIN, signInAs } from './helpers';

type Product = { id: string; slug: string; name: string; category: string; images: { src: string }[]; variants: { label: string; price: number; compareAt?: number }[] };
type Category = { id: string; slug: string; name: string };
const products = async (page: Page) => (await api<{ products: Product[] }>(page, '/api/admin/products')).data.products;
const categories = async (page: Page) => (await api<{ categories: Category[] }>(page, '/api/admin/categories')).data.categories;

async function pressPin(page: Page, pin: string) {
  for (const d of pin) await page.getByRole('button', { name: d, exact: true }).click();
}

test('wrong PIN is refused, right PIN opens the dashboard, Log out locks it again', async ({ page }) => {
  await page.goto('/admin');
  await pressPin(page, '0000');
  await expect(page.locator('main')).toContainText(/wrong|incorrect|try/i);
  await page.reload();
  await pressPin(page, PIN);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  for (const tile of ['Visitors', 'Page views', 'Orders', 'Revenue', 'Sign-ups', 'Active now']) await expect(page.locator('main')).toContainText(tile);
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('heading', { name: 'Enter your PIN' })).toBeVisible();
});

test('sidebar collapses to icons, remembers it, and expands again', async ({ page }) => {
  await adminLogin(page);
  const nav = page.getByRole('navigation', { name: 'Admin sections' });
  const sidebar = page.locator('aside').filter({ has: nav });
  await expect(nav.getByText('Orders')).toBeVisible();
  const wide = (await sidebar.boundingBox())!.width;

  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  // Names stay readable to screen readers but take no space on screen.
  await expect.poll(async () => (await nav.getByText('Orders').boundingBox())?.width ?? 0).toBeLessThanOrEqual(1);
  await expect(nav.getByRole('link', { name: 'Orders' }).locator('svg')).toBeVisible();
  await expect.poll(async () => (await sidebar.boundingBox())!.width).toBeLessThan(wide / 2);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  await nav.getByRole('link', { name: 'Products' }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);

  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  await expect(nav.getByText('Orders')).toBeVisible();
});

test('phone: menu button opens the sidebar and it closes after picking a page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await adminLogin(page);
  const nav = page.getByRole('navigation', { name: 'Admin sections' });
  await expect(nav).toBeHidden();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(nav.getByText('Categories')).toBeVisible();
  await nav.getByRole('link', { name: 'Categories' }).click();
  await expect(page).toHaveURL(/\/admin\/categories$/);
  await expect(nav).toBeHidden();
});

test('category: added with just a name, the web address is made for you', async ({ page }) => {
  await adminLogin(page);
  await page.goto('/admin/categories');
  await page.getByRole('button', { name: 'Add category' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Slug')).toHaveCount(0);
  await dialog.getByLabel('Name', { exact: true }).fill('Attar & Oud');
  await dialog.getByLabel('Tagline').fill('Alcohol-free fragrance oils');
  await dialog.getByRole('button', { name: 'Add category' }).click();
  await expect(page.locator('main')).toContainText('/attar-oud');

  // Same name again gets its own address instead of an error.
  await page.getByRole('button', { name: 'Add category' }).click();
  await page.getByRole('dialog').getByLabel('Name', { exact: true }).fill('Attar & Oud');
  await page.getByRole('dialog').getByRole('button', { name: 'Add category' }).click();
  await expect(page.locator('main')).toContainText('/attar-oud-2');

  // Renaming keeps the address, so shared links keep working.
  await page.getByRole('button', { name: 'Edit Attar & Oud' }).last().click();
  await page.getByRole('dialog').getByLabel('Name', { exact: true }).fill('Attar Gift Sets');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('li', { hasText: 'Attar Gift Sets' })).toContainText('/attar-oud-2');

  await page.getByRole('button', { name: 'Edit Attar Gift Sets' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).last().click();
  await expect(page.locator('main')).not.toContainText('Attar Gift Sets');

  const res = await page.goto('/category/attar-oud');
  expect(res?.status()).toBe(200);
  await expect(page.locator('main')).toContainText('Attar & Oud');
});

test('product: add with several prices and photos, edit, rename, duplicate name, delete', async ({ page }) => {
  await adminLogin(page);
  if (!(await categories(page)).some((c) => c.slug === 'attar-oud')) {
    await api(page, '/api/admin/categories', { method: 'POST', body: { name: 'Attar & Oud' } });
  }
  await page.goto('/admin/products/new');
  await expect(page.getByText('Slug', { exact: true })).toHaveCount(0);
  await page.getByLabel('Name', { exact: true }).fill('Rose Attar');
  await page.getByLabel('Category').selectOption({ label: 'Attar & Oud' });
  await page.getByLabel('Tagline').fill('Soft Taifi rose');
  await page.getByLabel('Description').fill('A gentle rose attar in a roll-on bottle.');
  await page.getByLabel('Highlights').fill('Alcohol-free\nRoll-on bottle');

  await page.getByLabel('Size or pack').first().fill('6 ml');
  await page.getByLabel('Price ₹', { exact: true }).first().fill('349');
  await page.getByLabel('Was ₹ (optional)').first().fill('399');
  await page.getByRole('button', { name: 'Add a price' }).click();
  await page.getByLabel('Size or pack').nth(1).fill('12 ml');
  await page.getByLabel('Price ₹', { exact: true }).nth(1).fill('649');

  for (const src of ['/images/products/talbeenah-duo.webp', '/images/products/gift-sunnah-trio.webp']) {
    await page.getByLabel('Image link').fill(src);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }
  // A real upload, the way the owner adds photos from their phone.
  await page.getByLabel('Upload pictures').setInputFiles('public/images/brand/icon-192.png');
  await expect(page.locator('img[src*="res.cloudinary.com"]').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel('Picture 3 description')).toBeVisible();

  await page.getByRole('button', { name: 'Add product' }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);

  let rose = (await products(page)).find((p) => p.name === 'Rose Attar')!;
  expect(rose.slug).toBe('rose-attar');
  expect(rose.category).toBe('attar-oud');
  expect(rose.images).toHaveLength(3);
  expect(rose.variants.map((v) => [v.label, v.price, v.compareAt ?? null])).toEqual([['6 ml', 349, 399], ['12 ml', 649, null]]);
  const uploaded = rose.images.find((i) => i.src.includes('res.cloudinary.com'))!.src;

  // Storefront shows it straight away.
  await page.goto('/product/rose-attar');
  await expect(page.locator('main')).toContainText('Rose Attar');
  await expect(page.locator('main')).toContainText('₹349');
  await page.goto('/category/attar-oud');
  await expect(page.locator('main')).toContainText('Rose Attar');

  // Edit the price and rename: the web address stays.
  await page.goto(`/admin/products/${rose.id}`);
  await page.getByLabel('Price ₹', { exact: true }).first().fill('329');
  await page.getByLabel('Name', { exact: true }).fill('Rose Attar Roll-on');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect.poll(async () => (await products(page)).find((p) => p.id === rose.id)?.variants[0].price).toBe(329);
  rose = (await products(page)).find((p) => p.id === rose.id)!;
  expect(rose.name).toBe('Rose Attar Roll-on');
  expect(rose.slug).toBe('rose-attar');
  await page.goto('/product/rose-attar');
  await expect(page.locator('main')).toContainText('₹329');

  // Same name twice: the second one gets its own address.
  await page.goto('/admin/products/new');
  await page.getByLabel('Name', { exact: true }).fill('Rose Attar Roll-on');
  await page.getByLabel('Category').selectOption({ label: 'Attar & Oud' });
  await page.getByLabel('Size or pack').first().fill('6 ml');
  await page.getByLabel('Price ₹', { exact: true }).first().fill('299');
  await page.getByRole('button', { name: 'Add product' }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  const twin = (await products(page)).find((p) => p.name === 'Rose Attar Roll-on' && p.id !== rose.id)!;
  expect(twin.slug).toBe('rose-attar-roll-on');

  // Category with products can't be deleted.
  const attar = (await categories(page)).find((c) => c.slug === 'attar-oud')!;
  expect((await api(page, `/api/admin/categories/${attar.id}`, { method: 'DELETE' })).status).toBe(409);

  for (const p of [rose, twin]) {
    await page.goto(`/admin/products/${p.id}`);
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page).toHaveURL(/\/admin\/products$/);
  }
  expect((await products(page)).filter((p) => p.name.startsWith('Rose Attar'))).toHaveLength(0);
  expect((await api(page, `/api/admin/categories/${attar.id}`, { method: 'DELETE' })).status).toBe(200);
  expect((await page.goto('/product/rose-attar'))?.status()).toBe(404);

  await destroyCloudinary(uploaded);
});

test('users tab lists customers who signed in', async ({ page, context }) => {
  await signInAs(context, { name: 'Zainab Fatima', email: 'zainab.fatima@example.com' });
  await adminLogin(page);
  await page.goto('/admin/users');
  await expect(page.locator('main')).toContainText('Zainab Fatima');
  await expect(page.locator('main')).toContainText('zainab.fatima@example.com');
});

test('settings: change the PIN, sign in with the new one, change it back', async ({ page }) => {
  await adminLogin(page);
  await page.goto('/admin/settings');
  const change = async (from: string, to: string) => {
    await page.getByLabel('Current PIN').fill(from);
    await page.getByLabel('New PIN', { exact: false }).first().fill(to);
    await page.getByLabel('Confirm new PIN').fill(to);
    await page.getByRole('button', { name: 'Change PIN' }).click();
    await expect(page.locator('main')).toContainText(/changed|updated|saved/i);
  };
  await change(PIN, '2468');
  await page.getByRole('button', { name: 'Log out' }).click();
  await adminLogin(page, '2468');
  await page.goto('/admin/settings');
  await change('2468', PIN);
});

// Removes the test photo from Cloudinary so test runs leave nothing behind.
async function destroyCloudinary(src: string) {
  const publicId = src.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/)?.[1];
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
  if (!publicId || !cloud || !key || !secret) return;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash('sha1').update(`public_id=${publicId}&timestamp=${timestamp}${secret}`).digest('hex');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, {
    method: 'POST',
    body: new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: key, signature }),
  });
  expect((await res.json()).result).toBe('ok');
}
