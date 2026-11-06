import { createHmac } from 'node:crypto';
import mongoose from 'mongoose';
import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { addToCart, adminLogin, api, closeRazorpay, fillCheckout, payWithTestBank, signInAs, testDb } from './helpers';
import { cashOrder, emailOf, payCash, payOnlineChoice, placeOrder } from './place-order';
import { formatINR } from '../lib/format';
import type { Order } from '../lib/types';

// Every money path, one row of the audit per test: online payments, cancellations, refunds, cash on delivery and the dashboard.
// Online refunds are checked at Razorpay itself, not just in our database.

test.describe.configure({ timeout: 240_000 });

const COD_OFF = 'Cash on delivery isn’t available on your account because an earlier order was cancelled. You can pay online.';
const TOO_LATE = 'This order has already left our shop, so it can’t be cancelled. Message us and we’ll help.';

const person = (name: string, mobile: string, address: string, city: string, pincode: string) => ({ name, mobile, address, city, pincode });
const WHO = {
  farhan: person('Farhan Siddiqui', '98480 22338', '14 Banjara Hills Road 3', 'Hyderabad', '500034'),
  zoya: person('Zoya Pathan', '98201 45567', 'Flat 5B, Lotus Residency, Lokhandwala, Andheri West', 'Mumbai', '400053'),
  imtiyaz: person('Imtiyaz Ahmed', '98450 31209', '22 Residency Road, Shanthala Nagar', 'Bengaluru', '560025'),
  shabnam: person('Shabnam Qureshi', '99100 76543', 'B-12, Abul Fazal Enclave, Jamia Nagar, Okhla', 'New Delhi', '110025'),
  irfan: person('Mohammed Irfan', '98300 12984', '7 Park Street, Near Mullick Bazar', 'Kolkata', '700016'),
  tabassum: person('Tabassum Sheikh', '94440 88123', '45 Mount Road, Anna Salai', 'Chennai', '600002'),
  rizwan: person('Rizwan Mansoori', '98390 55012', '18 Hazratganj Market Lane', 'Lucknow', '226001'),
  nargis: person('Nargis Fatima', '97650 41876', '31 Camp Road, Near Bund Garden', 'Pune', '411001'),
  junaid: person('Junaid Memon', '98250 67190', '3 Ashram Road, Usmanpura', 'Ahmedabad', '380013'),
  sameera: person('Sameera Begum', '98860 20456', '9 Tolichowki Main Road', 'Hyderabad', '500008'),
  asif: person('Asif Nizami', '98100 33781', '27 Nizamuddin West, Near Dargah Road', 'New Delhi', '110013'),
  farida: person('Farida Khatoon', '98730 19064', '12 Lal Darwaza Road, Charminar', 'Hyderabad', '500002'),
  salim: person('Salim Chaudhary', '98760 14499', '5 Civil Lines, Near Clock Tower', 'Meerut', '250001'),
  hina: person('Hina Rizvi', '99880 42310', '61 Colaba Causeway', 'Mumbai', '400005'),
  danish: person('Danish Ansari', '98270 90018', '44 Rajouri Garden Main Market', 'New Delhi', '110027'),
  mehnaz: person('Mehnaz Siddiqui', '98340 77651', '8 Sadar Bazaar Road', 'Nagpur', '440001'),
  wasim: person('Wasim Akhtar', '98180 25543', '16 Moti Bagh Road, Near Idgah', 'Bhopal', '462001'),
};
type Person = (typeof WHO)[keyof typeof WHO];

/* ---------- Razorpay itself ---------- */

type RzpRefund = { id: string; amount: number; status: string; receipt: string | null };

