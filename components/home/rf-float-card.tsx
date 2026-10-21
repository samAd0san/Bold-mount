'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Small white UI card that fades in, then bobs gently; `className` positions it (absolute on wide screens). */
export function RfFloatCard({
  children,
  className,
  delay = 0,
  duration = 6,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: reduce ? 0 : 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="h-full rounded-xl bg-pearl p-2.5 text-ink shadow-card ring-1 ring-line"
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
