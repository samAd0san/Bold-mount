import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { adminLogin, api, CUSTOMER, destroyCloudinary, fillCheckout, signInAs } from './helpers';
import type { Order } from '../lib/types';

type Product = { id: string; slug: string; name: string; images: { src: string }[]; variants: { id: string; label: string; price: number; compareAt?: number }[] };
type Category = { id: string; slug: string; name: string };
const products = async (page: Page) => (await api<{ products: Product[] }>(page, '/api/admin/products')).data.products;
const categories = async (page: Page) => (await api<{ categories: Category[] }>(page, '/api/admin/categories')).data.categories;
const sizeBox = (page: Page) => page.getByRole('textbox', { name: /^Size or pack/ });
const tipText = (page: Page) => page.getByRole('tooltip');
const ICON = readFileSync('public/images/brand/icon-192.png');
// A picture already online that Cloudinary can fetch: our own live site's icon.
const LIVE_PICTURE = 'https://bold-mount.vercel.app/images/brand/icon-192.png';

async function booksCategory(page: Page) {
  if (!(await categories(page)).some((c) => c.slug === 'islamic-books')) {
    await api(page, '/api/admin/categories', { method: 'POST', body: { name: 'Islamic Books', short: 'Books', tagline: 'Duas, seerah and tafsir' } });
  }
}

/** What happens when you paste into the link box: text (a copied link) or a picture file (a copied picture). */
async function paste(box: Locator, what: { text: string } | { png: string }) {
  await box.evaluate((el, w) => {
    const dt = new DataTransfer();
    if ('text' in w) dt.setData('text/plain', w.text);
    else dt.items.add(new File([Uint8Array.from(atob(w.png), (c) => c.charCodeAt(0))], 'copied-picture.png', { type: 'image/png' }));
    (el as HTMLInputElement).focus();
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, what);
}

async function deleteProduct(page: Page, id: string) {
  expect((await api(page, `/api/admin/products/${id}`, { method: 'DELETE' })).status).toBe(200);
}

test('a book: one price and no size; the shop, cart, WhatsApp message and tracking show no empty size', async ({ page, context }) => {
  await adminLogin(page);
  await booksCategory(page);
  await page.goto('/admin/products/new');
  await page.getByLabel('Name', { exact: true }).fill('Riyad as-Salihin (Arabic–English)');
  await page.getByLabel('Category', { exact: true }).selectOption({ label: 'Islamic Books' });
  await expect(sizeBox(page)).toHaveAccessibleName('Size or pack (optional)');
  await expect(page.getByRole('button', { name: /^Remove price row/ })).toHaveCount(0);
  await page.getByLabel('Price ₹', { exact: true }).fill('899');
  await page.getByRole('button', { name: 'Add product' }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);

  const book = (await products(page)).find((p) => p.name === 'Riyad as-Salihin (Arabic–English)')!;
  expect(book.variants).toEqual([{ id: 'standard', label: '', price: 899 }]);

  // Product page: nothing to choose, and it is "Carefully packed", not "Freshly packed".
  await page.goto(`/product/${book.slug}`);
  await expect(page.locator('main h1')).toHaveText('Riyad as-Salihin (Arabic–English)');
  await expect(page.locator('main fieldset')).toHaveCount(0);
  await expect(page.locator('main')).toContainText('Carefully packed');
  await expect(page.locator('main')).not.toContainText('About this product');
  await page.goto('/category/islamic-books');
  await expect(page.getByRole('button', { name: 'Add Riyad as-Salihin (Arabic–English) to cart' })).toBeVisible();

  // Cart and a WhatsApp order: the line reads "name × 1", never "name () × 1".
  await signInAs(context, { name: 'Bilal Qureshi', email: 'bilal.qureshi@example.com' });
  await page.goto(`/product/${book.slug}`);
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await expect(page.getByRole('dialog').locator('li', { hasText: 'Riyad as-Salihin' }).locator('p')).toHaveCount(1);
  await page.goto('/cart');
  await expect(page.locator('main li', { hasText: 'Riyad as-Salihin' }).locator('p').first()).toHaveText('₹899');
  await page.evaluate(() => { window.open = (url) => { (window as unknown as { sent: string }).sent = String(url); return null; }; });
  await fillCheckout(page, { ...CUSTOMER, name: 'Bilal Qureshi' });
  await page.getByRole('button', { name: 'Order on WhatsApp instead' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { sent?: string }).sent ?? '')).toContain('wa.me');
  const message = decodeURIComponent(await page.evaluate(() => (window as unknown as { sent: string }).sent));
  expect(message).toContain('• Riyad as-Salihin (Arabic–English) × 1 — ₹899');
  expect(message).not.toContain('()');

  const bookOrder = async () => (await api<{ orders: Order[] }>(page, '/api/orders/mine')).data.orders.find((o) => o.items.some((i) => i.slug === book.slug));
  await expect.poll(async () => !!(await bookOrder())).toBe(true);
  const order = (await bookOrder())!;
  expect(order.items[0].variant).toBe('');
  await page.goto(`/orders/${order.id}`);
  await expect(page.locator('main li', { hasText: 'Riyad as-Salihin' }).first()).toContainText('Riyad as-Salihin (Arabic–English) × 1');
  await expect(page.locator('main')).not.toContainText('()');

  await deleteProduct(page, book.id);
});

