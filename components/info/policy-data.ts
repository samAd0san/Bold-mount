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

export const POLICY_UPDATED = 'November 2026';

const FREE = formatINR(SITE.freeShippingAbove);

// Short, plain-English drafts: the owner should review them before relying on them.
export const POLICIES: Policy[] = [
  {
    slug: 'shipping',
    title: 'Delivery & Returns',
    intro: 'How delivery works, and what to do if something is not right with your order.',
    description: `Bold Mount delivers to your door ourselves. Pay online (UPI, cards, netbanking) or cash on delivery, and share your drop address or location; delivery time is confirmed before dispatch. Delivery is ${formatINR(SITE.deliveryFee)}, and free on orders of ${FREE} or more.`,
    blocks: [
      {
        heading: 'Delivery to your door',
        paragraphs: ['We deliver your order ourselves.'],
        list: [
          'Share your drop address at checkout, or tap “Use my current location”.',
          'We confirm the delivery time with you before we dispatch your order.',
          `Delivery is ${formatINR(SITE.deliveryFee)} per order, and free on orders of ${FREE} or more.`,
        ],
      },
      {
        heading: 'How orders and payment work',
        paragraphs: [
          'At checkout you choose how to pay: online (UPI, cards, netbanking), or cash on delivery.',
          'Pay online with UPI (Google Pay, PhonePe, Paytm), debit or credit cards, netbanking or Apple Pay on Safari. Your order is placed once the payment goes through, and we confirm delivery with you personally.',
          'Payments are processed by Razorpay. We never see or store your card details.',
          'Cash on delivery: your order is placed straight away and you pay the total in cash when it arrives. Nothing is paid at checkout. If you have ever cancelled one of your own orders, cash on delivery is switched off for your account and you pay online instead.',
          'You sign in with Google at checkout, so your orders are saved to your account and you can track them, cancel them or ask for a refund.',
        ],
      },
      {
        heading: 'Returns',
        paragraphs: [
          'Our food products are perishable. For hygiene and safety, we cannot take back food that has been opened or used. Modest wear can be returned within 7 days of delivery if it is unworn and unwashed, with its tags.',
        ],
        link: { label: 'Read Refund & Cancellation', href: '/policies/refund-cancellation' },
      },
      {
        heading: 'Damaged or incorrect items',
        paragraphs: ['If your food order arrives damaged, leaking, wrong, missing an item or past its date:'],
        ordered: true,
        list: [
          'Take a clear photo of the item and its packaging.',
          'Request a refund from Your orders within 48 hours of delivery.',
          'Send the photos to us on WhatsApp with your order number.',
          'We will replace the item or refund it.',
        ],
      },
    ],
  },
  {
    slug: 'refund-cancellation',
    title: 'Refund & Cancellation',
    intro: 'How to cancel an order, and when you can get a refund.',
    description:
      'Cancel your Bold Mount order from Your orders any time before it is dispatched, with a full refund if you paid online. Cancelling turns off cash on delivery for your account. What happens if we cancel, how damaged or wrong food items and modest-wear returns are handled, and how refunds are paid.',
    blocks: [
      {
        heading: 'Cancelling your order',
        paragraphs: ['You can cancel your order yourself from Your orders, any time before it is dispatched.'],
        list: [
          'If you paid online, we refund the full amount, including delivery, to your original payment method. Banks usually take 5–7 working days, and UPI is often sooner.',
          'If you chose cash on delivery, you have not paid anything yet, so there is nothing to refund.',
          'Once you cancel one of your own orders, cash on delivery is switched off for your account, and future orders need to be paid online. If we cancel an order, this does not apply to you.',
          'Once your order is dispatched, it cannot be cancelled. If there is a problem, message us.',
        ],
        link: { label: 'Go to your orders', href: '/orders' },
      },
      {
        heading: 'If we cancel',
        paragraphs: [
          'If an item is out of stock, we cannot deliver to your pincode, or there is a problem with your payment, we cancel the order and refund you in full.',
        ],
      },
      {
        heading: 'Food items',
        paragraphs: [
          'This covers Talbeenah, dates, honey and dry fruits. For hygiene and safety, we cannot take back food that has been opened or used.',
          'If your order arrives damaged, leaking, wrong, missing an item or past its date, request a refund from Your orders within 48 hours of delivery and send us photos on WhatsApp. We will replace it or refund it.',
        ],
      },
      {
        heading: 'Modest wear',
        paragraphs: [
          'Tell us within 7 days of delivery. Unworn, unwashed items with their tags can be exchanged or refunded once we receive them back.',
          'Custom-stitched or altered pieces cannot be returned unless they are faulty.',
        ],
      },
      {
        heading: 'How refunds are paid',
        list: [
          'Online payments go back to the original payment method through Razorpay.',
          'Cash on delivery orders: we pay the refund back to you directly, by cash or UPI, and record it on your order.',
          'We reply to refund requests within 2 working days, and approved refunds are sent within 5–7 working days.',
        ],
      },
      {
        heading: 'Delivery charges',
        paragraphs: ['Delivery charges are refunded when you cancel before dispatch, or when the problem was our mistake.'],
      },
      {
        heading: 'Contact',
        paragraphs: ['Questions about a cancellation or refund? Get in touch:'],
        list: [`Phone: ${SITE.phoneDisplay}`, `WhatsApp: ${SITE.phoneDisplay}`, `Email: ${SITE.email}`],
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    intro: 'We keep this simple: we only use what you send us, and only to look after your order or request.',
    description:
      'What Bold Mount collects, why, and how it is used: the details you give at checkout, or send us on WhatsApp with a question or request, to fulfil your orders and requests. Payments are handled by Razorpay, so we never see or store your card details. We never sell your data.',
    blocks: [
      {
        heading: 'What we collect',
        paragraphs: [
          'Only what you give us: your name, phone number and drop address or shared location at checkout, plus any message or request details you choose to share. For online orders we also keep the payment reference Razorpay returns (such as the payment ID), so we can match your payment to your order.',
        ],
      },
      {
        heading: 'Signing in with Google',
        paragraphs: [
          'You sign in with Google to place an order. Google shares your name, email address and profile picture with us; we use them only to keep your orders in your account so you can track, cancel or ask for a refund. We never see your Google password.',
        ],
      },
      {
        heading: 'How we use it',
        paragraphs: [
          'To confirm and deliver your order, answer your questions and carry out the requests you make, such as Zakat, Umrah Badal or a giveaway. We contact you by phone or WhatsApp for this.',
        ],
      },
      {
        heading: 'Your cart',
        paragraphs: [
          'Your cart is stored in your own browser, on your device. It is not sent to us until you check out and place your order, paying online or choosing cash on delivery. Clearing your browser data removes it.',
        ],
      },
      {
        heading: 'Online payments',
        paragraphs: [
          'Online payments are processed by Razorpay. You enter your card, UPI or netbanking details with Razorpay, not with us, so we never see or store them. Razorpay’s own terms and privacy policy apply to the payment.',
        ],
      },
      {
        heading: 'Visits to this website',
        paragraphs: [
          'To see which pages are useful, we keep a simple record of visits. By default it is anonymous: a random ID in a small cookie, the pages opened, the kind of device (phone, tablet or computer), the time, the website or link that sent you (such as WhatsApp or Google), words typed into our shop search, and whether something was added to a cart, you reached checkout or an order was placed (with its order number). We do not store your IP address or your browser’s details. Only if you are signed in is the record linked to your account, so we can see which customer it was. Records are deleted automatically after 400 days, and visits by the shop owner are not counted.',
        ],
      },
      {
        heading: 'Sharing',
        paragraphs: [
          'We do not sell your data. We share details only with those who need them to complete your order, such as Razorpay for your payment and whoever is delivering it to you.',
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
      'Terms for using the Bold Mount site: prices are in INR and may change, you can pay online (payments are handled by Razorpay) or by cash on delivery, orders are confirmed once we contact you to check availability and delivery, and our services are performed with sincerity per the details you give.',
    blocks: [
      {
        heading: 'Using this site',
        paragraphs: ['By using this site and placing an order, you agree to these terms.'],
      },
      {
        heading: 'Prices and orders',
        paragraphs: [
          'Prices are in Indian rupees (₹). Prices and availability may change. You sign in with Google to place an order. Your order is confirmed once we contact you to check availability and delivery.',
        ],
      },
      {
        heading: 'Payments',
        paragraphs: [
          'You can pay online at checkout with UPI, cards, netbanking or Apple Pay on Safari, or choose cash on delivery and pay in cash when your order arrives. Online payments are processed by Razorpay, and we never see or store your card details. Cash on delivery is not available to a customer who has cancelled one of their own orders before; they pay online.',
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
        heading: 'Cancellations and refunds',
        paragraphs: ['You can cancel an order from Your orders before it is dispatched; this turns off cash on delivery for your account. How cancellations and refunds work is covered in our Refund & Cancellation policy.'],
        link: { label: 'Read Refund & Cancellation', href: '/policies/refund-cancellation' },
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
