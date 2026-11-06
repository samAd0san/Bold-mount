import { expect, test, type Browser, type Page } from '@playwright/test';
import { addToCart, adminLogin, api, CUSTOMER, fillCheckout, signInAs, testDb, TALBEENAH } from './helpers';
import { emailOf, payCash, placeOrder } from './place-order';
import type { Order } from '../lib/types';

type Delivery = { fee: number; freeAbove: number | null };
const DEFAULTS: Delivery = { fee: 50, freeAbove: 999 };

// Every spec after this one asserts ₹50 / ₹999 totals, so the settings always go back to the defaults.
test.afterAll(async ({ browser }) => {
  const admin = await adminPage(browser);
  await setDelivery(admin, DEFAULTS);
  await admin.context().close();
});

async function adminPage(browser: Browser) {
  const page = await (await browser.newContext()).newPage();
  await adminLogin(page);
  return page;
}

async function setDelivery(admin: Page, d: Delivery) {
  const res = await api(admin, '/api/admin/delivery', { method: 'PUT', body: d });
  expect(res.status, JSON.stringify(res.data)).toBe(200);
}

const savedDelivery = async (admin: Page) => (await api<Delivery>(admin, '/api/admin/delivery')).data;
const card = (admin: Page) => admin.locator('section').filter({ has: admin.getByRole('heading', { name: 'Delivery', exact: true }) });
const feeBox = (admin: Page) => card(admin).getByLabel('Delivery fee for every order (₹)', { exact: true });
const offerBox = (admin: Page) => card(admin).getByRole('checkbox', { name: 'Free delivery on bigger orders' });
const aboveBox = (admin: Page) => card(admin).getByLabel('Free when the order total is at least (₹)', { exact: true });
const save = (admin: Page) => card(admin).getByRole('button', { name: 'Save delivery' });

/** The line the announcement bar shows right now (it starts on the first line, then rotates every few seconds). */
const barLine = (page: Page) => page.locator('p.truncate.animate-in').first();

// Anything that promises free delivery from some order total, or free delivery at all.
const FREE_PROMISE = /free (delivery|above)|free on orders|orders of ₹/i;

const SENTENCE = {
  fee70Above1500: 'Delivery is ₹70 per order, and free on orders of ₹1,500 or more.',
  fee70Only: 'Delivery is ₹70 per order.',
  free: 'Delivery is free on every order.',
};

async function customer(page: Page, name: string) {
  await signInAs(page.context(), { name, email: emailOf(name) });
}

/** Places a cash-on-delivery order from the API, like the checkout button does, and returns the saved order. */
async function orderOf(page: Page, qty: number, extra: Record<string, unknown> = {}) {
  const res = await api<{ order: Order }>(page, '/api/orders', {
    method: 'POST',
    body: { method: 'cod', items: [{ slug: 'premium-roasted-talbeenah', variantId: '250g', qty }], customer: { ...CUSTOMER, note: '' }, ...extra },
  });
  expect(res.status, JSON.stringify(res.data)).toBe(201);
  return res.data.order;
}

test('before the owner saves anything, delivery is ₹50 and free from ₹999, as it always was', async ({ browser }) => {
  await (await testDb()).collection<{ _id: string }>('settings').deleteOne({ _id: 'delivery' });
  const admin = await adminPage(browser);
  expect(await savedDelivery(admin)).toEqual(DEFAULTS);
  await admin.goto('/admin/settings');
  await expect(feeBox(admin)).toHaveValue('50');
  await expect(offerBox(admin)).toBeChecked();
  await expect(aboveBox(admin)).toHaveValue('999');
  await expect(card(admin)).toContainText('Delivery is ₹50 per order, and free on orders of ₹999 or more.');
  await admin.context().close();
});

