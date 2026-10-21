'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { whatsappFormLink } from '@/lib/whatsapp';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { cn } from '@/lib/utils';

export interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'tel' | 'email' | 'number' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  full?: boolean; // span both columns on desktop
}

const INPUT =
  'w-full rounded-xl border border-line bg-pearl px-4 py-3 text-base text-ink placeholder:text-ink-soft/70 transition-colors focus:border-navy focus:outline-none md:text-sm';

/** Collects details and opens WhatsApp with them pre-filled — no backend needed. */
export function WhatsAppForm({
  title,
  fields,
  submitLabel = 'Send on WhatsApp',
  initial = {},
  note,
  className,
}: {
  title: string;
  fields: FormField[];
  submitLabel?: string;
  initial?: Record<string, string>;
  note?: string;
  className?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [sent, setSent] = useState(false);
  const set = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const byLabel = Object.fromEntries(fields.map((f) => [f.label, values[f.name] ?? '']));
    window.open(whatsappFormLink(title, byLabel), '_blank', 'noopener,noreferrer');
    setSent(true);
  };

  return (
    <form onSubmit={submit} className={cn('grid gap-4 md:grid-cols-2', className)}>
      {fields.map((f) => (
        <label key={f.name} className={cn('block', (f.full || f.type === 'textarea') && 'md:col-span-2')}>
          <span className="mb-1.5 block text-sm font-medium text-ink">
            {f.label} {f.required && <span className="text-gold-ink">*</span>}
          </span>
          {f.type === 'textarea' ? (
            <textarea
              name={f.name}
              required={f.required}
              rows={4}
              placeholder={f.placeholder}
              value={values[f.name] ?? ''}
              onChange={(e) => set(f.name, e.target.value)}
              className={cn(INPUT, 'resize-y')}
            />
          ) : f.type === 'select' ? (
            <select
              name={f.name}
              required={f.required}
              value={values[f.name] ?? ''}
              onChange={(e) => set(f.name, e.target.value)}
              className={INPUT}
            >
              <option value="" disabled>
                {f.placeholder ?? 'Select…'}
              </option>
              {f.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input
              name={f.name}
              type={f.type ?? 'text'}
              required={f.required}
              placeholder={f.placeholder}
              inputMode={f.type === 'tel' ? 'tel' : f.type === 'number' ? 'numeric' : undefined}
              value={values[f.name] ?? ''}
              onChange={(e) => set(f.name, e.target.value)}
              className={INPUT}
            />
          )}
        </label>
      ))}

      <div className="md:col-span-2">
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-105 sm:w-auto"
        >
          <WhatsAppGlyph size={18} /> {submitLabel}
        </button>
        {sent ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-whatsapp-ink">
            <CheckCircle2 size={16} /> WhatsApp opened with your details — just press send. We’ll reply soon, in shā’ Allāh.
          </p>
        ) : (
          note && <p className="mt-3 text-xs text-ink-soft">{note}</p>
        )}
      </div>
    </form>
  );
}
