'use client';

import { useId, useState } from 'react';
import { HandCoins } from 'lucide-react';
import { formatINR } from '@/lib/format';
import { buttonClass } from '@/components/ui/button-styles';
import { cn } from '@/lib/utils';
import { prefillAndScroll } from './prefill';

const ASSETS = [
  { key: 'cash', label: 'Cash & bank savings', hint: 'At home and in all your accounts' },
  { key: 'gold', label: 'Gold (today’s value)', hint: 'Include jewellery as your madhhab requires' },
  { key: 'silver', label: 'Silver (today’s value)', hint: 'Coins, bars and silverware' },
  { key: 'stock', label: 'Business stock', hint: 'Goods held for sale, at today’s value' },
  { key: 'owed', label: 'Money owed to you', hint: 'Loans you expect to get back' },
] as const;

const NISAB_GRAMS = { gold: 87.48, silver: 612.36 } as const;
type Basis = keyof typeof NISAB_GRAMS;

const INPUT =
  'w-full rounded-xl border border-line bg-pearl py-3 pr-4 pl-9 text-base text-ink placeholder:text-ink-soft/60 transition-colors focus:border-navy focus:outline-none md:text-sm';

// Accepts "1,50,000" or "150000.50"; anything unreadable counts as 0.
const toNum = (s = '') => {
  const n = Number(s.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

function Money({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-soft" aria-hidden>
          ₹
        </span>
        <input
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT}
        />
      </span>
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

/** Simple Zakat estimate (2.5% of zakatable wealth) with an optional nisab check; pre-fills the pledge form. */
export function ZakatCalculator({ formId, targetId }: { formId: string; targetId: string }) {
  const uid = useId();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [basis, setBasis] = useState<Basis>('silver');
  const set = (k: string) => (v: string) => setVals((s) => ({ ...s, [k]: v }));

  const assets = ASSETS.reduce((sum, a) => sum + toNum(vals[a.key]), 0);
  const wealth = Math.max(0, assets - toNum(vals.debts));
  const due = Math.round(wealth * 0.025);
  const rate = toNum(vals.rate);
  const nisab = Math.round(rate * NISAB_GRAMS[basis]);
  const belowNisab = nisab > 0 && wealth < nisab;

  return (
    <div className="grid overflow-hidden rounded-2xl bg-pearl shadow-card ring-1 ring-line lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="p-5 sm:p-8">
        <p className="eyebrow">What you own today</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {ASSETS.map((a) => (
            <Money key={a.key} label={a.label} hint={a.hint} value={vals[a.key] ?? ''} onChange={set(a.key)} />
          ))}
          <Money
            label="Minus debts due now"
            hint="Bills, rent or instalments you must pay now"
            value={vals.debts ?? ''}
            onChange={set('debts')}
          />
        </div>

        <fieldset className="mt-8 rounded-xl border border-line p-4 sm:p-5">
          <legend className="px-1 text-sm font-medium text-ink">Nisab check (optional)</legend>
          <p className="text-xs leading-relaxed text-ink-soft">
            Pick a standard and enter today’s rate per gram. Ask a scholar you trust which standard to follow.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div role="radiogroup" aria-label="Nisab standard" className="grid grid-cols-2 gap-1 self-end rounded-full bg-sand p-1">
              {(Object.keys(NISAB_GRAMS) as Basis[]).map((b) => (
                <label
                  key={b}
                  className="flex min-h-11 cursor-pointer items-center justify-center rounded-full px-3 text-center text-xs font-semibold text-ink-soft transition-colors has-checked:bg-navy has-checked:text-on-night has-focus-visible:ring-2 has-focus-visible:ring-gold-deep"
                >
                  <input
                    type="radio"
                    name={`${uid}-basis`}
                    value={b}
                    checked={basis === b}
                    onChange={() => setBasis(b)}
                    className="sr-only"
                  />
                  {b === 'gold' ? 'Gold' : 'Silver'} · {NISAB_GRAMS[b]} g
                </label>
              ))}
            </div>
            <Money label={`Today’s ${basis} rate (per gram)`} value={vals.rate ?? ''} onChange={set('rate')} />
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col bg-navy bg-lattice p-6 text-on-night sm:p-8">
        <p className="eyebrow text-gold">Your Zakat</p>
        <dl className="mt-5 space-y-5" aria-live="polite">
          <div>
            <dt className="text-sm text-on-night-soft">Zakatable wealth</dt>
            <dd className="mt-1 text-2xl font-semibold">{formatINR(wealth)}</dd>
          </div>
          <div>
            <dt className="text-sm text-on-night-soft">Zakat due (2.5%)</dt>
            <dd className={cn('mt-1 text-4xl font-semibold md:text-5xl', belowNisab ? 'text-on-night-soft line-through' : 'text-gold')}>
              {formatINR(due)}
            </dd>
          </div>
          {nisab > 0 && (
            <div className="rounded-xl bg-night/40 p-4 text-sm">
              <dt className="text-on-night-soft">
                Nisab ({NISAB_GRAMS[basis]} g {basis})
              </dt>
              <dd className="mt-1">
                <span className="font-semibold">{formatINR(nisab)}</span> —{' '}
                {belowNisab ? 'your wealth is below the nisab, so Zakat is not due.' : 'your wealth is above the nisab.'}
              </dd>
            </div>
          )}
        </dl>

        {belowNisab ? (
          <button
            type="button"
            onClick={() => prefillAndScroll(formId, { type: 'Sadaqah' }, targetId)}
            className={buttonClass('outline-light', 'mt-7 w-full')}
          >
            <HandCoins size={18} aria-hidden /> Give Sadaqah instead
          </button>
        ) : (
          <button
            type="button"
            disabled={due <= 0}
            onClick={() => prefillAndScroll(formId, { type: 'Zakat', amount: String(due) }, targetId)}
            className={buttonClass('gold', 'mt-7 w-full')}
          >
            <HandCoins size={18} aria-hidden /> Pledge this amount
          </button>
        )}

        <p className="mt-6 text-xs leading-relaxed text-on-night-soft">
          Zakat is due only if your zakatable wealth stays above the nisab — the value of 87.48 g of gold or 612.36 g
          of silver — for a full lunar (Hijri) year. This is a simple guide, not a fatwa; for shares, property or
          other complex cases, please ask a scholar.
        </p>
      </div>
    </div>
  );
}
