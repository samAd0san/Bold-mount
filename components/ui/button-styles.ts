import { cn } from '@/lib/utils';

export type ButtonVariant = 'gold' | 'navy' | 'outline' | 'outline-light' | 'whatsapp';

const variants: Record<ButtonVariant, string> = {
  gold: 'bg-gold text-night hover:bg-gold-bright shadow-gold/0 hover:shadow-gold',
  navy: 'bg-navy text-on-night hover:bg-night',
  outline: 'border border-navy/30 text-navy hover:border-navy hover:bg-navy hover:text-on-night',
  'outline-light': 'border border-on-night/40 text-on-night hover:bg-on-night/10',
  whatsapp: 'bg-whatsapp text-white hover:brightness-105',
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-300 ease-expo disabled:pointer-events-none disabled:opacity-50';

/** Class string for pill buttons/links — use on <Link>, <a> or <button>. */
export function buttonClass(variant: ButtonVariant = 'gold', className?: string) {
  return cn(base, variants[variant], className);
}
