import { expect, test } from '@playwright/test';
import { addToCart, adminLogin, api, TALBEENAH } from './helpers';

test('home lists the shop categories from the database', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  const header = page.locator('header');
  for (const name of ['Talbeenah', 'Dates', 'Honey']) await expect(header).toContainText(name);
});

test('no WhatsApp order buttons outside checkout', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header a[href*="wa.me"]')).toHaveCount(0);
  await expect(page.locator('footer a[href*="wa.me"]')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText(/order on whatsapp/i);

  await page.goto(TALBEENAH);
  await expect(page.locator('main')).not.toContainText(/order on whatsapp/i);
  await expect(page.locator('main a[href*="wa.me"]')).toHaveCount(0);

  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  const drawer = page.locator('aside').filter({ has: page.getByRole('link', { name: 'Checkout' }) });
  await expect(drawer).toBeVisible();
  await expect(drawer.locator('a[href*="wa.me"]')).toHaveCount(0);
});

test('shop lists products and search narrows them', async ({ page }) => {
  await page.goto('/shop');
  expect(await page.locator('main a[href^="/product/"]').count()).toBeGreaterThanOrEqual(10);
  await page.goto('/shop?q=honey');
  const cards = page.locator('main a[href^="/product/"]');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeLessThan(10);
});

test('product page: pick a size and add it to the cart', async ({ page }) => {
  await addToCart(page);
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText('Premium Roasted Talbeenah');
});

test('5 quick taps on the logo open the admin PIN pad; 4 taps do not', async ({ page }) => {
  await page.goto('/shop');
  const logo = page.getByRole('link', { name: 'Bold Mount home' });
  for (let i = 0; i < 4; i++) await logo.click();
  await expect(page).toHaveURL(/\/$/);
  await page.waitForTimeout(4200); // taps older than 4 seconds are forgotten
  for (let i = 0; i < 5; i++) await logo.click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Enter your PIN' })).toBeVisible();
});

test('contact form reaches admin Forms, can be marked read and deleted', async ({ page }) => {
  await page.goto('/contact');
  await page.evaluate(() => { window.open = () => null; });
  const form = page.locator('main form').first();
  for (const input of await form.locator('input:visible, textarea:visible').all()) {
    const type = (await input.getAttribute('type')) ?? 'text';
    const name = (await input.getAttribute('name')) ?? '';
    if (name === 'website') continue; // spam trap: people leave it empty
    if (type === 'tel' || /phone|mobile/.test(name)) await input.fill('98490 11223');
    else if (type === 'email') await input.fill('ibrahim.khan@example.com');
    else if ((await input.evaluate((e) => e.tagName)) === 'TEXTAREA') await input.fill('Do you deliver Ajwa dates to Secunderabad this week?');
    else await input.fill('Ibrahim Khan');
  }
  for (const select of await form.locator('select:visible').all()) {
    const first = await select.locator('option:not([disabled])').first().getAttribute('value');
    if (first) await select.selectOption(first);
  }
  const saved = page.waitForResponse((r) => r.url().endsWith('/api/forms') && r.request().method() === 'POST');
  await form.locator('button[type=submit]').click();
  expect((await saved).status()).toBe(201);

  await adminLogin(page);
  await page.goto('/admin/forms');
  const card = page.locator('li', { hasText: 'Ibrahim Khan' }).first();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Mark read' }).click();
  await expect(card.getByRole('button', { name: 'Mark unread' })).toBeVisible();
  await card.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('li', { hasText: 'Ibrahim Khan' })).toHaveCount(0);
  const { data } = await api<{ forms: unknown[] }>(page, '/api/admin/forms');
  expect(data.forms).toHaveLength(0);
});
