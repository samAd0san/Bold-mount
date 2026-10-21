'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ANNOUNCEMENTS } from '@/lib/site';

export function AnnouncementBar() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % ANNOUNCEMENTS.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-gold text-night">
      <div className="mx-auto flex h-9 max-w-site items-center justify-center px-5 text-[0.8rem] font-medium md:justify-between md:px-8 lg:px-12">
        <p key={i} className="truncate animate-in fade-in duration-700">
          {ANNOUNCEMENTS[i]}
        </p>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/about" className="hover:underline">Our Story</Link>
          <Link href="/faq" className="hover:underline">FAQ</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
        </nav>
      </div>
    </div>
  );
}
