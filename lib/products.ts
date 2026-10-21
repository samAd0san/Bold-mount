import type { Product, ShopSection, Variant } from './types';
import { CAMPAIGN, DRY_FRUITS, PRODUCT_IMG, STOCK } from './media';

// PLACEHOLDER PRICES — sanity-checked against Organo Mart (Oct 2026); replace with Bold Mount's real price list.
const packs = (rows: [string, number, number?][]): Variant[] =>
  rows.map(([label, price, compareAt]) => ({ id: label.toLowerCase().replace(/\s+/g, ''), label, price, compareAt }));

const sizes = (labels: string[], price: number, compareAt?: number): Variant[] =>
  labels.map((label) => ({ id: label.toLowerCase(), label, price, compareAt }));

const DATE_DETAILS = [
  { label: 'Storage', value: 'Cool, dry place; refrigerate for longer freshness' },
  { label: 'Ingredients', value: '100% whole dates — nothing added' },
];

export const PRODUCTS: Product[] = [
  // ── Talbeenah ─────────────────────────────────────────────
  {
    slug: 'premium-roasted-talbeenah',
    name: 'Premium Roasted Talbeenah',
    section: 'talbeenah',
    tags: ['bestseller'],
    badge: 'Bestseller',
    tagline: 'Slow-roasted barley porridge mix — the Sunnah superfood',
    description:
      'Talbeenah is a soft, milky porridge made from finely ground barley — a food the Prophet ﷺ recommended to comfort a grieving heart. We clean, slow-roast and finely mill whole barley so it cooks smooth and nutty in minutes. Nothing else goes in.',
    highlights: [
      '100% whole barley, slow-roasted for a nutty aroma',
      'Naturally rich in fibre, magnesium and potassium',
      'No sugar, preservatives or additives',
      'Ready in about 5–7 minutes with milk or water',
    ],
    details: [
      { label: 'Ingredients', value: 'Roasted whole barley flour' },
      { label: 'How to prepare', value: '2–3 tbsp in a cup of milk or water, stir on low heat until thick; sweeten with honey' },
      { label: 'Storage', value: 'Cool, dry place; keep the pouch sealed' },
    ],
    images: [
      { src: PRODUCT_IMG.talbeenahPouch, alt: 'Bold Mount Talbeenah pouch' },
      { src: CAMPAIGN.pouchesOutdoors, alt: 'Bold Mount Talbeenah pouches outdoors', cover: true },
      { src: CAMPAIGN.talbeenahBlue, alt: 'Talbeenah — recommended by the Prophet ﷺ (Bukhari 5417)' },
    ],
    variants: packs([
      ['250 g', 249, 299],
      ['500 g', 449, 549],
      ['1 kg', 849, 999],
    ]),
  },
  {
    slug: 'talbeenah-duo',
    name: 'Talbeenah Duo (2 × 500 g)',
    section: 'talbeenah',
    tags: ['gift'],
    tagline: 'Two pouches — one for home, one to gift',
    description:
      'Our Premium Roasted Talbeenah in a value pair. Keep one in the kitchen and share the other with someone who could use a little comfort.',
    highlights: ['2 × 500 g pouches', 'Same slow-roasted whole barley', 'Better value than two singles'],
    images: [
      { src: '/images/products/talbeenah-duo.webp', alt: 'Two Bold Mount Talbeenah pouches' },
      { src: PRODUCT_IMG.talbeenahPouch, alt: 'Bold Mount Talbeenah pouch' },
    ],
    variants: packs([['2 × 500 g', 829, 898]]),
  },
  {
    slug: 'sunnah-trio-gift-box',
    name: 'Sunnah Trio Gift Box',
    section: 'talbeenah',
    tags: ['gift', 'bestseller'],
    badge: 'Gift',
    tagline: 'Talbeenah, Sidr honey and Ajwa dates — together',
    description:
      'The three foods of the Sunnah in one thoughtful box: Premium Roasted Talbeenah (500 g), Pure Sidr Honey (250 g) and Ajwa Dates (250 g). A beautiful gift for Ramadan, Eid, a new baby or someone recovering.',
    highlights: ['Talbeenah 500 g', 'Sidr Honey 250 g', 'Ajwa Dates 250 g', 'Gift-ready packing with a note'],
    images: [
      { src: '/images/products/gift-sunnah-trio.webp', alt: 'Sunnah Trio Gift Box' },
      { src: PRODUCT_IMG.talbeenahPouch, alt: 'Talbeenah pouch' },
      { src: PRODUCT_IMG.honeySidr, alt: 'Sidr honey jar' },
    ],
    variants: packs([['Gift box', 1299, 1547]]),
  },

  // ── Dates ─────────────────────────────────────────────────
  {
    slug: 'ajwa-dates',
    name: 'Ajwa Dates — Madinah Premium',
    section: 'dates',
    tags: ['bestseller'],
    badge: 'Bestseller',
    origin: 'Madinah, Saudi Arabia',
    tagline: 'The king of dates — soft, dark and deeply flavourful',
    description:
      'Ajwa is the treasured date of Madinah: small, near-black and soft, with a gentle, prune-like sweetness. "Whoever eats seven Ajwa dates in the morning, nothing will harm him that day" (Sahih al-Bukhari 5445).',
    highlights: ['Grown in the groves of Madinah', 'Soft, dark flesh, mild sweetness', 'Hand-sorted and packed fresh'],
    details: DATE_DETAILS,
    images: [
      { src: PRODUCT_IMG.dates.ajwa, alt: 'Ajwa dates' },
      { src: PRODUCT_IMG.datesPhoto.ajwa, alt: 'Ajwa dates — close-up photo', cover: true },
    ],
    variants: packs([
      ['500 g', 899, 1099],
      ['1 kg', 1699, 1999],
    ]),
  },
  {
    slug: 'medjool-dates',
    name: 'Medjool Dates — Jordanian',
    section: 'dates',
    tags: ['bestseller'],
    origin: 'Jordan Valley',
    tagline: 'Large, succulent, caramel-like',
    description:
      'Big, plump Medjool dates from the Jordan Valley with a rich, caramel texture. Perfect for iftar, stuffing with nuts, or blending into shakes.',
    highlights: ['Jumbo size, moist and soft', 'Caramel and honey notes', 'Great for iftar and gifting'],
    details: DATE_DETAILS,
    images: [
      { src: PRODUCT_IMG.dates.medjool, alt: 'Medjool dates' },
      { src: PRODUCT_IMG.datesPhoto.medjool, alt: 'Medjool dates — close-up photo', cover: true },
    ],
    variants: packs([
      ['500 g', 799, 949],
      ['1 kg', 1499, 1799],
    ]),
  },
  {
    slug: 'safawi-kalmi-dates',
    name: 'Safawi (Kalmi) Madeenah',
    section: 'dates',
    tags: [],
    origin: 'Madinah, Saudi Arabia',
    tagline: 'Deep black, soft and mineral-rich',
    description:
      'Safawi — often called Kalmi — is a long, deep-black Madinah date with a soft bite and a gentle sweetness. An everyday favourite with a premium character.',
    highlights: ['Grown in Madinah', 'Soft and moist', 'Lovely with milk or Talbeenah'],
    details: DATE_DETAILS,
    images: [
      { src: PRODUCT_IMG.dates.safawiKalmi, alt: 'Safawi Kalmi dates' },
      { src: PRODUCT_IMG.datesPhoto.safawiKalmi, alt: 'Safawi Kalmi dates — close-up photo', cover: true },
    ],
    variants: packs([
      ['500 g', 549, 649],
      ['1 kg', 999, 1199],
    ]),
  },
  {
    slug: 'mabroom-dates',
    name: 'Mabroom Premium Saudi',
    section: 'dates',
    tags: [],
    origin: 'Saudi Arabia',
    tagline: 'Slender, firm and high in fibre',
    description:
      'Mabroom dates are long and slender with a firm, chewy texture and a toffee-like sweetness that is never cloying.',
    highlights: ['Firm, chewy bite', 'Toffee-like sweetness', 'Travels well — great for gifting'],
    details: DATE_DETAILS,
    images: [
      { src: PRODUCT_IMG.dates.mabroom, alt: 'Mabroom dates' },
      { src: PRODUCT_IMG.datesPhoto.mabroom, alt: 'Mabroom dates — close-up photo', cover: true },
    ],
    variants: packs([
      ['500 g', 599, 699],
      ['1 kg', 1099, 1299],
    ]),
  },
  {
    slug: 'sukkary-dates',
    name: 'Sukkary — The Golden Date',
    section: 'dates',
    tags: [],
    origin: 'Al-Qassim, Saudi Arabia',
    tagline: 'Crisp, golden and naturally sweet',
    description:
      'Sukkary means "sugary" — a golden, melt-in-the-mouth date from Al-Qassim with a crisp outer layer and a butterscotch finish.',
    highlights: ['Golden colour, delicate skin', 'Naturally very sweet', 'A crowd-pleaser for guests'],
    details: DATE_DETAILS,
    images: [
      { src: PRODUCT_IMG.dates.sukkary, alt: 'Sukkary dates' },
      { src: PRODUCT_IMG.datesPhoto.sukkary, alt: 'Sukkary dates — close-up photo', cover: true },
    ],
    variants: packs([
      ['500 g', 499, 599],
      ['1 kg', 899],
    ]),
  },
  {
    slug: 'zahdi-dates',
    name: 'Zahdi Iraqi',
    section: 'dates',
    tags: [],
    origin: 'Iraq',
    tagline: 'A nutty, semi-dry classic',
    description:
      'Zahdi is a small, golden-brown, semi-dry date with a nutty flavour — wonderful for cooking, baking and everyday snacking.',
    highlights: ['Semi-dry, light texture', 'Nutty, mellow sweetness', 'Great value everyday date'],
    details: DATE_DETAILS,
    images: [
      { src: PRODUCT_IMG.dates.zahdi, alt: 'Zahdi dates' },
      { src: PRODUCT_IMG.datesPhoto.zahdi, alt: 'Zahdi dates — close-up photo', cover: true },
    ],
    variants: packs([
      ['500 g', 249],
      ['1 kg', 449, 499],
    ]),
  },
  {
    slug: 'deglet-noor-dates',
    name: 'Tunisian Deglet Noor',
    section: 'dates',
    tags: [],
    origin: 'Tunisia',
    tagline: 'The "date of light"',
    description:
      'Deglet Noor dates are translucent amber with a delicate, honey-like taste and a firm bite — elegant on a cheese board or in desserts.',
    highlights: ['Translucent amber colour', 'Delicate honey notes', 'Firm, clean bite'],
    details: DATE_DETAILS,
    images: [
      { src: PRODUCT_IMG.dates.degletNoor, alt: 'Deglet Noor dates' },
      { src: PRODUCT_IMG.datesPhoto.degletNoor, alt: 'Deglet Noor dates — close-up photo', cover: true },
    ],
    variants: packs([
      ['500 g', 399, 449],
      ['1 kg', 749, 849],
    ]),
  },
  {
    slug: 'suqai-dates',
    name: 'Suqai',
    section: 'dates',
    tags: [],
    origin: 'Saudi Arabia',
    tagline: 'Two-tone, crisp-tipped and mildly sweet',
    description:
      'Suqai dates are easy to spot — dark at the base and golden at the tip — with a crisp-soft texture and a mild, balanced sweetness.',
    highlights: ['Distinctive two-tone look', 'Crisp tip, soft body', 'Mild, balanced sweetness'],
    details: DATE_DETAILS,
    images: [
      { src: PRODUCT_IMG.dates.suqai, alt: 'Suqai dates' },
      { src: PRODUCT_IMG.datesPhoto.suqai, alt: 'Suqai dates — close-up photo', cover: true },
    ],
    variants: packs([
      ['500 g', 449, 499],
      ['1 kg', 849],
    ]),
  },
  {
    slug: 'safawi-madina-dates',
    name: 'Safawi Madina',
    section: 'dates',
    tags: [],
    origin: 'Madinah, Saudi Arabia',
    tagline: 'Rich and nourishing',
    description: 'A rich, soft Safawi from Madinah — the everyday date for families who break their fast with dates all year.',
    highlights: ['Soft and rich', 'Everyday family date', 'Packed fresh'],
    details: DATE_DETAILS,
    images: [
      { src: PRODUCT_IMG.dates.safawiMadina, alt: 'Safawi Madina dates' },
      { src: PRODUCT_IMG.datesPhoto.safawiMadina, alt: 'Safawi Madina dates — close-up photo', cover: true },
    ],
    variants: packs([
      ['500 g', 499, 579],
      ['1 kg', 949],
    ]),
  },
  {
    slug: 'premium-dates-hamper',
    name: 'Premium Dates Hamper',
    section: 'dates',
    tags: ['gift'],
    badge: 'Gift',
    tagline: 'Ajwa, Safawi and Medjool — 3 × 500 g',
    description:
      'Three of our most-loved dates in one hamper: Ajwa and Safawi (Kalmi) from Madinah, and jumbo Jordanian Medjool. A generous gift for Ramadan, Eid or any family gathering.',
    highlights: ['Ajwa 500 g', 'Safawi (Kalmi) 500 g', 'Medjool 500 g', 'Gift-ready packing'],
    images: [
      { src: '/images/products/gift-dates-hamper.webp', alt: 'Premium Dates Hamper' },
      { src: PRODUCT_IMG.dates.ajwa, alt: 'Ajwa dates' },
    ],
    variants: packs([['Hamper', 1999, 2247]]),
  },

  // ── Honey ─────────────────────────────────────────────────
  {
    slug: 'pure-sidr-honey',
    name: 'Pure Sidr Honey',
    section: 'honey',
    tags: ['bestseller'],
    badge: 'Raw',
    tagline: 'Raw, unheated honey from Sidr (Ber) blossom',
    description:
      'Sidr honey is prized for its thick, buttery texture and deep caramel flavour. Ours is raw and unheated, so it keeps its natural enzymes and aroma. Raw honey can crystallise over time — that is natural; warm the jar gently in water to loosen it.',
    highlights: ['Raw and unheated', 'No added sugar or syrup', 'Thick, buttery, caramel notes', 'Perfect in Talbeenah'],
    details: [
      { label: 'Ingredients', value: '100% pure honey' },
      { label: 'Storage', value: 'Room temperature, away from sunlight; use a dry spoon' },
    ],
    images: [
      { src: PRODUCT_IMG.honeySidr, alt: 'Pure Sidr honey jar' },
      { src: PRODUCT_IMG.honeySidrPhoto, alt: 'Sidr honey dripping from a wooden dipper into a jar', cover: true },
    ],
    variants: packs([
      ['250 g', 349, 399],
      ['500 g', 649, 749],
      ['1 kg', 1199, 1399],
    ]),
  },

  // ── Dry fruits ────────────────────────────────────────────
  {
    slug: 'premium-almonds',
    name: 'Premium Almonds (Badam)',
    section: 'dry-fruits',
    tags: ['new'],
    tagline: 'Whole, crunchy and naturally sweet',
    description:
      'Plump whole almonds with a clean crunch — lovely on their own, soaked overnight, or chopped over Talbeenah with a drizzle of honey.',
    highlights: ['Whole, unbroken kernels', 'No salt, oil or coating', 'Great soaked overnight or roasted'],
    details: [
      { label: 'Ingredients', value: '100% almonds' },
      { label: 'Storage', value: 'Airtight container in a cool, dry place' },
    ],
    images: [
      { src: DRY_FRUITS.almonds, alt: 'Whole almonds' },
      { src: DRY_FRUITS.almondsPhoto, alt: 'Almonds — close-up photo', cover: true },
    ],
    variants: packs([
      ['250 g', 299, 349],
      ['500 g', 549, 649],
      ['1 kg', 1049, 1249],
    ]),
  },
  {
    slug: 'whole-cashews',
    name: 'Whole Cashews (Kaju)',
    section: 'dry-fruits',
    tags: ['new'],
    tagline: 'Creamy, buttery and whole',
    description:
      'Large whole cashews with a soft, buttery bite — perfect for snacking, sweets and festive cooking.',
    highlights: ['Large whole cashews', 'No salt, oil or coating', 'Rich and creamy'],
    details: [
      { label: 'Ingredients', value: '100% cashew nuts' },
      { label: 'Storage', value: 'Airtight container in a cool, dry place' },
    ],
    images: [
      { src: DRY_FRUITS.cashews, alt: 'Whole cashews' },
      { src: DRY_FRUITS.cashewsPhoto, alt: 'Cashews — close-up photo', cover: true },
    ],
    variants: packs([
      ['250 g', 329, 379],
      ['500 g', 629, 729],
      ['1 kg', 1199, 1399],
    ]),
  },
  {
    slug: 'walnut-kernels',
    name: 'Walnut Kernels (Akhrot)',
    section: 'dry-fruits',
    tags: ['new'],
    tagline: 'Light, mellow halves',
    description:
      'Light walnut halves with a mellow, buttery taste — add them to Talbeenah, salads and desserts, or enjoy a handful with dates.',
    highlights: ['Light-coloured halves', 'Shelled and ready to eat', 'Lovely with dates and honey'],
    details: [
      { label: 'Ingredients', value: '100% walnut kernels' },
      { label: 'Storage', value: 'Airtight container; refrigerate in hot weather' },
    ],
    images: [
      { src: DRY_FRUITS.walnuts, alt: 'Walnut kernels' },
      { src: DRY_FRUITS.walnutsPhoto, alt: 'Walnuts — close-up photo', cover: true },
    ],
    variants: packs([
      ['250 g', 449, 499],
      ['500 g', 849, 949],
    ]),
  },
  {
    slug: 'dry-fruit-barfi',
    name: 'Dry Fruit Barfi',
    section: 'dry-fruits',
    tags: ['new', 'gift'],
    badge: 'New',
    tagline: 'Soft squares packed with mixed dry fruits',
    description:
      'Bite-sized squares made with a rich mix of dry fruits — a wholesome sweet for guests, Eid boxes and gifting. Ask us on WhatsApp for the exact mix in the current batch.',
    highlights: ['Packed with mixed dry fruits', 'Square, bite-sized pieces', 'Lovely for gifting'],
    details: [{ label: 'Storage', value: 'Cool, dry place; best within a few weeks of opening' }],
    images: [
      { src: DRY_FRUITS.barfi, alt: 'Dry fruit barfi squares' },
      { src: DRY_FRUITS.barfiPhoto, alt: 'Dry fruit barfi — close-up photo', cover: true },
    ],
    variants: packs([
      ['250 g', 399, 449],
      ['500 g', 749, 849],
    ]),
  },

  // ── Wearings (placeholder range until real stock is photographed) ──
  {
    slug: 'classic-white-thobe',
    name: 'Classic White Thobe',
    section: 'wearings',
    tags: ['new'],
    badge: 'New',
    tagline: 'Breathable, ankle-length, Jumu‘ah-ready',
    description:
      'A clean, ankle-length thobe in soft, breathable fabric with a simple collar and side pockets. Dignified for Jumu‘ah, comfortable for every day.',
    highlights: ['Soft, breathable fabric', 'Ankle length, relaxed fit', 'Side pockets'],
    images: [{ src: STOCK.wear.thobe, alt: 'White thobe' }],
    variants: sizes(['S', 'M', 'L', 'XL'], 1499, 1799),
  },
  {
    slug: 'cotton-kurta-pyjama',
    name: 'Cotton Kurta Pyjama Set',
    section: 'wearings',
    tags: ['new'],
    tagline: 'Everyday comfort in pure cotton',
    description: 'A classic straight-cut kurta with matching pyjama in light cotton — easy for salah, gatherings and daily wear.',
    highlights: ['Pure cotton', 'Straight cut, full sleeves', 'Matching pyjama included'],
    images: [{ src: STOCK.wear.kurta, alt: 'Cotton kurta', cover: true }],
    variants: sizes(['S', 'M', 'L', 'XL'], 1299, 1499),
  },
  {
    slug: 'knitted-kufi-cap',
    name: 'Knitted Kufi Cap',
    section: 'wearings',
    tags: [],
    tagline: 'Light, stretchable prayer cap',
    description: 'A soft knitted kufi that sits comfortably through long prayers. Light enough to keep in a pocket.',
    highlights: ['Soft knit, stretch fit', 'One size fits most', 'Washable'],
    images: [{ src: STOCK.wear.kufi, alt: 'Kufi cap', cover: true }],
    variants: sizes(['White', 'Black'], 199, 249),
  },
  {
    slug: 'classic-abaya',
    name: 'Classic Everyday Abaya',
    section: 'wearings',
    tags: ['new'],
    tagline: 'Flowing, modest and easy to wear',
    description: 'A graceful open-front abaya in a flowing, non-sheer fabric with wide sleeves — simple enough for every day.',
    highlights: ['Flowing, non-sheer fabric', 'Open front with snap', 'Wide, comfortable sleeves'],
    images: [{ src: STOCK.wear.abaya, alt: 'Abaya', cover: true }],
    variants: sizes(['52', '54', '56', '58'], 1799, 2199),
  },
  {
    slug: 'premium-jersey-hijab',
    name: 'Premium Jersey Hijab',
    section: 'wearings',
    tags: [],
    tagline: 'Soft stretch, stays in place',
    description: 'A soft, opaque jersey hijab with a gentle stretch that drapes beautifully and stays in place all day.',
    highlights: ['Opaque, soft jersey', 'Stays in place without slipping', 'Breathable'],
    images: [{ src: STOCK.wear.hijab, alt: 'Folded hijab', cover: true }],
    variants: sizes(['Black', 'Navy', 'Beige'], 399, 449),
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function productsBySection(section: ShopSection): Product[] {
  return PRODUCTS.filter((p) => p.section === section);
}

export const bestsellers = () => PRODUCTS.filter((p) => p.tags.includes('bestseller'));
export const giftProducts = () => PRODUCTS.filter((p) => p.tags.includes('gift'));

export function relatedProducts(product: Product, limit = 4): Product[] {
  const same = PRODUCTS.filter((p) => p.slug !== product.slug && p.section === product.section);
  const others = PRODUCTS.filter((p) => p.slug !== product.slug && p.section !== product.section && p.tags.includes('bestseller'));
  return [...same, ...others].slice(0, limit);
}

export const lowestPrice = (p: Product) => Math.min(...p.variants.map((v) => v.price));
