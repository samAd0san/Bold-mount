import { expect, test, type Browser, type Page } from '@playwright/test';
import { acceptCookies, adminLogin, api, CUSTOMER, fillCheckout, overflowing, payWithTestBank, signInAs, testDb } from './helpers';
import type { AdminStats } from '../lib/server/admin-stats';
import type { Order } from '../lib/types';

// Real browsers with real user-agents: the stats ignore Playwright's default "HeadlessChrome" as a bot.
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const PIXEL = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const PHONE_SIZE = { width: 390, height: 844 };
const stats = async (page: Page) => (await api<AdminStats>(page, '/api/admin/stats?period=today')).data;
const panel = (page: Page, title: string) => page.locator('section').filter({ has: page.getByRole('heading', { name: title }) });
// Waits for the page's tracking note to reach the server, so the steps are saved in the order they happened.
const tracked = async (page: Page, act: () => Promise<unknown>) => {
  const note = page.waitForResponse((r) => r.url().endsWith('/api/track'));
  await act();
  await note;
};
const open = (page: Page, url: string, referer?: string) => tracked(page, () => page.goto(url, referer ? { referer } : undefined));
const customer = (name: string) => ({ ...CUSTOMER, name });
const inr = (v: number) => `₹${v.toLocaleString('en-IN')}`;
// One tappable row per visitor on the Visitors page.
const visitorRows = (page: Page) => page.getByRole('list', { name: 'Visitors' }).getByRole('button');

/** The step texts of the open journey, without the clock times. */
async function steps(page: Page) {
  const items = page.getByRole('dialog').locator('ol li');
  await expect(items.first()).toBeVisible();
  return (await items.allInnerTexts()).map((t) => t.split('\n').map((s) => s.trim()).filter(Boolean)[1]);
}