test('admin sets ₹70 and free from ₹1,500: cart, checkout and the saved order all follow it', async ({ page, browser }) => {
  const admin = await adminPage(browser);
  await admin.goto('/admin/settings');
  await feeBox(admin).fill('70');
  await aboveBox(admin).fill('1500');
  await expect(card(admin)).toContainText(`Customers will see: “${SENTENCE.fee70Above1500}”`);
  await save(admin).click();
  await expect(card(admin).getByRole('status')).toContainText(`Delivery saved. ${SENTENCE.fee70Above1500}`);
  expect(await savedDelivery(admin)).toEqual({ fee: 70, freeAbove: 1500 });
  await admin.reload();
  await expect(feeBox(admin)).toHaveValue('70');
  await expect(aboveBox(admin)).toHaveValue('1500');

  // The cart drawer opens on "Add to cart": ₹249 is ₹1,251 short of ₹1,500.
  await customer(page, 'Imran Qureshi');
  await addToCart(page);
  const drawer = page.getByRole('dialog', { name: 'Your cart' });
  await expect(drawer).toContainText('Add ₹1,251 more for free delivery');
  await expect(drawer).toContainText(/Delivery\s*₹70/);

  await page.goto('/cart');
  const main = page.locator('main');
  await expect(main).toContainText('Add ₹1,251 more for free delivery');
  await expect(page.getByRole('progressbar', { name: 'Progress to free delivery' })).toBeVisible();
  await expect(main).toContainText(/Delivery\s*₹70/);
  await expect(main).toContainText(/Total\s*₹319/);

  await fillCheckout(page, { ...CUSTOMER, name: 'Imran Qureshi' });
  await expect(main).toContainText('Includes ₹70 delivery');
  await payCash(page).check();
  await expect(placeOrder(page)).toHaveText(/Place order — pay ₹319 on delivery/);
  await placeOrder(page).click();
  await expect(page.getByText('Order placed — thank you!')).toBeVisible();
  const placed = (await api<{ orders: Order[] }>(page, '/api/orders/mine')).data.orders[0];
  expect(placed).toMatchObject({ subtotal: 249, delivery: 70, total: 319 });

  // The server prices with the saved settings: numbers sent by the browser are ignored, and ₹1,500 is the line (6 packs = ₹1,494, 7 = ₹1,743).
  expect(await orderOf(page, 1, { delivery: 0, subtotal: 1, total: 1 })).toMatchObject({ delivery: 70, total: 319 });
  expect(await orderOf(page, 6)).toMatchObject({ subtotal: 1494, delivery: 70, total: 1564 });
  expect(await orderOf(page, 7)).toMatchObject({ subtotal: 1743, delivery: 0, total: 1743 });
  await admin.context().close();
});

test('free delivery is at or above the amount, never just below it', async ({ page, browser }) => {
  const admin = await adminPage(browser);
  await customer(page, 'Farzana Begum');

  await setDelivery(admin, { fee: 70, freeAbove: 249 });
  await addToCart(page);
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText(/Delivery\s*Free/);
  await expect(page.locator('main')).toContainText('You’ve unlocked free delivery');
  expect(await orderOf(page, 1)).toMatchObject({ subtotal: 249, delivery: 0, total: 249 });

  await setDelivery(admin, { fee: 70, freeAbove: 250 });
  expect(await orderOf(page, 1)).toMatchObject({ subtotal: 249, delivery: 70, total: 319 });
  await admin.context().close();
});

test('free delivery switched off: no progress bar, and no "free above" wording anywhere', async ({ page, browser }) => {
  const admin = await adminPage(browser);
  await setDelivery(admin, { fee: 70, freeAbove: 1500 });
  await admin.goto('/admin/settings');
  await offerBox(admin).uncheck();
  await expect(aboveBox(admin)).toHaveCount(0);
  await expect(card(admin)).toContainText(`Customers will see: “${SENTENCE.fee70Only}”`);
  await save(admin).click();
  await expect(card(admin).getByRole('status')).toContainText(`Delivery saved. ${SENTENCE.fee70Only}`);
  expect(await savedDelivery(admin)).toEqual({ fee: 70, freeAbove: null });

  await customer(page, 'Rahul Verma');
  await addToCart(page);
  const drawer = page.getByRole('dialog', { name: 'Your cart' });
  await expect(drawer).toContainText(/Delivery\s*₹70/);
  await expect(drawer).not.toContainText(/more for free delivery|unlocked free delivery/);
  await page.goto('/cart');
  const main = page.locator('main');
  await expect(main).toContainText(/Delivery\s*₹70/);
  await expect(main).not.toContainText(FREE_PROMISE);
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  // Even a big cart pays the fee when nothing is free.
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Increase' }).first().click();
  await expect(main).toContainText(/Delivery\s*₹70/);
  expect(await orderOf(page, 7)).toMatchObject({ subtotal: 1743, delivery: 70, total: 1813 });

  // The announcement bar skips the delivery line, so its first line is the payment one.
  await page.goto('/');
  await expect(barLine(page)).toContainText('Pay online');
  await page.waitForTimeout(5000);
  await expect(barLine(page)).not.toContainText(FREE_PROMISE);

  // Every page that talks about delivery says the same thing and promises nothing free.
  for (const path of ['/', '/talbeenah', TALBEENAH, '/faq', '/policies/shipping']) {
    await page.goto(path);
    const html = await page.content();
    expect(html, path).not.toMatch(FREE_PROMISE);
    expect(html, path).toContain(SENTENCE.fee70Only);
  }
  await page.goto(TALBEENAH);
  await expect(page.locator('main').getByText('Delivery ₹70 per order', { exact: true })).toBeVisible();
  await page.goto('/faq');
  const ask = page.getByRole('button', { name: 'Is delivery free?' });
  await ask.click();
  await expect(page.locator(`#${await ask.getAttribute('aria-controls')}`)).toContainText(SENTENCE.fee70Only);

  // The product editor's preview shows the same product page text.
  await admin.goto('/admin/products/new');
  await expect(admin.getByTestId('product-preview').first()).toContainText('Delivery ₹70 per order');
  await expect(admin.getByTestId('product-preview').first()).not.toContainText(FREE_PROMISE);
  await admin.context().close();
});

