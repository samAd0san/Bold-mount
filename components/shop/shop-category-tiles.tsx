import Link from 'next/link';
import Image from 'next/image';
import { STOCK } from '@/lib/media';
import { getSection } from '@/lib/sections';
import type { ShopSection } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ShopTileScroller } from './shop-tile-scroller';
import { shopHref, type ShopFilter, type ShopQuery } from './shop-query';

const GIFT_IMG = '/images/products/gift-sunnah-trio.webp';

interface Tile {
  value?: ShopFilter; // undefined = All
  label: string;
  image: string;
  cutout: boolean; // product cut-outs sit contained on pearl; photos fill the circle
  crop?: string; // object-position for photos
}

const sectionTile = (slug: ShopSection, cutout: boolean, crop?: string): Tile => {
  const s = getSection(slug);
  return { value: slug, label: s.short, image: s.image, cutout, crop };
};

export const CATEGORY_TILES: Tile[] = [
  { label: 'All', image: STOCK.datesHero, cutout: false, crop: 'object-[75%_50%]' },
  sectionTile('talbeenah', false, 'object-[50%_25%]'),
  sectionTile('dates', true),
  sectionTile('honey', true),
  sectionTile('dry-fruits', false),
  sectionTile('wearings', false, 'object-[45%_50%]'),
  { value: 'gifts', label: 'Gift Boxes', image: GIFT_IMG, cutout: true },
];

export const categoryLabel = (filter?: ShopFilter) => CATEGORY_TILES.find((t) => t.value === filter)?.label ?? 'All';

/** "Shop by category" image tiles: plain links, so the chosen category lives in the URL. */
export function ShopCategoryTiles({ query }: { query: ShopQuery }) {
  return (
    <nav aria-label="Shop by category">
      <p className="eyebrow">Shop by category</p>
      <ShopTileScroller activeKey={query.filter ?? 'all'}>
        {CATEGORY_TILES.map((t) => {
          const on = t.value === query.filter;
          return (
            <li key={t.label} className="shrink-0 snap-start">
              <Link
                href={shopHref({ ...query, filter: t.value })}
                scroll={false}
                aria-current={on ? 'true' : undefined}
                className="group flex w-[4.75rem] flex-col items-center gap-2 text-center md:w-24"
              >
                <span
                  className={cn(
                    'relative block h-[4.5rem] w-[4.5rem] overflow-hidden rounded-full bg-pearl transition-shadow duration-300 md:h-20 md:w-20',
                    on
                      ? 'ring-2 ring-gold ring-offset-2 ring-offset-cream'
                      : 'ring-1 ring-line group-hover:ring-2 group-hover:ring-gold-deep/60',
                  )}
                >
                  <Image
                    src={t.image}
                    alt=""
                    fill
                    sizes="80px"
                    className={t.cutout ? 'object-contain p-2' : cn('object-cover', t.crop)}
                  />
                </span>
                <span className={cn('text-sm leading-tight whitespace-nowrap', on ? 'font-bold text-ink' : 'font-medium text-ink-soft group-hover:text-ink')}>
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ShopTileScroller>
    </nav>
  );
}
