import {
  Wheat,
  TreePalm,
  Droplets,
  Nut,
  Shirt,
  HeartHandshake,
  HandCoins,
  BriefcaseBusiness,
  BookOpen,
  Landmark,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { PRODUCT_IMG, STOCK } from './media';
import { categoryHref } from './shop';
import type { Category } from './types';

// A tile in the header rail, menus, home tiles and footer: a shop category (from the DB) or a serve page (static, below).
export interface Section {
  slug: string;
  href: string;
  kind: 'shop' | 'serve';
  title: string;
  short: string; // label on small chips
  tagline: string;
  blurb: string;
  image: string;
  icon: LucideIcon;
  cta: string;
}

export const SERVE_SECTIONS: Section[] = [
  {
    slug: 'khidmat-e-khalq',
    href: '/khidmat-e-khalq',
    kind: 'serve',
    title: 'Khidmat-e-Khalq',
    short: 'Khidmat',
    tagline: 'Serving people, for the sake of Allah',
    blurb: 'Food drives, ration kits and help for families going through hard times.',
    image: STOCK.servingFood,
    icon: HeartHandshake,
    cta: 'Join the effort',
  },
  {
    slug: 'zakat',
    href: '/zakat',
    kind: 'serve',
    title: 'Zakat for the Needy',
    short: 'Zakat',
    tagline: 'Your Zakat, delivered with care',
    blurb: 'Supporting madrasa students, imams, mu‘azzins and families in need.',
    image: STOCK.givingHands,
    icon: HandCoins,
    cta: 'Give Zakat',
  },
  {
    slug: 'volunteer',
    href: '/volunteer',
    kind: 'serve',
    title: 'Volunteer Services',
    short: 'Volunteer',
    tagline: 'Free guidance from people who care',
    blurb: 'Business set-up advice, job consultation and career guidance — at no cost.',
    image: STOCK.mentoring,
    icon: BriefcaseBusiness,
    cta: 'Get free guidance',
  },
  {
    slug: 'giveaway',
    href: '/giveaway',
    kind: 'serve',
    title: 'Free Giveaways',
    short: 'Giveaway',
    tagline: 'A Qur’an in every home',
    blurb: 'Request a free copy of the Qur’an and Islamic books, or sponsor one for someone.',
    image: STOCK.quran,
    icon: BookOpen,
    cta: 'Request a free copy',
  },
  {
    slug: 'umrah',
    href: '/umrah',
    kind: 'serve',
    title: 'Umrah on Behalf',
    short: 'Umrah',
    tagline: 'Umrah Badal for your loved ones',
    blurb: 'An Umrah performed in Makkah for a parent or loved one who cannot travel.',
    image: STOCK.kaaba,
    icon: Landmark,
    cta: 'Book Umrah Badal',
  },
];

const SHOP_ICONS: Record<string, LucideIcon> = { talbeenah: Wheat, dates: TreePalm, honey: Droplets, 'dry-fruits': Nut, wearings: Shirt };

// Round-photo tiles where the image is a transparent product cut-out (contained), not a photo (fills the circle).
export const CUTOUT_IMAGES = new Set<string>([PRODUCT_IMG.talbeenahPouch, PRODUCT_IMG.honeySidr, ...Object.values(PRODUCT_IMG.dates)]);

export const categoryIcon = (slug: string): LucideIcon => SHOP_ICONS[slug] ?? ShoppingBag;

export function categorySection(c: Category): Section {
  return {
    slug: c.slug,
    href: categoryHref(c.slug),
    kind: 'shop',
    title: c.name,
    short: c.short,
    tagline: c.tagline,
    blurb: c.blurb,
    image: c.image,
    icon: categoryIcon(c.slug),
    cta: `Shop ${c.short}`,
  };
}

export const shopSections = (categories: Category[]) => categories.map(categorySection);

/** Shop categories first, then the five serve pages — the order used everywhere. */
export const allSections = (categories: Category[]) => [...shopSections(categories), ...SERVE_SECTIONS];

/** A serve section by slug (shop categories come from the database instead). */
export function getSection(slug: string): Section {
  const s = SERVE_SECTIONS.find((x) => x.slug === slug);
  if (!s) throw new Error(`Unknown section: ${slug}`);
  return s;
}
