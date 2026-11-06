import { expect, type BrowserContext, type Page } from '@playwright/test';
import { addToCart, api, CUSTOMER, fillCheckout, signInAs } from './helpers';
import type { Order } from '../lib/types';

export const emailOf = (name: string) => `${name.toLowerCase().replace(/\W+/g, '.')}@example.com`;
export const payCash = (page: Page) => page.getByRole('radio', { name: /Cash on delivery/ });
export const payOnlineChoice = (page: Page) => page.getByRole('radio', { name: /Pay online/ });
export const placeOrder = (page: Page) => page.getByRole('button', { name: /^Place order/ });

/** Signs in as `name`, puts one Ajwa Dates pack in the cart and places the order with cash on delivery from the checkout page. Returns the saved order. */
export async function cashOrder(page: Page, context: BrowserContext, name: string, mobile = CUSTOMER.mobile): Promise<Order> {
  await signInAs(context, { name, email: emailOf(name) });
  await addToCart(page, '/product/ajwa-dates');
  await page.goto('/cart');
  await fillCheckout(page, { ...CUSTOMER, name, mobile });
  await payCash(page).check();
  await placeOrder(page).click();
  await expect(page.getByText('Order placed — thank you!')).toBeVisible();
  const { data } = await api<{ orders: Order[] }>(page, '/api/orders/mine');
  return data.orders[0];
}
