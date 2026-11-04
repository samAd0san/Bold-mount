'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from 'lucide-react';
import { adminFetch } from '@/components/admin/api';
import { Button, Checkbox, InfoTip, Input, Thumb } from '@/components/admin/ui';
import type { ProductImage } from '@/lib/types';
import { cn } from '@/lib/utils';

const FILL_TIP = 'Turn on for full photos (e.g. dates in a bowl) so they cover the whole square. Leave off for cut-out pictures of a pouch, jar or box on a plain background, so nothing gets cropped.';

type Signature = { cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string };

// Cloudinary's reasons, in words the shop owner can act on.
function uploadError(message = ''): string {
  if (/HTML response/i.test(message)) return 'That link opens a web page, not a picture. Open the picture itself, then press and hold (or right-click) it and choose “Copy image address”.';
  if (/Error in loading|Resource not found/i.test(message)) return 'That website won’t let us copy this picture. Save it to your phone or computer, then use Upload instead.';
  if (/Invalid image|unsupported|format/i.test(message)) return 'That file isn’t a picture we can use. Try a JPG, PNG or WebP.';
  if (/too large|File size/i.test(message)) return 'That picture is too big. Try a smaller one (under 10 MB).';
  return message || 'Upload failed.';
}

/** Sends a file, or a picture link for Cloudinary to copy, straight from the browser to Cloudinary (signed by our API); reports progress 0-100. */
function uploadFile(file: File | string, onProgress: (pct: number) => void): Promise<string> {
  return adminFetch<Signature>('/api/admin/upload-signature', { method: 'POST', body: '{}' }).then(
    (s) =>
      new Promise<string>((resolve, reject) => {
        const form = new FormData();
        form.append('file', file);
        form.append('api_key', s.apiKey);
        form.append('timestamp', String(s.timestamp));
        form.append('folder', s.folder);
        form.append('signature', s.signature);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onerror = () => reject(new Error('Upload failed. Check your connection.'));
        xhr.onload = () => {
          let body: { secure_url?: string; error?: { message?: string } } = {};
          try { body = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
          if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) resolve(body.secure_url);
          else reject(new Error(uploadError(body.error?.message)));
        };
        xhr.send(form);
      }),
  );
}

type Upload = { id: number; name: string; pct: number; copying?: boolean; error?: string };
let uploadId = 0;

// The site's own pictures and ones already on Cloudinary are used as they are; anything else is copied to Cloudinary.
const isStored = (v: string) => /^\/(?!\/)\S+$/.test(v) || v.startsWith('https://res.cloudinary.com/');
const isCopyable = (v: string) => /^https?:\/\/[^\s/]+\.\S+$/i.test(v) || /^data:image\/[\w.+-]+;base64,/i.test(v);
function linkName(v: string) {
  if (v.startsWith('data:')) return 'Pasted picture';
  try {
    return `Picture from ${new URL(v).hostname.replace(/^www\./, '')}`;
  } catch {
    return 'Picture from a link';
  }
}

