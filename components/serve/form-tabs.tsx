'use client';

import { useState, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { ServeForm, type ServeFormConfig } from './serve-form';

export interface FormTab extends ServeFormConfig {
  id: string; // also the URL hash that opens this tab, e.g. /volunteer#mentor
  label: string;
  intro?: string;
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};
const readHash = () => window.location.hash.slice(1);
const serverHash = () => '';

/** Forms behind tab pills; every panel stays mounted so typed values survive a tab switch. */
export function FormTabs({ tabs }: { tabs: FormTab[] }) {
  const hash = useSyncExternalStore(subscribe, readHash, serverHash);
  const [picked, setPicked] = useState(tabs[0].id);
  const active = tabs.some((t) => t.id === hash) ? hash : picked;

  const pick = (id: string) => {
    setPicked(id);
    // Keep the hash in step, so a later "#other-tab" link still fires hashchange.
    window.history.replaceState(null, '', `#${id}`);
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    pick(next.id);
    document.getElementById(next.id)?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Choose a form" className="mb-6 grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-sand p-1">
        {tabs.map((t, i) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              id={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`${t.id}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => pick(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                'min-h-11 scroll-mt-40 rounded-xl px-3 py-2 text-sm leading-tight font-semibold transition-colors duration-300',
                on ? 'bg-navy text-on-night shadow-card' : 'text-ink-soft hover:text-ink',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`${t.id}-panel`} aria-labelledby={t.id} hidden={t.id !== active}>
          {t.intro && <p className="mb-5 text-sm leading-relaxed text-ink-soft">{t.intro}</p>}
          <ServeForm title={t.title} fields={t.fields} submitLabel={t.submitLabel} note={t.note} initial={t.initial} />
        </div>
      ))}
    </div>
  );
}