/** What Razorpay says about a payment's refunds (test API; the keys are only used for the request, never printed). */
async function razorpayRefunds(paymentId: string) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refunds`, { headers: { Authorization: `Basic ${auth}` } });
  expect(res.ok, `Razorpay refund lookup for ${paymentId} answered ${res.status}`).toBe(true);
  const body = (await res.json()) as { count: number; items: RzpRefund[] };
  return { count: body.count, amounts: body.items.map((r) => r.amount), items: body.items };
}

/** Our own refund must be exactly one Razorpay refund of `rupees` (in paise), sent without a receipt (Razorpay wants those unique). */
async function expectOneRazorpayRefund(paymentId: string, rupees: number) {
  const rz = await razorpayRefunds(paymentId);
  expect(rz.amounts).toEqual([rupees * 100]);
  expect(rz.items[0].receipt).toBeNull();
  expect(rz.items[0].status).toMatch(/^(processed|pending|created)$/);
}

/* ---------- what the shop expects to see on the dashboard, worked out by hand per order ---------- */

type Stats = { orders: number; paidOrders: number; revenue: number };
const stats = async (admin: Page) => (await api<Stats>(admin, '/api/admin/stats?period=today')).data;
const revenueToday = async (admin: Page) => (await stats(admin)).revenue;

let base: Stats;
const ledger: { label: string; orders: number; paid: number; revenue: number }[] = [];
const mine = { numbers: new Set<string>(), emails: new Set<string>() };
/** Writes down what this order should add to Orders, paid and Revenue once its story is over. */
const book = (order: Order, orders: 0 | 1, paid: 0 | 1, revenue: number) => {
  mine.numbers.add(order.number);
  ledger.push({ label: order.number, orders, paid, revenue });
};

test.beforeAll(async ({ browser }) => {
  const admin = await adminIn(browser);
  base = await stats(admin);
  await admin.context().close();
});

// Later specs read today's revenue and orders, so take this spec's orders and customers back out.
test.afterAll(async () => {
  const d = await testDb();
  await d.collection('orders').deleteMany({ number: { $in: [...mine.numbers] } });
  await d.collection('users').deleteMany({ email: { $in: [...mine.emails] } });
});

/* ---------- people and pages ---------- */

/** A separate browser signed in to the admin, like the shop owner's own phone. */
async function adminIn(browser: Browser) {
  const admin = await browser.newPage();
  await adminLogin(admin);
  return admin;
}
const newAdmin = (context: BrowserContext) => adminIn(context.browser()!);

async function signIn(context: BrowserContext, who: Person) {
  const email = emailOf(who.name);
  mine.emails.add(email);
  await signInAs(context, { name: who.name, email });
}

/** Signs in, puts one Talbeenah (₹249 + ₹50 delivery = ₹299) in the cart and fills in the delivery details. */
async function startCheckout(page: Page, context: BrowserContext, who: Person) {
  await signIn(context, who);
  await addToCart(page);
  await page.goto('/cart');
  await fillCheckout(page, who);
}
const payButton = (page: Page) => page.getByRole('button', { name: /^Pay ₹/ });

/** A customer pays ₹299 in Razorpay's test mode and lands on "Payment received". Returns the saved order. */
async function paidOrder(page: Page, context: BrowserContext, who: Person): Promise<Order> {
  await startCheckout(page, context, who);
  await payButton(page).click();
  await payWithTestBank(page, 'Success');
  await expect(page.getByText('Payment received')).toBeVisible({ timeout: 45_000 });
  const order = (await api<{ orders: Order[] }>(page, '/api/orders/mine')).data.orders[0];
  mine.numbers.add(order.number);
  return order;
}

/** A signed-in customer places one 500 g Talbeenah with cash on delivery straight through the API. */
async function apiCashOrder(page: Page, context: BrowserContext, who: Person): Promise<Order> {
  await signIn(context, who);
  await page.goto('/');
  const res = await api<{ order: Order }>(page, '/api/orders', {
    method: 'POST',
    body: { method: 'cod', items: [{ slug: 'premium-roasted-talbeenah', variantId: '500g', qty: 1 }], customer: { ...who, note: '' } },
  });
  expect(res.status).toBe(201);
  mine.numbers.add(res.data.order.number);
  return res.data.order;
}

const adminOrder = async (admin: Page, id: string) => (await api<{ orders: Order[] }>(admin, '/api/admin/orders')).data.orders.find((o) => o.id === id)!;
const myOrder = async (page: Page, id: string) => (await api<{ orders: Order[] }>(page, '/api/orders/mine')).data.orders.find((o) => o.id === id)!;
const setStatus = (admin: Page, id: string, status: string) => api(admin, `/api/admin/orders/${id}`, { method: 'PATCH', body: { status } });
const adminRow = (admin: Page, number: string) => admin.locator('main li').filter({ hasText: number }).first();
const codAllowed = async (page: Page) => (await api<{ allowed: boolean }>(page, '/api/orders/cod')).data.allowed;

/** Opens the shop's Orders page with this order's details showing. */
async function openInAdmin(admin: Page, order: Order) {
  await admin.goto('/admin/orders');
  const row = adminRow(admin, order.number);
  await row.getByRole('button', { name: 'Show details' }).click();
  return row;
}

/** What the shop presses to send a refund: the amount, then the "are you sure" step. */
async function refundInAdmin(row: Locator, amount: number) {
  const start = row.getByRole('button', { name: /^(Refund|Try refund again)$/ });
  if (await start.count()) await start.click();
  await row.getByLabel('Amount to refund (₹)').fill(String(amount));
  await row.getByRole('button', { name: `Refund ${formatINR(amount)}` }).click();
  await row.getByRole('button', { name: `Yes, refund ${formatINR(amount)}` }).click();
}

/** The customer opens "Request a refund" on their order and sends it. */
async function askForRefund(page: Page, order: Order, reason = 'Damaged or leaking', note = 'The pouch was torn and some Talbeenah spilled out.') {
  await page.goto(`/orders/${order.id}`);
  await page.getByRole('button', { name: 'Request a refund' }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Reason').selectOption(reason);
  await form.getByLabel('Note (optional)').fill(note);
  await form.getByRole('button', { name: 'Send refund request' }).click();
  await expect(page.locator('main')).toContainText('Refund requested');
}

const cancelInCustomerPage = async (page: Page, order: Order, confirm: 'click' | 'dblclick' = 'click') => {
  await page.goto(`/orders/${order.id}`);
  await page.getByRole('button', { name: 'Cancel order' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, cancel my order' })[confirm]();
};

/* ======================================================================================================== */
/* Online payments (rows 1–4) and what happens to an order after dispatch (rows 7 and 16)                    */
/* ======================================================================================================== */

test.describe.serial('online payment, then dispatched and delivered', () => {
  let a: Order;
  let paymentId = '';

  test('1. pay online: the order is paid, customer and shop both see it, revenue goes up by the total', async ({ page, context }) => {
    const admin = await newAdmin(context);
    const before = await stats(admin);

    a = await paidOrder(page, context, WHO.farhan);
    expect(a).toMatchObject({ method: 'online', payment: 'paid', status: 'new', total: 299 });
    expect(a.razorpayPaymentId).toMatch(/^pay_/);
    paymentId = a.razorpayPaymentId!;
    expect(await localCart(page)).toContain('"items":[]');

    // The customer sees it on their order page.
    await page.getByRole('link', { name: 'Track this order' }).click();
    await expect(page.locator('main')).toContainText('Paid online');
    await expect(page.locator('main')).toContainText('Status: Placed');

    // The shop sees it paid, in the list and on the dashboard.
    await admin.goto('/admin/orders');
    await expect(adminRow(admin, a.number)).toContainText('Paid');
    expect(await adminOrder(admin, a.id)).toMatchObject({ payment: 'paid', method: 'online', razorpayPaymentId: paymentId });
    const after = await stats(admin);
    expect(after.revenue - before.revenue).toBe(299);
    expect([after.orders - before.orders, after.paidOrders - before.paidOrders]).toEqual([1, 1]);
    expect((await razorpayRefunds(paymentId)).count).toBe(0);
    await admin.context().close();
  });

  test('4. tampered payment confirmations are refused and nothing is marked paid', async ({ page, context }) => {
    // Checkout has saved an unpaid order and opened Razorpay; now someone calls "verify" with made-up details.
    await signIn(context, WHO.zoya);
    await page.goto('/');
    const placed = await api<{ order: Order; razorpay: { orderId: string } }>(page, '/api/orders', {
      method: 'POST',
      body: { method: 'online', items: [{ slug: 'premium-roasted-talbeenah', variantId: '500g', qty: 1 }], customer: { ...WHO.zoya, note: '' } },
    });
    expect(placed.status).toBe(201);
    const { order, razorpay } = placed.data;
    mine.numbers.add(order.number);
    expect(order.payment).toBe('pending');

    // A real payment of somebody else's order, signed properly for that order.
    const realOrder = a?.razorpayOrderId ?? 'order_RealLooking0001';
    const realPayment = paymentId || 'pay_RealLooking0001';
    const sign = (rzpOrder: string, pay: string) => createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!).update(`${rzpOrder}|${pay}`).digest('hex');
    const verify = (body: object) => api<{ error?: string }>(page, '/api/orders/verify', { method: 'POST', body: { orderId: order.id, ...body } });
    const tries: Record<string, object> = {
      'a made-up signature': { razorpayOrderId: razorpay.orderId, razorpayPaymentId: 'pay_MadeUpPayment01', razorpaySignature: 'f'.repeat(64) },
      'someone else’s payment with its own signature': { razorpayOrderId: razorpay.orderId, razorpayPaymentId: realPayment, razorpaySignature: sign(realOrder, realPayment) },
      'a right signature but a swapped payment id': { razorpayOrderId: razorpay.orderId, razorpayPaymentId: 'pay_SwappedPayment1', razorpaySignature: sign(razorpay.orderId, realPayment) },
      'another order’s Razorpay ids': { razorpayOrderId: realOrder, razorpayPaymentId: realPayment, razorpaySignature: sign(realOrder, realPayment) },
      'no details at all': {},
    };
    for (const [why, body] of Object.entries(tries)) {
      const res = await verify(body);
      expect(res.status, why).toBe(400);
      expect(res.data.error, why).toBeTruthy();
    }
    // Replaying a genuine confirmation on the already-paid order changes nothing.
    if (a) {
      const replay = await api(page, '/api/orders/verify', {
        method: 'POST',
        body: { orderId: a.id, razorpayOrderId: realOrder, razorpayPaymentId: realPayment, razorpaySignature: sign(realOrder, realPayment) },
      });
      expect(replay.status).toBe(200);
    }

    const admin = await newAdmin(context);
    const saved = await adminOrder(admin, order.id);
    expect(saved.payment).toBe('pending');
    expect(saved.razorpayPaymentId).toBeUndefined();
    expect(saved.paidAt).toBeUndefined();
    // Never charged and never paid: it counts as a placed order, not a paid one, and adds no revenue.
    book(order, 1, 0, 0);
    await admin.context().close();
  });

  test('7. after dispatch the customer can’t cancel: friendly message in the page and from the API, and no refund is sent', async ({ page, context }) => {
    test.skip(!a, 'needs the paid order from row 1');
    await signIn(context, WHO.farhan);
    const admin = await newAdmin(context);

    // The customer already has the order open with the Cancel button showing…
    await page.goto(`/orders/${a.id}`);
    await expect(page.getByRole('button', { name: 'Cancel order' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel order' }).click();
    // …when the shop dispatches it (written straight to the database so this open page is not updated live).
    await (await testDb()).collection('orders').updateOne({ _id: new mongoose.Types.ObjectId(a.id) }, { $set: { status: 'dispatched', dispatchedAt: new Date() } });
    await page.getByRole('dialog').getByRole('button', { name: 'Yes, cancel my order' }).click();
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText(TOO_LATE);
    await page.keyboard.press('Escape');

    // The API says the same, and a refreshed page has no Cancel button at all.
    const res = await api<{ error: string }>(page, `/api/orders/${a.id}/cancel`, { method: 'POST', body: {} });
    expect(res.status).toBe(409);
    expect(res.data.error).toBe(TOO_LATE);
    await page.reload();
    await expect(page.locator('main')).toContainText('Status: Dispatched');
    await expect(page.getByRole('button', { name: 'Cancel order' })).toHaveCount(0);

    expect(await adminOrder(admin, a.id)).toMatchObject({ status: 'dispatched', payment: 'paid' });
    expect((await razorpayRefunds(paymentId)).count).toBe(0);
    expect(await codAllowed(page)).toBe(true);
    await admin.context().close();
  });

  test('16. a refund request outside the 7-day window is refused, in the page and by the API', async ({ page, context }) => {
    test.skip(!a, 'needs the paid order from row 1');
    await signIn(context, WHO.farhan);
    const admin = await newAdmin(context);
    expect((await setStatus(admin, a.id, 'delivered')).status).toBe(200);
    const orders = (await testDb()).collection('orders');
    const deliveredAgo = (days: number) => orders.updateOne({ _id: new mongoose.Types.ObjectId(a.id) }, { $set: { deliveredAt: new Date(Date.now() - days * 86_400_000) } });

    // Day 6: still inside the window, so the button is there.
    await deliveredAgo(6);
    await page.goto(`/orders/${a.id}`);
    await expect(page.getByRole('button', { name: 'Request a refund' })).toBeVisible();

    // Day 8: the window has closed.
    await deliveredAgo(8);
    await page.reload();
    await expect(page.locator('main')).toContainText('Status: Delivered');
    await expect(page.getByRole('button', { name: 'Request a refund' })).toHaveCount(0);
    const res = await api<{ error: string }>(page, `/api/orders/${a.id}/refund-request`, { method: 'POST', body: { reason: 'Other', note: 'Packet was damaged.' } });
    expect(res.status).toBe(409);
    expect(res.data.error).toMatch(/7-day window .* has ended/);
    expect((await adminOrder(admin, a.id)).refund).toBeUndefined();
    expect((await razorpayRefunds(paymentId)).count).toBe(0);

    // The order itself stays a normal paid order: nothing was refunded, so it keeps all its revenue.
    book(a, 1, 1, 299);
    await admin.context().close();
  });
});

const localCart = (page: Page) => page.evaluate(() => localStorage.getItem('boldmount-cart'));

/** After a payment that didn't go through, the checkout page says so, keeps the cart and lets the customer try again. */
async function expectCartKept(page: Page, notice: RegExp) {
  const main = page.locator('main');
  await expect(main).toContainText(notice);
  await expect(main).toContainText(/nothing was charged/i);
  await expect(main).toContainText('Your cart is saved');
  expect(await localCart(page)).toContain('premium-roasted-talbeenah');
  expect(await localCart(page)).not.toContain('"items":[]');
  await expect(payButton(page)).toBeEnabled();
}

/** The customer's latest order is failed: no revenue, not on its way, and not something they can "cancel" (that would switch cash off). */
async function expectDeadOrder(page: Page, context: BrowserContext) {
  const main = page.locator('main');
  const admin = await newAdmin(context);
  const before = await stats(admin);
  const order = (await api<{ orders: Order[] }>(page, '/api/orders/mine')).data.orders[0];
  mine.numbers.add(order.number);
  await expect.poll(async () => (await adminOrder(admin, order.id)).payment).toBe('failed');
  expect(await adminOrder(admin, order.id)).toMatchObject({ status: 'new', method: 'online' });
  expect((await adminOrder(admin, order.id)).razorpayPaymentId).toBeUndefined();

  // The customer is not told an unpaid order is on its way, and there is nothing to cancel (cancelling would switch cash off).
  await page.goto('/orders');
  await expect(page.getByRole('region', { name: 'Ongoing' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Order history' })).toContainText('Payment not completed');
  await page.goto(`/orders/${order.id}`);
  await expect(main).toContainText('Payment not completed');
  await expect(page.getByRole('button', { name: 'Cancel order' })).toHaveCount(0);
  const refused = await api(page, `/api/orders/${order.id}/cancel`, { method: 'POST', body: {} });
  expect(refused.status).toBe(409);
  expect(await codAllowed(page)).toBe(true);

  // A failed payment is no order at all on the dashboard, and brings in no money.
  const after = await stats(admin);
  expect([after.orders - before.orders, after.paidOrders - before.paidOrders, after.revenue - before.revenue]).toEqual([0, 0, 0]);
  book(order, 0, 0, 0);
  await admin.context().close();
}

test('2. closing the Razorpay window marks the order failed, says nothing was charged and keeps the cart for another try', async ({ page, context }) => {
  await startCheckout(page, context, WHO.imtiyaz);
  await payButton(page).click();
  await closeRazorpay(page);
  await expectCartKept(page, /Payment cancelled/);

  // Trying again on the same page opens Razorpay again with the same cart; closing it once more leaves a second dead order.
  await payButton(page).click();
  await closeRazorpay(page);
  await expectCartKept(page, /Payment cancelled/);
  const admin = await newAdmin(context);
  const failed = (await api<{ orders: Order[] }>(admin, '/api/admin/orders')).data.orders.filter((o) => o.customer.name === WHO.imtiyaz.name);
  await expect.poll(async () => (await api<{ orders: Order[] }>(admin, '/api/admin/orders')).data.orders.filter((o) => o.customer.name === WHO.imtiyaz.name).map((o) => o.payment)).toEqual(['failed', 'failed']);
  failed.slice(1).forEach((o) => book(o, 0, 0, 0)); // the newest is written down by expectDeadOrder
  await admin.context().close();
  await expectDeadOrder(page, context);
});

test('3. a payment that fails at the bank is marked failed, the same as a closed window', async ({ page, context }) => {
  await startCheckout(page, context, WHO.shabnam);
  await payButton(page).click();
  await payWithTestBank(page, 'Failure');
  // Razorpay says the bank declined; the customer dismisses that, then closes the payment window.
  const frame = page.frameLocator('iframe.razorpay-checkout-frame');
  await frame.getByText('Payment could not be completed').waitFor({ timeout: 30_000 });
  await frame.getByTestId('payment-status-modal').getByRole('button').filter({ hasText: /^$/ }).click();
  await closeRazorpay(page);
  await expectCartKept(page, /payment didn’t go through/i);
  await expectDeadOrder(page, context);
});

/* ======================================================================================================== */
/* Cancellations (rows 5, 6, 8, 9)                                                                           */
/* ======================================================================================================== */

test('5. customer cancels a paid online order before dispatch: one automatic full Razorpay refund, revenue back, cash switched off', async ({ page, context }) => {
  const admin = await newAdmin(context);
  const before = await stats(admin);
  const order = await paidOrder(page, context, WHO.tabassum);
  const paymentId = order.razorpayPaymentId!;
  expect(await codAllowed(page)).toBe(true);

  // A double tap on "Yes, cancel my order" still sends the money back once.
  await cancelInCustomerPage(page, order, 'dblclick');
  const main = page.locator('main');
  await expect(main).toContainText(/Refund of ₹299 sent/);
  await expect(main).toContainText('Cancelled by you');
  await expect(main).toContainText('Refunded');

  const saved = await adminOrder(admin, order.id);
  expect(saved).toMatchObject({ status: 'cancelled', cancelledBy: 'customer', payment: 'refunded' });
  expect(saved.refund).toMatchObject({ status: 'refunded', amount: 299 });
  expect(saved.refund?.razorpayRefundId).toMatch(/^rfnd_/);
  await expectOneRazorpayRefund(paymentId, 299);
  expect((await razorpayRefunds(paymentId)).items[0].id).toBe(saved.refund?.razorpayRefundId);

  // The shop sees it refunded; it counts as a paid order but keeps no money.
  await admin.goto('/admin/orders');
  await expect(adminRow(admin, order.number)).toContainText('Refunded ₹299');
  const after = await stats(admin);
  expect([after.orders - before.orders, after.paidOrders - before.paidOrders, after.revenue - before.revenue]).toEqual([1, 1, 0]);

  // Cancelling their own order switches cash on delivery off for this customer: in checkout and in the API.
  expect(await codAllowed(page)).toBe(false);
  await addToCart(page);
  await page.goto('/cart');
  await expect(payCash(page)).toBeDisabled();
  await expect(main).toContainText(COD_OFF);
  await expect(payOnlineChoice(page)).toBeChecked();
  const cash = await api<{ error: string }>(page, '/api/orders', {
    method: 'POST',
    body: { method: 'cod', items: [{ slug: 'premium-roasted-talbeenah', variantId: '500g', qty: 1 }], customer: { ...WHO.tabassum, note: '' } },
  });
  expect(cash.status).toBe(403);
  book(order, 1, 1, 0);
  await admin.context().close();
});

test('6. two cancel requests at the same moment send exactly one Razorpay refund', async ({ page, context }) => {
  const order = await paidOrder(page, context, WHO.rizwan);
  const burst = await page.evaluate(
    (id) => Promise.all([0, 1, 2, 3].map(() => fetch(`/api/orders/${id}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then((r) => r.status))),
    order.id,
  );
  expect(burst.sort()).toEqual([200, 409, 409, 409]);
  await expectOneRazorpayRefund(order.razorpayPaymentId!, 299);

  const admin = await newAdmin(context);
  expect(await adminOrder(admin, order.id)).toMatchObject({ status: 'cancelled', payment: 'refunded', refund: { status: 'refunded', amount: 299 } });
  // Cancelling again, later, is refused and sends nothing more.
  expect((await api(page, `/api/orders/${order.id}/cancel`, { method: 'POST', body: {} })).status).toBe(409);
  await expectOneRazorpayRefund(order.razorpayPaymentId!, 299);
  book(order, 1, 1, 0);
  await admin.context().close();
});