test('fee 0: "Free delivery on every order" everywhere, and orders are charged ₹0', async ({ page, browser }) => {
  const admin = await adminPage(browser);
  // The free-above amount is kept but has nothing left to do.
  await setDelivery(admin, { fee: 0, freeAbove: 1500 });
  await admin.goto('/admin/settings');
  await expect(card(admin)).toContainText(`Customers will see: “${SENTENCE.free}”`);

  await customer(page, 'Ayesha Siddiqui');
  await page.goto('/');
  await expect(barLine(page)).toHaveText('Free delivery on every order');
  await page.goto(TALBEENAH);
  await expect(page.locator('main').getByText('Free delivery on every order', { exact: true })).toBeVisible();
  for (const path of ['/', '/talbeenah', TALBEENAH, '/faq', '/policies/shipping']) {
    await page.goto(path);
    const html = await page.content();
    expect(html, path).toContain(SENTENCE.free);
    expect(html, path).not.toMatch(/orders of ₹|Delivery is ₹/);
  }

  await addToCart(page);
  await page.goto('/cart');
  const main = page.locator('main');
  await expect(main).toContainText(/Delivery\s*Free/);
  await expect(main).toContainText(/Total\s*₹249/);
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await expect(main).not.toContainText(/more for free delivery|unlocked free delivery/);
  await fillCheckout(page, { ...CUSTOMER, name: 'Ayesha Siddiqui' });
  await expect(main).toContainText('Free delivery');
  await payCash(page).check();
  await expect(placeOrder(page)).toHaveText(/Place order — pay ₹249 on delivery/);
  await placeOrder(page).click();
  await expect(page.getByText('Order placed — thank you!')).toBeVisible();
  expect((await api<{ orders: Order[] }>(page, '/api/orders/mine')).data.orders[0]).toMatchObject({ subtotal: 249, delivery: 0, total: 249 });
  await admin.context().close();
});

