import { redirect } from 'next/navigation';

// Old links and the Google sign-in return path (/account) land on the orders page.
export default function AccountPage() {
  redirect('/orders');
}
