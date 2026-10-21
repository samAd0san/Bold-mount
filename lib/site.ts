// Brand facts used across the site; contact numbers come from Bold Mount's own posters.
export const SITE = {
  name: 'Bold Mount',
  tagline: 'Sunnah Superfoods & Service',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bold-mount.vercel.app',
  description:
    'Premium roasted Talbeenah, hand-picked dates and pure Sidr honey — plus Zakat, Umrah Badal, free Quran giveaways and volunteer guidance for the community.',
  whatsapp: '918125079915',
  phoneDisplay: '+91 81250 79915',
  altPhones: ['+91 73821 74227', '+91 83408 00524'],
  email: 'boldmount22@gmail.com',
  location: 'India',
  freeShippingAbove: 999,
} as const;

export const ANNOUNCEMENTS = [
  `Free delivery on orders above ₹${SITE.freeShippingAbove}`,
  'Doorstep delivery — share your location on WhatsApp',
  'A share of every order feeds a family in need',
];
