import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';
import mongoose from 'mongoose';
import { addToCart, adminLogin, api, closeRazorpay, fillCheckout, payWithTestBank, signInAs, testDb } from './helpers';
import { emailOf } from './place-order';
import type { Order } from '../lib/types';

// Razorpay took the money but the browser's "verify" call never landed: the order must not stay unpaid, and nobody may be left on a live Pay button.
// Every payment is checked at Razorpay itself, so "paid once" means one captured payment there too.

test.describe.configure({ timeout: 180_000 });

const person = (name: string, mobile: string, address: string, city: string, pincode: string) => ({ name, mobile, address, city, pincode });
const WHO = {
  aarif: person('Aarif Shaikh', '98215 66034', '21 Bandra Reclamation Road, Near Mount Mary Steps', 'Mumbai', '400050'),
  mariam: person('Mariam Khatun', '99020 18475', '8 Park Circus Seven Point, Ballygunge', 'Kolkata', '700017'),
  naseem: person('Naseem Banu', '97420 55631', '14 Johnson Market Road, Near Shivajinagar', 'Bengaluru', '560051'),
  yaseen: person('Yaseen Lone', '98450 77129', '5 Rajbagh Colony, Near Jhelum Bund', 'Srinagar', '190008'),
  rukhsar: person('Rukhsar Parveen', '96300 24818', '33 Aminabad Chowk, Near Tunday Kababi', 'Lucknow', '226018'),
  idrees: person('Idrees Qazi', '98110 42276', '19 Mehdipatnam Main Road, Near Rythu Bazar', 'Hyderabad', '500028'),
  sabiha: person('Sabiha Ansari', '98230 91547', '27 Kondhwa Road, Near Salunke Vihar', 'Pune', '411048'),
  farida: person('Farida Begum', '98490 33172', '12 Old Malakpet Road, Near Race Course', 'Hyderabad', '500036'),
};
type Person = (typeof WHO)[keyof typeof WHO];

const orders = async () => (await testDb()).collection('orders');
/** The customer's newest order, straight from the database. */
const savedOrder = async (who: Person) => (await (await orders()).findOne({ 'customer.name': who.name }, { sort: { createdAt: -1 } }))!;

// Later specs read today's revenue and orders, so take this spec's orders and customers back out.
test.afterAll(async () => {
  const d = await testDb();
  await d.collection('orders').deleteMany({ 'customer.name': { $in: Object.values(WHO).map((w) => w.name) } });
  await d.collection('users').deleteMany({ email: { $in: Object.values(WHO).map((w) => emailOf(w.name)) } });
});

/* ---------- Razorpay itself ---------- */