test('several prices: each needs a name, the shop says "from" the lowest and lets customers choose', async ({ page }) => {
  await adminLogin(page);
  await booksCategory(page);
  await page.goto('/admin/products/new');
  await page.getByLabel('Name', { exact: true }).fill('Tafsir Ibn Kathir (10 volumes)');
  await page.getByLabel('Category', { exact: true }).selectOption({ label: 'Islamic Books' });
  await page.getByLabel('Price ₹', { exact: true }).fill('6499');
  await page.getByRole('button', { name: 'Add a size or pack' }).click();
  await page.getByLabel('Price ₹', { exact: true }).nth(1).fill('5499');
  await expect(sizeBox(page).first()).toHaveAccessibleName('Size or pack');
  await page.getByRole('button', { name: 'Add product' }).click();
  await expect(page.getByRole('alert').first()).toContainText('Please fix the highlighted fields.');
  await expect(page.getByText('Name each one so customers can choose, e.g. 500 g.')).toHaveCount(2);
  await expect(page).toHaveURL(/\/new$/);

  // The server refuses it too, in words the owner understands.
  const refused = await api<{ error: string }>(page, '/api/admin/products', {
    method: 'POST',
    body: { name: 'Tafsir Ibn Kathir', category: 'islamic-books', variants: [{ label: 'English', price: 6499 }, { label: '', price: 5499 }] },
  });
  expect(refused.status).toBe(400);
  expect(refused.data.error).toBe('With more than one price, name each size or pack so customers can choose.');

  await sizeBox(page).first().fill('English');
  await sizeBox(page).nth(1).fill('Arabic');
  await page.getByRole('button', { name: 'Add product' }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  const tafsir = (await products(page)).find((p) => p.name === 'Tafsir Ibn Kathir (10 volumes)')!;

  await page.goto('/category/islamic-books');
  const tile = page.locator('main .group', { hasText: 'Tafsir Ibn Kathir' });
  await expect(tile).toContainText('from ₹5,499');
  await expect(tile.getByRole('button', { name: 'Add Tafsir Ibn Kathir (10 volumes) (Arabic) to cart' })).toBeVisible();
  await page.goto(`/product/${tafsir.slug}`);
  await expect(page.locator('main fieldset legend')).toHaveText('Option: English');
  await page.locator('main fieldset').getByRole('button', { name: 'Arabic' }).click();
  await expect(page.locator('main fieldset legend')).toHaveText('Option: Arabic');
  await expect(page.locator('main')).toContainText('₹5,499');

  await deleteProduct(page, tafsir.id);
});

test('pictures: links, Google picture addresses and copied pictures are saved to the shop; web pages are refused', async ({ page }) => {
  await adminLogin(page);
  await booksCategory(page);
  await page.goto('/admin/products/new');
  await page.getByLabel('Name', { exact: true }).fill('Fortress of the Muslim (pocket)');
  await page.getByLabel('Category', { exact: true }).selectOption({ label: 'Islamic Books' });
  await page.getByLabel('Price ₹', { exact: true }).fill('120');
  const box = page.getByLabel('Image link');
  const thumbs = page.getByRole('textbox', { name: /^Picture \d+ description$/ });

  // Not a link at all, then a link to a web page instead of a picture.
  await box.fill('fortress of the muslim');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('That doesn’t look like a picture link. It should start with https://')).toBeVisible();
  // Select the wrong text and paste over it: the pasted link is tried straight away.
  await box.selectText();
  await paste(box, { text: 'https://example.com/' });
  await expect(page.getByText('That link opens a web page, not a picture.', { exact: false })).toBeVisible({ timeout: 30_000 });
  await expect(thumbs).toHaveCount(0);
  await page.getByRole('button', { name: 'Dismiss' }).click();

  // A picture link, a pasted Google Images address (data:…), and a copied picture.
  await box.fill(LIVE_PICTURE);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText('Picture from bold-mount.vercel.app')).toBeVisible();
  await expect(thumbs).toHaveCount(1, { timeout: 30_000 });
  await paste(box, { text: `data:image/png;base64,${ICON.toString('base64')}` });
  await expect(thumbs).toHaveCount(2, { timeout: 30_000 });
  await paste(box, { png: ICON.toString('base64') });
  await expect(thumbs).toHaveCount(3, { timeout: 30_000 });
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0);

  await page.getByRole('button', { name: 'Add product' }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  const book = (await products(page)).find((p) => p.name === 'Fortress of the Muslim (pocket)')!;
  expect(book.images).toHaveLength(3);
  for (const im of book.images) expect(im.src).toMatch(/^https:\/\/res\.cloudinary\.com\/.+\/bold-mount\/products\//);

  // The shop really shows them (only Cloudinary and our own pictures can be shown there).
  await page.goto(`/product/${book.slug}`);
  const main = page.locator('main img[alt="Fortress of the Muslim (pocket)"]').first();
  await expect.poll(() => main.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);

  // Links from elsewhere can't be saved by going around the form.
  const outside = await api<{ error: string }>(page, `/api/admin/products/${book.id}`, { method: 'PATCH', body: { images: [{ src: 'https://example.com/fortress.jpg', alt: '' }] } });
  expect(outside.status).toBe(400);
  expect(outside.data.error).toBe('Add pictures with the Upload button or the link box, so they are saved to the shop.');

  await deleteProduct(page, book.id);
  for (const im of book.images) await destroyCloudinary(im.src);
});

