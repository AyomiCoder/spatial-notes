import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type Variants } from 'motion/react'

const STORAGE_KEY = 'spatial-notes:changelog:v2'
const APPEAR_DELAY_MS = 30_000  // 30s after page load
const RELEASE_DATE = 'May 15, 2026'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

interface Feature {
  title: string
  desc: string
  tint: string
  accent: string
  icon: React.ReactNode
}

const FEATURES: Feature[] = [
  {
    title: 'Rich formatting',
    desc: 'Bold, italic, bullets — select text or hit ⌘B / ⌘I.',
    tint: 'var(--color-note-cream)',
    accent: 'var(--color-accent-cream)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <text x="9" y="13.5" textAnchor="middle" fontFamily="var(--font-sans)" fontWeight="800" fontSize="13" fill="var(--color-ink-900)">Aa</text>
      </svg>
    ),
  },
  {
    title: 'Notes ↔ to-dos',
    desc: 'Flip any note into a checkable list, then back again.',
    tint: 'var(--color-note-mint)',
    accent: 'var(--color-accent-mint)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6" stroke="var(--color-ink-900)" strokeWidth="1.6" />
        <path d="M5.8 9.1l2.2 2.2 4.2-4.8" stroke="var(--color-ink-900)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Drag to trash',
    desc: 'Pick up a note and drop it on the bottom zone to delete.',
    tint: 'var(--color-note-rose)',
    accent: 'var(--color-accent-rose)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M4 5h10M7 5V3.6c0-.3.3-.6.6-.6h2.8c.3 0 .6.3.6.6V5M5.5 5l.7 9.4c0 .3.3.6.6.6h4.4c.3 0 .6-.3.6-.6L12.5 5M7.5 8v4.5M10.5 8v4.5" stroke="var(--color-ink-900)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'A dozen colors',
    desc: 'Twelve tints — tap the palette on any note to recolor.',
    tint: 'var(--color-note-sky)',
    accent: 'var(--color-accent-sky)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M9 2.4c-3.7 0-6.7 2.7-6.7 6.2 0 2.1 1.4 3.6 3.3 3.6.8 0 1.4.5 1.4 1.2 0 .4-.2.8-.5 1.1-.3.3-.5.7-.5 1.2 0 .9.7 1.4 1.9 1.4 3.7 0 6.8-2.9 6.8-6.6 0-4.2-2.7-7.1-5.7-7.1z" stroke="var(--color-ink-900)" strokeWidth="1.4" fill="none" />
        <circle cx="5.4" cy="6.6" r="0.95" fill="var(--color-accent-rose)" />
        <circle cx="9"   cy="4.9" r="0.95" fill="var(--color-accent-cream)" />
        <circle cx="12.6" cy="6.6" r="0.95" fill="var(--color-accent-mint)" />
        <circle cx="12.8" cy="10"  r="0.95" fill="var(--color-accent-lilac)" />
      </svg>
    ),
  },
]

const HERO_DOTS = [
  'var(--color-note-cream)',
  'var(--color-note-coral)',
  'var(--color-note-lilac)',
  'var(--color-note-aqua)',
  'var(--color-note-mint)',
]

const popupVariants: Variants = {
  initial: { opacity: 0, y: 28, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 340,
      damping: 30,
      mass: 0.8,
      delayChildren: 0.14,
      staggerChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.97,
    transition: { duration: 0.22, ease: EASE_OUT },
  },
}

const heroDotsVariants: Variants = {
  initial: {},
  animate: { transition: { delayChildren: 0.04, staggerChildren: 0.05 } },
}

const heroDotVariants: Variants = {
  initial: { scale: 0, y: 10, opacity: 0 },
  animate: {
    scale: 1,
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 480, damping: 18 },
  },
}

const itemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 360, damping: 30 },
  },
}

const triggerVariants: Variants = {
  initial: { opacity: 0, y: 14, scale: 0.85 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 380, damping: 26, delay: 0.6 },
  },
  exit: { opacity: 0, y: 10, scale: 0.85, transition: { duration: 0.18, ease: EASE_OUT } },
}