/** Upload button + "paste a link" box. Calls onAdd with each finished image URL and its file name. */
function AddImage({ multiple, onAdd, label }: { multiple?: boolean; onAdd: (src: string, name: string) => void; label: string }) {
  const [uploads, setUploads] = React.useState<Upload[]>([]);
  const [link, setLink] = React.useState('');
  const [linkError, setLinkError] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  const patch = (id: number, p: Partial<Upload>) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const start = (name: string, file: File | string, alt: string) => {
    const id = ++uploadId;
    setUploads((u) => [...u, { id, name, pct: 0, copying: typeof file === 'string' }]);
    uploadFile(file, (pct) => patch(id, { pct }))
      .then((src) => {
        onAdd(src, alt);
        setUploads((u) => u.filter((x) => x.id !== id));
      })
      .catch((e: Error) => patch(id, { error: e.message }));
  };

  const pick = (files: FileList | File[] | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        setUploads((u) => [...u, { id: ++uploadId, name: file.name, pct: 0, error: 'That is not a picture.' }]);
        continue;
      }
      start(file.name, file, file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const addLink = (raw = link) => {
    let v = raw.trim();
    if (/^www\./i.test(v)) v = `https://${v}`;
    if (!v) return setLinkError('Paste a picture link first.');
    if (!isStored(v) && !isCopyable(v)) return setLinkError('That doesn’t look like a picture link. It should start with https://');
    setLinkError('');
    setLink('');
    if (isStored(v)) onAdd(v, '');
    else start(linkName(v), v, '');
  };

  // Pasting adds straight away: a copied picture is uploaded, a copied link is fetched (unless it's being pasted into the middle of other text).
  const paste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const files = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'));
    if (files.length) {
      e.preventDefault();
      pick(multiple ? files : files.slice(0, 1));
      return;
    }
    const el = e.currentTarget;
    const replacesAll = !link.trim() || (el.selectionStart === 0 && el.selectionEnd === el.value.length);
    const text = e.clipboardData.getData('text').trim();
    if (replacesAll && text && (isStored(text) || isCopyable(text) || /^www\./i.test(text))) {
      e.preventDefault();
      addLink(text);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-stretch gap-2 @md:flex-row @md:items-start">
        <input ref={fileRef} type="file" accept="image/*" multiple={multiple} className="sr-only" aria-label={label} onChange={(e) => pick(e.target.files)} />
        <Button variant="outline" size="sm" className="self-start" onClick={() => fileRef.current?.click()}><ImagePlus className="size-4" />{label}</Button>
        <div className="flex w-full min-w-0 gap-2 @md:flex-1">
          <Input
            value={link}
            onChange={(e) => { setLink(e.target.value); setLinkError(''); }}
            onPaste={paste}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
            placeholder="…or paste a picture link"
            aria-label="Image link"
            inputMode="url"
            autoComplete="off"
            className="min-w-0 py-1.5"
          />
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => addLink()}>Add</Button>
        </div>
      </div>
      {linkError && <p role="alert" className="text-xs font-medium text-red-700">{linkError}</p>}
      {uploads.map((u) => (
        <div key={u.id} className="text-xs" role={u.error ? 'alert' : 'status'}>
          <div className="flex justify-between gap-3 text-ink-soft">
            <span className="truncate">{u.name}</span>
            {!u.error && <span className="shrink-0">{u.copying ? 'Copying…' : `${u.pct}%`}</span>}
          </div>
          {u.error ? (
            <p className="mt-0.5 font-medium text-red-700">
              {u.error}{' '}
              <button type="button" onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))} className="font-semibold text-navy underline underline-offset-4">Dismiss</button>
            </p>
          ) : (
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-navy/10">
              <div className={cn('h-full rounded-full bg-gold transition-all', u.copying && 'animate-pulse')} style={{ width: u.copying ? '100%' : `${u.pct}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Product pictures: add, reorder with arrows, alt text, "fill the tile", remove. The first one is the main picture. */
export function ImagesEditor({ images, onChange, defaultAlt }: { images: ProductImage[]; onChange: (v: ProductImage[]) => void; defaultAlt: string }) {
  // Uploads finish later, so always append to the newest list.
  const latest = React.useRef(images);
  React.useEffect(() => { latest.current = images; });

  const move = (i: number, by: number) => {
    const next = [...images];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    onChange(next);
  };
  const edit = (i: number, patch: Partial<ProductImage>) => onChange(images.map((im, k) => (k === i ? { ...im, ...patch } : im)));

  return (
    <div className="flex flex-col gap-4">
      {images.length > 0 && (
        <ul className="grid gap-3 @2xl:grid-cols-2">
          {images.map((im, i) => (
            <li key={`${im.src}-${i}`} className="flex gap-3 rounded-xl border bg-white p-3">
              <div className="flex flex-col items-center gap-1">
                <Thumb src={im.src} alt={im.alt || defaultAlt} size={80} cover={im.cover} />
                {i === 0 && <span className="text-[11px] font-semibold text-gold-ink">Main</span>}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Input value={im.alt} onChange={(e) => edit(i, { alt: e.target.value })} placeholder="Describe the picture" aria-label={`Picture ${i + 1} description`} className="py-1.5" />
                <span className="flex items-center gap-1">
                  <Checkbox checked={!!im.cover} onChange={(v) => edit(i, { cover: v })}>Fill the tile</Checkbox>
                  <InfoTip label="What is “Fill the tile”?">{FILL_TIP}</InfoTip>
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move picture ${i + 1} earlier`} className="grid size-9 place-items-center rounded-full border text-navy hover:bg-navy/10 disabled:opacity-30"><ArrowLeft className="size-4" /></button>
                  <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label={`Move picture ${i + 1} later`} className="grid size-9 place-items-center rounded-full border text-navy hover:bg-navy/10 disabled:opacity-30"><ArrowRight className="size-4" /></button>
                  <button type="button" onClick={() => onChange(images.filter((_, k) => k !== i))} aria-label={`Remove picture ${i + 1}`} className="ml-auto grid size-9 place-items-center rounded-full border border-red-700/30 text-red-700 hover:bg-red-700 hover:text-white"><Trash2 className="size-4" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AddImage multiple label="Upload pictures" onAdd={(src, name) => onChange([...latest.current, { src, alt: name || defaultAlt }])} />
    </div>
  );
}

/** One picture (categories): preview plus upload or paste a link. */
export function SingleImage({ value, onChange, alt }: { value: string; onChange: (v: string) => void; alt: string }) {
  return (
    <div className="flex flex-col gap-3">
      {value && (
        <div className="flex items-center gap-3">
          <Thumb src={value} alt={alt} size={72} cover />
          <Button variant="danger" size="sm" onClick={() => onChange('')}><Trash2 className="size-4" />Remove</Button>
        </div>
      )}
      <AddImage label={value ? 'Replace picture' : 'Upload a picture'} onAdd={(src) => onChange(src)} />
    </div>
  );
}