test('help tips: every field has one; tap to open, hover with a mouse, typing is never interrupted', async ({ page }) => {
  await adminLogin(page);
  await page.goto('/admin/products/new');
  for (const field of ['Name', 'Category', 'Tagline', 'Description', 'Highlights', 'Price ₹', 'Was ₹ (optional)', 'Size or pack (optional)', 'Pictures', 'Details', 'Tags', 'Badge', 'Origin', 'Sort order', 'Show in the shop']) {
    await expect(page.getByRole('button', { name: `What is “${field}”?`, exact: true }), field).toBeVisible();
  }

  // Tap: opens, explains in plain words, closes when you tap elsewhere.
  await page.getByRole('button', { name: 'What is “Size or pack (optional)”?' }).click();
  await expect(tipText(page)).toContainText('Selling just one version, like a book? Leave it empty.');
  await page.getByRole('heading', { name: 'Basics' }).click();
  await expect(tipText(page)).toHaveCount(0);

  // Mouse: hover shows it, moving away hides it, and the box you are typing in keeps its focus.
  const name = page.getByLabel('Name', { exact: true });
  await name.click();
  await page.getByRole('button', { name: 'What is “Badge”?' }).hover();
  await expect(tipText(page)).toContainText('A small gold label on the product’s photo');
  await expect(name).toBeFocused();
  await page.mouse.move(5, 5);
  await expect(tipText(page)).toHaveCount(0);
  // Hover then click pins it open until you click elsewhere.
  await page.getByRole('button', { name: 'What is “Origin”?' }).hover();
  await page.getByRole('button', { name: 'What is “Origin”?' }).click();
  await page.mouse.move(5, 5);
  await expect(tipText(page)).toContainText('Where it comes from');
  await page.getByRole('heading', { name: 'Basics' }).click();
  await expect(tipText(page)).toHaveCount(0);

  await page.goto('/admin/categories');
  await page.getByRole('button', { name: 'Add category' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add category' });
  for (const field of ['Name', 'Short label', 'Tagline', 'Blurb', 'Picture', 'Sort order', 'Show in the shop']) {
    await expect(dialog.getByRole('button', { name: `What is “${field}”?`, exact: true }), field).toBeVisible();
  }
  // Tips work inside the pop-up too, and tapping one does not close the pop-up.
  await dialog.getByRole('button', { name: 'What is “Short label”?' }).click();
  await expect(tipText(page)).toContainText('the round category buttons in the shop');
  await expect(dialog).toBeVisible();
});

test('preview: the product and category previews follow what you type; phones get a Preview button', async ({ page }) => {
  await adminLogin(page);
  await page.goto('/admin/products/new');
  const preview = page.getByTestId('product-preview').first();
  await expect(preview).toContainText('Product name');
  await page.getByLabel('Name', { exact: true }).fill('Ajwa Dates Gift Tin');
  await page.getByLabel('Tagline', { exact: true }).fill('Soft Ajwa from Madinah in a keepsake tin');
  await page.getByLabel('Highlights', { exact: true }).fill('Hand-picked\nKeepsake tin');
  await page.getByLabel('Price ₹', { exact: true }).fill('1299');
  await page.getByLabel('Was ₹ (optional)', { exact: true }).fill('1499');
  await page.getByLabel('Badge', { exact: true }).fill('Limited');
  await page.getByLabel('Origin', { exact: true }).fill('Madinah');
  await page.getByLabel('Image link').fill('/images/products/gift-sunnah-trio.webp');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  for (const text of ['Ajwa Dates Gift Tin', 'Soft Ajwa from Madinah in a keepsake tin', 'Keepsake tin', '₹1,299', '₹1,499', '-13%', 'Limited', 'Madinah']) await expect(preview).toContainText(text);
  await expect(preview.locator('img').first()).toBeVisible();
  // No size: no picker. Two sizes: "from" the lowest and both to choose from.
  await expect(preview.locator('fieldset')).toHaveCount(0);
  await sizeBox(page).fill('250 g');
  await page.getByRole('button', { name: 'Add a size or pack' }).click();
  await sizeBox(page).nth(1).fill('500 g');
  await page.getByLabel('Price ₹', { exact: true }).nth(1).fill('2399');
  await expect(preview).toContainText('from ₹1,299');
  await expect(preview.locator('fieldset')).toContainText('Pack size: 250 g');
  await expect(preview.locator('fieldset')).toContainText('500 g');
  // Look only: its buttons can't be pressed, so nothing goes into the real cart.
  await expect(preview).toHaveAttribute('inert', '');
  await expect(preview).toContainText('Add to cart');

  // Phones and tablets: the preview opens from the bottom bar.
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.getByRole('complementary', { name: 'Preview' })).toBeHidden();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Preview' });
  await expect(sheet.getByTestId('product-preview')).toContainText('Ajwa Dates Gift Tin');
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/admin/categories');
  await page.getByRole('button', { name: 'Add category' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill('Prayer Mats');
  await dialog.getByLabel('Short label', { exact: true }).fill('Mats');
  await dialog.getByLabel('Tagline', { exact: true }).fill('Soft, thick and easy to carry');
  await dialog.getByLabel('Blurb', { exact: true }).fill('Padded prayer mats for home and travel.');
  const cat = dialog.getByTestId('category-preview');
  for (const text of ['Mats', 'Soft, thick and easy to carry', 'Prayer Mats', 'Padded prayer mats for home and travel.', 'Shop Mats']) await expect(cat).toContainText(text);
  await dialog.getByRole('button', { name: 'Close' }).click();
});
