import { formatINR } from '@/lib/format';
import { SITE } from '@/lib/site';

export interface PolicyBlock {
  heading: string;
  paragraphs?: string[];
  list?: string[];
  ordered?: boolean;
  link?: { label: string; href: string };
}

export interface Policy {
  slug: string;
  title: string;
  intro: string;
  description: string;
  blocks: PolicyBlock[];
}

export const POLICY_UPDATED = 'October 2026';

const FREE = formatINR(SITE.freeShippingAbove);

// Short, plain-English drafts: the owner should review them before relying on them.
export const POLICIES: Policy[] = [
  {
    slug: 'shipping',
    title: 'Delivery & Returns',
    intro: 'How delivery works, and what to do if something is not right with your order.',
    description: `Bold Mount delivers to your door ourselves. Share your drop address or location on WhatsApp; delivery time and any charge are confirmed before dispatch. Free delivery above ${FREE}.`,
    blocks: [
      {
        heading: 'Delivery to your door',
        paragraphs: ['We deliver your order ourselves.'],
        list: [
          'Share your drop address or a location pin on WhatsApp, or tap “Use my current location” at checkout.',
          'We confirm the delivery time and any delivery charge with you on WhatsApp before we dispatch your order.',
          `Delivery is free on orders above ${FREE}.`,
        ],
      },
      {
        heading: 'How orders work',
        paragraphs: [
          'Your cart is sent to us as a WhatsApp message. Your order is confirmed only once we reply, and we share payment details with you at that time.',
        ],
      },
      {
        heading: 'Returns',
        paragraphs: [
          'Our food products are perishable, so they cannot be returned once opened. For anything else, message us and we will do our best to help.',
        ],
      },
      {
        heading: 'Damaged or incorrect items',
        paragraphs: ['If your order arrives damaged, or is not what you ordered:'],
        ordered: true,
        list: [
          'Take a clear photo of the item and its packaging.',
          'Send it to us on WhatsApp at delivery, or within 24 hours.',
          'We will replace the item.',
        ],
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    intro: 'We keep this simple: we only use what you send us, and only to look after your order or request.',
    description:
      'What Bold Mount collects, why, and how it is used: only the details you send us on WhatsApp to fulfil orders and requests. Your cart stays in your browser and we never sell your data.',
    blocks: [
      {
        heading: 'What we collect',
        paragraphs: [
          'Only what you send us: your name, phone number and drop address or shared location, plus any message or request details you choose to share.',
        ],
      },
      {
        heading: 'How we use it',
        paragraphs: [
          'To confirm and deliver your order, answer your questions and carry out the requests you make, such as Zakat, Umrah Badal or a giveaway. We contact you on WhatsApp for this.',
        ],
      },
      {
        heading: 'Your cart',
        paragraphs: [
          'Your cart is stored in your own browser, on your device. It is not sent to us until you choose to send your order on WhatsApp. Clearing your browser data removes it.',
        ],
      },
      {
        heading: 'Sharing',
        paragraphs: [
          'We do not sell your data. We share details only with those who need them to complete your order, such as whoever is delivering it to you.',
        ],
      },
      {
        heading: 'WhatsApp',
        paragraphs: ['Messages you send through WhatsApp are also covered by WhatsApp’s own terms and privacy policy.'],
      },
      {
        heading: 'Your choices',
        paragraphs: ['You can ask us to remove the details you have sent us at any time by messaging us on WhatsApp.'],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    intro: 'The ground rules for using this site and placing an order with us.',
    description:
      'Terms for using the Bold Mount site: prices in INR may change, orders are confirmed only once we reply on WhatsApp, and our services are performed with sincerity per the details you give.',
    blocks: [
      {
        heading: 'Using this site',
        paragraphs: ['By using this site and placing an order, you agree to these terms.'],
      },
      {
        heading: 'Prices and orders',
        paragraphs: [
          'Prices are in Indian rupees (₹). Prices and availability may change. Your order is confirmed only once we reply on WhatsApp.',
        ],
      },
      {
        heading: 'Our products',
        paragraphs: [
          'Photos are for illustration, and natural products can vary slightly in colour, size and texture. Our food products are food, not medicine, and are not meant to diagnose, treat or cure any condition.',
        ],
      },
      {
        heading: 'Our services',
        paragraphs: [
          'Religious and community services, such as Zakat, Umrah Badal, Khidmat-e-Khalq and volunteer guidance, are carried out with sincerity, according to the details you provide. Zakat goes only to eligible recipients. Free giveaways are available while stock lasts.',
        ],
      },
      {
        heading: 'Delivery and returns',
        paragraphs: ['Delivery, damaged items and returns are covered in our Delivery & Returns page.'],
        link: { label: 'Read Delivery & Returns', href: '/policies/shipping' },
      },
      {
        heading: 'Changes',
        paragraphs: ['We may update these terms from time to time. The date at the top shows when they were last changed.'],
      },
    ],
  },
];

export const POLICY_SLUGS = POLICIES.map((p) => p.slug);

export function getPolicy(slug: string): Policy | undefined {
  return POLICIES.find((p) => p.slug === slug);
}
