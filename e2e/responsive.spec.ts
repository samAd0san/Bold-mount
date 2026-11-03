import { expect, test } from '@playwright/test';
import { addToCart, adminLogin, overflowing, signInAs, TALBEENAH } from './helpers';

const WIDTHS = [360, 390, 768, 1024, 1440];
const STORE = ['/', '/shop', TALBEENAH, '/dates', '/honey', '/wearings', '/category/talbeenah', '/cart', '/account', '/contact', '/faq', '/about', '/umrah', '/zakat', '/khidmat-e-khalq', '/policies/shipping', '/policies/refund-cancellation'];
const ADMIN = ['/admin', '/admin/orders', '/admin/products', '/admin/products/new', '/admin/categories', '/admin/users', '/admin/forms', '/admin/settings'];

for (const width of WIDTHS) {
  test(`nothing spills off the screen at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: width < 768 ? 800 : 900 });
    // A customer with orders from the checkout tests, so My orders and the signed-in checkout are checked too.
    await signInAs(context, { name: 'Yusuf Rahman', email: 'yusuf.rahman@example.com' });
    await addToCart(page);
    const problems: string[] = [];
    const check = async (where: string) => {
      const bad = await overflowing(page);
      if (bad.length) problems.push(`${where}: ${bad.join(' | ')}`);
    };

    for (const path of STORE) {
      const res = await page.goto(path, { waitUntil: 'networkidle' });
      expect(res?.status(), path).toBeLessThan(400);
      await check(path);
    }
    if (width < 1024) {
      await page.goto('/');
      await page.getByRole('button', { name: 'Open menu' }).click();
      await page.waitForTimeout(600);
      await check('phone menu');
      await page.keyboard.press('Escape');
    }
    await page.goto('/account', { waitUntil: 'networkidle' });
    const cancel = page.getByRole('button', { name: 'Cancel order' }).first();
    if (await cancel.count()) {
      await cancel.click();
      await check('cancel order dialog');
      await page.getByRole('button', { name: 'Keep order' }).click();
    }
    await page.goto('/');
    await page.getByRole('button', { name: /^Open cart/ }).click();
    await page.waitForTimeout(600);
    await check('cart drawer');

    await adminLogin(page);
    for (const path of ADMIN) {
      await page.goto(path, { waitUntil: 'networkidle' });
      await check(path);
    }
    await page.goto('/admin/categories');
    await page.getByRole('button', { name: 'Add category' }).click();
    await check('add category dialog');

    expect(problems, problems.join('\n')).toEqual([]);
  });
}
