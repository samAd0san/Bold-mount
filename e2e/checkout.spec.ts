import { expect, test, type Page } from '@playwright/test';
import { addToCart, adminLogin, api, CUSTOMER, fillCheckout, payWithTestBank, signInAs } from './helpers';
import { payCash, payOnlineChoice, placeOrder } from './place-order';

type Order = { id: string; number: string; method: string; payment: string; status: string; total: number; delivery: number; customer: { name: string } };
const orders = async (page: Page) => (await api<{ orders: Order[] }>(page, '/api/admin/orders')).data.orders;
const payButton = (page: Page) => page.getByRole('button', { name: /^Pay ₹/ });

test('signed out: checkout asks you to sign in, and the API refuses the order', async ({ page }) => {
  await addToCart(page);
  await page.goto('/cart');
  await expect(page.getByRole('link', { name: /Sign in with Google to place your order/i })).toBeVisible();
  await expect(payButton(page)).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText(/on whatsapp/i);
  await expect(page.locator('main a[href*="wa.me"]')).toHaveCount(0);
  for (const method of ['online', 'cod']) {
    const res = await api<{ error: string }>(page, '/api/orders', { method: 'POST', body: { method, items: [], customer: CUSTOMER } });
    expect(res.status).toBe(401);
  }
});

test('checkout offers online payment or cash on delivery, shows the total, and has no WhatsApp ordering', async ({ page, context }) => {
  await signInAs(context, { name: 'Zainab Hussain', email: 'zainab.hussain@example.com' });
  await addToCart(page);
  await page.goto('/cart');
  const main = page.locator('main');

  // Pay online is the default; both choices show the same clear total (₹249 + ₹50 delivery).
  await expect(payOnlineChoice(page)).toBeChecked();
  await expect(payCash(page)).toBeEnabled();
  await expect(main).toContainText('To pay now');
  await expect(main.getByText('₹299').last()).toBeVisible();
  await expect(payButton(page)).toHaveText(/Pay ₹299 securely/);
  await expect(placeOrder(page)).toHaveCount(0);

  await payCash(page).check();
  await expect(main).toContainText('To pay in cash on delivery');
  await expect(placeOrder(page)).toHaveText(/Place order — pay ₹299 on delivery/);
  await expect(payButton(page)).toHaveCount(0);

  // Nothing in checkout sends the customer to WhatsApp to order or pay.
  await expect(page.getByRole('button', { name: /whatsapp/i })).toHaveCount(0);
  await expect(main.locator('a[href*="wa.me"]')).toHaveCount(0);
  await expect(main).not.toContainText(/(order|pay|send)[^.]{0,25}on whatsapp/i);

  // The server no longer takes WhatsApp orders either, and saves nothing.
  const before = (await api<{ orders: unknown[] }>(page, '/api/orders/mine')).data.orders.length;
  const res = await api<{ error: string }>(page, '/api/orders', {
    method: 'POST',
    body: { method: 'whatsapp', items: [{ slug: 'premium-roasted-talbeenah', variantId: '500g', qty: 1 }], customer: { ...CUSTOMER, name: 'Zainab Hussain' } },
  });
  expect(res.status).toBe(400);
  expect((await api<{ orders: unknown[] }>(page, '/api/orders/mine')).data.orders.length).toBe(before);
});

test('checkout checks every required field before paying', async ({ page, context }) => {
  await signInAs(context, { name: 'Yusuf Rahman', email: 'yusuf.rahman@example.com' });
  await addToCart(page);
  await page.goto('/cart');
  await payButton(page).click();
  // Name is left out on purpose: when blank it falls back to the customer's Google name.
  for (const msg of ['valid 10-digit mobile', 'drop address', 'Enter your city', 'valid 6-digit pincode']) {
    await expect(page.locator('main')).toContainText(msg);
  }
  await expect(page.locator('iframe.razorpay-checkout-frame')).toHaveCount(0);
});

