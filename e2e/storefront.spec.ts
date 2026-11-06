import { expect, test } from '@playwright/test';
import { addToCart, adminLogin, api, TALBEENAH } from './helpers';
import { FAQ_GROUPS } from '../components/info/faq-data';
import { POLICIES } from '../components/info/policy-data';

test('home lists the shop categories from the database', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  const header = page.locator('header');
  for (const name of ['Talbeenah', 'Dates', 'Honey']) await expect(header).toContainText(name);
});

test('no WhatsApp order buttons on the shop pages', async ({ page }) => {
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

// Shop orders are placed on the website (pay online or cash on delivery); WhatsApp is only for questions and support.
const WHATSAPP_ORDERING = [
  /order on whatsapp/i,
  /pay on whatsapp/i,
  /whatsapp instead/i,
  /whatsapp orders?\b/i,
  /(send|place) (your|the|an?) order (to us )?(on|via|through) whatsapp/i,
  /(order|ordering|pay|paying|payment) (via|through) whatsapp/i,
];
const orderingOnWhatsApp = (text: string) => WHATSAPP_ORDERING.filter((re) => re.test(text)).map(String);

test('no page tells customers to order or pay on WhatsApp', async ({ page }) => {
  const pages = ['/', '/shop', TALBEENAH, '/talbeenah', '/dates', '/honey', '/dry-fruits', '/wearings', '/cart', '/faq', '/contact', '/about', '/policies/shipping', '/policies/refund-cancellation', '/policies/privacy', '/policies/terms'];
  for (const path of pages) {
    await page.goto(path);
    const text = (await page.locator('body').innerText()) + (await page.content());
    expect(orderingOnWhatsApp(text), path).toEqual([]);
  }
  // Collapsed FAQ answers and policy text too, straight from where the words are written.
  expect(orderingOnWhatsApp(JSON.stringify([FAQ_GROUPS, POLICIES]))).toEqual([]);
  // Every page that explains how to pay says the same two ways.
  for (const path of ['/', '/shop', '/cart', '/policies/shipping']) {
    await page.goto(path);
    expect(await page.content(), path).toMatch(/cash on delivery/i);
  }
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
  await page.waitForTimeout(2500); // a pause over 2 seconds starts the count again
  for (let i = 0; i < 5; i++) await logo.click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Enter your PIN' })).toBeVisible();
});

test('logo taps at a normal human pace (about one a second) still open the admin', async ({ page }) => {
  await page.goto('/contact');
  const logo = page.getByRole('link', { name: 'Bold Mount home' });
  for (let i = 0; i < 5; i++) {
    await logo.click();
    await page.waitForTimeout(1200);
  }
  await expect(page).toHaveURL(/\/admin$/);
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

test('phone: opening a product or category from a scrolled page starts at the top; Back returns; shop filters keep the place', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  const at = () => page.evaluate(() => Math.round(window.scrollY));
  // Clicked the way a thumb does it: no extra scrolling first, from slightly down the page (the case that opened half-hidden).
  const tap = (selector: string) => page.evaluate((s) => (document.querySelector(s) as HTMLAnchorElement).click(), selector);
  const topVisible = async () => {
    const header = (await page.locator('header').first().boundingBox())!;
    const crumbs = (await page.getByRole('navigation', { name: 'Breadcrumb' }).first().boundingBox())!;
    return crumbs.y >= header.y + header.height - 1;
  };

  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 150));
  await expect.poll(at).toBe(150);
  await tap(`main a[href="${TALBEENAH}"]`);
  await expect(page).toHaveURL(new RegExp(`${TALBEENAH}$`));
  await expect(page.locator('main h1')).toBeVisible();
  await expect.poll(at).toBe(0);
  expect(await topVisible()).toBe(true);

  // Back lands where the visitor was, not at the top.
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(at).toBeGreaterThan(100);

  // Category links in the sticky bar do the same.
  await page.evaluate(() => window.scrollTo(0, 250));
  await tap('header a[href="/dates"]');
  await expect(page).toHaveURL(/\/dates$/);
  await expect.poll(at).toBe(0);

  // Changing a shop filter is the same page: it keeps the visitor's place.
  await page.goto('/shop');
  await page.evaluate(() => window.scrollTo(0, 400));
  await tap('nav[aria-label="Shop by category"] a[href*="filter=dates"]');
  await expect(page).toHaveURL(/filter=dates/);
  await page.waitForTimeout(500);
  expect(await at()).toBeGreaterThan(300);
});
