import { formatINR } from '@/lib/format';
import { SITE } from '@/lib/site';

export interface FaqItem {
  q: string;
  a: string;
  link?: { label: string; href: string };
}

export interface FaqGroup {
  id: string;
  title: string;
  items: FaqItem[];
}

const FREE = formatINR(SITE.freeShippingAbove);

// Answers stay in step with the site: two ways to pay (online or cash on delivery); delivery time is confirmed with each customer.
export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'orders',
    title: 'Orders & delivery',
    items: [
      {
        q: 'How do I place an order?',
        a: 'Add what you like to your cart, sign in with Google, then check out. Pay online (UPI, cards, netbanking) or cash on delivery. An online order is placed once the payment goes through, a cash on delivery order straight away, and we confirm delivery with you.',
        link: { label: 'Start shopping', href: '/shop' },
      },
      {
        q: 'How does delivery work?',
        a: 'We deliver to your door ourselves. Share your drop address or location at checkout, and we confirm the delivery time with you before we dispatch.',
        link: { label: 'Read Delivery & Returns', href: '/policies/shipping' },
      },
      {
        q: 'How do I share my location?',
        a: 'At checkout, tap “Use my current location” and allow access, or just type your drop address.',
      },
      {
        q: 'Do you deliver to my area?',
        a: 'Enter your drop address and pincode at checkout and we confirm delivery and the time with you before we dispatch. Not sure we reach you? Message your pincode to us on WhatsApp before you order and we will check.',
      },
      {
        q: 'Is delivery free?',
        a: `Delivery is ${formatINR(SITE.deliveryFee)} per order, and free on orders of ${FREE} or more. The charge is shown in your cart before you pay.`,
      },
      {
        q: 'How do I pay?',
        a: 'At checkout you choose one of two ways to pay. Pay online (UPI, cards, netbanking): UPI (Google Pay, PhonePe, Paytm), debit or credit cards, netbanking or Apple Pay on Safari, handled by Razorpay, so we never see or store your card details. Or choose cash on delivery and pay in cash when your order arrives.',
      },
      {
        q: 'Can I pay cash on delivery?',
        a: 'Yes. Choose “Cash on delivery” at checkout, and you pay the total in cash when your order arrives. If you have ever cancelled one of your own orders, cash on delivery is switched off for your account and you pay online instead.',
      },
      {
        q: 'How long will my order take to arrive?',
        a: 'It depends on what you order and where you are. Once you share your drop address or location, we confirm the delivery time with you before we dispatch.',
      },
      {
        q: 'Can I return something?',
        a: 'For hygiene and safety, we cannot take back food that has been opened or used. If food arrives damaged, leaking, wrong, missing an item or past its date, request a refund from Your orders within 48 hours of delivery and send us photos on WhatsApp. We will replace it or refund it. Modest wear can be returned within 7 days of delivery if it is unworn and unwashed, with its tags.',
        link: { label: 'Read Refund & Cancellation', href: '/policies/refund-cancellation' },
      },
      {
        q: 'Can I cancel?',
        a: 'Yes, any time before your order is dispatched. Sign in, open Your orders, choose the order and press “Cancel order”. If you paid online, the full amount, including delivery, goes back to your original payment method. Banks usually take 5–7 working days, and UPI is often sooner. If you chose cash on delivery, you have not paid anything, so there is nothing to refund. Once you cancel one of your own orders, cash on delivery is switched off for your account and future orders need to be paid online. Once an order is dispatched it cannot be cancelled, so message us if there is a problem.',
        link: { label: 'Go to your orders', href: '/orders' },
      },
      {
        q: 'How do refunds work?',
        a: 'Online payments go back to the original payment method through Razorpay. If you cancel before dispatch, a paid online order is refunded automatically. For a problem with a delivered order, request a refund from Your orders and we reply within 2 working days; approved refunds are sent within 5–7 working days. For a cash on delivery order, we pay the refund back to you directly, by cash or UPI, and record it on your order.',
        link: { label: 'Read Refund & Cancellation', href: '/policies/refund-cancellation' },
      },
      {
        q: 'Can I order in bulk or as a gift?',
        a: 'Yes. Browse our gift boxes and check out on the website, or ask us on WhatsApp if you have a bulk or custom gift in mind and we will help you put it together.',
        link: { label: 'See gift boxes', href: '/shop?filter=gifts' },
      },
    ],
  },
  {
    id: 'products',
    title: 'Products',
    items: [
      {
        q: 'How do I prepare Talbeenah?',
        a: 'Stir 2–3 tablespoons into a cup of milk or water and cook on low heat, stirring until it thickens. Sweeten with honey.',
        link: { label: 'Shop Talbeenah', href: '/talbeenah' },
      },
      {
        q: 'Why is Talbeenah called a Sunnah food?',
        a: 'The Prophet ﷺ said that Talbeenah “gives rest to the heart of the sick person and relieves some of his sorrow” (Sahih al-Bukhari 5417). Barley is also naturally rich in fibre, magnesium and potassium.',
      },
      {
        q: 'Are your products natural?',
        a: 'Our Talbeenah is just roasted whole barley, our dates are whole dates with nothing added, and our Sidr honey is pure honey. Each food product page lists what is in it.',
      },
      {
        q: 'My honey has turned thick or grainy. Is it spoiled?',
        a: 'No, crystallisation is natural for raw honey. To loosen it, stand the sealed jar in a bowl of warm (not boiling) water for a while and stir gently.',
      },
      {
        q: 'How should I store dates, honey and Talbeenah?',
        a: 'Keep dates in a cool, dry place, or in the fridge for longer freshness. Store honey at room temperature, away from sunlight, and use a dry spoon. Keep the Talbeenah pouch sealed in a cool, dry place.',
      },
    ],
  },
  {
    id: 'serve',
    title: 'Serve & Give',
    items: [
      {
        q: 'Where does my Zakat go?',
        a: 'Zakat goes only to eligible recipients, as set out in the Qur’an (9:60). Message us on WhatsApp and we will explain how it works before you give.',
        link: { label: 'Zakat for the Needy', href: '/zakat' },
      },
      {
        q: 'How does Umrah Badal work?',
        a: 'Umrah Badal is an Umrah performed on behalf of someone who cannot travel, such as a parent or loved one. It is performed by someone who has already done their own Umrah, and we share photo and video updates with you.',
        link: { label: 'Umrah on Behalf', href: '/umrah' },
      },
      {
        q: 'Are the Qur’an giveaways really free?',
        a: 'Yes. Giveaways are free while stock lasts. Send us a request and we will confirm on WhatsApp.',
        link: { label: 'Request a free copy', href: '/giveaway' },
      },
      {
        q: 'What is volunteer guidance?',
        a: 'Free business set-up advice, job consultation and career guidance from people who care, at no cost to you.',
        link: { label: 'Get free guidance', href: '/volunteer' },
      },
      {
        q: 'How can I help with Khidmat-e-Khalq?',
        a: 'Message us on WhatsApp and tell us how you would like to help. We arrange food drives, ration kits and support for families going through hard times.',
        link: { label: 'Join the effort', href: '/khidmat-e-khalq' },
      },
      {
        q: 'What happens with the share of each order?',
        a: 'A share of every order supports people in need through our Serve & Give work. You can ask us about it any time on WhatsApp.',
      },
    ],
  },
];
