import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { addToCart, adminLogin, api, CUSTOMER, signInAs } from './helpers';
import { cashOrder, emailOf, payCash, payOnlineChoice, placeOrder } from './place-order';
import { formatINR } from '../lib/format';
import type { Order } from '../lib/types';

const COD_OFF = 'Cash on delivery isn’t available on your account because an earlier order was cancelled. You can pay online.';

/** Waits until the page's live connection is subscribed, so nothing is published before anyone is listening. */
const listening = (page: Page, topic: 'admin' | 'orders') => expect(page.locator(`html[data-live~="${topic}"]`)).toHaveCount(1, { timeout: 15_000 });
const mark = (page: Page) => page.evaluate(() => { (window as unknown as { __kept: boolean }).__kept = true; });
const notReloaded = async (page: Page) => expect(await page.evaluate(() => (window as unknown as { __kept?: boolean }).__kept)).toBe(true);

const adminRow = (page: Page, number: string) => page.locator('main li').filter({ hasText: number }).first();
const adminOrder = async (page: Page, id: string) => (await api<{ orders: Order[] }>(page, '/api/admin/orders')).data.orders.find((o) => o.id === id)!;

/** A signed-in customer places one 500 g Talbeenah with cash on delivery straight through the API. */
async function apiCashOrder(page: Page, context: BrowserContext, name: string): Promise<Order> {
  await signInAs(context, { name, email: emailOf(name) });
  await page.goto('/');
  const res = await api<{ order: Order }>(page, '/api/orders', {
    method: 'POST',
    body: { method: 'cod', items: [{ slug: 'premium-roasted-talbeenah', variantId: '500g', qty: 1 }], customer: { ...CUSTOMER, name, note: '' } },
  });
  expect(res.status).toBe(201);
  return res.data.order;
}

async function newAdmin(context: BrowserContext) {
  const admin = await context.browser()!.newPage();
  await adminLogin(admin);
  return admin;
}

test('cash on delivery: placed straight away, the customer is told what to pay and sees it on every orders page', async ({ page, context }) => {
  const order = await cashOrder(page, context, 'Ayesha Khan', '+91 98480 22338');
  expect(order).toMatchObject({ method: 'cod', payment: 'cod', status: 'new' });
  const total = formatINR(order.total);

  // Same order-placed screen as a paid order, but it says how much to hand over.
  const main = page.locator('main');
  await expect(main).toContainText(order.number);
  await expect(main).toContainText(`You’ll pay ${total} in cash when your order arrives.`);
  expect(await page.evaluate(() => localStorage.getItem('boldmount-cart'))).toContain('"items":[]');

  await page.getByRole('link', { name: 'Track this order' }).click();
  await expect(page).toHaveURL(/\/orders\/[0-9a-f]{24}$/);
  await expect(main).toContainText('Status: Placed');
  await expect(main).toContainText(`Cash on delivery · pay ${total} on arrival`);
  await expect(main).toContainText(`Please keep ${total} ready in cash`);
  await expect(main.getByRole('button', { name: 'Cancel order' })).toBeVisible();

  await page.goto('/orders');
  await expect(page.getByRole('region', { name: 'Ongoing' })).toContainText(`Cash on delivery: pay ${total} in cash when it arrives.`);
});

