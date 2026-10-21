export type ShopSection = 'talbeenah' | 'dates' | 'honey' | 'wearings';

export interface Variant {
  id: string; // e.g. "500g"
  label: string;
  price: number; // rupees
  compareAt?: number;
}

export interface ProductImage {
  src: string;
  alt: string;
}

export interface Product {
  slug: string;
  name: string;
  section: ShopSection;
  tags: ('bestseller' | 'gift' | 'new')[];
  tagline: string;
  description: string;
  highlights: string[];
  details?: { label: string; value: string }[];
  images: ProductImage[];
  variants: Variant[];
  origin?: string;
  badge?: string;
}