/** Every payment Razorpay has on one Razorpay order (test API; the keys are only used for the request, never printed). */
async function razorpayPayments(razorpayOrderId: string) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const res = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}/payments`, { headers: { Authorization: `Basic ${auth}` } });
  expect(res.ok, `Razorpay payment lookup for ${razorpayOrderId} answered ${res.status}`).toBe(true);
  return ((await res.json()) as { items: { id: string; status: string }[] }).items;
}

/** The one captured payment Razorpay has for this order; fails if there is more than one payment at all. */
async function theCapturedPayment(razorpayOrderId: string) {
  let items: { id: string; status: string }[] = [];
  // Capture can trail the checkout by a moment.
  await expect.poll(async () => (items = await razorpayPayments(razorpayOrderId)).map((p) => p.status), { timeout: 30_000 }).toEqual(['captured']);
  return items[0].id;
}

/* ---------- people and pages ---------- */

const payButton = (page: Page) => page.getByRole('button', { name: /^Pay ₹/ });
const localCart = (page: Page) => page.evaluate(() => localStorage.getItem('boldmount-cart'));
const confirmingHeading = (page: Page) => page.getByRole('heading', { name: 'Confirming your payment' });
const receivedHeading = (page: Page) => page.getByRole('heading', { name: 'Payment received — thank you!' });

/** Signs in, puts one Talbeenah (₹249 + ₹50 delivery = ₹299) in the cart and fills in the delivery details. */
async function startCheckout(page: Page, context: BrowserContext, who: Person) {
  await signInAs(context, { name: who.name, email: emailOf(who.name) });
  await addToCart(page);
  await page.goto('/cart');
  // The name box fills itself from the account once it loads; typing before that would be added to it.
  await expect(payButton(page)).toBeVisible();
  await fillCheckout(page, who);
}

/** The verify requests the browser tried to send while they were being held back. */
type Held = { bodies: Record<string, string>[] };

/**
 * Pays ₹299 at Razorpay's test bank while the browser's "verify" call never gets through (phone lost signal) and the order list can't be read,
 * so the page is left exactly as a customer would see it. Resolves once the page shows "Confirming your payment".
 */
async function payWithVerifyLost(page: Page, context: BrowserContext, who: Person): Promise<Held> {
  await startCheckout(page, context, who);
  const held: Held = { bodies: [] };
  await page.route('**/api/orders/verify', (route) => {
    held.bodies.push(route.request().postDataJSON());
    return route.abort();
  });
  await page.route('**/api/orders/mine', (route) => route.abort());
  await payButton(page).click();
  await payWithTestBank(page, 'Success');
  await expect(confirmingHeading(page)).toBeVisible({ timeout: 60_000 });
  return held;
}

const letNetworkBack = async (page: Page) => {
  await page.unroute('**/api/orders/verify');
  await page.unroute('**/api/orders/mine');
};

/** Razorpay can take a moment to show a payment as captured, and a check that found nothing waits a minute: clear that wait so the next list load asks again at once. */
const askAgain = async (who: Person) => (await orders()).updateMany({ 'customer.name': who.name }, { $unset: { paymentCheckedAt: '' } });

/** Wakes the open page the way coming back to the tab does, until it has re-read the order list and shows `heading`. */
const nudgeUntil = (page: Page, who: Person, heading: Locator) =>
  expect(async () => {
    await askAgain(who);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(heading).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 45_000 });

const mine = async (page: Page, who: Person) => (await api<{ orders: Order[] }>(page, '/api/orders/mine')).data.orders.find((o) => o.customer.name === who.name)!;
const adminOrders = async (admin: Page) => (await api<{ orders: Order[] }>(admin, '/api/admin/orders')).data.orders;
/** What the shop's list says about this customer's order after a fresh look at Razorpay. */
const adminPayment = async (admin: Page, who: Person, number: string) => {
  await askAgain(who);
  return (await adminOrders(admin)).find((o) => o.number === number)?.payment;
};

type Stats = { orders: number; paidOrders: number; revenue: number };
const stats = async (admin: Page) => (await api<Stats>(admin, '/api/admin/stats?period=today')).data;

async function adminIn(context: BrowserContext) {
  const admin = await context.browser()!.newPage();
  await adminLogin(admin);
  return admin;
}

test('a. verify never lands: no live Pay button, cart cleared, "Confirming…", then Paid by itself with Razorpay’s own payment id and only one payment', async ({ page, context }) => {
  const held = await payWithVerifyLost(page, context, WHO.aarif);

  // Tried three times (then 1s and 3s apart) before giving up, and the customer is not asked to pay again.
  expect(held.bodies).toHaveLength(3);
  await expect(payButton(page)).toHaveCount(0);
  expect(await localCart(page)).toContain('"items":[]');
  const main = page.locator('main');
  await expect(main).toContainText('Payment received by Razorpay — we’re confirming it.');
  await expect(main).toContainText('This page updates by itself');
  await expect(main).toContainText((await savedOrder(WHO.aarif)).number);
  await expect(main).not.toContainText(/payment failed|pay now/i);
  expect(await savedOrder(WHO.aarif)).toMatchObject({ method: 'online', payment: 'pending' });

  // The connection comes back; the open page flips on its own (no reload), with Razorpay's own payment.
  const razorpayPaymentId = await theCapturedPayment((await savedOrder(WHO.aarif)).razorpayOrderId);
  await letNetworkBack(page);
  await nudgeUntil(page, WHO.aarif, receivedHeading(page));

  // Your orders: on its way, and paid with the very payment Razorpay has. Still one payment there.
  await page.goto('/orders');
  await expect(page.getByRole('region', { name: 'Ongoing' })).toContainText((await savedOrder(WHO.aarif)).number);
  const order = await mine(page, WHO.aarif);
  expect(order).toMatchObject({ payment: 'paid', razorpayPaymentId, total: 299 });
  expect(order.paidAt).toBeTruthy();
  expect(order).not.toHaveProperty('paymentCheckedAt');
  expect(await razorpayPayments(order.razorpayOrderId!)).toHaveLength(1);
});

test('b. verify fails twice (server error) and then works: the retry marks it paid and the customer sees no error', async ({ page, context }) => {
  await startCheckout(page, context, WHO.mariam);
  let calls = 0;
  await page.route('**/api/orders/verify', (route) => (++calls <= 2 ? route.fulfill({ status: 500, json: { error: 'Something went wrong on our side.' } }) : route.continue()));
  await payButton(page).click();
  await payWithTestBank(page, 'Success');
  await expect(receivedHeading(page)).toBeVisible({ timeout: 60_000 });

  expect(calls).toBe(3);
  await expect(page.locator('main')).not.toContainText(/couldn’t confirm|Confirming your payment/);
  const saved = await savedOrder(WHO.mariam);
  expect(saved).toMatchObject({ payment: 'paid', razorpayPaymentId: await theCapturedPayment(saved.razorpayOrderId) });
});

test('b2. a refused verify (400) is never retried; the order still waits for confirmation and the backstop pays it', async ({ page, context }) => {
  await startCheckout(page, context, WHO.naseem);
  let calls = 0;
  await page.route('**/api/orders/verify', (route) => {
    calls++;
    return route.fulfill({ status: 400, json: { error: 'We couldn’t confirm this payment.' } });
  });
  await page.route('**/api/orders/mine', (route) => route.abort()); // otherwise the page re-reads the list and is already Paid before we can look
  await payButton(page).click();
  await payWithTestBank(page, 'Success');
  await expect(confirmingHeading(page)).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(5000); // longer than both retry waits
  expect(calls).toBe(1);
  await expect(payButton(page)).toHaveCount(0);

  await theCapturedPayment((await savedOrder(WHO.naseem)).razorpayOrderId);
  await letNetworkBack(page);
  await nudgeUntil(page, WHO.naseem, receivedHeading(page));
  expect(await mine(page, WHO.naseem)).toMatchObject({ payment: 'paid' });
});

test('c. a closed window marked the order failed although Razorpay had captured the payment: the backstop makes it paid', async ({ page, context }) => {
  await payWithVerifyLost(page, context, WHO.yaseen);
  const before = await savedOrder(WHO.yaseen);
  const razorpayPaymentId = await theCapturedPayment(before.razorpayOrderId);

  // The UPI window is dismissed while the payment is still going through, so the page reports it failed.
  const dismissed = await api(page, '/api/orders/failed', { method: 'POST', body: { orderId: String(before._id), reason: 'dismissed' } });
  expect(dismissed.status).toBe(200);
  expect(await savedOrder(WHO.yaseen)).toMatchObject({ payment: 'failed' });

  // The shop opens its Orders page: it shows Paid, not Failed.
  const admin = await adminIn(context);
  const row = admin.locator('main li').filter({ hasText: before.number }).first();
  await expect(async () => {
    await askAgain(WHO.yaseen);
    await admin.goto('/admin/orders');
    await expect(row).toContainText('Paid', { timeout: 5000 });
  }).toPass({ timeout: 60_000 });
  await expect(row).not.toContainText('Failed');
  expect((await adminOrders(admin)).find((o) => o.id === String(before._id))).toMatchObject({ payment: 'paid', razorpayPaymentId });
  expect(await razorpayPayments(before.razorpayOrderId)).toHaveLength(1);

  await letNetworkBack(page);
  expect(await mine(page, WHO.yaseen)).toMatchObject({ payment: 'paid', razorpayPaymentId });
  await admin.context().close();
});

test('d. a payment that was never made stays unpaid, and Razorpay is not asked again within a minute', async ({ page, context }) => {
  // One order whose Razorpay window was closed without paying (marked failed), one that was started and abandoned (still pending).
  await startCheckout(page, context, WHO.rukhsar);
  await payButton(page).click();
  await closeRazorpay(page);
  await expect(page.locator('main')).toContainText(/nothing was charged/i);
  await expect.poll(async () => (await savedOrder(WHO.rukhsar)).payment).toBe('failed');
  const failed = await savedOrder(WHO.rukhsar);
  const started = await api<{ order: Order }>(page, '/api/orders', {
    method: 'POST',
    body: { method: 'online', items: [{ slug: 'premium-roasted-talbeenah', variantId: '500g', qty: 1 }], customer: { ...WHO.rukhsar, note: '' } },
  });
  expect(started.status).toBe(201);
  const pendingId = new mongoose.Types.ObjectId(started.data.order.id);

  // The first list load asks Razorpay and writes down when; nothing is marked paid.
  const checkedAt = async (id: unknown) => ((await (await orders()).findOne({ _id: id as mongoose.Types.ObjectId }))!.paymentCheckedAt as Date | undefined)?.getTime();
  const first = (await api<{ orders: Order[] }>(page, '/api/orders/mine')).data.orders.filter((o) => o.customer.name === WHO.rukhsar.name);
  expect(first.map((o) => o.payment).sort()).toEqual(['failed', 'pending']);
  expect(first.every((o) => !o.razorpayPaymentId)).toBe(true);
  const stamps = [await checkedAt(failed._id), await checkedAt(pendingId)];
  expect(stamps.every((t) => t && Date.now() - t < 60_000)).toBe(true);
  expect((await razorpayPayments(failed.razorpayOrderId)).filter((p) => p.status === 'captured')).toEqual([]);

  // Loading again at once (customer's list, and the shop's) leaves the stamps alone: no second question to Razorpay.
  await api(page, '/api/orders/mine');
  const admin = await adminIn(context);
  await adminOrders(admin);
  expect([await checkedAt(failed._id), await checkedAt(pendingId)]).toEqual(stamps);

  // The customer's pages are honest about each one.
  await page.goto(`/orders/${failed._id}`);
  await expect(page.locator('main')).toContainText('Payment not completed');
  await page.goto(`/orders/${pendingId}`);
  await expect(page.locator('main')).toContainText('Status: Confirming your payment');
  await expect(page.locator('main')).toContainText('If you paid and it still says pending');

  // Once the minute is up Razorpay is asked again, still finds no payment, and the orders stay unpaid.
  await (await orders()).updateMany({ _id: { $in: [failed._id, pendingId] } }, { $set: { paymentCheckedAt: new Date(Date.now() - 120_000) } });
  const later = (await api<{ orders: Order[] }>(page, '/api/orders/mine')).data.orders.filter((o) => o.customer.name === WHO.rukhsar.name);
  expect(later.map((o) => o.payment).sort()).toEqual(['failed', 'pending']);
  for (const id of [failed._id, pendingId]) expect(await checkedAt(id)).toBeGreaterThan(Date.now() - 60_000);
  await admin.context().close();
});

test('e. the dashboard counts a reconciled order once, however often it is looked at or confirmed again', async ({ page, context }) => {
  const admin = await adminIn(context);
  const base = await stats(admin);
  const held = await payWithVerifyLost(page, context, WHO.idrees);
  const saved = await savedOrder(WHO.idrees);
  const delta = async () => {
    const now = await stats(admin);
    return [now.orders - base.orders, now.paidOrders - base.paidOrders, now.revenue - base.revenue];
  };

  // Placed, but not paid: it is an order, not money.
  expect(await delta()).toEqual([1, 0, 0]);

  // The shop's list load finds the captured payment: one paid order, ₹299.
  const razorpayPaymentId = await theCapturedPayment(saved.razorpayOrderId);
  await expect.poll(() => adminPayment(admin, WHO.idrees, saved.number), { timeout: 45_000 }).toBe('paid');
  expect(await delta()).toEqual([1, 1, 299]);

  // Looking again, the customer's own list, and the late "verify" finally arriving change nothing.
  await adminOrders(admin);
  await letNetworkBack(page);
  expect(await mine(page, WHO.idrees)).toMatchObject({ payment: 'paid', razorpayPaymentId });
  const late = await api<{ order: Order }>(page, '/api/orders/verify', { method: 'POST', body: held.bodies[0] });
  expect(late.status).toBe(200);
  expect(late.data.order).toMatchObject({ payment: 'paid', razorpayPaymentId });
  expect(await delta()).toEqual([1, 1, 299]);
  expect(await razorpayPayments(saved.razorpayOrderId)).toHaveLength(1);
  await admin.context().close();
});

test('f. a payment that landed after the shop cancelled the order is found by the backstop and sent straight back', async ({ page, context }) => {
  await payWithVerifyLost(page, context, WHO.sabiha);
  const saved = await savedOrder(WHO.sabiha);
  await theCapturedPayment(saved.razorpayOrderId);

  const admin = await adminIn(context);
  const cancelled = await api(admin, `/api/admin/orders/${saved._id}`, { method: 'PATCH', body: { status: 'cancelled' } });
  expect(cancelled.status).toBe(200);

  // The next list load confirms the payment and refunds it in full, once.
  await expect.poll(() => adminPayment(admin, WHO.sabiha, saved.number), { timeout: 45_000 }).toBe('refunded');
  expect((await adminOrders(admin)).find((o) => o.number === saved.number)).toMatchObject({
    status: 'cancelled',
    refund: { status: 'refunded', amount: 299, reason: 'Paid after the order was cancelled' },
  });
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const paymentId = (await razorpayPayments(saved.razorpayOrderId))[0].id;
  const refunds = (await (await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refunds`, { headers: { Authorization: `Basic ${auth}` } })).json()) as { items: { amount: number }[] };
  expect(refunds.items.map((r) => r.amount)).toEqual([29900]);
  await admin.context().close();
});

test('g. the page died before it heard back and the cart is still full: paying again for the same items is stopped once, then allowed', async ({ page, context }) => {
  await payWithVerifyLost(page, context, WHO.farida);
  const first = await savedOrder(WHO.farida);
  await theCapturedPayment(first.razorpayOrderId);
  await letNetworkBack(page);
  await askAgain(WHO.farida);

  // Same items back in the cart, as if the page had been killed before it could clear it.
  await addToCart(page);
  await page.goto('/cart');
  await expect(payButton(page)).toBeVisible();
  await fillCheckout(page, WHO.farida);
  await payButton(page).click();
  await expect(page.locator('main')).toContainText(`Your earlier payment went through: order ${first.number} is paid.`);
  await expect(page.locator('iframe.razorpay-checkout-frame')).toHaveCount(0);
  expect(await savedOrder(WHO.farida)).toMatchObject({ number: first.number, payment: 'paid' });

  // Told once: a deliberate second purchase goes ahead to Razorpay.
  await payButton(page).click();
  await closeRazorpay(page);
  const second = await savedOrder(WHO.farida);
  expect(second.number).not.toBe(first.number);
  expect(await razorpayPayments(first.razorpayOrderId)).toHaveLength(1);
});
