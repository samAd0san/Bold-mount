'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, LocateFixed, MapPin } from 'lucide-react';
import { buttonClass } from '@/components/ui/button-styles';

export interface Coords {
  lat: number;
  lng: number;
}

/** Google Maps link for a point; shown in the WhatsApp message and behind "View on map". */
export function mapsUrl({ lat, lng }: Coords): string {
  return `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

const LINK = 'inline-flex min-h-11 items-center text-sm font-semibold text-navy underline underline-offset-4';

/** "Use my current location" button: asks the browser once and hands the point to the parent. */
export function LocationShare({ value, onChange }: { value: Coords | null; onChange: (c: Coords | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const locate = () => {
    setFailed(false);
    if (!('geolocation' in navigator)) {
      setFailed(true);
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setBusy(false);
        setFailed(true);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  };

  return (
    <div className="rounded-xl border border-line bg-cream px-4 py-3">
      {value ? (
        <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="flex items-center gap-2 text-sm font-medium text-whatsapp-ink">
            <MapPin size={16} aria-hidden /> Location added ✓
          </p>
          <a href={mapsUrl(value)} target="_blank" rel="noopener noreferrer" className={LINK}>
            View on map
          </a>
          <button type="button" onClick={() => onChange(null)} className={`${LINK} text-ink-soft`}>
            Remove
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" onClick={locate} disabled={busy} className={buttonClass('outline', 'min-h-11 py-2.5')}>
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <LocateFixed size={16} aria-hidden />}
            {busy ? 'Finding your location…' : 'Use my current location'}
          </button>
          <p className="text-xs text-ink-soft">Optional if you’ve typed your address.</p>
        </div>
      )}
      {failed && !value && (
        <p role="status" className="mt-2.5 flex items-start gap-1.5 text-xs font-medium text-gold-ink">
          <AlertCircle size={13} className="mt-px shrink-0" aria-hidden />
          Couldn’t get your location — you can type your address or share a location pin in WhatsApp.
        </p>
      )}
    </div>
  );
}
