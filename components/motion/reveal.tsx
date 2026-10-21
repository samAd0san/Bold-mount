'use client';

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

type Direction = 'up' | 'left' | 'right' | 'none';

const OFFSET: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 28 },
  left: { x: 28 },
  right: { x: -28 },
  none: {},
};

// Fire when the top edge crosses 85% of the screen; a fraction-visible trigger never fires for blocks taller than the screen.
const ENTER = { once: true, amount: 'some', margin: '0px 0px -15% 0px' } as const;

/** Fade + slide in on scroll; static under reduced motion. */
export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  ...rest
}: Omit<HTMLMotionProps<'div'>, 'ref'> & { children: ReactNode; delay?: number; direction?: Direction }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, ...(reduce ? {} : OFFSET[direction]) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={ENTER}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