test('the admin sees a new cash on delivery order live; Delivered makes it "Paid in cash", and the customer sees that live too', async ({ page, context }) => {
  test.skip(!process.env.ABLY_API_KEY, 'ABLY_API_KEY is not set');
  const admin = await newAdmin(context);
  await admin.goto('/admin/orders');
  await listening(admin, 'admin');
  await mark(admin);

  const order = await apiCashOrder(page, context, 'Bilal Hashmi');
  const row = adminRow(admin, order.number);
  const total = formatINR(order.total);
  await expect(row).toContainText(`Cash on delivery — collect ${total}`, { timeout: 10_000 });
  await notReloaded(admin);

  await page.goto(`/orders/${order.id}`);
  await listening(page, 'orders');
  await mark(page);
  await expect(page.locator('main')).toContainText(`Cash on delivery · pay ${total} on arrival`);

  // Delivered settles the cash: no extra step for the shop.
  await admin.getByLabel(`Status of ${order.number}`).selectOption('delivered');
  await expect(row).toContainText('Paid in cash');
  await expect(row).not.toContainText('collect');
  await expect(page.locator('main')).toContainText('Status: Delivered', { timeout: 10_000 });
  await expect(page.locator('main')).toContainText('Paid in cash');
  await notReloaded(page);

  const saved = await adminOrder(admin, order.id);
  expect(saved).toMatchObject({ method: 'cod', payment: 'paid', status: 'delivered' });
  expect(saved.paidAt && saved.deliveredAt).toBeTruthy();
  expect(saved.refund).toBeUndefined();
  // Once paid in cash, the customer can ask for a refund like with an online order.
  await expect(page.getByRole('button', { name: 'Request a refund' })).toBeVisible({ timeout: 10_000 });

  await admin.context().close();
});

test('admin can mark cash received without changing the status; cancelling an unpaid cash order needs no refund, a paid one offers it', async ({ page, context }) => {
  const received = await apiCashOrder(page, context, 'Imran Qadri');
  const cancelled = await apiCashOrder(page, context, 'Sana Farooqui');
  const admin = await newAdmin(context);
  await admin.goto('/admin/orders');

  // Cash handed over while the order is still "Confirmed".
  await admin.getByLabel(`Status of ${received.number}`).selectOption('confirmed');
  const row = adminRow(admin, received.number);
  const total = formatINR(received.total);
  await expect(row).toContainText(`Cash on delivery — collect ${total}`);
  await row.getByRole('button', { name: 'Show details' }).click();
  await expect(row).toContainText(`Collect ${total} in cash when it is delivered.`);
  await row.getByRole('button', { name: 'Mark cash received' }).click();
  await expect(row).toContainText('Paid in cash');
  await expect(row.getByRole('button', { name: 'Mark cash received' })).toHaveCount(0);
  expect(await adminOrder(admin, received.id)).toMatchObject({ payment: 'paid', status: 'confirmed' });

  // Cancelling a cash order asks nothing about refunds.
  await admin.getByLabel(`Status of ${cancelled.number}`).selectOption('cancelled');
  await expect(adminRow(admin, cancelled.number)).toContainText('Cash on delivery · cancelled');
  await expect(admin.getByRole('dialog')).toHaveCount(0);
  const saved = await adminOrder(admin, cancelled.id);
  expect(saved).toMatchObject({ method: 'cod', payment: 'cod', status: 'cancelled', cancelledBy: 'shop' });
  expect(saved.refund).toBeUndefined();
  expect((await api(admin, `/api/admin/orders/${cancelled.id}/cash`, { method: 'POST' })).status).toBe(409);

  // Cash already received, then the shop cancels: the same box as for an online order offers the refund (recorded, not sent).
  await admin.getByLabel(`Status of ${received.number}`).selectOption('cancelled');
  const dialog = admin.getByRole('dialog');
  await expect(dialog).toContainText('already paid in cash');
  await expect(dialog.getByRole('checkbox')).toBeChecked();
  await dialog.getByRole('button', { name: 'Cancel order' }).click();
  await expect.poll(async () => (await adminOrder(admin, received.id)).payment).toBe('refunded');
  const refunded = await adminOrder(admin, received.id);
  expect(refunded).toMatchObject({ status: 'cancelled', cancelledBy: 'shop' });
  expect(refunded.refund).toMatchObject({ status: 'refunded', amount: received.total, by: 'hand' });
  expect(refunded.refund?.razorpayRefundId).toBeUndefined();
  await admin.close();
});

/** A cash order that was delivered (so paid in cash), with the admin signed in on a second page. */
async function deliveredCashOrder(page: Page, context: BrowserContext, name: string) {
  const order = await apiCashOrder(page, context, name);
  const admin = await newAdmin(context);
  expect((await api(admin, `/api/admin/orders/${order.id}`, { method: 'PATCH', body: { status: 'delivered' } })).status).toBe(200);
  return { order, admin };
}
const revenueToday = async (admin: Page) => (await api<{ revenue: number }>(admin, '/api/admin/stats?period=today')).data.revenue;

