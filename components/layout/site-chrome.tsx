import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { SiteHeader } from '@/components/layout/site-header';
import { OngoingOrderStrip } from '@/components/layout/ongoing-order-strip';
import { SiteFooter } from '@/components/layout/site-footer';
import { CartDrawer } from '@/components/layout/cart-drawer';
import { FloatingActions } from '@/components/layout/floating-actions';
import { CategoriesProvider } from '@/components/layout/categories-context';
import { DeliveryProvider } from '@/components/layout/delivery-context';
import { Tracker } from '@/components/analytics/tracker';
import { LiveCatalog } from '@/components/layout/live-catalog';
import { getCategories, getDelivery } from '@/lib/catalog';
import { DEFAULT_DELIVERY } from '@/lib/delivery';

/** Store header, footer, cart drawer and floating buttons around a storefront page (not used by /admin). */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  // If the catalog can't load, the chrome still renders (serve pages only) instead of breaking every page; orders are priced on the server either way.
  const [categories, delivery] = await Promise.all([
    getCategories().catch(() => []),
    getDelivery().catch((err) => (console.error('[delivery] settings unavailable', err), DEFAULT_DELIVERY)),
  ]);
  return (
    <CategoriesProvider categories={categories}>
      <DeliveryProvider delivery={delivery}>
        <AnnouncementBar />
        <SiteHeader categories={categories} />
        <OngoingOrderStrip />
        {/* Side-sliding reveals start off-screen; clip (unlike hidden) keeps sticky elements working. */}
        <main className="overflow-x-clip">{children}</main>
        <SiteFooter categories={categories} />
        <CartDrawer />
        <FloatingActions />
        <Tracker />
        <LiveCatalog />
      </DeliveryProvider>
    </CategoriesProvider>
  );
}
