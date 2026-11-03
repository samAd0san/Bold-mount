import { SiteChrome } from '@/components/layout/site-chrome';

// The header and footer read the catalog, so every storefront page refreshes at most once a minute.
export const revalidate = 60;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
