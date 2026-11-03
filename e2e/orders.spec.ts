import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { addToCart, adminLogin, api, CUSTOMER, fillCheckout, payWithTestBank, signInAs } from './helpers';
import type { Order } from '../lib/types';

/** Signs in as `name`, pays for one Talbeenah (₹249 + ₹50 delivery) in Razorpay's test mode and returns the order. */
async function paidOrder(page: Page, context: BrowserContext, name: string): Promise<Order> {
  await signInAs(context, { name, email: `${name.toLowerCase().replace(/\W+/g, '.')}@example.com` });
  await addToCart(page);
  await page.goto('/cart');
  await fillCheckout(page, { ...CUSTOMER, name });
  await page.getByRole('button', { name: /^Pay ₹/ }).click();
  await payWithTestBank(page, 'Success');
  await expect(page.getByText('Payment received')).toBeVisible({ timeout: 45_000 });
  const { data } = await api<{ orders: Order[] }>(page, '/api/orders/mine');
  return data.orders[0];
}

async function whatsappOrder(page: Page, context: BrowserContext, name: string): Promise<Order> {
  await signInAs(context, { name, email: `${name.toLowerCase().replace(/\W+/g, '.')}@example.com` });
  await addToCart(page, '/product/ajwa-dates');
  await page.goto('/cart');
  const mine = async () => (await api<{ orders: Order[] }>(page, '/api/orders/mine')).data.orders.length;
  const before = await mine();
  await page.evaluate(() => { window.open = () => null; });
  await fillCheckout(page, { ...CUSTOMER, name });
  await page.getByRole('button', { name: 'Order on WhatsApp instead' }).click();
  await expect.poll(mine).toBeGreaterThan(before);
  return (await api<{ orders: Order[] }>(page, '/api/orders/mine')).data.orders[0];
}

const track = (page: Page, order: Order) => page.goto(`/orders/${order.id}`);
const adminRow = (page: Page, number: string) => page.locator('main li').filter({ hasText: number }).first();
const setStatus =(page: Page, id: string, status: string) => api(page, `/api/admin/orders/${id}`, { method: 'PATCH', body: { status } });
const adminOrder = async (page: Page, id: string) =>
  (await api<{ orders: Order[] }>(page, '/api/admin/orders')).data.orders.find((o) => o.id === id)!;

test('My orders tracks the order: placed → confirmed → dispatched → delivered', async ({ page, context }) => {
  const order = await whatsappOrder(page, context, 'Imran Sheikh');
  await track(page, order);
  const progress = page.getByRole('list', { name: 'Order progress' });
  for (const step of ['Placed', 'Confirmed', 'Dispatched', 'Delivered']) await expect(progress).toContainText(step);

  const customer = page;
  const admin = await context.browser()!.newPage();
  await adminLogin(admin);
  await setStatus(admin, order.id, 'dispatched');
  await customer.reload();
  await expect(customer.locator('main')).toContainText('Status: Dispatched');
  await expect(customer.getByRole('button', { name: 'Cancel order' })).toHaveCount(0);
  // Once it has left the shop, the server refuses too.
  expect((await api(customer, `/api/orders/${order.id}/cancel`, { method: 'POST', body: {} })).status).toBe(409);
  await admin.close();
});

