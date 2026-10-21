import { create } from 'zustand';

// Lets a button elsewhere on the page (calculator, package card) pre-fill a form; `n` bumps to remount it.
interface PrefillState {
  forms: Record<string, { values: Record<string, string>; n: number }>;
  prefill: (formId: string, values: Record<string, string>) => void;
}

export const usePrefill = create<PrefillState>((set) => ({
  forms: {},
  prefill: (formId, values) =>
    set((s) => ({ forms: { ...s.forms, [formId]: { values, n: (s.forms[formId]?.n ?? 0) + 1 } } })),
}));

/** Pre-fill a form, then bring its section into view and move focus there for screen readers. */
export function prefillAndScroll(formId: string, values: Record<string, string>, targetId: string) {
  usePrefill.getState().prefill(formId, values);
  const el = document.getElementById(targetId);
  if (!el) return;
  el.scrollIntoView({ block: 'start' });
  el.focus({ preventScroll: true });
}
