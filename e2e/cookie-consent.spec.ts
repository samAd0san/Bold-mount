import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { adminLogin, api, overflowing, signInAs, testDb } from './helpers';

// A real-looking user-agent: the stats ignore Playwright's default "HeadlessChrome" as a bot.
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const NOTE = 'Accept cookies?';
const COUNTED = 'Only visitors who pressed OK on the cookie notice are counted.';

const notice = (page: Page) => page.getByRole('region', { name: 'Cookie notice' });
const ok = (page: Page) => notice(page).getByRole('button', { name: 'OK', exact: true });
const noThanks = (page: Page) => notice(page).getByRole('button', { name: 'No thanks', exact: true });
// Oldest first: saving is asynchronous, so the order the rows were stored in is not reliable.
const saved = async (vid?: string) => (await testDb()).collection('visits').find(vid ? { vid } : {}).sort({ ts: 1 }).toArray();
const cookie = async (context: BrowserContext, name: string) => (await context.cookies()).find((c) => c.name === name);
const trackCalls = (page: Page) => {
  const calls: string[] = [];
  page.on('request', (r) => r.url().includes('/api/track') && calls.push(r.method()));
  return calls;
};
const tracked = (page: Page) => page.waitForResponse((r) => r.url().endsWith('/api/track'));
const overlap = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

async function visitor(browser: Browser, viewport = { width: 1280, height: 800 }, userAgent = DESKTOP) {
  const context = await browser.newContext({ userAgent, viewport });
  return { context, page: await context.newPage() };
}