test('cash on delivery: delivered, the customer asks for a refund, the shop refunds part of it and the revenue drops by exactly that', async ({ page, context }) => {
  const { order, admin } = await deliveredCashOrder(page, context, 'Rukhsar Begum');
  const before = await revenueToday(admin);

  await page.goto(`/orders/${order.id}`);
  const main = page.locator('main');
  await expect(main).toContainText('Paid in cash');
  await main.getByRole('button', { name: 'Request a refund' }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Reason').selectOption('Damaged or leaking');
  await form.getByLabel('Note (optional)').fill('The pouch was torn and some Talbeenah spilled out.');
  await form.getByRole('button', { name: 'Send refund request' }).click();
  await expect(main).toContainText('Refund requested');

  // The shop uses the same refund panel as for online orders, plus one line about paying it back by hand.
  await admin.goto('/admin/orders');
  const row = adminRow(admin, order.number);
  await expect(row).toContainText('Refund requested');
  await row.getByRole('button', { name: 'Show details' }).click();
  await expect(row).toContainText('The pouch was torn');
  await expect(row).toContainText('Cash on delivery: pay this back by cash or UPI, then press Refund to record it.');
  await row.getByLabel('Amount to refund (₹)').fill('150');
  await row.getByRole('button', { name: 'Refund ₹150' }).click();
  await expect(row).toContainText('Only do this once you have paid it back');
  await row.getByRole('button', { name: 'Yes, refund ₹150' }).click();
  await expect.poll(async () => (await adminOrder(admin, order.id)).refund?.status).toBe('refunded');

  const saved = await adminOrder(admin, order.id);
  expect(saved.payment).toBe('refunded');
  expect(saved.refund).toMatchObject({ status: 'refunded', amount: 150, by: 'hand' });
  expect(saved.refund?.razorpayRefundId).toBeUndefined();
  await expect(row).toContainText('Refunded ₹150');
  expect(before - (await revenueToday(admin))).toBe(150);

  await page.reload();
  await expect(main).toContainText('₹150 refunded');
  await expect(main).not.toContainText(/razorpay/i);
  await expect(main.getByRole('button', { name: 'Request a refund' })).toHaveCount(0);
  await admin.context().close();
});

test('cash on delivery: the shop can decline a refund request with a reply the customer can read', async ({ page, context }) => {
  const { order, admin } = await deliveredCashOrder(page, context, 'Nasreen Fatima');
  expect((await api(page, `/api/orders/${order.id}/refund-request`, { method: 'POST', body: { reason: 'Other', note: 'Changed my mind.' } })).status).toBe(200);

  await admin.goto('/admin/orders');
  const row = adminRow(admin, order.number);
  await row.getByRole('button', { name: 'Show details' }).click();
  await row.getByRole('button', { name: 'Decline', exact: true }).click();
  await row.getByLabel('Your reply to the customer').fill('Opened food can only be refunded if it arrived damaged.');
  await row.getByRole('button', { name: 'Decline refund' }).click();
  await expect.poll(async () => (await adminOrder(admin, order.id)).refund?.status).toBe('declined');
  expect((await adminOrder(admin, order.id)).payment).toBe('paid');

  await page.goto(`/orders/${order.id}`);
  await expect(page.locator('main')).toContainText('Refund declined: Opened food can only be refunded');
  await admin.context().close();
});

test('cash on delivery: delivered, the shop refunds the full amount without any customer request', async ({ page, context }) => {
  const { order, admin } = await deliveredCashOrder(page, context, 'Tahira Parveen');
  const before = await revenueToday(admin);

  await admin.goto('/admin/orders');
  const row = adminRow(admin, order.number);
  await row.getByRole('button', { name: 'Show details' }).click();
  await row.getByRole('button', { name: 'Refund', exact: true }).click();
  await expect(row.getByLabel('Amount to refund (₹)')).toHaveValue(String(order.total));
  await row.getByRole('button', { name: `Refund ${formatINR(order.total)}` }).click();
  await row.getByRole('button', { name: `Yes, refund ${formatINR(order.total)}` }).click();
  await expect.poll(async () => (await adminOrder(admin, order.id)).payment).toBe('refunded');

  const saved = await adminOrder(admin, order.id);
  expect(saved.refund).toMatchObject({ status: 'refunded', amount: order.total, by: 'hand' });
  expect(before - (await revenueToday(admin))).toBe(order.total);
  // A second refund on the same order is refused.
  expect((await api(admin, `/api/admin/orders/${order.id}/refund`, { method: 'POST', body: { amount: 10 } })).status).toBe(409);

  await page.goto(`/orders/${order.id}`);
  await expect(page.locator('main')).toContainText(`${formatINR(order.total)} refunded`);
  await admin.context().close();
});

test('a customer who cancelled an order can no longer pay cash on delivery, in checkout or through the API', async ({ page, context }) => {
  const order = await cashOrder(page, context, 'Faiza Rehman');
  // Before anything is cancelled, cash on delivery is on.
  expect((await api<{ allowed: boolean }>(page, '/api/orders/cod')).data).toEqual({ allowed: true });

  await page.goto(`/orders/${order.id}`);
  await page.getByRole('button', { name: 'Cancel order' }).click();
  const dialog = page.getByRole('dialog');
  // They are told before they confirm.
  await expect(dialog).toContainText('cash on delivery is switched off for your account');
  await expect(dialog).toContainText('nothing to refund');
  await dialog.getByRole('button', { name: 'Yes, cancel my order' }).click();
  await expect(page.locator('main')).toContainText('Cancelled by you');
  await expect(page.locator('main')).toContainText('Cash on delivery · nothing to pay');
  const mine = (await api<{ orders: Order[] }>(page, '/api/orders/mine')).data.orders.find((o) => o.id === order.id)!;
  expect(mine).toMatchObject({ status: 'cancelled', cancelledBy: 'customer', payment: 'cod' });
  expect(mine.refund).toBeUndefined();

  // The next checkout shows cash on delivery switched off, with the reason, and online payment ready.
  await addToCart(page);
  await page.goto('/cart');
  await expect(payCash(page)).toBeDisabled();
  await expect(page.locator('main')).toContainText(COD_OFF);
  await expect(payOnlineChoice(page)).toBeChecked();
  await expect(page.getByRole('button', { name: /^Pay ₹/ })).toBeVisible();
  await expect(placeOrder(page)).toHaveCount(0);

  // Never trust the browser: the server refuses a cash order too, and saves nothing.
  const before = (await api<{ orders: unknown[] }>(page, '/api/orders/mine')).data.orders.length;
  const refused = await api<{ error: string }>(page, '/api/orders', {
    method: 'POST',
    body: { method: 'cod', items: [{ slug: 'premium-roasted-talbeenah', variantId: '500g', qty: 1 }], customer: { ...CUSTOMER, name: 'Faiza Rehman' } },
  });
  expect(refused.status).toBe(403);
  expect(refused.data.error).toBe(COD_OFF);
  expect((await api<{ orders: unknown[] }>(page, '/api/orders/mine')).data.orders.length).toBe(before);
  expect((await api<{ allowed: boolean; reason: string }>(page, '/api/orders/cod')).data).toEqual({ allowed: false, reason: COD_OFF });
});

test('cash on delivery stays on for new customers and when the shop (not the customer) cancels', async ({ page, context }) => {
  // Not signed in: the question can't be asked.
  await page.goto('/');
  expect((await api(page, '/api/orders/cod')).status).toBe(401);

  const order = await apiCashOrder(page, context, 'Mustafa Ali');
  const admin = await newAdmin(context);
  expect((await api(admin, `/api/admin/orders/${order.id}`, { method: 'PATCH', body: { status: 'cancelled' } })).status).toBe(200);
  expect((await api<{ allowed: boolean }>(page, '/api/orders/cod')).data).toEqual({ allowed: true });
  await admin.close();

  await addToCart(page);
  await page.goto('/cart');
  await expect(payCash(page)).toBeEnabled();
  await payCash(page).check();
  await expect(page.locator('main')).not.toContainText(COD_OFF);
});
