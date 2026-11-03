'use client';

import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useAdmin } from '@/components/admin/admin-gate';
import { adminFetch } from '@/components/admin/api';
import { Button, Card, ErrorNote, Field, Input, PageHead } from '@/components/admin/ui';

function PinInput({ value, onChange, label, hint }: { value: string; onChange: (v: string) => void; label: string; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <Input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={8}
        autoComplete="off"
        data-1p-ignore=""
        data-lpignore="true"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
        className="tracking-[0.3em]"
      />
    </Field>
  );
}

export function Settings() {
  const { pinLength, recheck } = useAdmin();
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDone(null);
    if (current.length < 4) return setError('Enter your current PIN.');
    if (next.length < 4) return setError('The new PIN must be 4 to 8 digits.');
    if (next !== confirm) return setError('The new PINs do not match.');
    setBusy(true);
    setError(null);
    try {
      await adminFetch('/api/admin/pin', { method: 'POST', body: JSON.stringify({ current, next, confirm }) });
      setCurrent('');
      setNext('');
      setConfirm('');
      setDone(`PIN changed. Your new PIN has ${next.length} digits.`);
      await recheck();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <PageHead title="Settings" sub={`Your admin PIN is ${pinLength} digits.`} />
      <Card>
        <h2 className="text-[15px] font-semibold text-navy">Change PIN</h2>
        <p className="mt-0.5 mb-4 text-[13px] text-ink-soft">Use 4 to 8 digits. Changing it signs out other devices.</p>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <PinInput label="Current PIN" value={current} onChange={setCurrent} />
          <div className="grid gap-4 sm:grid-cols-2">
            <PinInput label="New PIN" value={next} onChange={setNext} hint="4 to 8 digits." />
            <PinInput label="Confirm new PIN" value={confirm} onChange={setConfirm} />
          </div>
          {error && <ErrorNote>{error}</ErrorNote>}
          {done && (
            <p role="status" className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              {done}
            </p>
          )}
          <div>
            <Button type="submit" variant="gold" busy={busy} className="w-full sm:w-auto">Change PIN</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
