import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

const PHRASES = [
  'A clean canvas.',
  'Space for thinking.',
  'Drop your thoughts.',
  'Make something.',
] as const

const ROTATE_MS = 3600
const STAGGER = 0.025
const EASE_OUT = [0.16, 1, 0.3, 1] as const

const containerVariants = {
  enter: { transition: { staggerChildren: STAGGER } },
  exit:  { transition: { staggerChildren: STAGGER * 0.5, staggerDirection: -1 } },
}

const letterVariants = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  enter:   { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: EASE_OUT } },
  exit:    { opacity: 0, y: -10, filter: 'blur(6px)', transition: { duration: 0.35, ease: EASE_OUT } },
}

export default function EmptyState() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % PHRASES.length), ROTATE_MS)
    return () => clearInterval(t)
  }, [])

  const phrase = PHRASES[index]

  return (
    <div className="text-center select-none">
      {/* Animated, rotating headline */}
      <div className="relative h-[44px] overflow-visible">
        <AnimatePresence mode="wait">
          <motion.h1
            key={phrase}
            variants={containerVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="text-[40px] font-semibold tracking-[-0.035em] leading-none text-ink-900"
          >
            {phrase.split('').map((ch, i) => (
              <motion.span
                key={`${i}-${ch}`}
                variants={letterVariants}
                style={{ display: 'inline-block', whiteSpace: 'pre' }}
              >
                {ch}
              </motion.span>
            ))}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* Static subtitle with a soft entrance + slow breath */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.7, ease: EASE_OUT }}
        className="mt-4 flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-500"
      >
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="h-1 w-1 rounded-full bg-ink-500"
        />
        Double-click anywhere
      </motion.div>
    </div>
  )
}
