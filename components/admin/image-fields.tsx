'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from 'lucide-react';
import { adminFetch } from '@/components/admin/api';
import { Button, Checkbox, Input, Thumb } from '@/components/admin/ui';
import type { ProductImage } from '@/lib/types';
import { cn } from '@/lib/utils';

type Signature = { cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string };

/** Sends one file straight from the browser to Cloudinary (signed by our API) and reports progress 0-100. */
function uploadFile(file: File, onProgress: (pct: number) => void): Promise<string> {
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
          else reject(new Error(body.error?.message || 'Upload failed.'));
        };
        xhr.send(form);
      }),
  );
}

type Upload = { id: number; name: string; pct: number; error?: string };
let uploadId = 0;

/** Upload button + "paste a link" box. Calls onAdd with each finished image URL and its file name. */
function AddImage({ multiple, onAdd, label }: { multiple?: boolean; onAdd: (src: string, name: string) => void; label: string }) {
  const [uploads, setUploads] = React.useState<Upload[]>([]);
  const [link, setLink] = React.useState('');
  const [linkError, setLinkError] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  const patch = (id: number, p: Partial<Upload>) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const pick = (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const id = ++uploadId;
      setUploads((u) => [...u, { id, name: file.name, pct: 0 }]);
      if (!file.type.startsWith('image/')) { patch(id, { error: 'That is not a picture.' }); continue; }
      uploadFile(file, (pct) => patch(id, { pct }))
        .then((src) => {
          onAdd(src, file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
          setUploads((u) => u.filter((x) => x.id !== id));
        })
        .catch((e: Error) => patch(id, { error: e.message }));
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const addLink = () => {
    const v = link.trim();
    if (!/^(https?:\/\/|\/)\S+$/.test(v)) return setLinkError('Paste a full link that starts with https:// (or a /images/... path).');
    setLinkError('');
    onAdd(v, '');
    setLink('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-start gap-2 sm:flex-row">
        <input ref={fileRef} type="file" accept="image/*" multiple={multiple} className="sr-only" aria-label={label} onChange={(e) => pick(e.target.files)} />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><ImagePlus className="size-4" />{label}</Button>
        <div className="flex w-full min-w-0 gap-2 sm:flex-1">
          <Input value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }} placeholder="…or paste an image link" aria-label="Image link" className="py-1.5" />
          <Button variant="outline" size="sm" onClick={addLink}>Add</Button>
        </div>
      </div>
      {linkError && <p className="text-xs font-medium text-red-700">{linkError}</p>}
      {uploads.map((u) => (
        <div key={u.id} className="text-xs">
          <div className="flex justify-between gap-3 text-ink-soft">
            <span className="truncate">{u.name}</span>
            <span className={cn(u.error && 'font-medium text-red-700')}>{u.error ?? `${u.pct}%`}</span>
          </div>
          {u.error ? (
            <button type="button" onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))} className="mt-0.5 font-semibold text-navy underline underline-offset-4">Dismiss</button>
          ) : (
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-navy/10"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${u.pct}%` }} /></div>
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
        <ul className="grid gap-3 sm:grid-cols-2">
          {images.map((im, i) => (
            <li key={`${im.src}-${i}`} className="flex gap-3 rounded-xl border bg-white p-3">
              <div className="flex flex-col items-center gap-1">
                <Thumb src={im.src} alt={im.alt || defaultAlt} size={80} cover={im.cover} />
                {i === 0 && <span className="text-[11px] font-semibold text-gold-ink">Main</span>}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Input value={im.alt} onChange={(e) => edit(i, { alt: e.target.value })} placeholder="Describe the picture" aria-label={`Picture ${i + 1} description`} className="py-1.5" />
                <Checkbox checked={!!im.cover} onChange={(v) => edit(i, { cover: v })}>Fill the tile</Checkbox>
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
