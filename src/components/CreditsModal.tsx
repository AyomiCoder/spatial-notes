import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type Variants } from 'motion/react'

const STORAGE_KEY = 'spatial-notes:credits:v1'
const APPEAR_DELAY_MS = 1800     // credits is the first modal users meet

const EASE_OUT = [0.16, 1, 0.3, 1] as const

const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.28, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

const cardVariants: Variants = {
  initial: { opacity: 0, scale: 0.92, y: 14, rotate: -1.5 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 320,
      damping: 26,
      mass: 0.8,
      delayChildren: 0.14,
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.18, ease: EASE_OUT },
  },
}

const itemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 360, damping: 30 },
  },
}

const waveVariants: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: [0, 14, -8, 14, -4, 10, 0],
    transition: { duration: 1.4, delay: 0.25, ease: 'easeInOut' },
  },
}

export default function CreditsModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let seen = false
    try { seen = localStorage.getItem(STORAGE_KEY) === 'seen' } catch {}
    if (seen) return
    const t = window.setTimeout(() => setOpen(true), APPEAR_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const markSeen = () => {
    try { localStorage.setItem(STORAGE_KEY, 'seen') } catch {}
  }

  const dismiss = () => {
    setOpen(false)
    markSeen()
  }

  const follow = () => {
    markSeen()
    window.open('https://x.com/ayomicoder', '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onPointerDown={dismiss}
          className="fixed inset-0 z-[200] grid place-items-center"
          style={{
            backgroundColor: 'rgba(15, 15, 18, 0.18)',
            backdropFilter: 'blur(14px) saturate(140%)',
            WebkitBackdropFilter: 'blur(14px) saturate(140%)',
          }}
        >
          <motion.div
            variants={cardVariants}
            role="dialog"
            aria-modal="true"
            aria-labelledby="credits-title"
            onPointerDown={(e) => e.stopPropagation()}
            className="relative w-[380px] max-w-[92vw] overflow-hidden rounded-[24px]"
            style={{
              background: 'var(--color-note-cream)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.55), ' +
                '0 1px 2px rgba(0,0,0,0.04), ' +
                '0 24px 64px -12px rgba(0,0,0,0.35), ' +
                '0 32px 80px -20px rgba(245,184,0,0.45)',
            }}
          >
            {/* Tape strip — playful sticky-note touch */}
            <div
              aria-hidden
              className="absolute left-1/2 -top-2 h-5 w-20 -translate-x-1/2 rotate-[-2deg] rounded-[2px]"
              style={{
                background: 'rgba(255,255,255,0.55)',
                boxShadow:
                  '0 1px 2px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
              }}
            />

            <div className="relative px-7 pt-9 pb-6">
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2.5"
              >
                <h2
                  id="credits-title"
                  className="text-[26px] font-semibold leading-[1.05] tracking-[-0.025em] text-ink-900"
                >
                  Hey there
                </h2>
                <motion.span
                  variants={waveVariants}
                  style={{ display: 'inline-block', transformOrigin: '70% 70%' }}
                  className="text-[24px]"
                >
                  👋
                </motion.span>
              </motion.div>

              <motion.p
                variants={itemVariants}
                className="mt-3 text-[14.5px] leading-[1.55] tracking-[-0.008em] text-ink-800"
              >
                I'm{' '}
                <a
                  href="https://x.com/ayomicoder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-[var(--color-accent-cream)] decoration-2 underline-offset-[3px] font-semibold text-ink-900 hover:decoration-ink-900 transition-colors"
                >
                  Ayomide Aluko
                </a>
                {' '}— the human behind the pixels. I built{' '}
                <span className="font-semibold text-ink-900">inklin</span>{' '}
                for my own scattered brain, and quietly hoped it might help
                someone else's too.
              </motion.p>

              <motion.p
                variants={itemVariants}
                className="mt-2.5 text-[14.5px] leading-[1.55] tracking-[-0.008em] text-ink-700"
              >
                If it brings you a small bit of calm today, say hi.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="mt-6 flex items-center gap-2"
              >
                <motion.button
                  onClick={follow}
                  whileHover={{ y: -0.5 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink-950 text-white text-[14px] font-semibold tracking-[-0.01em]"
                  style={{
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 16px -4px rgba(0,0,0,0.35)',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M1.6 1.6h2.6l3 4.2 3.4-4.2h2L8.2 6.6 12.6 12.4H10L6.8 8.0 3.1 12.4H1.1l4.8-5.9L1.6 1.6z"
                      fill="currentColor"
                    />
                  </svg>
                  Find me on X
                </motion.button>
                <motion.button
                  onClick={dismiss}
                  whileTap={{ scale: 0.96 }}
                  className="h-11 rounded-full px-4 text-[13px] font-medium tracking-[-0.005em] text-ink-700 hover:text-ink-900 hover:bg-black/[0.05] transition-colors"
                >
                  Close
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
