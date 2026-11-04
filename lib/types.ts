// Shared shapes for the store, the API and the admin. Prices are whole rupees.

export type ProductTag = 'bestseller' | 'gift' | 'new';
export const PRODUCT_TAGS: ProductTag[] = ['bestseller', 'gift', 'new'];

export interface Variant {
  id: string; // e.g. "500g"
  label: string; // "500 g", "M"; empty when the product comes in one version only (e.g. a book)
  price: number;
  compareAt?: number;
}

export interface ProductImage {
  src: string; // /images/... (bundled) or a Cloudinary URL
  alt: string;
  cover?: boolean; // full photo that should fill its tile (cut-outs stay contained)
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string; // Category.slug
  tags: ProductTag[];
  tagline: string;
  description: string;
  highlights: string[];
  details: { label: string; value: string }[];
  images: ProductImage[];
  variants: Variant[];
  origin?: string;
  badge?: string;
  active: boolean;
  sort: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string; // "Premium Dates"
  short: string; // chip label, "Dates"
  tagline: string;
  blurb: string;
  image: string;
  active: boolean;
  sort: number;
}

/** Everything the storefront shows, in one payload (GET /api/catalog). */
export interface Catalog {
  categories: Category[];
  products: Product[];
}

export interface OrderItem {
  slug: string;
  name: string;
  variant: string;
  price: number;
  qty: number;
  image?: string;
}

export interface OrderCustomer {
  name: string;
  mobile: string;
  address: string;
  city: string;
  pincode: string;
  note: string;
  location?: { lat: number; lng: number };
}

export type OrderMethod = 'online' | 'whatsapp';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'on-whatsapp' | 'refunded';
export type OrderStatus = 'new' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
export const ORDER_STATUSES: OrderStatus[] = ['new', 'confirmed', 'dispatched', 'delivered', 'cancelled'];
/** The customer can cancel in these statuses (before it leaves the shop). */
export const CANCELLABLE: OrderStatus[] = ['new', 'confirmed'];
/** Days after delivery the customer can still ask for a refund. */
export const REFUND_REQUEST_DAYS = 7;
export const REFUND_REASONS = ['Damaged or leaking', 'Wrong item', 'Item missing', 'Expired or quality issue', 'Size or fit (modest wear)', 'Other'] as const;

/** requested = customer asked, waiting for the shop; refunded = money sent back via Razorpay; failed = Razorpay refused, retry from admin. */
export type RefundStatus = 'requested' | 'refunded' | 'declined' | 'failed';
export interface OrderRefund {
  status: RefundStatus;
  reason: string;
  note?: string;
  amount: number; // rupees asked for / sent back
  razorpayRefundId?: string;
  reply?: string; // shop's note to the customer (e.g. why declined)
  requestedAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  number: string; // "BM-1001"
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
  customer: OrderCustomer;
  userId?: string;
  method: OrderMethod;
  payment: PaymentStatus;
  status: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  refund?: OrderRefund;
  cancelledBy?: 'customer' | 'shop';
  createdAt: string;
  paidAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

/** A form someone filled on the site (contact, zakat pledge, volunteer, giveaway, umrah…). */
export interface FormEntry {
  id: string;
  form: string; // the form's title
  page: string; // path it was sent from
  fields: { label: string; value: string }[];
  read: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
