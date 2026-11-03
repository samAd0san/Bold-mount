'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Customer } from '@/lib/types';
import { initials } from '@/components/auth/use-account';
import { cn } from '@/lib/utils';

/** Round Google picture, or the person's initial when there's none (or it fails to load). */
export function Avatar({ user, size = 32, className }: { user: Customer; size?: number; className?: string }) {
  const [broken, setBroken] = useState<string | null>(null);
  const box = cn('shrink-0 rounded-full', className);
  if (user.avatar && broken !== user.avatar) {
    return (
      <Image
        src={user.avatar}
        alt=""
        width={size}
        height={size}
        // Google photo URLs are already sized; no-referrer avoids their occasional 403 on cross-site referrers.
        unoptimized
        referrerPolicy="no-referrer"
        onError={() => setBroken(user.avatar ?? null)}
        className={cn(box, 'object-cover')}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(box, 'grid place-items-center bg-gold font-semibold text-night')}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initials(user.name, user.email)}
    </span>
  );
}
