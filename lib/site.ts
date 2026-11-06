import { deliveryWords, type DeliverySettings } from '@/lib/delivery';

// Brand facts used across the site; contact numbers come from Bold Mount's own posters.
export const SITE = {
  name: 'Bold Mount',
  tagline: 'Sunnah Superfoods & Service',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.boldmount.store',
  description:
    'Premium roasted Talbeenah, hand-picked dates, pure Sidr honey and dry fruits — plus Zakat, Umrah Badal, free Quran giveaways and volunteer guidance for the community.',
  whatsapp: '918125079915',
  phoneDisplay: '+91 81250 79915',
  altPhones: ['+91 73821 74227', '+91 83408 00524'],
  email: 'boldmount22@gmail.com',
  location: 'India',
} as const;

/** The two ways to pay for a shop order, worded the same everywhere on the site. */
export const PAY_WAYS = 'online (UPI, cards, netbanking) or cash on delivery';
export const PAY_LINE = `Pay ${PAY_WAYS}`;

/** The rotating lines in the top bar; the delivery one is left out when delivery has nothing free to announce. */
export const announcements = (d: DeliverySettings) =>
  [deliveryWords(d).promo, PAY_LINE, 'A share of every order feeds a family in need'].filter((a): a is string => !!a);
