import type { Category } from '../types';
import { DRY_FRUITS, PRODUCT_IMG, STOCK } from '../media';

// Seed data only (npm run seed): the five shop categories as they were before the admin existed.
export const SEED_CATEGORIES: Omit<Category, 'id' | 'active'>[] = [
  { slug: 'talbeenah', name: 'Talbeenah', short: 'Talbeenah', tagline: 'The Sunnah superfood', blurb: 'Slow-roasted barley porridge mix that soothes the heart and fuels the day.', image: PRODUCT_IMG.talbeenahPhoto, sort: 1 },
  { slug: 'dates', name: 'Premium Dates', short: 'Dates', tagline: 'Hand-picked from blessed lands', blurb: 'Ajwa, Medjool, Safawi and more — sourced from Madinah, Jordan and beyond.', image: PRODUCT_IMG.dates.ajwa, sort: 2 },
  { slug: 'honey', name: 'Sidr Honey', short: 'Honey', tagline: 'Raw, rich and unheated', blurb: 'Pure Sidr honey — "a drink of varying colours, wherein is healing for people."', image: PRODUCT_IMG.honeySidr, sort: 3 },
  { slug: 'dry-fruits', name: 'Dry Fruits', short: 'Dry Fruits', tagline: 'Almonds, cashews, walnuts & barfi', blurb: 'Crunchy whole nuts and a soft mixed dry-fruit barfi — for daily snacking, guests and gifting.', image: DRY_FRUITS.tile, sort: 4 },
  { slug: 'wearings', name: 'Modest Wear', short: 'Wearings', tagline: 'Simple, dignified, comfortable', blurb: 'Thobes, kurtas, kufis, abayas and hijabs for everyday and Jumu‘ah.', image: STOCK.wear.kurta, sort: 5 },
];
