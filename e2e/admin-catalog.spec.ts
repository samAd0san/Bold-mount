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
const LIVE_PICTURE = 'https://www.boldmount.store/images/brand/icon-192.png';

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

test('a book: one price and no size; the shop, cart, order and tracking show no empty size', async ({ page, context }) => {
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

  // Cart and a cash on delivery order: the line reads "name × 1", never "name () × 1".
  await signInAs(context, { name: 'Bilal Qureshi', email: 'bilal.qureshi@example.com' });
  await page.goto(`/product/${book.slug}`);
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await expect(page.getByRole('dialog').locator('li', { hasText: 'Riyad as-Salihin' }).locator('p')).toHaveCount(1);
  await page.goto('/cart');
  await expect(page.locator('main li', { hasText: 'Riyad as-Salihin' }).locator('p').first()).toHaveText('₹899');
  await fillCheckout(page, { ...CUSTOMER, name: 'Bilal Qureshi' });
  await page.getByRole('radio', { name: /Cash on delivery/ }).check();
  await page.getByRole('button', { name: /^Place order/ }).click();
  await expect(page.getByText('Order placed — thank you!')).toBeVisible();

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
  await expect(page.getByText('Picture from boldmount.store')).toBeVisible();
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
  for (const field of ['Name', 'Category', 'Tagline', 'Description', 'Highlights', 'Price ₹', 'Was ₹', 'Size or pack (optional)', 'Pictures', 'Details', 'Tags', 'Badge', 'Origin', 'Sort order', 'Show in the shop']) {
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

  await page.goto('/admin/categories/new');
  for (const field of ['Name', 'Short label', 'Tagline', 'Blurb', 'Picture', 'Sort order', 'Show in the shop']) {
    await expect(page.getByRole('button', { name: `What is “${field}”?`, exact: true }), field).toBeVisible();
  }
  await page.getByRole('button', { name: 'What is “Short label”?' }).click();
  await expect(tipText(page)).toContainText('the round category buttons in the shop');
  // Phones: the category preview opens from the bottom bar, like the product one.
  await page.setViewportSize({ width: 390, height: 800 });
  await page.getByRole('heading', { name: 'Basics' }).click();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Preview' })).toBeVisible();
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
  await page.getByLabel('Was ₹', { exact: true }).fill('1499');
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
  // It behaves like the shop: picking a size changes the price, and the quantity buttons work.
  const purchase = preview.locator('fieldset');
  await purchase.getByRole('button', { name: '500 g' }).click();
  await expect(purchase.locator('legend')).toHaveText('Pack size: 500 g');
  await expect(purchase.getByRole('button', { name: '500 g' })).toHaveAttribute('aria-pressed', 'true');
  await expect(preview).toContainText('₹2,399');
  await sizeBox(page).nth(1).fill('500 g pouch');
  await expect(purchase.locator('legend')).toHaveText('Pack size: 500 g pouch');
  await preview.getByRole('button', { name: 'Increase quantity' }).click();
  await expect(preview.getByRole('group', { name: /quantity/i })).toContainText('2');
  // Several pictures: tapping a thumbnail shows it; removing it in the form never leaves the picture blank.
  await page.getByLabel('Image link').fill('/images/products/talbeenah-duo.webp');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await preview.getByRole('button', { name: 'Show image 2 of 2' }).click();
  await expect(preview.getByRole('button', { name: 'Show image 2 of 2' })).toHaveAttribute('aria-pressed', 'true');
  await expect(preview.locator('img[aria-hidden="false"]').first()).toHaveAttribute('src', /talbeenah-duo/);
  await page.getByRole('button', { name: 'Remove picture 2' }).click();
  await expect(preview.locator('img[aria-hidden="false"]').first()).toHaveAttribute('src', /gift-sunnah-trio/);
  // Detail rows open to show their text, just like the product page (with "Delivery & payment" added for every product).
  await page.getByRole('button', { name: 'Add a detail' }).click();
  await page.getByLabel('Detail label').fill('Storage');
  await page.getByLabel('Detail value').fill('Keep in a cool, dry place.');
  await preview.getByText('Storage', { exact: true }).click();
  await expect(preview.getByText('Keep in a cool, dry place.')).toBeVisible();
  await preview.getByText('Delivery & payment').click();
  await expect(preview.getByText(/Online payments are handled by Razorpay/)).toBeVisible();
  // Tapping the shop tile "opens" its page: the page preview scrolls into view and the admin stays put.
  await preview.getByRole('link', { name: 'Ajwa Dates Gift Tin' }).first().click();
  await expect(page).toHaveURL(/\/admin\/products\/new$/);
  await expect(preview.getByText('Its own page (as on a phone)')).toBeInViewport();
  // Add to cart, Buy now and quick add can't fill the admin's own cart: they show a note instead.
  for (const name of ['Add to cart', 'Buy now', /^Add Ajwa Dates Gift Tin/]) {
    await preview.getByRole('button', { name }).first().click();
    await expect(preview.getByRole('status')).toContainText('Just a preview');
  }
  expect(await page.evaluate(() => Object.values(localStorage).join(' '))).not.toContain('Ajwa Dates Gift Tin');

  // Phones and tablets: the preview opens from the bottom bar.
  await page.setViewportSize({ width: 390, height: 800 });
  await expect(page.getByRole('complementary', { name: 'Preview' })).toBeHidden();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Preview' });
  await expect(sheet.getByTestId('product-preview')).toContainText('Ajwa Dates Gift Tin');
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/admin/categories/new');
  await page.getByLabel('Name', { exact: true }).fill('Prayer Mats');
  await page.getByLabel('Short label', { exact: true }).fill('Mats');
  await page.getByLabel('Tagline', { exact: true }).fill('Soft, thick and easy to carry');
  await page.getByLabel('Blurb', { exact: true }).fill('Padded prayer mats for home and travel.');
  const cat = page.getByTestId('category-preview').first();
  for (const text of ['Shop by category', 'Mats', 'Soft, thick and easy to carry', 'Prayer Mats', 'Padded prayer mats for home and travel.', 'Shop Mats', 'No products yet']) await expect(cat).toContainText(text);
  // Its round button sits among the real ones, in sort order (empty sort = last before Gift Boxes).
  const tiles = cat.getByRole('navigation', { name: 'Shop by category' }).getByRole('link');
  await expect(tiles.first()).toHaveText('All');
  await expect(tiles.nth(-2)).toHaveText('Mats');
  await expect(tiles.last()).toHaveText('Gift Boxes');
  await page.getByLabel('Sort order', { exact: true }).fill('0');
  await expect(tiles.nth(1)).toHaveText('Mats');
  // Tapping "Shop Mats" jumps to its products and the admin stays put; hiding it removes its button.
  await cat.getByRole('link', { name: 'Shop Mats' }).click();
  await expect(cat.getByText('No products yet')).toBeInViewport();
  await expect(page).toHaveURL(/\/admin\/categories\/new$/);
  await page.getByRole('switch', { name: 'Show in the shop' }).click();
  await expect(cat).toContainText('Hidden: customers won’t see this button or page.');
  await expect(tiles.filter({ hasText: 'Mats' })).toHaveCount(0);

  // An existing category previews its real products.
  await page.goto('/admin/categories');
  await page.getByRole('link', { name: 'Edit Talbeenah' }).click();
  const existing = page.getByTestId('category-preview').first();
  await expect(existing).toContainText('Premium Roasted Talbeenah');
  await expect(existing).not.toContainText('No products yet');
});