test('8. the shop cancels a paid online order and refunds it in the same step; cash on delivery stays on', async ({ page, context }) => {
  const order = await paidOrder(page, context, WHO.nargis);
  const admin = await newAdmin(context);
  const before = await revenueToday(admin);
  await admin.goto('/admin/orders');
  await admin.getByLabel(`Status of ${order.number}`).selectOption('cancelled');
  const dialog = admin.getByRole('dialog');
  await expect(dialog).toContainText('already paid online');
  await expect(dialog.getByRole('checkbox')).toBeChecked();
  await dialog.getByRole('button', { name: 'Cancel order' }).click();
  await expect.poll(async () => (await adminOrder(admin, order.id)).payment).toBe('refunded');

  const saved = await adminOrder(admin, order.id);
  expect(saved).toMatchObject({ status: 'cancelled', cancelledBy: 'shop' });
  expect(saved.refund).toMatchObject({ status: 'refunded', amount: 299 });
  await expectOneRazorpayRefund(order.razorpayPaymentId!, 299);
  await expect(adminRow(admin, order.number)).toContainText('Refunded ₹299');
  expect(await revenueToday(admin)).toBe(before - 299);

  // The customer sees it was the shop, with the refund; cash on delivery is NOT switched off for them.
  await page.goto(`/orders/${order.id}`);
  await expect(page.locator('main')).toContainText('Cancelled by the shop');
  await expect(page.locator('main')).toContainText(/Refund of ₹299 sent/);
  expect(await codAllowed(page)).toBe(true);
  await addToCart(page);
  await page.goto('/cart');
  await expect(payCash(page)).toBeEnabled();
  book(order, 1, 1, 0);
  await admin.context().close();
});

