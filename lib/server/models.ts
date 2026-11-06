import 'server-only';
import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import type { Category, FormEntry, Order, OrderRefund, Product } from '@/lib/types';
import { notify } from '@/lib/server/live';

// Collections in the "boldmount" db: categories, products, orders, users, forms, plus visits/settings/counters (raw driver).

const CategorySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    short: { type: String, default: '', trim: true },
    tagline: { type: String, default: '', trim: true },
    blurb: { type: String, default: '', trim: true },
    image: { type: String, default: '' },
    active: { type: Boolean, default: true },
    sort: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const ProductSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    tags: { type: [String], default: [] },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    highlights: { type: [String], default: [] },
    details: { type: [{ _id: false, label: String, value: String }], default: [] },
    images: { type: [{ _id: false, src: String, alt: String, cover: Boolean }], default: [] },
    variants: { type: [{ _id: false, id: String, label: String, price: Number, compareAt: Number }], default: [] },
    origin: String,
    badge: String,
    active: { type: Boolean, default: true },
    sort: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const OrderSchema = new Schema(
  {
    number: { type: String, required: true, unique: true },
    items: { type: [{ _id: false, slug: String, name: String, variant: String, price: Number, qty: Number, image: String }], default: [] },
    subtotal: Number,
    delivery: Number,
    total: Number,
    customer: {
      name: String,
      mobile: String,
      address: String,
      city: String,
      pincode: String,
      note: String,
      location: { type: { _id: false, lat: Number, lng: Number }, default: undefined },
    },
    userId: { type: String, index: true },
    method: { type: String, enum: ['online', 'cod', 'whatsapp'], required: true },
    payment: { type: String, enum: ['pending', 'paid', 'failed', 'on-whatsapp', 'refunded', 'cod'], default: 'pending' },
    status: { type: String, enum: ['new', 'confirmed', 'dispatched', 'delivered', 'cancelled'], default: 'new' },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: String,
    refund: {
      type: {
        _id: false,
        status: { type: String, enum: ['requested', 'refunded', 'declined', 'failed'] },
        reason: String,
        note: String,
        amount: Number,
        razorpayRefundId: String,
        by: { type: String, enum: ['hand'] },
        reply: String,
        requestedAt: Date,
        updatedAt: Date,
      },
      default: undefined,
    },
    cancelledBy: { type: String, enum: ['customer', 'shop'] },
    refundingAt: Date, // set while a refund is being sent, so two requests can't both send it
    paidAt: Date,
    paymentCheckedAt: Date, // last time Razorpay was asked about this unpaid online order (throttle; never sent to the browser)
    paidLate: Boolean, // paid, but found by the backstop: the customer's checkout never said so (cleared once checkout warns them)
    dispatchedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true },
);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: '' },
    avatar: String,
    googleId: { type: String, index: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

const FormSchema = new Schema(
  {
    form: { type: String, required: true },
    page: { type: String, default: '' },
    fields: { type: [{ _id: false, label: String, value: String }], default: [] },
    read: { type: Boolean, default: false },
    client: String, // hashed IP+UA, for the rate limit
  },
  { timestamps: true },
);

// Every write to an order, form or user tells open admin/customer pages to refetch; hooking the schema catches every route.
const orderChanged = (doc: { _id?: unknown; userId?: string | null } | null) => {
  if (!doc?._id) return;
  const id = String(doc._id);
  notify('admin', 'order', { id });
  if (doc.userId) notify(`orders:${doc.userId}`, 'order', { id });
};
OrderSchema.post('save', orderChanged);
OrderSchema.post('findOneAndUpdate', orderChanged);
OrderSchema.post('updateOne', async function (res: { modifiedCount?: number }) {
  if (res?.modifiedCount) orderChanged(await this.model.findById(this.getFilter()._id, { userId: 1 }).lean<{ _id: unknown; userId?: string }>());
});
FormSchema.post(['save', 'findOneAndUpdate', 'findOneAndDelete'], () => notify('admin', 'form'));
UserSchema.post('save', () => notify('admin', 'user'));

// Reuse compiled models across dev hot reloads.
const model = <S extends Schema>(name: string, schema: S, collection: string) =>
  (mongoose.models[name] as Model<InferSchemaType<S>>) ?? mongoose.model(name, schema, collection);

export const CategoryModel = model('Category', CategorySchema, 'categories');
export const ProductModel = model('Product', ProductSchema, 'products');
export const OrderModel = model('Order', OrderSchema, 'orders');
export const UserModel = model('User', UserSchema, 'users');
export const FormModel = model('Form', FormSchema, 'forms');

/* eslint-disable @typescript-eslint/no-explicit-any -- lean() docs are plain objects; mapped field by field below. */
const iso = (d: any) => (d ? new Date(d).toISOString() : undefined);

export const toCategory = (d: any): Category => ({
  id: String(d._id), slug: d.slug, name: d.name, short: d.short || d.name, tagline: d.tagline ?? '', blurb: d.blurb ?? '',
  image: d.image ?? '', active: d.active !== false, sort: d.sort ?? 0,
});

export const toProduct = (d: any): Product => ({
  id: String(d._id), slug: d.slug, name: d.name, category: d.category, tags: d.tags ?? [], tagline: d.tagline ?? '',
  description: d.description ?? '', highlights: d.highlights ?? [], details: d.details ?? [],
  images: (d.images ?? []).map((i: any) => ({ src: i.src, alt: i.alt ?? '', ...(i.cover ? { cover: true } : {}) })),
  variants: (d.variants ?? []).map((v: any) => ({ id: v.id, label: v.label ?? '', price: v.price, ...(v.compareAt ? { compareAt: v.compareAt } : {}) })),
  ...(d.origin ? { origin: d.origin } : {}), ...(d.badge ? { badge: d.badge } : {}),
  active: d.active !== false, sort: d.sort ?? 0,
});

const toRefund = (r: any): OrderRefund => ({
  status: r.status, reason: r.reason ?? '', ...(r.note ? { note: r.note } : {}), amount: r.amount ?? 0,
  ...(r.razorpayRefundId ? { razorpayRefundId: r.razorpayRefundId } : {}), ...(r.by ? { by: r.by } : {}), ...(r.reply ? { reply: r.reply } : {}),
  requestedAt: iso(r.requestedAt)!, updatedAt: iso(r.updatedAt)!,
});

export const toOrder = (d: any): Order => ({
  id: String(d._id), number: d.number, items: d.items ?? [], subtotal: d.subtotal, delivery: d.delivery, total: d.total,
  customer: d.customer, ...(d.userId ? { userId: d.userId } : {}), method: d.method, payment: d.payment, status: d.status,
  ...(d.razorpayOrderId ? { razorpayOrderId: d.razorpayOrderId } : {}), ...(d.razorpayPaymentId ? { razorpayPaymentId: d.razorpayPaymentId } : {}),
  ...(d.refund ? { refund: toRefund(d.refund) } : {}), ...(d.cancelledBy ? { cancelledBy: d.cancelledBy } : {}),
  createdAt: iso(d.createdAt)!, ...(d.paidAt ? { paidAt: iso(d.paidAt) } : {}), ...(d.dispatchedAt ? { dispatchedAt: iso(d.dispatchedAt) } : {}),
  ...(d.deliveredAt ? { deliveredAt: iso(d.deliveredAt) } : {}), ...(d.cancelledAt ? { cancelledAt: iso(d.cancelledAt) } : {}),
});

export const toForm = (d: any): FormEntry => ({
  id: String(d._id), form: d.form, page: d.page ?? '', fields: d.fields ?? [], read: !!d.read, createdAt: iso(d.createdAt)!,
});
