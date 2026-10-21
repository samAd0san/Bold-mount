'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, SlidersHorizontal, X } from 'lucide-react';
import { buttonClass } from '@/components/ui/button-styles';
import { cn } from '@/lib/utils';
import { PRICE_OPTIONS, activeFilterCount, shopHref, type ShopPrice, type ShopQuery } from './shop-query';

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label
      className={cn(
        'flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors',
        checked ? 'border-navy bg-pearl' : 'border-line bg-cream hover:border-navy',
      )}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-deep',
          checked ? 'border-gold-deep bg-gold text-night' : 'border-ink-soft/50 bg-pearl',
        )}
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-xs text-ink-soft">{hint}</span>
      </span>
    </label>
  );
}

// Mounted only while open, so the draft picks up the current URL values every time it opens.
function FilterForm({ query, onDone }: { query: ShopQuery; onDone: () => void }) {
  const router = useRouter();
  const [price, setPrice] = useState<ShopPrice>(query.price);
  const [sale, setSale] = useState(query.sale);
  const [gift, setGift] = useState(query.gift);

  const apply = (e: FormEvent) => {
    e.preventDefault();
    router.push(shopHref({ ...query, price, sale, gift }), { scroll: false });
    onDone();
  };

  return (
    <form onSubmit={apply} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-ink">Price</legend>
          <div className="flex flex-wrap gap-2">
            {PRICE_OPTIONS.map((o) => (
              <label key={o.value} className="relative">
                <input
                  type="radio"
                  name="price"
                  value={o.value}
                  checked={price === o.value}
                  onChange={() => setPrice(o.value)}
                  className="peer sr-only"
                />
                <span className="flex min-h-11 cursor-pointer items-center rounded-full border border-line bg-cream px-4 text-sm font-medium text-ink transition-colors hover:border-navy peer-checked:border-navy peer-checked:bg-navy peer-checked:text-on-night peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-deep">
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-ink">Offers</legend>
          <Toggle label="On sale only" hint="Products with a reduced price" checked={sale} onChange={setSale} />
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-ink">Type</legend>
          <Toggle label="Gift boxes only" hint="Gift-ready sets and hampers" checked={gift} onChange={setGift} />
        </fieldset>
      </div>

      <div className="flex gap-3 border-t border-line bg-pearl px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => {
            setPrice('any');
            setSale(false);
            setGift(false);
          }}
          className={buttonClass('outline', 'h-11 flex-1 py-0')}
        >
          Clear
        </button>
        <button type="submit" className={buttonClass('gold', 'h-11 flex-[2] py-0')}>
          Apply filters
        </button>
      </div>
    </form>
  );
}

/** "Filter" button + a panel: bottom sheet on phones, right-hand drawer on desktop. Radix handles Esc, focus trap and focus return. */
export function ShopFilterDrawer({ query }: { query: ShopQuery }) {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(query);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={buttonClass('navy', 'h-11 shrink-0 py-0 pr-5 pl-4')}>
          <SlidersHorizontal size={16} aria-hidden />
          Filter
          {count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.7rem] font-bold text-night">
              {count}
              <span className="sr-only"> active</span>
            </span>
          )}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-night/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-[81] flex max-h-[88dvh] flex-col rounded-t-3xl bg-pearl shadow-2xl outline-none',
            'md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[26rem] md:rounded-none',
            'data-[state=open]:animate-in data-[state=open]:duration-300 data-[state=open]:slide-in-from-bottom md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=open]:slide-in-from-right',
            'data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=closed]:slide-out-to-bottom md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=closed]:slide-out-to-right',
          )}
        >
          <span aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line md:hidden" />
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <Dialog.Title className="text-lg text-ink">Filter products</Dialog.Title>
            <Dialog.Close
              aria-label="Close filters"
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-sand/60"
            >
              <X size={20} aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Narrow the products by price, offers and type.</Dialog.Description>
          <FilterForm query={query} onDone={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