test.describe.serial('cookie notice', () => {
  test.beforeEach(async () => (await testDb()).collection('visits').deleteMany({}));
  // Later specs read today's numbers, so leave no visits behind.
  test.afterAll(async () => (await testDb()).collection('visits').deleteMany({}));

  test('before OK nothing is sent and no visit cookie is set, even while browsing and adding to the cart', async ({ browser }) => {
    const { context, page } = await visitor(browser);
    await signInAs(context, { name: 'Priya Venkataraman', email: 'priya.venkataraman@example.com' });
    const calls = trackCalls(page);

    await page.goto('/?utm_source=whatsapp');
    await expect(notice(page)).toContainText(NOTE);
    await expect(ok(page)).toBeVisible();
    await expect(noThanks(page)).toBeVisible();

    await page.locator('input[type=search]:visible').fill('dates');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/shop\?q=dates/);
    await page.goto('/product/ajwa-dates');
    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    await expect(page.getByRole('link', { name: 'Checkout' })).toBeVisible();
    await page.goto('/cart');
    await page.waitForTimeout(1500);

    expect(calls).toEqual([]);
    expect(await cookie(context, 'bm_vid')).toBeUndefined();
    expect(await cookie(context, 'bm_consent')).toBeUndefined();
    expect(await page.evaluate(() => localStorage.getItem('bm_seen'))).toBeNull();
    expect(await saved()).toEqual([]);
    await context.close();
  });

  test('after OK the visit is recorded, with where the visitor came from, and the choice lasts a week', async ({ browser }) => {
    const { context, page } = await visitor(browser);
    await page.goto('/?utm_source=whatsapp&utm_campaign=eid-sale', { referer: 'https://l.wl.co/' });
    await expect(notice(page)).toBeVisible();

    const note = tracked(page);
    await ok(page).click();
    await note;
    await expect(notice(page)).toHaveCount(0);

    const consent = await cookie(context, 'bm_consent');
    expect(consent?.value).toBe('yes');
    const days = ((consent?.expires ?? 0) * 1000 - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6);
    expect(days).toBeLessThan(8);
    const vid = (await cookie(context, 'bm_vid'))?.value;
    expect(vid).toBeTruthy();

    // The page already on screen is counted, still knowing it came from WhatsApp.
    await expect.poll(async () => (await saved(vid)).length).toBe(1);
    expect((await saved(vid))[0]).toMatchObject({ path: '/', src: 'whatsapp', utm: { source: 'whatsapp', campaign: 'eid-sale' } });

    // Later pages and cart adds are counted, and the notice does not come back.
    const next = tracked(page);
    await page.goto('/product/ajwa-dates');
    await next;
    const added = tracked(page);
    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    await added;
    await expect(notice(page)).toHaveCount(0);
    await expect.poll(async () => (await saved(vid)).map((v) => v.ev ?? v.path)).toEqual(['/', '/product/ajwa-dates', 'cart']);
    await context.close();
  });

  test('No thanks is remembered: nothing is recorded across reloads and new pages', async ({ browser }) => {
    const { context, page } = await visitor(browser);
    const calls = trackCalls(page);
    await page.goto('/');
    await noThanks(page).click();
    await expect(notice(page)).toHaveCount(0);
    expect((await cookie(context, 'bm_consent'))?.value).toBe('no');

    await page.reload();
    await page.goto('/shop');
    await page.goto('/product/ajwa-dates');
    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    await page.reload();
    await page.waitForTimeout(1500);

    await expect(notice(page)).toHaveCount(0);
    expect(calls).toEqual([]);
    expect(await cookie(context, 'bm_vid')).toBeUndefined();
    expect(await page.evaluate(() => localStorage.getItem('bm_seen'))).toBeNull();
    expect(await saved()).toEqual([]);
    await context.close();
  });

  test('the notice is only a question: no link, and after OK the policy has no "Change my choice" button', async ({ browser }) => {
    const { context, page } = await visitor(browser);
    await page.goto('/');
    await expect(notice(page)).toHaveText(/^Accept cookies\?\s*OK\s*No thanks$/);
    await expect(notice(page).getByRole('link')).toHaveCount(0);
    const first = tracked(page);
    await ok(page).click();
    await first;
    expect((await cookie(context, 'bm_vid'))?.value).toBeTruthy();

    // The policy names the cookies and says visits are counted only after OK.
    await page.goto('/policies/privacy');
    const main = page.locator('main');
    await expect(main).toContainText('only after you press OK on the cookie notice');
    const cookies = page.locator('#cookies');
    for (const name of ['bm_session', 'bm_admin', 'bm_consent', 'bm_vid']) await expect(cookies).toContainText(name);
    await expect(cookies).toContainText('for one week');
    await page.waitForLoadState('networkidle');
    await expect(notice(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Change my choice' })).toHaveCount(0);
    await context.close();
  });

  test('after No thanks, "Change my choice" in the privacy policy reopens the notice, in both directions', async ({ browser }) => {
    const { context, page } = await visitor(browser);
    await page.goto('/');
    await noThanks(page).click();
    await expect(notice(page)).toHaveCount(0);

    // Reopen and say No thanks again: focus goes to the notice and comes back to the button.
    await page.goto('/policies/privacy');
    const change = page.locator('#cookies').getByRole('button', { name: 'Change my choice' });
    await change.click();
    await expect(notice(page)).toContainText(NOTE);
    await expect(ok(page)).toBeFocused();
    await noThanks(page).click();
    await expect(notice(page)).toHaveCount(0);
    await expect(change).toBeFocused();
    expect((await cookie(context, 'bm_consent'))?.value).toBe('no');
    await page.goto('/about');
    await page.waitForTimeout(1500);
    expect(await saved()).toEqual([]);

    // Then OK: counting starts, and the button is gone.
    await page.goto('/policies/privacy');
    await change.click();
    const again = tracked(page);
    await ok(page).click();
    await again;
    expect((await cookie(context, 'bm_consent'))?.value).toBe('yes');
    await expect(notice(page)).toHaveCount(0);
    await expect(change).toHaveCount(0);
    await expect.poll(async () => (await saved()).map((v) => v.path)).toEqual(['/policies/privacy']);
    await context.close();
  });

  test('the notice works from the keyboard and never traps it', async ({ browser }) => {
    const { context, page } = await visitor(browser);
    await page.goto('/');
    await ok(page).focus();
    await page.keyboard.press('Escape');
    await expect(notice(page)).toBeVisible();
    await expect(ok(page)).toBeFocused();

    // Tab walks on to "No thanks", and Shift+Tab walks back out past the notice.
    await page.keyboard.press('Tab');
    await expect(noThanks(page)).toBeFocused();
    await ok(page).focus();
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[aria-label="Cookie notice"]'))).toBe(false);

    const note = tracked(page);
    await ok(page).focus();
    await page.keyboard.press('Enter');
    await note;
    await expect(notice(page)).toHaveCount(0);
    await context.close();
  });

  test('the server ignores visit notes from a browser that has not said OK', async ({ request }) => {
    const note = (path: string, cookieHeader?: string) =>
      request.post('/api/track', { data: { path }, headers: { 'user-agent': DESKTOP, ...(cookieHeader ? { cookie: cookieHeader } : {}) } });

    // An old cached page with no choice, a visitor who said No thanks, and one who said OK.
    const silent = await note('/about');
    const refused = await note('/faq', 'bm_consent=no');
    const accepted = await note('/contact', 'bm_consent=yes');
    for (const res of [silent, refused, accepted]) expect(res.status()).toBe(204);
    expect(silent.headers()['set-cookie']).toBeUndefined();
    expect(refused.headers()['set-cookie']).toBeUndefined();
    expect(accepted.headers()['set-cookie']).toContain('bm_vid=');

    await expect.poll(async () => (await saved()).length).toBe(1);
    await new Promise((r) => setTimeout(r, 500));
    expect((await saved()).map((v) => v.path)).toEqual(['/contact']);
  });

  test('the choice is only saved as yes or no, from our own site', async ({ page, request }) => {
    // Without our own site's Origin (another website, or a script) nothing is saved.
    expect((await request.post('/api/consent', { data: { choice: 'yes' } })).status()).toBe(403);
    expect((await request.post('/api/consent', { data: { choice: 'yes' }, headers: { origin: 'https://other.example.in' } })).status()).toBe(403);

    await page.goto('/');
    expect((await api(page, '/api/consent', { method: 'POST', body: { choice: 'maybe' } })).status).toBe(400);
    expect((await cookie(page.context(), 'bm_consent'))).toBeUndefined();
    expect((await api(page, '/api/consent', { method: 'POST', body: { choice: 'no' } })).status).toBe(200);
    expect((await cookie(page.context(), 'bm_consent'))?.value).toBe('no');
  });

  for (const width of [360, 390]) {
    test(`on a ${width}px phone the notice fits and covers neither the cart button nor the WhatsApp button`, async ({ browser }) => {
      const { context, page } = await visitor(browser, { width, height: 844 }, IPHONE);
      await page.goto('/');
      await expect(notice(page)).toContainText(NOTE);
      expect(await overflowing(page)).toEqual([]);

      const box = (await notice(page).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y + box.height).toBeLessThanOrEqual(844);
      expect(box.height).toBeLessThan(180);
      const whatsapp = (await page.locator('a[aria-label="Chat on WhatsApp"]').boundingBox())!;
      const cart = (await page.getByRole('button', { name: /^Open cart/ }).boundingBox())!;
      expect(overlap(box, whatsapp), 'WhatsApp button').toBe(false);
      expect(overlap(box, cart), 'cart button').toBe(false);

      // The cart still works with the notice up: its drawer opens above it and the Checkout button can be pressed.
      await page.goto('/product/ajwa-dates');
      await expect(notice(page)).toBeVisible();
      await page.getByRole('button', { name: 'Add to cart' }).first().click();
      const checkout = page.getByRole('link', { name: 'Checkout' });
      await expect(checkout).toBeVisible();
      await checkout.click({ trial: true });
      await context.close();
    });
  }

  test('the admin area has no notice, and says who is counted on the dashboard and the Visitors page', async ({ page }) => {
    await adminLogin(page);
    await expect(notice(page)).toHaveCount(0);
    await expect(page.getByText(COUNTED)).toBeVisible();
    await page.goto('/admin/visitors');
    await expect(page.getByRole('heading', { name: 'Visitors' })).toBeVisible();
    await expect(page.getByText(COUNTED)).toBeVisible();
    await expect(notice(page)).toHaveCount(0);
  });
});