test('9. customer cancels a cash on delivery order: nothing to refund, cash switched off (checkout and API)', async ({ page, context }) => {
  const order = await cashOrder(page, context, WHO.junaid.name, WHO.junaid.mobile);
  mine.emails.add(emailOf(WHO.junaid.name));
  mine.numbers.add(order.number);
  expect(await codAllowed(page)).toBe(true);
  await cancelInCustomerPage(page, order);
  const main = page.locator('main');
  await expect(main).toContainText('Cancelled by you');
  await expect(main).toContainText('Cash on delivery · nothing to pay');
  const saved = await myOrder(page, order.id);
  expect(saved).toMatchObject({ status: 'cancelled', cancelledBy: 'customer', payment: 'cod' });
  expect(saved.refund).toBeUndefined();

  expect(await codAllowed(page)).toBe(false);
  await addToCart(page);
  await page.goto('/cart');
  await expect(payCash(page)).toBeDisabled();
  await expect(main).toContainText(COD_OFF);
  await expect(payOnlineChoice(page)).toBeChecked();
  await expect(placeOrder(page)).toHaveCount(0);
  const refused = await api<{ error: string }>(page, '/api/orders', {
    method: 'POST',
    body: { method: 'cod', items: [{ slug: 'premium-roasted-talbeenah', variantId: '500g', qty: 1 }], customer: { ...WHO.junaid, note: '' } },
  });
  expect([refused.status, refused.data.error]).toEqual([403, COD_OFF]);
  book(order, 1, 0, 0);
});

