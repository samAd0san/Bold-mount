import type { Metadata } from 'next';
import { PRODUCT_IMG } from '@/lib/media';
import { SITE } from '@/lib/site';

// Setting openGraph on a page replaces the layout's whole object, so we re-state siteName and image here.
export function pageMeta({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      title: `${title} · ${SITE.name}`,
      description,
      url: path,
      images: [PRODUCT_IMG.talbeenahPhoto],
    },
  };
}
