import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import type { NoteTint } from '../types'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

const TINTS: { name: NoteTint; bg: string }[] = [
  { name: 'cream',  bg: 'var(--color-note-cream)'  },
  { name: 'banana', bg: 'var(--color-note-banana)' },
  { name: 'sand',   bg: 'var(--color-note-sand)'   },
  { name: 'coral',  bg: 'var(--color-note-coral)'  },
  { name: 'rose',   bg: 'var(--color-note-rose)'   },
  { name: 'blush',  bg: 'var(--color-note-blush)'  },
  { name: 'lilac',  bg: 'var(--color-note-lilac)'  },
  { name: 'sky',    bg: 'var(--color-note-sky)'    },
  { name: 'aqua',   bg: 'var(--color-note-aqua)'   },
  { name: 'mint',   bg: 'var(--color-note-mint)'   },
  { name: 'sage',   bg: 'var(--color-note-sage)'   },
  { name: 'slate',  bg: 'var(--color-note-slate)'  },
]

interface Props {
  open: boolean
  anchor: DOMRect | null
  current: NoteTint
  onSelect: (tint: NoteTint) => void
  onClose: () => void
}

const containerVariants: Variants = {
  initial: { opacity: 0, scale: 0.6, y: -10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 460,
      damping: 30,
      mass: 0.7,
      staggerChildren: 0.022,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    y: -6,
    transition: { duration: 0.14, ease: EASE_OUT, staggerChildren: 0, when: 'afterChildren' },
  },
}

const swatchVariants: Variants = {
  initial: { opacity: 0, scale: 0.2, y: -4 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 520, damping: 22 },
  },
  exit: { opacity: 0, scale: 0.4, transition: { duration: 0.1 } },
}

export default function ColorPicker({ open, anchor, current, onSelect, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest('[data-color-picker]')) return
      if (target.closest('[data-color-trigger]')) return
      onClose()
    }
    document.addEventListener('pointerdown', handler, true)
    return () => document.removeEventListener('pointerdown', handler, true)
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  // 2 rows × 6 cols, h-6 swatches with gap-1.5 and px-2 py-2
  const PILL_W = 200
  const PILL_H = 68
  let left = 0
  let top = 0
  let origin = '50% 0%'
  if (anchor) {
    left = Math.max(
      8,
      Math.min(window.innerWidth - PILL_W - 8, anchor.left + anchor.width / 2 - PILL_W / 2),
    )
    top = anchor.bottom + 10
    if (top + PILL_H > window.innerHeight - 8) {
      top = anchor.top - PILL_H - 10
      origin = '50% 100%'
    }
    // Compute where the trigger center sits relative to the pill so the
    // scale-in feels anchored to the icon the user just tapped.
    const triggerCenterX = anchor.left + anchor.width / 2
    const xPct = ((triggerCenterX - left) / PILL_W) * 100
    origin = `${Math.max(0, Math.min(100, xPct))}% ${origin.endsWith('100%') ? '100%' : '0%'}`
  }

  return createPortal(
    <AnimatePresence>
      {open && anchor && (
        <motion.div
          data-color-picker
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            position: 'fixed',
            left,
            top,
            zIndex: 100,
            transformOrigin: origin,
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="glass grid grid-cols-6 gap-1.5 rounded-[18px] p-2"
        >
          {TINTS.map((t) => {
            const active = current === t.name
            return (
              <motion.button
                key={t.name}
                variants={swatchVariants}
                aria-label={`Set color ${t.name}`}
                aria-pressed={active}
                whileTap={{ scale: 0.84 }}
                whileHover={{ scale: 1.14, y: -1 }}
                transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(t.name)
                }}
                className="relative grid h-6 w-6 place-items-center rounded-full"
                style={{
                  background: t.bg,
                  boxShadow: active
                    ? '0 0 0 1.5px var(--color-ink-900), inset 0 1px 0 rgba(255,255,255,0.55)'
                    : '0 0 0 0.5px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                <AnimatePresence>
                  {active && (
                    <motion.svg
                      key="check"
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ duration: 0.14, ease: EASE_OUT }}
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M3 6.3l2 2 4-4.6"
                        stroke="var(--color-ink-900)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
