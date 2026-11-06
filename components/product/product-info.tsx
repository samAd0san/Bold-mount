import { Check, ChevronDown, Lock, MapPin, PackageCheck, Truck } from 'lucide-react';
import { deliveryWords, type DeliverySettings } from '@/lib/delivery';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ProductPurchase } from './product-purchase';

const ARABIC: Record<string, string> = { talbeenah: 'تلبينة', dates: 'تمر', honey: 'عسل' };
// "Freshly packed" only makes sense for food; books, wear and anything added later are "Carefully packed".
const FOOD = new Set(['talbeenah', 'dates', 'honey', 'dry-fruits']);

/** The product page's text column: labels, name, price and sizes, assurances, about and detail rows. Also drives the admin preview (`preview` = phone sizes, no page-level headings). */
export function ProductInfo({ product, categoryName, delivery, preview = false }: { product: Product; categoryName?: string; delivery: DeliverySettings; preview?: boolean }) {
  const Title = preview ? 'h3' : 'h1';
  const Sub = preview ? 'h4' : 'h2';
  const words = deliveryWords(delivery);
  const details = [
    ...(product.details ?? []),
    {
      label: 'Delivery & payment',
      value: `Pay online (UPI, cards, netbanking) or cash on delivery. Online payments are handled by Razorpay, so we never see or store your card details. ${words.sentence} We deliver to your door and confirm the delivery time with you before we dispatch.`,
    },
  ];
  const assurances = [
    { icon: Truck, label: words.label },
    { icon: PackageCheck, label: FOOD.has(product.category) ? 'Freshly packed' : 'Carefully packed' },
    { icon: Lock, label: 'Secure checkout' },
  ];

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {product.badge && (
          <span className="rounded-full bg-gold px-2.5 py-1 text-[0.68rem] font-bold tracking-wide text-night uppercase">
            {product.badge}
          </span>
        )}
        {categoryName && <span className="eyebrow">{categoryName}</span>}
        {product.origin && (
          <span className="flex items-center gap-1 text-sm text-ink-soft">
            <MapPin size={14} className="text-gold-ink" /> {product.origin}
          </span>
        )}
        {ARABIC[product.category] && (
          <span lang="ar" dir="rtl" className="ml-auto font-arabic text-xl text-gold-ink">
            {ARABIC[product.category]}
          </span>
        )}
      </div>

      <Title className={cn('mt-4 text-3xl leading-[1.1] break-words text-ink', !preview && 'md:text-[2.75rem]')}>{product.name}</Title>
      {product.tagline && <p className="mt-3 text-lg leading-relaxed text-ink-soft">{product.tagline}</p>}
      <div className="rule-gold my-6" />

      <ProductPurchase product={product} />

      <ul className="mt-6 grid grid-cols-3 gap-2">
        {assurances.map(({ icon: Icon, label }) => (
          <li key={label} className="flex flex-col items-center gap-2 rounded-xl bg-pearl px-2 py-3 text-center ring-1 ring-line ring-inset">
            <Icon size={18} className="text-gold-ink" />
            <span className="text-[0.72rem] leading-snug font-medium text-ink">{label}</span>
          </li>
        ))}
      </ul>

      {(product.description || product.highlights.length > 0) && (
        <div className="mt-10">
          <Sub className="text-xl text-ink">About this product</Sub>
          <p className="mt-3 leading-relaxed whitespace-pre-line text-ink-soft">{product.description}</p>
          <ul className="mt-5 space-y-3">
            {product.highlights.map((h, i) => (
              <li key={`${i}-${h}`} className="flex items-start gap-3 text-ink">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold">
                  <Check size={12} strokeWidth={3} className="text-night" />
                </span>
                <span className="leading-relaxed">{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 divide-y divide-line overflow-hidden rounded-2xl bg-pearl ring-1 ring-line ring-inset">
        {details.map((d, i) => (
          <details key={`${i}-${d.label}`} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-ink [&::-webkit-details-marker]:hidden">
              {d.label}
              <ChevronDown size={18} className="shrink-0 text-ink-soft transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed whitespace-pre-line text-ink-soft">{d.value}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
