'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';

type Stroke = { d: string; width: number; tone: string; delay: number };

// Portrait art for phones, landscape for wider panels — one viewBox can't crop well to both shapes.
const WIDE: Stroke[] = [
  { d: 'M -40 660 C 170 610 230 430 140 300 S 70 90 230 -30', width: 30, tone: 'stroke-blue/45', delay: 0 },
  { d: 'M -10 720 C 120 670 270 700 340 600 S 430 470 385 410', width: 20, tone: 'stroke-blue/35', delay: 0.35 },
  { d: 'M 1240 70 C 1040 130 980 300 1070 400 S 1180 590 990 750', width: 30, tone: 'stroke-blue/45', delay: 0.15 },
  { d: 'M 1210 340 C 1120 310 1075 220 1130 140', width: 18, tone: 'stroke-blue/35', delay: 0.6 },
  {
    d: 'M -20 650 C 80 610 140 530 230 565 S 330 480 420 535 S 560 605 640 565 S 800 480 900 545 S 1060 605 1220 525',
    width: 3,
    tone: 'stroke-gold/40',
    delay: 0.8,
  },
];

const TALL: Stroke[] = [
  { d: 'M -30 880 C 70 780 20 650 60 530 S 20 350 -20 280', width: 20, tone: 'stroke-blue/45', delay: 0 },
  { d: 'M 430 110 C 330 200 380 340 330 440 S 400 640 430 710', width: 20, tone: 'stroke-blue/45', delay: 0.2 },
  { d: 'M -10 880 C 60 840 100 800 160 830 S 260 790 320 830 S 380 800 410 820', width: 3, tone: 'stroke-gold/40', delay: 0.7 },
];

const BUDS_WIDE = [
  { cx: 230, cy: -30, r: 7 },
  { cx: 1130, cy: 140, r: 6 },
];

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: (delay: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 2.2, delay, ease: 'easeInOut' },
      opacity: { duration: 0.4, delay },
    },
  }),
};

function Art({ strokes, buds, box, className }: { strokes: Stroke[]; buds?: typeof BUDS_WIDE; box: string; className: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox={box}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
      initial={reduce ? 'show' : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {strokes.map((s) => (
        <g key={s.d}>
          <motion.path
            d={s.d}
            variants={draw}
            custom={s.delay}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={s.width}
            className={s.tone}
          />
          {/* Thin offset line on top of the thick vine gives it a veined, hand-drawn texture. */}
          {s.width > 10 && (
            <g transform="translate(-5 -4)">
              <motion.path
                d={s.d}
                variants={draw}
                custom={s.delay + 0.1}
                fill="none"
                strokeLinecap="round"
                strokeWidth={2}
                className="stroke-sky/25"
              />
            </g>
          )}
        </g>
      ))}
      {buds?.map((b, i) => (
        <motion.circle
          key={`${b.cx}-${b.cy}`}
          cx={b.cx}
          cy={b.cy}
          r={b.r}
          className="fill-gold/60"
          initial={{ scale: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 2 + i * 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      ))}
    </motion.svg>
  );
}

/** Decorative vines + a mountain-ridge line that draw in on scroll; sits behind the panel text. */
export function RfVines() {
  return (
    <>
      <Art
        strokes={TALL}
        box="0 0 400 900"
        className="pointer-events-none absolute inset-0 h-full w-full md:hidden"
      />
      <Art
        strokes={WIDE}
        buds={BUDS_WIDE}
        box="0 0 1200 700"
        className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
      />
    </>
  );
}