/* ======================================================================================================== */
/* Refunds after delivery (rows 10–15)                                                                       */
/* ======================================================================================================== */

test.describe.serial('declined request and refused amounts', () => {
  let order: Order;
  let admin: Page;

  test('12. the shop declines a refund request with a reply: the customer reads it, Razorpay and revenue are untouched', async ({ page, context }) => {
    order = await paidOrder(page, context, WHO.sameera);
    admin = await newAdmin(context);
    expect((await setStatus(admin, order.id, 'delivered')).status).toBe(200);
    const before = await revenueToday(admin);

    await askForRefund(page, order, 'Other', 'I changed my mind about the quantity.');
    const row = await openInAdmin(admin, order);
    await expect(row).toContainText('I changed my mind about the quantity.');
    await row.getByRole('button', { name: 'Decline', exact: true }).click();
    await row.getByLabel('Your reply to the customer').fill('Opened food can only be refunded if it arrived damaged.');
    await row.getByRole('button', { name: 'Decline refund' }).click();
    await expect.poll(async () => (await adminOrder(admin, order.id)).refund?.status).toBe('declined');

    await page.goto(`/orders/${order.id}`);
    await expect(page.locator('main')).toContainText('Refund declined: Opened food can only be refunded if it arrived damaged.');
    await expect(page.locator('main')).toContainText('Paid online');
    expect(await adminOrder(admin, order.id)).toMatchObject({ payment: 'paid', status: 'delivered' });
    expect((await razorpayRefunds(order.razorpayPaymentId!)).count).toBe(0);
    expect(await revenueToday(admin)).toBe(before);
    // Nothing is waiting for the shop any more, and the customer can't ask again.
    expect((await api(page, `/api/orders/${order.id}/refund-request`, { method: 'POST', body: { reason: 'Other' } })).status).toBe(409);
  });

  test('13. a refund bigger than the order, ₹0, negative or not a whole number is refused', async () => {
    test.skip(!order, 'needs the order from row 12');
    const refund = (amount: unknown) => api<{ error: string }>(admin, `/api/admin/orders/${order.id}/refund`, { method: 'POST', body: { amount } });
    const tooMuch = await refund(300);
    expect([tooMuch.status, tooMuch.data.error]).toEqual([400, `The refund can’t be more than the order total (${formatINR(299)}).`]);
    for (const amount of [0, -50, 99.5, '100', null]) {
      const res = await refund(amount);
      expect(res.status, `amount ${JSON.stringify(amount)}`).toBe(400);
      expect(res.data.error).toBeTruthy();
    }
    expect((await api(admin, `/api/admin/orders/${order.id}/refund`, { method: 'POST', body: {} })).status).toBe(400);

    // The refund box doesn't let ₹0, ₹300 or 99.5 through either.
    const row = await openInAdmin(admin, order);
    await row.getByRole('button', { name: 'Refund', exact: true }).click();
    const amountField = row.getByLabel('Amount to refund (₹)');
    for (const typed of ['0', '300', '99.5', '']) {
      await amountField.fill(typed);
      await expect(row.getByRole('button', { name: /^Refund/ }).first()).toBeDisabled();
    }
    // Nothing happened at Razorpay or to the order; it is still a paid order that was declined.
    expect((await razorpayRefunds(order.razorpayPaymentId!)).count).toBe(0);
    expect(await adminOrder(admin, order.id)).toMatchObject({ payment: 'paid', refund: { status: 'declined' } });
    // Declined, paid, kept: it counts as a paid order and keeps its ₹299.
    book(order, 1, 1, 299);
    await admin.context().close();
  });
});

