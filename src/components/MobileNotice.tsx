import { motion, type Variants } from 'motion/react'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

const STICKIES = [
  { tint: 'var(--color-note-cream)',  accent: '#f5b800', rot: -10, x: -18, y: -6 },
  { tint: 'var(--color-note-mint)',   accent: '#34c759', rot:  6,  x:  20, y: -16 },
  { tint: 'var(--color-note-lilac)',  accent: '#af52de', rot:  -3, x:  -8, y:  18 },
  { tint: 'var(--color-note-rose)',   accent: '#ff2d55', rot:  9,  x:  26, y:  14 },
]

const wrap: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const stickyVariants: Variants = {
  initial: { opacity: 0, y: -60, rotate: 0, scale: 0.6 },
  animate: (i: number) => ({
    opacity: 1,
    y: STICKIES[i]!.y,
    x: STICKIES[i]!.x,
    rotate: STICKIES[i]!.rot,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 16,
      mass: 0.9,
      delay: 0.08 * i,
    },
  }),
}

const floatVariants: Variants = {
  initial: {},
  animate: (i: number) => ({
    y: [STICKIES[i]!.y, STICKIES[i]!.y - 4, STICKIES[i]!.y],
    transition: {
      duration: 3 + i * 0.4,
      repeat: Infinity,
      ease: 'easeInOut',
      delay: 1.2 + i * 0.15,
    },
  }),
}

const textVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 340, damping: 30 },
  },
}

export default function MobileNotice() {
  return (
    <div className="fixed inset-0 grid place-items-center overflow-hidden bg-white text-ink-900 dark:bg-[#0b0b0d] dark:text-ink-100">
      {/* Soft drifting aurora — keeps the same vibe as the canvas */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          opacity: { duration: 1.2, ease: EASE_OUT },
          backgroundPosition: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(60% 35% at 50% 100%, color-mix(in oklab, var(--color-accent-sky) 14%, transparent), transparent 70%)',
            'radial-gradient(45% 30% at 25% 95%, color-mix(in oklab, var(--color-accent-lilac) 12%, transparent), transparent 70%)',
            'radial-gradient(40% 25% at 75% 95%, color-mix(in oklab, var(--color-accent-rose) 10%, transparent), transparent 70%)',
            'radial-gradient(50% 30% at 50% 0%, color-mix(in oklab, var(--color-accent-cream) 10%, transparent), transparent 75%)',
          ].join(', '),
          backgroundSize: '200% 200%',
        }}
      />

      <motion.div
        variants={wrap}
        initial="initial"
        animate="animate"
        className="relative z-10 flex max-w-[420px] flex-col items-center px-7 text-center"
      >
        {/* Brand */}
        <motion.div
          variants={textVariants}
          className="mb-6 flex items-baseline gap-1.5"
        >
          <span className="text-[15px] font-semibold tracking-[-0.018em] lowercase text-ink-900 dark:text-ink-100">
            inklin
          </span>
          <span className="font-mono text-[10px] tracking-tight text-ink-400 dark:text-ink-500">
            /ˈɪŋklɪn/
          </span>
        </motion.div>

        {/* Sticky-note stack — drops in, then idles with a slow float */}
        <div className="relative mb-10 h-32 w-32">
          {STICKIES.map((s, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={stickyVariants}
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2"
              style={{
                background: s.tint,
                borderRadius: '8px',
                boxShadow:
                  '0 1px 2px rgba(0,0,0,0.05), ' +
                  '0 6px 14px -4px rgba(0,0,0,0.10), ' +
                  `0 20px 40px -12px ${s.accent}55, ` +
                  'inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              <motion.div
                custom={i}
                variants={floatVariants}
                className="h-full w-full"
              />
              {/* A few "text" hint lines */}
              <div className="absolute inset-0 flex flex-col gap-1.5 p-3">
                <span className="h-1 w-10 rounded-full bg-ink-900/15" />
                <span className="h-1 w-14 rounded-full bg-ink-900/15" />
                <span className="h-1 w-8 rounded-full bg-ink-900/15" />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={textVariants}
          className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400"
        >
          A small ask
        </motion.div>

        <motion.h1
          variants={textVariants}
          className="text-[34px] font-semibold leading-[1.05] tracking-[-0.025em] text-ink-900 dark:text-ink-100"
        >
          Made for room to think
        </motion.h1>

        <motion.p
          variants={textVariants}
          className="mt-4 text-[15px] leading-[1.5] tracking-[-0.005em] text-ink-600 dark:text-ink-300"
        >
          This canvas spreads itself across your screen. Pop it open on an{' '}
          <span className="font-semibold text-ink-800 dark:text-ink-100">iPad</span> or{' '}
          <span className="font-semibold text-ink-800 dark:text-ink-100">desktop</span>{' '}
          and it'll be right here — full size, full breath.
        </motion.p>

        <motion.div
          variants={textVariants}
          className="mt-10 flex items-center gap-2 font-mono text-[11px] text-ink-400 dark:text-ink-500"
        >
          <span>made by</span>
          <a
            href="https://x.com/ayomicoder"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink-700 underline decoration-ink-300 underline-offset-[3px] hover:decoration-ink-700 transition-colors dark:text-ink-200 dark:decoration-ink-500 dark:hover:decoration-ink-100"
          >
            Ayomide Aluko
          </a>
        </motion.div>
      </motion.div>
    </div>
  )
}