test('delivery is ₹50 below ₹999 and free above it', async ({ page }) => {
  // Shown to everyone, signed in or not.
  await addToCart(page);
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText('₹50');
  const plus = page.getByRole('button', { name: 'Increase' }).first();
  for (let i = 0; i < 4; i++) await plus.click();
  await expect(page.locator('main')).toContainText(/Delivery\s*Free/);
});

test('online payment (Razorpay test bank) is saved as paid, and admin can confirm it', async ({ page, context }) => {
  await signInAs(context, { name: CUSTOMER.name, email: 'yusuf.rahman@example.com' });
  await addToCart(page);
  await page.goto('/cart');
  await fillCheckout(page);
  await expect(payOnlineChoice(page)).toBeChecked();
  await payButton(page).click();
  await payWithTestBank(page, 'Success');
  await expect(page.getByText('Payment received')).toBeVisible({ timeout: 45_000 });
  expect(await page.evaluate(() => localStorage.getItem('boldmount-cart'))).toContain('"items":[]');

  await adminLogin(page);
  const paid = (await orders(page)).find((o) => o.customer.name === CUSTOMER.name && o.payment === 'paid');
  expect(paid).toBeTruthy();
  expect(paid!.method).toBe('online');
  expect(paid!.total).toBe(299);

  await page.goto('/admin/orders');
  await page.getByLabel(`Status of ${paid!.number}`).selectOption('confirmed');
  await expect.poll(async () => (await orders(page)).find((o) => o.id === paid!.id)?.status).toBe('confirmed');

  await page.goto('/admin');
  await expect(page.locator('main')).toContainText('₹299');
});

test('a cancelled payment says nothing was charged and is marked failed', async ({ page, context }) => {
  await signInAs(context, { name: 'Hamza Qureshi', email: 'hamza.qureshi@example.com' });
  await addToCart(page);
  await page.goto('/cart');
  await fillCheckout(page, { ...CUSTOMER, name: 'Hamza Qureshi', mobile: '90000 12121' });
  await payButton(page).click();
  const frame = page.frameLocator('iframe.razorpay-checkout-frame');
  await frame.getByText('Payment Options').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  await frame.locator('[data-testid=checkout-close]').click();
  await frame.locator('[data-testid=confirm-positive]').click(); // "Yes, exit"
  await expect(page.locator('main')).toContainText(/nothing was charged/i);
  await expect(payButton(page)).toBeEnabled();

  // The customer isn't told an unpaid order is on its way.
  await page.goto('/orders');
  await expect(page.getByRole('region', { name: 'Ongoing' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Order history' })).toContainText('Payment not completed');

  await adminLogin(page);
  await expect.poll(async () => (await orders(page)).find((o) => o.customer.name === 'Hamza Qureshi')?.payment).toBe('failed');
});

test('a signed-in customer sees their paid order under My orders', async ({ page, context }) => {
  await signInAs(context, { name: 'Bilal Ahmed', email: 'bilal.ahmed@example.com' });
  await addToCart(page);
  await page.goto('/cart');
  await fillCheckout(page, { ...CUSTOMER, name: 'Bilal Ahmed', mobile: '97010 33445' });
  await payButton(page).click();
  await payWithTestBank(page, 'Success');
  await expect(page.getByText('Payment received')).toBeVisible({ timeout: 45_000 });

  // "Track this order" on the thank-you screen goes straight to the order.
  await page.getByRole('link', { name: 'Track this order' }).click();
  await expect(page).toHaveURL(/\/orders\/[0-9a-f]{24}$/);
  await expect(page.locator('main')).toContainText('Status: Placed');
  await expect(page.locator('main')).toContainText('Paid online');

  await page.goto('/account'); // old link still works
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.locator('main')).toContainText('Bilal Ahmed');
  await expect(page.getByRole('region', { name: 'Ongoing' })).toContainText(/BM-\d+/);
});
