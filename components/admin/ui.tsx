'use client';

import * as React from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import * as Popover from '@radix-ui/react-popover';
import { Info, Loader2, X } from 'lucide-react';
import { buttonClass } from '@/components/ui/button-styles';
import { cn } from '@/lib/utils';

// Small building blocks shared by every admin screen.

type Variant = 'navy' | 'gold' | 'outline' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

export function btn(variant: Variant = 'navy', size: Size = 'md', className?: string) {
  const sz = size === 'sm' ? 'gap-1.5 px-3.5 py-1.5 text-[13px]' : 'px-5 py-2.5';
  if (variant === 'ghost') return cn(buttonClass('outline', cn(sz, 'border-transparent text-navy hover:border-transparent hover:bg-navy/10 hover:text-navy')), className);
  if (variant === 'danger') return cn(buttonClass('outline', cn(sz, 'border-red-700/30 text-red-700 hover:border-red-700 hover:bg-red-700 hover:text-white')), className);
  return cn(buttonClass(variant, sz), className);
}

export function Button({
  variant,
  size,
  busy,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: React.ComponentProps<'button'> & { variant?: Variant; size?: Size; busy?: boolean }) {
  return (
    <button type={type} disabled={disabled || busy} className={btn(variant, size, className)} {...props}>
      {busy && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export const inputClass =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-ink-soft/60 transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-gold/70 disabled:opacity-60 sm:text-sm';

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />;
});

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea className={cn(inputClass, 'min-h-24 resize-y', className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(inputClass, 'pr-8', className)} {...props} />;
}

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-red-700">{error}</span> : hint ? <span className="text-xs text-ink-soft">{hint}</span> : null}
    </label>
  );
}

export function Card({ className, ...props }: React.ComponentProps<'section'>) {
  return <section className={cn('rounded-2xl border bg-pearl p-4 shadow-card sm:p-5', className)} {...props} />;
}

export function PageHead({ title, sub, action }: { title: string; sub?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink-soft">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorNote({ children, onRetry }: { children: React.ReactNode; onRetry?: () => void }) {
  return (
    <p role="alert" className="rounded-xl border border-red-700/20 bg-red-50 px-4 py-3 text-sm text-red-800">
      {children}
      {onRetry && (
        <>
          {' '}
          <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-4">Try again</button>
        </>
      )}
    </p>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed bg-pearl/60 px-4 py-10 text-center text-sm text-ink-soft">{children}</p>;
}

export function Skeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }, (_, i) => <div key={i} className={cn('h-20 animate-pulse rounded-2xl bg-ink/[0.06]', className)} />)}
    </div>
  );
}

const TONES = {
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-sky-100 text-sky-800',
  gray: 'bg-ink/10 text-ink-soft',
  gold: 'bg-gold/30 text-gold-ink',
};
export function Badge({ tone = 'gray', children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', TONES[tone])}>{children}</span>;
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50', checked ? 'bg-navy' : 'bg-ink/20')}
    >
      <span className={cn('absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
    </button>
  );
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-navy" />
      {children}
    </label>
  );
}

/** Pill buttons that pick one value (filters, periods). */
export function Chips<T extends string>({ value, options, onChange, className }: { value: T; options: { value: T; label: React.ReactNode }[]; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="radiogroup" className={cn('flex flex-wrap gap-2', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition',
            o.value === value ? 'border-navy bg-navy text-on-night' : 'border-line bg-white text-ink-soft hover:border-navy/40 hover:text-navy',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Tiny "i" that explains something in one sentence when tapped. */
export function InfoTip({ children, label = 'What is this?' }: { children: React.ReactNode; label?: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" aria-label={label} className="-m-1.5 inline-grid size-7 shrink-0 place-items-center rounded-full text-ink-soft/70 transition hover:bg-navy/10 hover:text-navy">
          <Info className="size-3.5" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side="top" sideOffset={6} collisionPadding={12} className="z-50 max-w-64 rounded-xl bg-night px-3 py-2 text-xs leading-snug text-on-night shadow-card">
          {children}
          <Popover.Arrow className="fill-night" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Bottom sheet on phones, centered box on desktop. */
export function Modal({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-night/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-pearl p-5 shadow-card outline-none sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-lg font-semibold text-navy">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-sm text-ink-soft">{description}</Dialog.Description> : null}
            </div>
            <Dialog.Close className="-m-1.5 grid size-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-navy/10 hover:text-navy" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** "Are you sure?" box for deletes; shows the API's message if it refuses. */
export function ConfirmDelete({ open, onOpenChange, title, description, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; onConfirm: () => Promise<void> }) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onOpenChange={(o) => { if (!o) setError(null); onOpenChange(o); }} title={title} description={description}>
      {error && <div className="mb-3"><ErrorNote>{error}</ErrorNote></div>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>Keep it</Button>
        <Button variant="danger" busy={busy} onClick={run}>Delete</Button>
      </div>
    </Modal>
  );
}

/** Small picture; works for /images paths and any https link. */
export function Thumb({ src, alt, size = 48, cover, className }: { src?: string; alt: string; size?: number; cover?: boolean; className?: string }) {
  if (!src) return <span className={cn('shrink-0 rounded-lg bg-sand/60', className)} style={{ width: size, height: size }} aria-hidden />;
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized={!src.startsWith('/')}
      style={{ width: size, height: size }}
      className={cn('shrink-0 rounded-lg bg-sand/50', cover ? 'object-cover' : 'object-contain', className)}
    />
  );
}