test.describe.serial('partial refund after delivery', () => {
  let order: Order;
  let admin: Page;
  let before = 0;
  const X = 120;

  test('10. delivered online order: the customer asks, the shop refunds ₹120 of ₹299; Razorpay sends exactly ₹120 and revenue drops by ₹120', async ({ page, context }) => {
    order = await paidOrder(page, context, WHO.asif);
    admin = await newAdmin(context);
    await admin.goto('/admin/orders');
    await admin.getByLabel(`Status of ${order.number}`).selectOption('delivered');
    await expect.poll(async () => (await adminOrder(admin, order.id)).status).toBe('delivered');
    await askForRefund(page, order);
    before = await revenueToday(admin);

    const row = await openInAdmin(admin, order);
    await expect(row).toContainText('The pouch was torn');
    await refundInAdmin(row, X);
    await expect.poll(async () => (await adminOrder(admin, order.id)).refund?.status).toBe('refunded');

    const saved = await adminOrder(admin, order.id);
    expect(saved.refund).toMatchObject({ status: 'refunded', amount: X });
    expect(saved.refund?.razorpayRefundId).toMatch(/^rfnd_/);
    await expectOneRazorpayRefund(order.razorpayPaymentId!, X);
    expect(await revenueToday(admin)).toBe(before - X);

    // The shop's list shows the part that went back; the customer sees ₹120 refunded, not a plain "Refunded".
    await admin.goto('/admin/orders');
    await expect(adminRow(admin, order.number)).toContainText(`Refunded ${formatINR(X)} of ${formatINR(299)}`);
    await page.goto(`/orders/${order.id}`);
    const main = page.locator('main');
    await expect(main).toContainText(`${formatINR(X)} refunded`);
    await expect(main).toContainText(`Refund of ${formatINR(X)} sent`);
    await expect(main.getByText('Refunded', { exact: true })).toHaveCount(0);
    await expect(main.getByRole('button', { name: 'Request a refund' })).toHaveCount(0);
    await page.goto('/orders');
    await expect(page.getByRole('region', { name: 'Order history' })).toContainText(`Refund of ${formatINR(X)} sent`);
    book(order, 1, 1, 299 - X);
  });

  test('14. a second refund on the part-refunded order is refused with a clear message, in the API and in the shop’s page', async () => {
    test.skip(!order, 'needs the order from row 10');
    const second = await api<{ error: string }>(admin, `/api/admin/orders/${order.id}/refund`, { method: 'POST', body: { amount: 50 } });
    expect(second.status).toBe(409);
    expect(second.data.error).toBe(`${formatINR(X)} of ${formatINR(299)} has already been refunded, and an order can only be refunded once.`);
    const same = await api(admin, `/api/admin/orders/${order.id}/refund`, { method: 'POST', body: { amount: X } });
    expect(same.status).toBe(409);

    // The shop's order page says what was refunded and that the rest can't be sent later; there is no Refund button.
    const row = await openInAdmin(admin, order);
    await expect(row).toContainText(`Refunded ${formatINR(X)} of ${formatINR(299)}`);
    await expect(row).toContainText(`the other ${formatINR(299 - X)} can’t be refunded later`);
    await expect(row.getByRole('button', { name: /^(Refund|Try refund again)$/ })).toHaveCount(0);
    await expectOneRazorpayRefund(order.razorpayPaymentId!, X);
    expect(await revenueToday(admin)).toBe(before - X);
    await admin.context().close();
  });
});

test('11. a full refund after delivery: Razorpay sends the whole ₹299 and revenue drops by the total', async ({ page, context }) => {
  const order = await paidOrder(page, context, WHO.farida);
  const admin = await newAdmin(context);
  expect((await setStatus(admin, order.id, 'delivered')).status).toBe(200);
  const before = await stats(admin);

  const row = await openInAdmin(admin, order);
  await row.getByRole('button', { name: 'Refund', exact: true }).click();
  await expect(row.getByLabel('Amount to refund (₹)')).toHaveValue('299');
  await refundInAdmin(row, 299);
  await expect.poll(async () => (await adminOrder(admin, order.id)).payment).toBe('refunded');

  const saved = await adminOrder(admin, order.id);
  expect(saved.refund).toMatchObject({ status: 'refunded', amount: 299 });
  await expectOneRazorpayRefund(order.razorpayPaymentId!, 299);
  const after = await stats(admin);
  expect([after.orders - before.orders, after.paidOrders - before.paidOrders, after.revenue - before.revenue]).toEqual([0, 0, -299]);

  await admin.goto('/admin/orders');
  await expect(adminRow(admin, order.number)).toContainText('Refunded ₹299');
  await expect(adminRow(admin, order.number)).not.toContainText(' of ₹299');
  await page.goto(`/orders/${order.id}`);
  await expect(page.locator('main')).toContainText('Refunded');
  await expect(page.locator('main')).toContainText(/Refund of ₹299 sent/);
  book(order, 1, 1, 0);
  await admin.context().close();
});

test('15. Razorpay refuses a refund: it is saved as failed, the order stays paid, and the retry works once the payment id is right', async ({ page, context }) => {
  const order = await paidOrder(page, context, WHO.salim);
  const realId = order.razorpayPaymentId!;
  const admin = await newAdmin(context);
  expect((await setStatus(admin, order.id, 'delivered')).status).toBe(200);
  const orders = (await testDb()).collection('orders');
  const usePaymentId = (id: string) => orders.updateOne({ _id: new mongoose.Types.ObjectId(order.id) }, { $set: { razorpayPaymentId: id } });
  const before = await revenueToday(admin);
  const Y = 150;

  // The order points at a payment Razorpay has never heard of.
  await usePaymentId('pay_NoSuchPayment0001');
  const row = await openInAdmin(admin, order);
  await refundInAdmin(row, Y);
  await expect(row.getByRole('alert')).toBeVisible();
  await expect(row).toContainText('Refund failed');
  const failed = await adminOrder(admin, order.id);
  expect(failed.payment).toBe('paid');
  expect(failed.refund).toMatchObject({ status: 'failed', amount: Y });
  expect(failed.refund?.razorpayRefundId).toBeUndefined();
  expect((await razorpayRefunds(realId)).count).toBe(0);
  expect(await revenueToday(admin)).toBe(before);
  // The shop is told something needs it, and the customer is told it is being retried.
  expect((await api<{ count: number }>(admin, '/api/admin/orders/attention')).data.count).toBeGreaterThan(0);
  await page.goto(`/orders/${order.id}`);
  await expect(page.locator('main')).toContainText('Your refund is being retried.');
  expect(await adminOrder(admin, order.id)).toMatchObject({ payment: 'paid' });

  // The id is fixed; "Try refund again" sends it.
  await usePaymentId(realId);
  await admin.reload();
  const again = adminRow(admin, order.number);
  await again.getByRole('button', { name: 'Show details' }).click();
  await refundInAdmin(again, Y);
  await expect.poll(async () => (await adminOrder(admin, order.id)).refund?.status).toBe('refunded');
  const done = await adminOrder(admin, order.id);
  expect(done).toMatchObject({ payment: 'refunded', refund: { status: 'refunded', amount: Y } });
  await expectOneRazorpayRefund(realId, Y);
  expect(await revenueToday(admin)).toBe(before - Y);
  await page.reload();
  await expect(page.locator('main')).toContainText(`Refund of ${formatINR(Y)} sent`);
  book(order, 1, 1, 299 - Y);
  await admin.context().close();
});

