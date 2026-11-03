import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { CartDrawer } from '@/components/layout/cart-drawer';
import { FloatingActions } from '@/components/layout/floating-actions';
import { CategoriesProvider } from '@/components/layout/categories-context';
import { Tracker } from '@/components/analytics/tracker';
import { getCategories } from '@/lib/catalog';

/** Store header, footer, cart drawer and floating buttons around a storefront page (not used by /admin). */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  // If the catalog can't load, the chrome still renders (serve pages only) instead of breaking every page.
  const categories = await getCategories().catch(() => []);
  return (
    <CategoriesProvider categories={categories}>
      <AnnouncementBar />
      <SiteHeader categories={categories} />
      {/* Side-sliding reveals start off-screen; clip (unlike hidden) keeps sticky elements working. */}
      <main className="overflow-x-clip">{children}</main>
      <SiteFooter categories={categories} />
      <CartDrawer />
      <FloatingActions />
      <Tracker />
    </CategoriesProvider>
  );
}