test('customer cancels a WhatsApp order before dispatch', async ({ page, context }) => {
  const order = await whatsappOrder(page, context, 'Sana Mirza');
  await track(page, order);
  await page.getByRole('button', { name: 'Cancel order' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, cancel my order' }).click();
  await expect(page.locator('main')).toContainText('Cancelled by you');
  const { data } = await api<{ orders: Order[] }>(page, '/api/orders/mine');
  expect(data.orders.find((o) => o.id === order.id)).toMatchObject({ status: 'cancelled', cancelledBy: 'customer' });
});

test('customer cancels a paid order: full refund goes back through Razorpay automatically', async ({ page, context }) => {
  const order = await paidOrder(page, context, 'Faisal Khan');
  await track(page, order);
  await page.getByRole('button', { name: 'Cancel order' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, cancel my order' }).click();
  await expect(page.locator('main')).toContainText(/Refund of ₹299 sent/);

  const admin = await context.browser()!.newPage();
  await adminLogin(admin);
  const saved = await adminOrder(admin, order.id);
  expect(saved.status).toBe('cancelled');
  expect(saved.payment).toBe('refunded');
  expect(saved.refund).toMatchObject({ status: 'refunded', amount: 299 });
  expect(saved.refund?.razorpayRefundId).toMatch(/^rfnd_/);
  await admin.goto('/admin/orders');
  await expect(adminRow(admin, order.number)).toContainText('Refunded ₹299');
  await admin.close();
});

test('delivered order: customer asks for a refund, admin refunds part of it', async ({ page, context }) => {
  const order = await paidOrder(page, context, 'Rehana Begum');
  const admin = await context.browser()!.newPage();
  await adminLogin(admin);
  await setStatus(admin, order.id, 'delivered');
  const before = (await api<{ revenue: number }>(admin, '/api/admin/stats?period=today')).data.revenue;

  await track(page, order);
  const card = page.locator('main');
  await expect(card).toContainText('Status: Delivered');
  await expect(card.getByRole('button', { name: 'Cancel order' })).toHaveCount(0);
  await card.getByRole('button', { name: 'Request a refund' }).click();
  const form = page.getByRole('dialog');
  await expect(form).toContainText('48 hours');
  await form.getByLabel('Reason').selectOption('Damaged or leaking');
  await form.getByLabel('Note (optional)').fill('The pouch was torn and some Talbeenah spilled out.');
  await form.getByRole('button', { name: 'Send refund request' }).click();
  await expect(card).toContainText(/Refund requested/);

  await admin.goto('/admin/orders');
  const row = adminRow(admin, order.number);
  await expect(row).toContainText('Refund requested');
  await expect(admin.getByRole('navigation', { name: 'Admin sections' }).getByRole('link', { name: /Orders/ })).toContainText(/[1-9]/);
  await row.getByRole('button', { name: 'Show details' }).click();
  await expect(row).toContainText('The pouch was torn');
  await row.getByLabel('Amount to refund (₹)').fill('150');
  await row.getByRole('button', { name: 'Refund ₹150' }).click();
  await row.getByRole('button', { name: 'Yes, refund ₹150' }).click();
  await expect.poll(async () => (await adminOrder(admin, order.id)).refund?.status).toBe('refunded');
  expect((await adminOrder(admin, order.id)).refund?.amount).toBe(150);
  const after = (await api<{ revenue: number }>(admin, '/api/admin/stats?period=today')).data.revenue;
  expect(before - after).toBe(150);

  await page.reload();
  await expect(page.locator('main')).toContainText(/Refund of ₹150 sent/);
  await admin.close();
});

test('admin declines a refund request with a reply the customer can read', async ({ page, context }) => {
  const order = await paidOrder(page, context, 'Kareem Ansari');
  const admin = await context.browser()!.newPage();
  await adminLogin(admin);
  await setStatus(admin, order.id, 'delivered');
  const res = await api(page, `/api/orders/${order.id}/refund-request`, { method: 'POST', body: { reason: 'Other', note: 'Changed my mind.' } });
  expect(res.status).toBe(200);
  // A second request for the same order is refused.
  expect((await api(page, `/api/orders/${order.id}/refund-request`, { method: 'POST', body: { reason: 'Other' } })).status).toBe(409);

  await admin.goto('/admin/orders');
  const row = adminRow(admin, order.number);
  await row.getByRole('button', { name: 'Show details' }).click();
  await row.getByRole('button', { name: 'Decline', exact: true }).click();
  await row.getByLabel('Your reply to the customer').fill('Opened food can only be refunded if it arrived damaged.');
  await row.getByRole('button', { name: 'Decline refund' }).click();
  await expect.poll(async () => (await adminOrder(admin, order.id)).refund?.status).toBe('declined');

  await track(page, order);
  await expect(page.locator('main')).toContainText(/Refund declined/);
  await expect(page.locator('main')).toContainText('Opened food can only be refunded');
  await admin.close();
});

test('admin cancels a paid order and refunds it in the same step', async ({ page, context }) => {
  const order = await paidOrder(page, context, 'Nadia Farooq');
  await adminLogin(page);
  await page.goto('/admin/orders');
  await page.getByLabel(`Status of ${order.number}`).selectOption('cancelled');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('checkbox')).toBeChecked();
  await dialog.getByRole('button', { name: 'Cancel order' }).click();
  await expect.poll(async () => (await adminOrder(page, order.id)).payment).toBe('refunded');
  expect(await adminOrder(page, order.id)).toMatchObject({ status: 'cancelled', cancelledBy: 'shop' });
});

test('refund policy page is linked from the footer and checkout', async ({ page }) => {
  await page.goto('/');
  await page.locator('footer').getByRole('link', { name: 'Refund & Cancellation' }).click();
  await expect(page).toHaveURL(/\/policies\/refund-cancellation$/);
  for (const text of ['before it is dispatched', '48 hours', '5–7 working days', 'Razorpay']) await expect(page.locator('main')).toContainText(text);
  await addToCart(page);
  await page.goto('/cart');
  await expect(page.locator('main').getByRole('link', { name: /Refund & Cancellation/ })).toBeVisible();
});
