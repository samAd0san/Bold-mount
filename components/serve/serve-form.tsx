'use client';

import { WhatsAppForm, type FormField } from '@/components/forms/whatsapp-form';
import { usePrefill } from './prefill';

export interface ServeFormConfig {
  title: string; // first line of the WhatsApp message
  fields: FormField[];
  submitLabel?: string;
  note?: string;
  initial?: Record<string, string>;
}

/** WhatsAppForm that buttons elsewhere on the page can pre-fill via prefill.ts. */
export function ServeForm({ formId, ...form }: ServeFormConfig & { formId?: string }) {
  const p = usePrefill((s) => (formId ? s.forms[formId] : undefined));
  return <WhatsAppForm key={p?.n ?? 0} {...form} initial={{ ...form.initial, ...p?.values }} />;
}