test('6b. the shop’s refund pressed several times at the same moment (two tabs, a retry) reaches Razorpay once', async ({ page, context }) => {
  const order = await paidOrder(page, context, WHO.hina);
  const admin = await newAdmin(context);
  expect((await setStatus(admin, order.id, 'delivered')).status).toBe(200);
  const refund = () => api(admin, `/api/admin/orders/${order.id}/refund`, { method: 'POST', body: { amount: 100 } });
  const results = await Promise.all([refund(), refund(), refund()]);
  expect(results.map((r) => r.status).sort()).toEqual([200, 409, 409]);
  await expectOneRazorpayRefund(order.razorpayPaymentId!, 100);
  expect(await adminOrder(admin, order.id)).toMatchObject({ payment: 'refunded', refund: { status: 'refunded', amount: 100 } });
  book(order, 1, 1, 299 - 100);
  await admin.context().close();
});

test('6c. a payment that lands after the shop cancelled the order is sent straight back', async ({ page, context }) => {
  await startCheckout(page, context, WHO.wasim);
  await payButton(page).click();
  // The Razorpay window is open (the order is saved but unpaid) when the shop cancels it.
  const frame = page.frameLocator('iframe.razorpay-checkout-frame');
  await frame.locator('[data-testid=checkout-close]').waitFor({ timeout: 30_000 });
  const admin = await newAdmin(context);
  const pending = (await api<{ orders: Order[] }>(admin, '/api/admin/orders')).data.orders.find((o) => o.customer.name === WHO.wasim.name)!;
  mine.numbers.add(pending.number);
  expect(pending.payment).toBe('pending');
  expect((await setStatus(admin, pending.id, 'cancelled')).status).toBe(200);

  // …and the customer pays anyway.
  await payWithTestBank(page, 'Success');
  await expect.poll(async () => (await adminOrder(admin, pending.id)).payment, { timeout: 45_000 }).toBe('refunded');
  const saved = await adminOrder(admin, pending.id);
  expect(saved).toMatchObject({ status: 'cancelled', cancelledBy: 'shop', refund: { status: 'refunded', amount: 299, reason: 'Paid after the order was cancelled' } });
  await expectOneRazorpayRefund(saved.razorpayPaymentId!, 299);
  book(pending, 1, 1, 0);
  await admin.context().close();
});

/* ======================================================================================================== */
/* Cash on delivery (rows 17–20)                                                                             */
/* ======================================================================================================== */

test('17. cash on delivery: Delivered means "Paid in cash" and adds the total; "Mark cash received" does the same without a status change', async ({ page, context }) => {
  const delivered = await cashOrder(page, context, WHO.mehnaz.name, WHO.mehnaz.mobile);
  mine.emails.add(emailOf(WHO.mehnaz.name));
  mine.numbers.add(delivered.number);
  const received = await apiCashOrder(page, context, WHO.danish);
  const admin = await newAdmin(context);
  const start = await stats(admin);
  expect(start.paidOrders).toBeGreaterThanOrEqual(0);
  await admin.goto('/admin/orders');

  // Delivered settles the cash.
  await expect(adminRow(admin, delivered.number)).toContainText(`Cash on delivery — collect ${formatINR(delivered.total)}`);
  await admin.getByLabel(`Status of ${delivered.number}`).selectOption('delivered');
  await expect(adminRow(admin, delivered.number)).toContainText('Paid in cash');
  await expect.poll(async () => (await adminOrder(admin, delivered.id)).payment).toBe('paid');
  expect(await adminOrder(admin, delivered.id)).toMatchObject({ method: 'cod', payment: 'paid', status: 'delivered' });
  const afterDelivered = await stats(admin);
  expect([afterDelivered.paidOrders - start.paidOrders, afterDelivered.revenue - start.revenue]).toEqual([1, delivered.total]);

  // "Mark cash received" while the order is still Confirmed: paid, status untouched.
  await admin.getByLabel(`Status of ${received.number}`).selectOption('confirmed');
  const row = adminRow(admin, received.number);
  await row.getByRole('button', { name: 'Show details' }).click();
  await row.getByRole('button', { name: 'Mark cash received' }).click();
  await expect(row).toContainText('Paid in cash');
  const saved = await adminOrder(admin, received.id);
  expect(saved).toMatchObject({ method: 'cod', payment: 'paid', status: 'confirmed' });
  expect(saved.deliveredAt).toBeUndefined();
  const afterCash = await stats(admin);
  expect([afterCash.paidOrders - afterDelivered.paidOrders, afterCash.revenue - afterDelivered.revenue]).toEqual([1, received.total]);

  // Delivering it later, or pressing the cash button again, never counts the money twice.
  await admin.getByLabel(`Status of ${received.number}`).selectOption('delivered');
  await expect.poll(async () => (await adminOrder(admin, received.id)).status).toBe('delivered');
  expect((await api(admin, `/api/admin/orders/${received.id}/cash`, { method: 'POST' })).status).toBe(200);
  expect((await stats(admin)).revenue).toBe(afterCash.revenue);

  // The customer sees the same in plain words; no Razorpay anywhere.
  await page.goto(`/orders/${received.id}`);
  await expect(page.locator('main')).toContainText('Paid in cash');
  await expect(page.locator('main')).not.toContainText(/razorpay|paid online/i);
  expect(saved.razorpayPaymentId).toBeUndefined();
  book(delivered, 1, 1, delivered.total);
  book(received, 1, 1, received.total);
  await admin.context().close();
});

