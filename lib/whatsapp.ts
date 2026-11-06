import { SITE } from './site';

export function whatsappLink(text: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function whatsappGeneralLink(): string {
  return whatsappLink('Assalamu alaikum Bold Mount, I have a question.');
}

/** Service request (Zakat, Umrah Badal, giveaway…) — a title line plus "Label: value" fields. */
export function whatsappFormLink(title: string, fields: Record<string, string>): string {
  const rows = Object.entries(fields).filter(([, v]) => v.trim());
  return whatsappLink(
    ['Assalamu alaikum Bold Mount,', title, '', ...rows.map(([k, v]) => `${k}: ${v}`)].join('\n'),
  );
}
