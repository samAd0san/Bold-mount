import type { Order } from '@/lib/types';
import { PAYMENT_LABEL } from '@/lib/order-view';
import { GoogleButton } from '@/components/auth/google-button';
import { signInHref } from '@/components/auth/use-account';
import { cn } from '@/lib/utils';

export const ORDER_CARD = 'rounded-2xl bg-pearl ring-1 ring-line ring-inset';

export function PaymentPill({ payment }: { payment: Order['payment'] }) {
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', payment === 'paid' ? 'bg-whatsapp/15 text-whatsapp-ink' : 'bg-sand text-ink')}>
      {PAYMENT_LABEL[payment]}
    </span>
  );
}

/** Shown on the orders pages when nobody is signed in; `next` is where Google sends them back to. */
export function SignInPrompt({ next, google }: { next: string; google: boolean }) {
  return (
    <div className={cn(ORDER_CARD, 'mx-auto max-w-md px-6 py-12 text-center')}>
      <h2 className="text-2xl text-ink">Sign in to see your orders</h2>
      {google ? (
        <>
          <p className="mt-2 text-sm text-ink-soft">Use your Google account — it takes a few seconds, and your orders stay together in one place.</p>
          <GoogleButton href={signInHref(next)} className="mt-6" />
        </>
      ) : (
        <p className="mt-2 text-sm text-ink-soft">Sign-in isn’t available right now. Please try again in a little while.</p>
      )}
    </div>
  );
}
