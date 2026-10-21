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

// Answers stay in step with the site: orders via cart → WhatsApp; timelines and payment are confirmed there.
export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'orders',
    title: 'Orders & delivery',
    items: [
      {
        q: 'How do I place an order?',
        a: 'Add what you like to your cart, then send the cart to us on WhatsApp. It opens as a ready-made message, so you only press send. We confirm everything with you personally.',
        link: { label: 'Start shopping', href: '/shop' },
      },
      {
        q: 'How does delivery work?',
        a: 'We deliver to your door ourselves. Share your drop address or location at checkout or on WhatsApp, and we confirm the delivery time and any charge with you there before we dispatch.',
        link: { label: 'Read Delivery & Returns', href: '/policies/shipping' },
      },
      {
        q: 'How do I share my location?',
        a: 'At checkout, tap “Use my current location” and allow access. Or in WhatsApp, tap 📎 → Location → Send your current location.',
      },
      {
        q: 'Do you deliver to my area?',
        a: 'Share your drop address or location pin on WhatsApp and we will confirm delivery to you, along with the time and any charge.',
      },
      {
        q: 'Is delivery free?',
        a: `Delivery is free on orders above ${FREE}. For smaller orders we tell you the delivery charge on WhatsApp before your order is final.`,
      },
      {
        q: 'How do I pay?',
        a: 'We share payment details with you on WhatsApp once your order is confirmed.',
      },
      {
        q: 'How long will my order take to arrive?',
        a: 'It depends on what you order and where you are. Once you share your drop address or location, we confirm the delivery time with you on WhatsApp before we dispatch.',
      },
      {
        q: 'Can I return something?',
        a: 'Perishable food cannot be returned once opened. If something arrives damaged or incorrect, send us a photo on WhatsApp at delivery or within 24 hours and we will replace it.',
        link: { label: 'Read Delivery & Returns', href: '/policies/shipping' },
      },
      {
        q: 'Can I order in bulk or as a gift?',
        a: 'Yes. Browse our gift boxes, or message us on WhatsApp with what you have in mind and we will help you put it together.',
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
