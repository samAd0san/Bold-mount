import {
  Wheat,
  TreePalm,
  Droplets,
  Shirt,
  HeartHandshake,
  HandCoins,
  BriefcaseBusiness,
  BookOpen,
  Landmark,
  type LucideIcon,
} from 'lucide-react';
import { PRODUCT_IMG, STOCK } from './media';

// The nine things Bold Mount offers — drives the header rail, menus, home tiles and footer.
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

export const SECTIONS: Section[] = [
  {
    slug: 'talbeenah',
    href: '/talbeenah',
    kind: 'shop',
    title: 'Talbeenah',
    short: 'Talbeenah',
    tagline: 'The Sunnah superfood',
    blurb: 'Slow-roasted barley porridge mix that soothes the heart and fuels the day.',
    image: PRODUCT_IMG.talbeenahPhoto,
    icon: Wheat,
    cta: 'Shop Talbeenah',
  },
  {
    slug: 'dates',
    href: '/dates',
    kind: 'shop',
    title: 'Premium Dates',
    short: 'Dates',
    tagline: 'Hand-picked from blessed lands',
    blurb: 'Ajwa, Medjool, Safawi and more — sourced from Madinah, Jordan and beyond.',
    image: PRODUCT_IMG.dates.ajwa,
    icon: TreePalm,
    cta: 'Shop Dates',
  },
  {
    slug: 'honey',
    href: '/honey',
    kind: 'shop',
    title: 'Sidr Honey',
    short: 'Honey',
    tagline: 'Raw, rich and unheated',
    blurb: 'Pure Sidr honey — "a drink of varying colours, wherein is healing for people."',
    image: PRODUCT_IMG.honeySidr,
    icon: Droplets,
    cta: 'Shop Honey',
  },
  {
    slug: 'wearings',
    href: '/wearings',
    kind: 'shop',
    title: 'Modest Wear',
    short: 'Wearings',
    tagline: 'Simple, dignified, comfortable',
    blurb: 'Thobes, kurtas, kufis, abayas and hijabs for everyday and Jumu‘ah.',
    image: STOCK.wear.thobe,
    icon: Shirt,
    cta: 'Shop Wearings',
  },
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

export const SHOP_SECTIONS = SECTIONS.filter((s) => s.kind === 'shop');
export const SERVE_SECTIONS = SECTIONS.filter((s) => s.kind === 'serve');

export function getSection(slug: string): Section {
  const s = SECTIONS.find((x) => x.slug === slug);
  if (!s) throw new Error(`Unknown section: ${slug}`);
  return s;
}
