import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type Variants } from 'motion/react'

// Bump version when the contents change so prior readers see the new entries.
const STORAGE_KEY = 'spatial-notes:changelog:v4'
const APPEAR_DELAY_MS = 30_000  // 30s after page load

const EASE_OUT = [0.16, 1, 0.3, 1] as const

interface Feature {
  title: string
  desc: string
  tint: string
  accent: string
  icon: React.ReactNode
}

interface Release {
  date: string
  features: Feature[]
}

// Note tile backgrounds in features stay bright in both themes (Stickies feel).
// The dark-ink-900 strokes inside the icons sit on those bright tiles and remain
// readable regardless of theme.
const RELEASES: Release[] = [
  {
    date: 'May 16, 2026',
    features: [
      {
        title: 'Dark mode',
        desc: 'Tap the moon in the toolbar — the canvas follows your system by default.',
        tint: 'var(--color-note-slate)',
        accent: 'var(--color-accent-slate)',
        icon: (
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path
              d="M14.4 10.5A5.4 5.4 0 017.5 3.6 6 6 0 1014.4 10.5z"
              stroke="var(--color-ink-900)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        title: 'Buttery panning',
        desc: 'Dragging the canvas now coalesces to one frame — lighter on the hand.',
        tint: 'var(--color-note-aqua)',
        accent: 'var(--color-accent-aqua)',
        icon: (
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path
              d="M3 9h12M11.5 5L15 9l-3.5 4M6.5 5L3 9l3.5 4"
              stroke="var(--color-ink-900)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        title: 'Sharper controls',
        desc: 'Zoom and palette icons got a precision pass at small sizes.',
        tint: 'var(--color-note-blush)',
        accent: 'var(--color-accent-blush)',
        icon: (
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <circle cx="7.5" cy="7.5" r="4.5" stroke="var(--color-ink-900)" strokeWidth="1.6" />
            <path
              d="M11 11l3.5 3.5"
              stroke="var(--color-ink-900)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M7.5 5.5v4M5.5 7.5h4"
              stroke="var(--color-ink-900)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        title: 'Interactive tour',
        desc: 'First visit gets a guided walkthrough. Tap the ? in the toolbar to replay any time.',
        tint: 'var(--color-note-lilac)',
        accent: 'var(--color-accent-lilac)',
        icon: (
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path
              d="M5 2.5v13"
              stroke="var(--color-ink-900)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M5 2.8h8.2l-1.8 2.6 1.8 2.6H5"
              stroke="var(--color-ink-900)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    ],
  },
  {
    date: 'May 15, 2026',
    features: [
      {
        title: 'Rich formatting',
        desc: 'Bold, italic, bullets — select text or hit ⌘B / ⌘I.',
        tint: 'var(--color-note-cream)',
        accent: 'var(--color-accent-cream)',
        icon: (
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <text
              x="9"
              y="13.5"
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontWeight="800"
              fontSize="13"
              fill="var(--color-ink-900)"
            >
              Aa
            </text>
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
            <path
              d="M5.8 9.1l2.2 2.2 4.2-4.8"
              stroke="var(--color-ink-900)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
            <path
              d="M4 5h10M7 5V3.6c0-.3.3-.6.6-.6h2.8c.3 0 .6.3.6.6V5M5.5 5l.7 9.4c0 .3.3.6.6.6h4.4c.3 0 .6-.3.6-.6L12.5 5M7.5 8v4.5M10.5 8v4.5"
              stroke="var(--color-ink-900)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
            <path
              d="M9 2.4c-3.7 0-6.7 2.7-6.7 6.2 0 2.1 1.4 3.6 3.3 3.6.8 0 1.4.5 1.4 1.2 0 .4-.2.8-.5 1.1-.3.3-.5.7-.5 1.2 0 .9.7 1.4 1.9 1.4 3.7 0 6.8-2.9 6.8-6.6 0-4.2-2.7-7.1-5.7-7.1z"
              stroke="var(--color-ink-900)"
              strokeWidth="1.4"
              fill="none"
            />
            <circle cx="5.4" cy="6.6" r="0.95" fill="var(--color-accent-rose)" />
            <circle cx="9" cy="4.9" r="0.95" fill="var(--color-accent-cream)" />
            <circle cx="12.6" cy="6.6" r="0.95" fill="var(--color-accent-mint)" />
            <circle cx="12.8" cy="10" r="0.95" fill="var(--color-accent-lilac)" />
          </svg>
        ),
      },
    ],
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
  // Persistent flag: has the user EVER seen this changelog version? Drives the
  // 30s auto-open so we don't keep interrupting returning users.
  const [everSeen, setEverSeen] = useState(() => {
    if (typeof window === 'undefined') return false
    try { return localStorage.getItem(STORAGE_KEY) === 'seen' } catch { return false }
  })
  // Session-only flag: has the user opened the changelog in THIS session?
  // Resets on every refresh so the red "new" dot reappears each visit until
  // they pop it open, mimicking an inbox-style notification badge.
  const [openedThisSession, setOpenedThisSession] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (everSeen) return
    const t = window.setTimeout(() => setOpen(true), APPEAR_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [everSeen])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const dismiss = () => {
    setOpen(false)
    setEverSeen(true)
    setOpenedThisSession(true)
    try { localStorage.setItem(STORAGE_KEY, 'seen') } catch {}
  }

  const reopen = () => {
    setOpen(true)
    setOpenedThisSession(true)
  }

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
            className="glass-btn group fixed bottom-5 left-5 z-40 grid h-10 w-10 place-items-center rounded-[8px]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 18 18"
              fill="none"
              className="text-ink-700 group-hover:text-ink-900 dark:text-ink-300 dark:group-hover:text-ink-100 transition-colors"
            >
              <rect
                x="3.5"
                y="2.5"
                width="11"
                height="13"
                rx="1.7"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M6 6.5h6M6 9h6M6 11.5h4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            {!openedThisSession && (
              <motion.span
                aria-hidden
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.8 }}
                className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
                style={{
                  background: 'var(--color-accent-rose)',
                  boxShadow: '0 0 0 1.5px var(--color-paper)',
                }}
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* The popup itself — anchored to the same bottom-left corner.
          No backdrop, no outside-click dismiss. Only the X / "Got it" close it.
          Liquid glass surface so it picks up the canvas tint behind it and
          inherits the dark variants from the .glass utility. */}
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
            className="glass fixed bottom-5 left-5 z-40 flex w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[14px]"
            style={{
              transformOrigin: '0% 100%',
              maxHeight: 'min(560px, calc(100vh - 2.5rem))',
            }}
          >
            {/* Soft halo at the top — kept above the scroll area so it doesn't
                travel with content. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-28"
              style={{
                background:
                  'radial-gradient(60% 100% at 30% 0%, color-mix(in oklab, var(--color-accent-lilac) 14%, transparent), transparent 70%), ' +
                  'radial-gradient(50% 100% at 80% 5%, color-mix(in oklab, var(--color-accent-sky) 12%, transparent), transparent 70%)',
              }}
            />

            {/* Header — hero dots, close, title, tagline. Stays put while
                the section list scrolls underneath. */}
            <div className="relative shrink-0 px-5 pt-4 pb-3">
              <div className="flex items-start justify-between">
                <motion.div
                  variants={heroDotsVariants}
                  className="flex items-center gap-1.5 pt-1"
                >
                  {HERO_DOTS.map((c, i) => (
                    <motion.div
                      key={i}
                      variants={heroDotVariants}
                      className="h-2 w-2 rounded-full"
                      style={{
                        background: c,
                        boxShadow:
                          '0 0 0 0.5px rgba(0,0,0,0.10), inset 0 0.5px 0 rgba(255,255,255,0.6)',
                      }}
                    />
                  ))}
                </motion.div>
                <motion.button
                  variants={itemVariants}
                  onClick={dismiss}
                  aria-label="Close"
                  whileTap={{ scale: 0.88 }}
                  className="grid h-6 w-6 place-items-center rounded-[6px] text-ink-500 hover:text-ink-900 hover:bg-black/[0.06] dark:text-ink-400 dark:hover:text-ink-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 2.5l7 7M9.5 2.5l-7 7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </motion.button>
              </div>

              <motion.h2
                variants={itemVariants}
                id="changelog-title"
                className="mt-3 text-[20px] font-semibold leading-[1.1] tracking-[-0.022em] text-ink-900 dark:text-ink-100"
              >
                What's new
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="mt-1 text-[13px] leading-[1.45] tracking-[-0.005em] text-ink-500 dark:text-ink-400"
              >
                A few fresh ways to use your canvas.
              </motion.p>
            </div>

            {/* Scrollable section list. min-h-0 lets this flex child shrink
                inside the max-height popup so overflow-y-auto kicks in. */}
            <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-2">
              {RELEASES.map((release, ri) => (
                <motion.section
                  key={release.date}
                  variants={itemVariants}
                  className={ri === 0 ? '' : 'mt-5 border-t border-black/[0.06] pt-4 dark:border-white/[0.08]'}
                >
                  <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-500 dark:text-ink-400">
                    {release.date}
                  </div>
                  <div className="flex flex-col gap-3">
                    {release.features.map((f) => (
                      <div key={f.title} className="flex items-start gap-3">
                        <div
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px]"
                          style={{
                            background: f.tint,
                            boxShadow:
                              '0 0 0 0.5px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.55), ' +
                              `0 4px 10px -4px ${f.accent}`,
                          }}
                        >
                          {f.icon}
                        </div>
                        <div className="flex-1 pt-[1px]">
                          <div className="text-[13.5px] font-semibold tracking-[-0.012em] text-ink-900 dark:text-ink-100">
                            {f.title}
                          </div>
                          <div className="mt-0.5 text-[12.5px] leading-[1.4] tracking-[-0.003em] text-ink-600 dark:text-ink-300">
                            {f.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              ))}
            </div>

            {/* Footer — Got it stays anchored so users can dismiss without
                scrolling to the bottom. */}
            <div className="relative shrink-0 px-5 pb-5 pt-3">
              <motion.button
                variants={itemVariants}
                onClick={dismiss}
                whileHover={{ y: -0.5 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                className="h-10 w-full rounded-[8px] bg-ink-950 text-white text-[13px] font-semibold tracking-[-0.01em] dark:bg-white dark:text-ink-950"
                style={{
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
