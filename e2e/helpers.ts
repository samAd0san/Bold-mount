import 'dotenv/config';
import { createHmac } from 'node:crypto';
import mongoose from 'mongoose';
import { expect, type BrowserContext, type Page } from '@playwright/test';

export const PIN = '1111';
export const TALBEENAH = '/product/premium-roasted-talbeenah';

/** Types the PIN on the admin pad and waits for the dashboard. */
export async function adminLogin(page: Page, pin = PIN) {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Enter your PIN' })).toBeVisible();
  for (const d of pin) await page.getByRole('button', { name: d, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

/** Calls our API from inside the page, so the browser's own cookies and Origin are used. */
export async function api<T = Record<string, unknown>>(page: Page, path: string, init?: { method?: string; body?: unknown }): Promise<{ status: number; data: T }> {
  return page.evaluate(
    async ([p, method, body]) => {
      const res = await fetch(p, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
      return { status: res.status, data: await res.json().catch(() => ({})) };
    },
    [path, init?.method ?? 'GET', init?.body] as const,
  );
}

let conn: Promise<typeof mongoose> | null = null;
/** The test database, for setting up a signed-in customer. */
export async function testDb() {
  conn ??= mongoose.connect(process.env.MONGODB_URI!, { dbName: 'boldmount_e2e', serverSelectionTimeoutMS: 10000 });
  return (await conn).connection.db!;
}

/** Same signed cookie the Google callback sets, for a customer stored in the test database. */
export async function signInAs(context: BrowserContext, user: { name: string; email: string }) {
  const users = (await testDb()).collection('users');
  await users.updateOne(
    { email: user.email },
    { $setOnInsert: { ...user, googleId: `g-${user.email}`, createdAt: new Date(), updatedAt: new Date(), lastLoginAt: new Date() } },
    { upsert: true },
  );
  const uid = String((await users.findOne({ email: user.email }))!._id);
  const body = Buffer.from(JSON.stringify({ uid, exp: Date.now() + 86_400_000 })).toString('base64url');
  const sig = createHmac('sha256', process.env.AUTH_SECRET!).update(`session:${body}`).digest('base64url');
  await context.addCookies([{ name: 'bm_session', value: `${body}.${sig}`, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
  return uid;
}

export const CUSTOMER = {
  name: 'Yusuf Rahman',
  mobile: '98480 22338',
  address: 'Flat 302, Green Heights, Road No. 12, Banjara Hills',
  city: 'Hyderabad',
  pincode: '500034',
};

export async function fillCheckout(page: Page, c: typeof CUSTOMER = CUSTOMER) {
  await page.fill('#checkout-name', c.name);
  await page.fill('#checkout-mobile', c.mobile);
  await page.fill('#checkout-address', c.address);
  await page.fill('#checkout-city', c.city);
  await page.fill('#checkout-pincode', c.pincode);
}

export async function addToCart(page: Page, path = TALBEENAH) {
  await page.goto(path);
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await expect(page.getByRole('link', { name: 'Checkout' })).toBeVisible();
}

/** Pays in Razorpay's test checkout with netbanking, then presses Success (or Failure) on the test bank page. */
export async function payWithTestBank(page: Page, outcome: 'Success' | 'Failure' = 'Success') {
  const frame = page.frameLocator('iframe.razorpay-checkout-frame');
  await frame.getByText('Payment Options').waitFor({ timeout: 30_000 });
  await frame.locator('[data-testid=Netbanking]').first().click();
  const popup = page.context().waitForEvent('page', { timeout: 30_000 });
  await frame.getByText('Axis Bank', { exact: true }).first().click();
  // Some checkout versions open the bank straight away, others need "Pay Now".
  const payNow = frame.locator('button:visible', { hasText: /^Pay( Now)?/ });
  await page.waitForTimeout(800);
  if (await payNow.count()) await payNow.last().click().catch(() => {});
  const bank = await popup;
  await bank.waitForLoadState();
  await bank.getByRole('button', { name: new RegExp(`^${outcome}`, 'i') }).click();
}

/** True for every element that sticks out past the right or left edge of the screen (ignores things inside scrollers/clippers). */
export async function overflowing(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out: string[] = [];
    if (document.documentElement.scrollWidth > vw + 1) out.push(`page is ${document.documentElement.scrollWidth}px wide on a ${vw}px screen`);
    const flagged = new Set<Element>();
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || (r.right <= vw + 1 && r.left >= -1)) continue;
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      let p = el.parentElement;
      let skip = false;
      while (p && p !== document.body) {
        if (flagged.has(p) || /auto|scroll|hidden|clip/.test(getComputedStyle(p).overflowX)) { skip = true; break; }
        p = p.parentElement;
      }
      if (skip) continue;
      flagged.add(el);
      const cls = typeof el.className === 'string' ? el.className.split(' ').slice(0, 4).join('.') : '';
      out.push(`<${el.tagName.toLowerCase()} ${cls}> ${Math.round(r.left)}→${Math.round(r.right)} "${(el.textContent || '').trim().slice(0, 40)}"`);
    }
    return out.slice(0, 8);
  });
}