test('wrong values are refused in plain words, in the form and by the server, and nothing is saved', async ({ browser }) => {
  const admin = await adminPage(browser);
  await setDelivery(admin, { fee: 70, freeAbove: 1500 });
  await admin.goto('/admin/settings');
  await expect(feeBox(admin)).toHaveValue('70');

  const refused = async (fee: string, above: string, message: RegExp) => {
    await feeBox(admin).fill(fee);
    await aboveBox(admin).fill(above);
    await save(admin).click();
    await expect(card(admin).getByRole('alert'), `${fee} / ${above}`).toContainText(message);
    await expect(card(admin).getByRole('status')).toHaveCount(0);
  };
  await refused('', '1500', /Enter the delivery fee as a whole number of rupees/);
  await refused('seventy', '1500', /whole number of rupees/);
  await refused('70.5', '1500', /whole number of rupees/);
  await refused('-5', '1500', /between ₹0 and ₹2,000/);
  await refused('2001', '1500', /between ₹0 and ₹2,000/);
  await refused('70', '', /Enter the order total for free delivery as a whole number of rupees/);
  await refused('70', '1499.5', /whole number of rupees/);
  await refused('70', '0', /between ₹1 and ₹1,00,000/);
  await refused('70', '100001', /between ₹1 and ₹1,00,000/);
  expect(await savedDelivery(admin)).toEqual({ fee: 70, freeAbove: 1500 });

  // The server says the same when the form is bypassed.
  const bad: [unknown, RegExp][] = [
    [{ fee: 70.5, freeAbove: 1500 }, /whole number/],
    [{ fee: 2001, freeAbove: 1500 }, /between ₹0 and ₹2,000/],
    [{ fee: -1, freeAbove: null }, /between ₹0 and ₹2,000/],
    [{ fee: 70, freeAbove: 0 }, /between ₹1 and ₹1,00,000/],
    [{ fee: 70, freeAbove: 100001 }, /between ₹1 and ₹1,00,000/],
    [{ fee: 70 }, /whole number/],
    [{ freeAbove: 1500 }, /whole number/],
    [{}, /whole number/],
  ];
  for (const [body, message] of bad) {
    const res = await api<{ error: string }>(admin, '/api/admin/delivery', { method: 'PUT', body });
    expect([res.status, res.data.error], JSON.stringify(body)).toEqual([400, expect.stringMatching(message)]);
  }
  expect(await savedDelivery(admin)).toEqual({ fee: 70, freeAbove: 1500 });

  // The limits themselves are allowed.
  for (const ok of [{ fee: 2000, freeAbove: 100000 }, { fee: 0, freeAbove: 1 }, { fee: 0, freeAbove: null }]) {
    await setDelivery(admin, ok);
    expect(await savedDelivery(admin)).toEqual(ok);
  }

  // Only the admin can read or change it.
  const guest = await (await browser.newContext()).newPage();
  await guest.goto('/');
  expect((await api(guest, '/api/admin/delivery')).status).toBe(401);
  expect((await api(guest, '/api/admin/delivery', { method: 'PUT', body: { fee: 0, freeAbove: null } })).status).toBe(401);
  await guest.context().close();
  await admin.context().close();
});

test('an order keeps the delivery it was charged when the settings change later', async ({ page, browser }) => {
  const admin = await adminPage(browser);
  await setDelivery(admin, { fee: 70, freeAbove: 1500 });
  await customer(page, 'Sanjay Kulkarni');
  await page.goto('/');
  const before = await orderOf(page, 1);
  expect(before).toMatchObject({ delivery: 70, total: 319 });

  await setDelivery(admin, { fee: 0, freeAbove: null });
  const after = await orderOf(page, 1);
  expect(after).toMatchObject({ delivery: 0, total: 249 });

  const mine = (await api<{ orders: Order[] }>(page, '/api/orders/mine')).data.orders;
  expect(mine.find((o) => o.id === before.id)).toMatchObject({ delivery: 70, total: 319 });
  const listed = (await api<{ orders: Order[] }>(admin, '/api/admin/orders')).data.orders;
  expect(listed.find((o) => o.id === before.id)).toMatchObject({ delivery: 70, total: 319 });

  await page.goto(`/orders/${before.id}`);
  await expect(page.locator('main')).toContainText(/Delivery\s*₹70/);
  await expect(page.locator('main')).toContainText(/Total\s*₹319/);
  await admin.context().close();
});

test('an open cart follows a change made in the admin, without reloading', async ({ page, browser }) => {
  test.skip(!process.env.ABLY_API_KEY, 'ABLY_API_KEY is not set');
  const admin = await adminPage(browser);
  await setDelivery(admin, { fee: 70, freeAbove: 1500 });
  await customer(page, 'Zubair Khan');
  await addToCart(page);
  await page.goto('/cart');
  const main = page.locator('main');
  await expect(main).toContainText(/Delivery\s*₹70/);
  await expect(main).toContainText('Add ₹1,251 more for free delivery');
  await expect(page.locator('html[data-live~="catalog"]')).toHaveCount(1, { timeout: 15_000 });
  await page.evaluate(() => { (window as unknown as { __kept: boolean }).__kept = true; });

  // One change per open page: a second quick change on the same page can lag behind in `next start` (the same happens to shop prices).
  await setDelivery(admin, { fee: 80, freeAbove: null });
  await expect(main).toContainText(/Delivery\s*₹80/, { timeout: 20_000 });
  await expect(main).toContainText(/Total\s*₹329/);
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await expect(main).not.toContainText('more for free delivery');
  expect(await page.evaluate(() => (window as unknown as { __kept?: boolean }).__kept)).toBe(true);
  await admin.context().close();
});