export default function Changelog() {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(() => {
    if (typeof window === 'undefined') return false
    try { return localStorage.getItem(STORAGE_KEY) === 'seen' } catch { return false }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (seen) return
    const t = window.setTimeout(() => setOpen(true), APPEAR_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [seen])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const dismiss = () => {
    setOpen(false)
    setSeen(true)
    try { localStorage.setItem(STORAGE_KEY, 'seen') } catch {}
  }

  const reopen = () => setOpen(true)

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      {/* Persistent "What's new" trigger — bottom-left of viewport.
          Hides while the popup is open so the same anchor point hosts both. */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="trigger"
            variants={triggerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={reopen}
            aria-label="What's new"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.94 }}
            className="group fixed bottom-5 left-5 z-40 grid h-10 w-10 place-items-center"
            style={{
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'saturate(220%) blur(28px)',
              WebkitBackdropFilter: 'saturate(220%) blur(28px)',
              borderRadius: '3px',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.9), ' +
                'inset 0 0 0 0.5px rgba(255,255,255,0.55), ' +
                '0 0 0 0.5px rgba(0,0,0,0.06), ' +
                '0 6px 14px -4px rgba(0,0,0,0.08), ' +
                '0 14px 32px -10px rgba(0,0,0,0.16)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" className="text-ink-700 group-hover:text-ink-900 transition-colors">
              <path
                d="M9 1.6l1.4 3.7 3.7 1.4-3.7 1.4L9 11.8 7.6 8.1 3.9 6.7l3.7-1.4L9 1.6zM13.7 11l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7.7-1.7zM4.2 11.2l.45 1.1 1.1.45-1.1.45-.45 1.1-.45-1.1-1.1-.45 1.1-.45.45-1.1z"
                fill="currentColor"
              />
            </svg>
            {!seen && (
              <motion.span
                aria-hidden
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.8 }}
                className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
                style={{ background: 'var(--color-accent-rose)', boxShadow: '0 0 0 1.5px white' }}
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* The popup itself — anchored to the same bottom-left corner.
          No backdrop, no outside-click dismiss. Only the X / "Got it" close it. */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="popup"
            variants={popupVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            role="dialog"
            aria-modal="false"
            aria-labelledby="changelog-title"
            className="fixed bottom-5 left-5 z-40 w-[360px] max-w-[calc(100vw-2.5rem)] overflow-hidden bg-white"
            style={{
              borderRadius: '3px',
              transformOrigin: '0% 100%',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.7) inset, ' +
                '0 0 0 0.5px rgba(0,0,0,0.08), ' +
                '0 14px 30px -8px rgba(0,0,0,0.20), ' +
                '0 28px 64px -12px rgba(0,0,0,0.28)',
            }}
          >
            {/* Soft halo at the top */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-28"
              style={{
                background:
                  'radial-gradient(60% 100% at 30% 0%, color-mix(in oklab, var(--color-accent-lilac) 14%, transparent), transparent 70%), ' +
                  'radial-gradient(50% 100% at 80% 5%, color-mix(in oklab, var(--color-accent-sky) 12%, transparent), transparent 70%)',
              }}
            />

            {/* Top row — date + close */}
            <div className="relative flex items-center justify-between px-5 pt-4">
              <motion.span
                variants={itemVariants}
                className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-500"
              >
                {RELEASE_DATE}
              </motion.span>
              <motion.button
                variants={itemVariants}
                onClick={dismiss}
                aria-label="Close"
                whileTap={{ scale: 0.88 }}
                className="grid h-6 w-6 place-items-center text-ink-500 hover:text-ink-900 hover:bg-black/[0.06] transition-colors"
                style={{ borderRadius: '3px' }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </motion.button>
            </div>

            <div className="relative px-5 pt-3 pb-5">
              {/* Hero dots */}
              <motion.div variants={heroDotsVariants} className="mb-3 flex items-center gap-1.5">
                {HERO_DOTS.map((c, i) => (
                  <motion.div
                    key={i}
                    variants={heroDotVariants}
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: c,
                      boxShadow: '0 0 0 0.5px rgba(0,0,0,0.10), inset 0 0.5px 0 rgba(255,255,255,0.6)',
                    }}
                  />
                ))}
              </motion.div>

              <motion.h2
                variants={itemVariants}
                id="changelog-title"
                className="text-[20px] font-semibold leading-[1.1] tracking-[-0.022em] text-ink-900"
              >
                What's new
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="mt-1 text-[13px] leading-[1.45] tracking-[-0.005em] text-ink-500"
              >
                A few fresh ways to use your canvas.
              </motion.p>

              <div className="mt-4 flex flex-col gap-3">
                {FEATURES.map((f) => (
                  <motion.div
                    key={f.title}
                    variants={itemVariants}
                    className="flex items-start gap-3"
                  >
                    <div
                      className="grid h-8 w-8 shrink-0 place-items-center"
                      style={{
                        background: f.tint,
                        borderRadius: '3px',
                        boxShadow:
                          '0 0 0 0.5px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.55), ' +
                          `0 4px 10px -4px ${f.accent}`,
                      }}
                    >
                      {f.icon}
                    </div>
                    <div className="flex-1 pt-[1px]">
                      <div className="text-[13.5px] font-semibold tracking-[-0.012em] text-ink-900">
                        {f.title}
                      </div>
                      <div className="mt-0.5 text-[12.5px] leading-[1.4] tracking-[-0.003em] text-ink-600">
                        {f.desc}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                variants={itemVariants}
                onClick={dismiss}
                whileHover={{ y: -0.5 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                className="mt-5 h-10 w-full bg-ink-950 text-white text-[13px] font-semibold tracking-[-0.01em]"
                style={{
                  borderRadius: '3px',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 12px -2px rgba(0,0,0,0.30)',
                }}
              >
                Got it
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  )
}
