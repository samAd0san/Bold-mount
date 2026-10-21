import Image from 'next/image';

export interface GalleryItem {
  src: string;
  alt: string;
}

/** Swipeable row of tall images; CSS scroll-snap only, and all four fit side by side from tablet up. */
export function PosterGallery({ items, label }: { items: GalleryItem[]; label: string }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:scroll-px-0 md:gap-6 md:px-0"
    >
      {items.map((it) => (
        <figure
          key={it.src}
          className="relative aspect-[9/16] w-[62vw] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl bg-night-2 shadow-card ring-1 ring-on-night/10 sm:w-[40%] md:w-[calc(25%-18px)] md:max-w-none"
        >
          <Image
            src={it.src}
            alt={it.alt}
            fill
            sizes="(max-width: 640px) 62vw, (max-width: 768px) 40vw, 25vw"
            className="object-cover"
          />
        </figure>
      ))}
    </div>
  );
}
