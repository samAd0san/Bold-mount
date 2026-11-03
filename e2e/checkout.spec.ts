import { expect, test, type Page } from '@playwright/test';
import { addToCart, adminLogin, api, CUSTOMER, fillCheckout, payWithTestBank, signInAs } from './helpers';

type Order = { id: string; number: string; method: string; payment: string; status: string; total: number; delivery: number; customer: { name: string } };
const orders = async (page: Page) => (await api<{ orders: Order[] }>(page, '/api/admin/orders')).data.orders;
const payButton = (page: Page) => page.getByRole('button', { name: /^Pay ₹/ });

test('signed out: checkout asks you to sign in, and the API refuses the order', async ({ page }) => {
  await addToCart(page);
  await page.goto('/cart');
  await expect(page.getByRole('link', { name: /Sign in with Google to place your order/i })).toBeVisible();
  await expect(payButton(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Order on WhatsApp instead' })).toHaveCount(0);
  const res = await api<{ error: string }>(page, '/api/orders', { method: 'POST', body: { method: 'whatsapp', items: [], customer: CUSTOMER } });
  expect(res.status).toBe(401);
});

test('checkout checks every required field before paying', async ({ page, context }) => {
  await signInAs(context, { name: 'Yusuf Rahman', email: 'yusuf.rahman@example.com' });
  await addToCart(page);
  await page.goto('/cart');
  await page.fill('#checkout-name', '');
  await payButton(page).click();
  for (const msg of ['Enter your name', 'valid 10-digit mobile', 'drop address', 'Enter your city', 'valid 6-digit pincode']) {
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

  await adminLogin(page);
  await expect.poll(async () => (await orders(page)).find((o) => o.customer.name === 'Hamza Qureshi')?.payment).toBe('failed');
});

test('WhatsApp order from checkout opens WhatsApp and is saved', async ({ page, context }) => {
  await signInAs(context, { name: 'Ayesha Siddiqui', email: 'ayesha.siddiqui@example.com' });
  await addToCart(page, '/product/ajwa-dates');
  await page.goto('/cart');
  await page.evaluate(() => {
    const w = window as unknown as { __wa: string[] };
    w.__wa = [];
    window.open = ((u?: string | URL) => { w.__wa.push(String(u ?? '')); return null; }) as typeof window.open;
  });
  await fillCheckout(page, { ...CUSTOMER, name: 'Ayesha Siddiqui', mobile: '91000 45127' });
  await page.getByRole('button', { name: 'Order on WhatsApp instead' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __wa: string[] }).__wa.some((u) => u.includes('wa.me')))).toBe(true);

  await adminLogin(page);
  const wa = (await orders(page)).find((o) => o.customer.name === 'Ayesha Siddiqui');
  expect(wa?.method).toBe('whatsapp');
});

test('a signed-in customer sees their paid order under My orders', async ({ page, context }) => {
  await signInAs(context, { name: 'Bilal Ahmed', email: 'bilal.ahmed@example.com' });
  await addToCart(page);
  await page.goto('/cart');
  await fillCheckout(page, { ...CUSTOMER, name: 'Bilal Ahmed', mobile: '97010 33445' });
  await payButton(page).click();
  await payWithTestBank(page, 'Success');
  await expect(page.getByText('Payment received')).toBeVisible({ timeout: 45_000 });

  await page.goto('/account');
  await expect(page.locator('main')).toContainText('Bilal Ahmed');
  await expect(page.locator('main')).toContainText(/BM-\d+/);
  await expect(page.locator('main')).toContainText(/paid/i);
});
