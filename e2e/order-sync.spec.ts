import { expect, test, type Browser, type Page } from '@playwright/test';
import { adminLogin } from './helpers';
import { cashOrder } from './place-order';

// Customer and shop use separate browsers, like in real life: what the shop changes must show up for the customer.

async function customerWithOrder(browser: Browser, name: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const order = await cashOrder(page, context, name);
  return { page, order };
}

async function shop(browser: Browser) {
  const page = await (await browser.newContext()).newPage();
  await adminLogin(page);
  await page.goto('/admin/orders');
  return page;
}

/** The shop picks a status in /admin/orders; resolves once it is saved. */
async function setStatus(admin: Page, number: string, value: string) {
  const saved = admin.waitForResponse((r) => r.url().includes('/api/admin/orders/') && r.request().method() === 'PATCH' && r.ok());
  await admin.getByLabel(`Status of ${number}`).selectOption(value);
  await saved;
}

/** What a customer does when they come back to the tab (the page ignores refreshes within 2s of the last one). */
async function comeBack(page: Page) {
  await page.waitForTimeout(2100);
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
  });
}

test('every status the shop sets shows up on the customer’s Track order page, list and strip', async ({ browser }) => {
  const { page, order } = await customerWithOrder(browser, 'Tariq Jameel');
  const admin = await shop(browser);

  await page.goto(`/orders/${order.id}`);
  await expect(page.locator('main')).toContainText('Status: Placed');

  for (const [value, label] of [['confirmed', 'Confirmed'], ['dispatched', 'Dispatched']] as const) {
    await setStatus(admin, order.number, value);
    await comeBack(page);
    await expect(page.locator('main')).toContainText(`Status: ${label}`);
    await expect(page.getByRole('list', { name: 'Order progress' }).locator('[aria-current="step"]')).toContainText(label);
  }

  // The strip under the header points to the ongoing order.
  await page.goto('/');
  const strip = page.getByRole('link', { name: new RegExp(`${order.number}.*Dispatched`) });
  await expect(strip).toBeVisible();
  await strip.click();
  await expect(page).toHaveURL(new RegExp(`/orders/${order.id}$`));

  // No focus trick this time: the page checks again on its own within 30 seconds.
  await setStatus(admin, order.number, 'delivered');
  await expect(page.locator('main')).toContainText('Status: Delivered', { timeout: 40_000 });

  await page.goto('/orders');
  const history = page.getByRole('region', { name: 'Order history' });
  await expect(history).toContainText(order.number);
  await page.goto('/');
  await expect(page.getByRole('link', { name: new RegExp(order.number) })).toHaveCount(0);
});

test('an order the shop cancels shows "Cancelled by the shop" and leaves Ongoing', async ({ browser }) => {
  const { page, order } = await customerWithOrder(browser, 'Huma Naqvi');
  await page.goto('/orders');
  const ongoing = page.getByRole('region', { name: 'Ongoing' });
  await expect(ongoing).toContainText(order.number);
  await expect(ongoing.getByRole('link', { name: 'Track order' }).first()).toBeVisible();

  const admin = await shop(browser);
  await setStatus(admin, order.number, 'cancelled');
  await comeBack(page);
  await expect(page.locator('main')).toContainText('Cancelled by the shop');
  await expect(ongoing.filter({ hasText: order.number })).toHaveCount(0);

  await page.goto(`/orders/${order.id}`);
  await expect(page.locator('main')).toContainText('Status: Cancelled by the shop');
  await expect(page.getByRole('button', { name: 'Cancel order' })).toHaveCount(0);
});

test('header has a "Your orders" link on phone and desktop', async ({ browser }) => {
  for (const width of [360, 1366]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    await page.goto('/');
    await page.getByRole('link', { name: 'Your orders' }).first().click();
    await expect(page).toHaveURL(/\/orders$/);
    await page.close();
  }
});
