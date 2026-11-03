import { expect, test } from '@playwright/test';
import { signInAs } from './helpers';

test('Sign in with Google sends you to Google with our client and callback', async ({ request, baseURL }) => {
  const res = await request.get('/api/auth/google?next=/account', { maxRedirects: 0 });
  expect(res.status()).toBeGreaterThanOrEqual(302);
  const to = new URL(res.headers()['location']);
  expect(to.origin + to.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
  expect(to.searchParams.get('client_id')).toBe(process.env.GOOGLE_CLIENT_ID);
  expect(to.searchParams.get('redirect_uri')).toBe(`${baseURL}/api/auth/google/callback`);
  expect(to.searchParams.get('code_challenge_method')).toBe('S256');
});

test('signed out, My account offers Google sign-in', async ({ page }) => {
  await page.goto('/account');
  await expect(page.locator('main')).toContainText(/Continue with Google|Sign in with Google/i);
});

test('signed in: name in the account page, Sign out works', async ({ page, context }) => {
  await signInAs(context, { name: 'Maryam Hussain', email: 'maryam.hussain@example.com' });
  await page.goto('/account');
  await expect(page.locator('main')).toContainText('Maryam Hussain');
  await page.getByRole('button', { name: /Sign out/i }).first().click();
  await expect(page.locator('main')).toContainText(/Continue with Google|Sign in with Google/i);
});
