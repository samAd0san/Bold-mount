'use client';

import { prefillAndScroll } from './prefill';

/** Button that pre-fills a ServeForm (by formId) and scrolls to its section. */
export function PrefillButton({
  formId,
  values,
  targetId,
  className,
  children,
}: {
  formId: string;
  values: Record<string, string>;
  targetId: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={() => prefillAndScroll(formId, values, targetId)} className={className}>
      {children}
    </button>
  );
}
