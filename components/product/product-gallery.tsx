'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ProductImage } from '@/lib/types';
import { cn } from '@/lib/utils';

// Images are stacked and cross-faded so switching never flashes an empty tile.
export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [active, setActive] = useState(0);
  if (!images.length) return <div className="aspect-square rounded-2xl bg-pearl ring-1 ring-line ring-inset" />;

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-pearl ring-1 ring-line ring-inset">
        {images.map((img, i) => (
          <Image
            key={img.src}
            src={img.src}
            alt={img.alt}
            fill
            priority={i === 0}
            sizes="(max-width: 768px) 100vw, (max-width: 1480px) 50vw, 720px"
            aria-hidden={i !== active}
            className={cn(
              'transition-opacity duration-500 ease-expo',
              img.cover ? 'object-cover' : 'object-contain p-6 md:p-10',
              i === active ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-pressed={i === active}
              className={cn(
                'relative h-16 w-16 overflow-hidden rounded-xl bg-pearl transition-shadow md:h-20 md:w-20',
                i === active ? 'ring-2 ring-navy' : 'ring-1 ring-line hover:ring-navy/40',
              )}
            >
              <Image src={img.src} alt="" fill sizes="80px" className={img.cover ? 'object-cover' : 'object-contain p-1.5'} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
