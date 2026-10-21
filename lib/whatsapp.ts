import { SITE } from './site';
import { formatINR } from './format';

export function whatsappLink(text: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function whatsappGeneralLink(): string {
  return whatsappLink('Assalamu alaikum Bold Mount, I have a question.');
}

export function whatsappProductLink(name: string, variant: string, price: number, slug: string): string {
  return whatsappLink(
    [
      'Assalamu alaikum Bold Mount, I would like to order:',
      '',
      `${name} (${variant}) — ${formatINR(price)}`,
      `${SITE.url}/product/${slug}`,
    ].join('\n'),
  );
}

export type OrderLine = { name: string; variant: string; price: number; qty: number };

/** Full order message for checkout; `customer` lines are appended as "Label: value", then an optional closing line. */
export function whatsappOrderLink(lines: OrderLine[], customer: Record<string, string> = {}, closing?: string): string {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const delivery = subtotal >= SITE.freeShippingAbove ? 'Free' : 'To be confirmed';
  const details = Object.entries(customer).filter(([, v]) => v.trim());
  return whatsappLink(
    [
      'Assalamu alaikum Bold Mount, I would like to place an order:',
      '',
      ...lines.map((l) => `• ${l.name} (${l.variant}) × ${l.qty} — ${formatINR(l.price * l.qty)}`),
      '',
      `Subtotal: ${formatINR(subtotal)}`,
      `Delivery: ${delivery}`,
      ...(details.length ? ['', ...details.map(([k, v]) => `${k}: ${v}`)] : []),
      ...(closing ? ['', closing] : []),
    ].join('\n'),
  );
}

/** Service request (Zakat, Umrah Badal, giveaway…) — a title line plus "Label: value" fields. */
export function whatsappFormLink(title: string, fields: Record<string, string>): string {
  const rows = Object.entries(fields).filter(([, v]) => v.trim());
  return whatsappLink(
    ['Assalamu alaikum Bold Mount,', title, '', ...rows.map(([k, v]) => `${k}: ${v}`)].join('\n'),
  );
}