test('18. cash on delivery, delivered: the customer asks for a refund and the shop records ₹100 by hand, with no Razorpay call and revenue down by ₹100', async ({ page, context }) => {
  const order = await apiCashOrder(page, context, WHO.mehnaz);
  const admin = await newAdmin(context);
  expect((await setStatus(admin, order.id, 'delivered')).status).toBe(200);
  const before = await revenueToday(admin);
  await askForRefund(page, order);

  const row = await openInAdmin(admin, order);
  await expect(row).toContainText('Cash on delivery: pay this back by cash or UPI, then press Refund to record it.');
  await refundInAdmin(row, 100);
  await expect.poll(async () => (await adminOrder(admin, order.id)).refund?.status).toBe('refunded');

  const saved = await adminOrder(admin, order.id);
  expect(saved).toMatchObject({ method: 'cod', payment: 'refunded', refund: { status: 'refunded', amount: 100, by: 'hand' } });
  expect(saved.refund?.razorpayRefundId).toBeUndefined();
  expect(saved.razorpayPaymentId).toBeUndefined();
  expect(await revenueToday(admin)).toBe(before - 100);
  await expect(adminRow(admin, order.number)).toContainText(`Refunded ${formatINR(100)} of ${formatINR(order.total)}`);

  await page.goto(`/orders/${order.id}`);
  await expect(page.locator('main')).toContainText(`${formatINR(100)} refunded`);
  await expect(page.locator('main')).toContainText('We paid it back to you directly');
  await expect(page.locator('main')).not.toContainText(/razorpay/i);
  expect((await api(admin, `/api/admin/orders/${order.id}/refund`, { method: 'POST', body: { amount: 50 } })).status).toBe(409);
  book(order, 1, 1, order.total - 100);
  await admin.context().close();
});

test('19. the shop cancels a cash order whose cash was already received: the refund box records it by hand', async ({ page, context }) => {
  const order = await apiCashOrder(page, context, WHO.farhan);
  const admin = await newAdmin(context);
  expect((await api(admin, `/api/admin/orders/${order.id}/cash`, { method: 'POST' })).status).toBe(200);
  const before = await revenueToday(admin);

  await admin.goto('/admin/orders');
  await admin.getByLabel(`Status of ${order.number}`).selectOption('cancelled');
  const dialog = admin.getByRole('dialog');
  await expect(dialog).toContainText('already paid in cash');
  await expect(dialog.getByRole('checkbox')).toBeChecked();
  await dialog.getByRole('button', { name: 'Cancel order' }).click();
  await expect.poll(async () => (await adminOrder(admin, order.id)).payment).toBe('refunded');

  const saved = await adminOrder(admin, order.id);
  expect(saved).toMatchObject({ status: 'cancelled', cancelledBy: 'shop', refund: { status: 'refunded', amount: order.total, by: 'hand' } });
  expect(saved.refund?.razorpayRefundId).toBeUndefined();
  expect(await revenueToday(admin)).toBe(before - order.total);
  await expect(adminRow(admin, order.number)).toContainText(`Refunded ${formatINR(order.total)}`);
  // A shop cancel doesn't switch cash off for the customer.
  expect(await codAllowed(page)).toBe(true);
  book(order, 1, 1, 0);
  await admin.context().close();
});

test('20. a customer cancelling a cash order that was already paid in cash: the shop is asked to pay it back; once delivered it can’t be cancelled at all', async ({ page, context }) => {
  // Both orders are placed first: after cancelling one, cash on delivery is off for this customer.
  const order = await apiCashOrder(page, context, WHO.irfan);
  const delivered = await apiCashOrder(page, context, WHO.irfan);
  const admin = await newAdmin(context);
  await setStatus(admin, order.id, 'confirmed');
  expect((await api(admin, `/api/admin/orders/${order.id}/cash`, { method: 'POST' })).status).toBe(200);
  const before = await revenueToday(admin);

  // The customer is told what will happen, then cancels.
  await page.goto(`/orders/${order.id}`);
  await page.getByRole('button', { name: 'Cancel order' }).click();
  await expect(page.getByRole('dialog')).toContainText('You’ve already paid in cash');
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, cancel my order' }).click();
  const main = page.locator('main');
  await expect(main).toContainText('Cancelled by you');
  await expect(main).toContainText('Refund requested');
  expect(await codAllowed(page)).toBe(false);

  // The shop sees a refund waiting for it (not a silently cancelled order that still counts as money kept).
  const waiting = await adminOrder(admin, order.id);
  expect(waiting).toMatchObject({ status: 'cancelled', cancelledBy: 'customer', payment: 'paid', refund: { status: 'requested', amount: order.total, reason: 'Cancelled by customer' } });
  expect((await api<{ count: number }>(admin, '/api/admin/orders/attention')).data.count).toBeGreaterThan(0);
  const row = await openInAdmin(admin, order);
  await expect(row).toContainText('Refund requested');
  expect(await revenueToday(admin)).toBe(before);

  // The shop pays the cash back and records it.
  await refundInAdmin(row, order.total);
  await expect.poll(async () => (await adminOrder(admin, order.id)).payment).toBe('refunded');
  expect((await adminOrder(admin, order.id)).refund).toMatchObject({ status: 'refunded', amount: order.total, by: 'hand' });
  expect(await revenueToday(admin)).toBe(before - order.total);
  await page.reload();
  await expect(main).toContainText(`${formatINR(order.total)} refunded`);
  book(order, 1, 1, 0);

  // Delivered (cash collected on arrival) can't be cancelled by the customer.
  await setStatus(admin, delivered.id, 'delivered');
  const refused = await api<{ error: string }>(page, `/api/orders/${delivered.id}/cancel`, { method: 'POST', body: {} });
  expect([refused.status, refused.data.error]).toEqual([409, TOO_LATE]);
  await page.goto(`/orders/${delivered.id}`);
  await expect(page.getByRole('button', { name: 'Cancel order' })).toHaveCount(0);
  expect(await adminOrder(admin, delivered.id)).toMatchObject({ status: 'delivered', payment: 'paid' });
  book(delivered, 1, 1, delivered.total);
  await admin.context().close();
});

/* ======================================================================================================== */
/* The dashboard (row 21)                                                                                    */
/* ======================================================================================================== */

test('21. after all of the above, the dashboard’s Orders, paid and Revenue equal the hand count of the orders made here', async ({ page }) => {
  const want = ledger.reduce((s, o) => ({ orders: s.orders + o.orders, paid: s.paid + o.paid, revenue: s.revenue + o.revenue }), { orders: 0, paid: 0, revenue: 0 });
  expect(ledger.length).toBeGreaterThan(15);

  await adminLogin(page);
  const now = await stats(page);
  expect({ orders: now.orders - base.orders, paid: now.paidOrders - base.paidOrders, revenue: now.revenue - base.revenue }, JSON.stringify(ledger)).toEqual(want);

  // And that is what the shop reads on the Dashboard tiles ("paid of all placed" and "money received").
  await page.reload();
  const main = page.locator('main');
  await expect(main).toContainText(`${now.paidOrders} of ${now.orders}`);
  await expect(main).toContainText(formatINR(now.revenue));
});