test.describe.serial('visitor analytics', () => {
  const placed = {} as { imran: Order; ayesha: Order };

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(240_000);
    // Only these visitors should be in today's numbers.
    await (await testDb()).collection('visits').deleteMany({});

    const who = async (b: Browser, userAgent: string, viewport = { width: 1280, height: 800 }) => {
      const context = await b.newContext({ userAgent, viewport });
      // Only visitors who pressed OK on the cookie notice are counted.
      await acceptCookies(context);
      return { context, page: await context.newPage() };
    };

    // 1. Imran: from a WhatsApp link, a search that finds nothing, a product, the cart, and a paid order.
    {
      const { context, page } = await who(browser, DESKTOP);
      await signInAs(context, { name: 'Imran Siddiqui', email: 'imran.siddiqui@example.com' });
      await open(page, '/?utm_source=whatsapp&utm_medium=social&utm_campaign=eid-sale', 'https://l.wl.co/');
      await tracked(page, async () => {
        await page.locator('input[type=search]:visible').fill('Zafran');
        await page.keyboard.press('Enter');
      });
      await open(page, '/dates');
      await open(page, '/product/ajwa-dates');
      await tracked(page, () => page.getByRole('button', { name: 'Add to cart' }).first().click());
      await tracked(page, () => page.getByRole('link', { name: 'Checkout' }).click());
      await fillCheckout(page, customer('Imran Siddiqui'));
      await page.getByRole('button', { name: /^Pay ₹/ }).click();
      await payWithTestBank(page, 'Success');
      await expect(page.getByText('Payment received')).toBeVisible({ timeout: 45_000 });
      placed.imran = (await api<{ orders: Order[] }>(page, '/api/orders/mine')).data.orders[0];
      await context.close();
    }

    // 2. Ayesha: from Instagram on her phone; reaches checkout and places an order but does not pay.
    {
      const { context, page } = await who(browser, IPHONE, PHONE_SIZE);
      await signInAs(context, { name: 'Ayesha Khan', email: 'ayesha.khan@example.com' });
      await open(page, '/', 'https://l.instagram.com/');
      await open(page, '/product/pure-sidr-honey');
      await tracked(page, () => page.getByRole('button', { name: 'Add to cart' }).first().click());
      await tracked(page, () => page.getByRole('link', { name: 'Checkout' }).click());
      const honey = (await (await page.request.get('/api/catalog')).json()).products.find((p: { slug: string }) => p.slug === 'pure-sidr-honey');
      const res = await api<{ order: Order }>(page, '/api/orders', {
        method: 'POST',
        body: { method: 'online', items: [{ slug: 'pure-sidr-honey', variantId: honey.variants[0].id, qty: 1 }], customer: customer('Ayesha Khan') },
      });
      expect(res.status).toBe(201);
      placed.ayesha = res.data.order;
      await context.close();
    }

    // 3. Someone from Google on an Android phone: searches for dates and opens one.
    {
      const { context, page } = await who(browser, PIXEL, PHONE_SIZE);
      await open(page, '/', 'https://www.google.com/');
      await open(page, '/shop?q=dates');
      await open(page, '/product/ajwa-dates');
      await context.close();
    }

    // 4. A reader from another website, on a computer.
    {
      const { context, page } = await who(browser, DESKTOP);
      await open(page, '/about', 'https://www.dua-corner.example.in/ramzan-gifts');
      await open(page, '/faq');
      await context.close();
    }

    // 5. Someone who typed the address on a tablet.
    {
      const { context, page } = await who(browser, IPAD, { width: 820, height: 1180 });
      await open(page, '/');
      await open(page, '/policies/shipping');
      await context.close();
    }
  });

  // Later specs read today's revenue and orders, so take this spec's orders and visits back out.
  test.afterAll(async () => {
    const d = await testDb();
    await d.collection('orders').deleteMany({ number: { $in: [placed.imran?.number, placed.ayesha?.number].filter(Boolean) } });
    await d.collection('visits').deleteMany({});
  });

  test('the dashboard speaks plain words: page names, sources, searches and the visit-to-order funnel', async ({ page }) => {
    await adminLogin(page);
    await expect.poll(async () => (await stats(page)).visitors).toBe(5);

    const s = await stats(page);
    expect(s.funnel).toEqual({ visitors: 5, looked: 3, carted: 2, checkout: 2, placed: 2, paid: 1 });
    expect(s.pagesOpened).toBe(15);
    expect(s.noResults).toEqual([{ term: 'zafran', times: 1 }]);

    await page.reload();
    const main = page.locator('main');
    for (const tile of ['Visitors', 'Pages opened', 'Orders', 'Revenue', 'Sign-ups', 'Active now']) await expect(main).toContainText(tile);
    await expect(main).not.toContainText('Page views');
    await page.getByRole('button', { name: 'What Orders counts' }).click();
    await expect(page.getByRole('tooltip')).toContainText('cash on delivery');
    await expect(page.getByRole('tooltip')).not.toContainText('WhatsApp');
    await page.keyboard.press('Escape');

    // The owner's sentence, in words.
    await expect(page.getByText(/^Of 5 visitors:/)).toHaveText('Of 5 visitors: 3 looked at a product → 2 added to cart → 2 reached checkout → 2 placed an order → 1 paid');

    // Page names: plain labels first, the path only as a small grey line.
    const pages = panel(page, 'Most visited pages');
    for (const name of ['Home page', 'Shop', 'Cart', 'Premium Dates', 'Ajwa Dates — Madinah Premium', 'Pure Sidr Honey', 'About us', 'FAQ', 'Delivery & Returns']) {
      await expect(pages.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(pages.getByText('/product/ajwa-dates', { exact: true })).toBeVisible();
    await expect(pages.getByText('Tracking an order')).toHaveCount(0);

    // Where visitors came from, grouped.
    const sources = panel(page, 'Where visitors came from');
    for (const name of ['WhatsApp', 'Instagram', 'Google', 'dua-corner.example.in', 'Typed the address / saved link']) await expect(sources.getByText(name, { exact: true })).toBeVisible();
    await expect(sources.getByText('Other website')).toBeVisible();
    await expect(sources.getByText('20%')).toHaveCount(5);

    // Searches, and the highlighted list of words that found nothing.
    const searched = panel(page, 'What people searched for');
    await expect(searched).toContainText('‘zafran’');
    await expect(searched).toContainText('Found nothing');
    await expect(searched).toContainText('‘dates’');
    await expect(searched).toContainText(/\d+ products found/);
    const missing = panel(page, 'People searched for these but found nothing');
    await expect(missing).toContainText('‘zafran’');
    await expect(missing).not.toContainText('‘dates’');

    await expect(panel(page, 'Most viewed products')).toContainText('Ajwa Dates — Madinah Premium');
    await expect(panel(page, 'Devices')).toContainText('Computer');
    await expect(panel(page, 'Devices')).toContainText('Phone');
    await expect(panel(page, 'Devices')).toContainText('Tablet');
    await expect(panel(page, 'Busiest time of day')).toContainText('Busiest hour');
    // A single day has no day-by-day chart.
    await expect(page.getByRole('heading', { name: /Visitors each day/ })).toHaveCount(0);

    // Every card explains itself with an "i".
    await page.getByRole('button', { name: 'What is “Where visitors came from”?' }).click();
    await expect(page.getByRole('tooltip')).toContainText('utm_source=whatsapp');
  });

  test('Visitors page lists each person newest first, and a tap shows their journey step by step', async ({ page }) => {
    await adminLogin(page);
    await page.getByRole('navigation', { name: 'Admin sections' }).getByRole('link', { name: 'Visitors' }).click();
    await expect(page).toHaveURL(/\/admin\/visitors$/);
    await expect(page.getByText('5 visitors today')).toBeVisible();

    const rows = visitorRows(page);
    await expect(rows).toHaveCount(5);
    // Newest first; signed-in people show their name, the rest are numbered in order of arrival.
    await expect(rows).toContainText(['Visitor 5', 'Visitor 4', 'Visitor 3', 'Ayesha Khan', 'Imran Siddiqui']);
    await expect(page.locator('main')).not.toContainText(/[0-9a-f]{8}-[0-9a-f]{4}-/);

    const row = (name: string) => rows.filter({ hasText: name });
    await expect(row('Imran Siddiqui')).toContainText('Paid ' + placed.imran.number);
    await expect(row('Imran Siddiqui')).toContainText('Computer');
    await expect(row('Imran Siddiqui')).toContainText('From WhatsApp');
    await expect(row('Imran Siddiqui')).toContainText('5 pages opened');
    await expect(row('Ayesha Khan')).toContainText('Placed order ' + placed.ayesha.number);
    await expect(row('Ayesha Khan')).toContainText('Phone');
    await expect(row('Ayesha Khan')).toContainText('From Instagram');
    await expect(row('Visitor 3')).toContainText('Just looked');
    await expect(row('Visitor 3')).toContainText('From Google');
    await expect(row('Visitor 4')).toContainText('From dua-corner.example.in');
    await expect(row('Visitor 5')).toContainText('Tablet');
    await expect(row('Visitor 5')).toContainText('Typed the address / saved link');
    await expect(row('Visitor 5')).toContainText('last page: Delivery & Returns');

    await row('Imran Siddiqui').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Imran Siddiqui' })).toBeVisible();
    expect(await steps(page)).toEqual([
      'Came from WhatsApp',
      'Home page',
      'Searched: ‘zafran’',
      'Premium Dates',
      'Ajwa Dates — Madinah Premium',
      'Added Ajwa Dates — Madinah Premium to cart',
      'Cart',
      'Reached checkout',
      `Placed order ${placed.imran.number}`,
      `Paid ${inr(placed.imran.total)}`,
    ]);
    await expect(dialog).toContainText('Campaign: eid-sale');
    await expect(dialog).toContainText('Found nothing');
    await expect(dialog).toContainText('/product/ajwa-dates');
    await page.keyboard.press('Escape');

    await row('Ayesha Khan').click();
    expect(await steps(page)).toEqual([
      'Came from Instagram',
      'Home page',
      'Pure Sidr Honey',
      'Added Pure Sidr Honey to cart',
      'Cart',
      'Reached checkout',
      `Placed order ${placed.ayesha.number}`,
    ]);
    await page.keyboard.press('Escape');

    await row('Visitor 5').click();
    expect(await steps(page)).toEqual(['Typed the address or opened a saved link', 'Home page', 'Delivery & Returns']);
  });

  test('a cash-style order counts as paid once its payment becomes paid', async ({ page }) => {
    await adminLogin(page);
    expect((await stats(page)).funnel.paid).toBe(1);
    await (await testDb()).collection('orders').updateOne({ number: placed.ayesha.number }, { $set: { payment: 'paid', paidAt: new Date() } });
    expect((await stats(page)).funnel).toMatchObject({ placed: 2, paid: 2 });

    await page.goto('/admin/visitors');
    const ayesha = visitorRows(page).filter({ hasText: 'Ayesha Khan' });
    await expect(ayesha).toContainText('Paid ' + placed.ayesha.number);
    await ayesha.click();
    expect((await steps(page)).slice(-2)).toEqual([`Placed order ${placed.ayesha.number}`, `Paid ${inr(placed.ayesha.total)}`]);
    await page.keyboard.press('Escape');

    // And a failed payment is not an order.
    await (await testDb()).collection('orders').updateOne({ number: placed.ayesha.number }, { $set: { payment: 'failed' } });
    expect((await stats(page)).funnel).toMatchObject({ placed: 1, paid: 1 });
    await page.reload();
    await expect(visitorRows(page).filter({ hasText: 'Ayesha Khan' })).toContainText('Payment didn’t go through');
  });

  test('a cancelled and refunded order is named as cancelled, not paid, and the journey shows both steps', async ({ page }) => {
    await adminLogin(page);
    const at = Date.now();
    await (await testDb()).collection('orders').updateOne({ number: placed.imran.number }, {
      $set: {
        status: 'cancelled', cancelledAt: new Date(at), cancelledBy: 'customer', payment: 'refunded',
        refund: { status: 'refunded', reason: 'Cancelled by customer', amount: placed.imran.total, requestedAt: new Date(at), updatedAt: new Date(at + 1000) },
      },
    });
    await page.goto('/admin/visitors');
    const imran = visitorRows(page).filter({ hasText: 'Imran Siddiqui' });
    await expect(imran).toContainText('Cancelled order ' + placed.imran.number);
    await expect(imran).not.toContainText('Paid ' + placed.imran.number);
    await imran.click();
    expect((await steps(page)).slice(-3)).toEqual([`Paid ${inr(placed.imran.total)}`, `Cancelled ${placed.imran.number}`, `Refunded ${inr(placed.imran.total)}`]);
    await expect(page.getByRole('dialog')).toContainText('by the customer');
  });

  test('the owner, bots and other sites are not counted, and nothing personal is stored', async ({ page, request }) => {
    await acceptCookies(page.context());
    await adminLogin(page);
    const before = await stats(page);

    // The owner browsing the shop while signed in to the admin.
    await open(page, '/');
    await open(page, '/product/ajwa-dates');
    // A search engine robot, and a note from another website.
    const note = { path: '/', land: { host: 'bing.com' } };
    const consent = 'bm_consent=yes';
    expect((await request.post('/api/track', { data: note, headers: { 'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)', cookie: consent } })).status()).toBe(204);
    expect((await request.post('/api/track', { data: note, headers: { 'user-agent': DESKTOP, 'sec-fetch-site': 'cross-site', cookie: consent } })).status()).toBe(204);
    expect((await request.post('/api/track', { data: { path: '/admin/orders' }, headers: { 'user-agent': DESKTOP, cookie: consent } })).status()).toBe(204);
    await page.waitForTimeout(1500);

    const after = await stats(page);
    expect(after.visitors).toBe(before.visitors);
    expect(after.pagesOpened).toBe(before.pagesOpened);
    expect(after.sources.some((x) => x.label === 'bing.com')).toBe(false);

    // What is saved: only the fields described in the privacy policy, and referrers are just a site name.
    const saved = await (await testDb()).collection('visits').find({}).toArray();
    const allowed = new Set(['_id', 'vid', 'path', 'device', 'ts', 'ev', 'uid', 'q', 'n', 'src', 'host', 'utm', 'slug', 'order']);
    for (const v of saved) {
      expect(Object.keys(v).filter((k) => !allowed.has(k)), JSON.stringify(v)).toEqual([]);
      if (v.host) expect(v.host).not.toMatch(/[/:?]/);
      expect(v.path).not.toMatch(/[?#]/);
    }
    expect(saved.some((v) => v.src === 'whatsapp' && v.utm?.campaign === 'eid-sale')).toBe(true);

    await page.goto('/policies/privacy');
    await expect(page.locator('main')).toContainText('Visits to this website');
    await expect(page.locator('main')).toContainText('We do not store your IP address');
  });

  for (const [name, size] of [['phone', { width: 390, height: 844 }], ['tablet', { width: 768, height: 1024 }]] as const) {
    test(`dashboard and Visitors page fit the ${name} screen, journey included`, async ({ page }) => {
      await page.setViewportSize(size);
      await adminLogin(page);
      await expect(page.getByText(/^Of 5 visitors:/)).toBeVisible();
      expect(await overflowing(page)).toEqual([]);
      await page.goto('/admin/visitors');
      await expect(visitorRows(page).first()).toBeVisible();
      expect(await overflowing(page)).toEqual([]);
      await visitorRows(page).filter({ hasText: 'Imran Siddiqui' }).click();
      await expect(page.getByRole('dialog').locator('ol li').first()).toBeVisible();
      expect(await overflowing(page)).toEqual([]);
    });
  }
});
