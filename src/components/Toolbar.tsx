import { memo } from 'react'
import { motion } from 'motion/react'
import type { SoundName } from '../lib/sounds'

interface Props {
  scale: number
  count: number
  soundEnabled: boolean
  /** Hide the bottom toolbar (e.g. while a note is being dragged toward trash). */
  dimmed?: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onAdd: () => void
  onToggleSound: () => void
  playSound: (s: SoundName) => void
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const

// Stable motion props for the brand block. Keeping these out of render
// avoids new object identities each render, and pairing with memo() means
// note-count changes don't re-render the inklin text at all.
const BRAND_INITIAL = { opacity: 0, y: -8 }
const BRAND_ANIMATE = { opacity: 1, y: 0 }
const BRAND_TRANSITION = { delay: 0.1, ease: EASE_OUT, duration: 0.5 }

const Brand = memo(function Brand({ count }: { count: number }) {
  return (
    <motion.div
      initial={BRAND_INITIAL}
      animate={BRAND_ANIMATE}
      transition={BRAND_TRANSITION}
      className="pointer-events-none fixed left-5 top-5 z-50 flex items-center gap-2.5"
    >
      <div className="grid h-7 w-7 place-items-center rounded-[8px] bg-ink-950 text-white shadow-soft">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="5" cy="5.5" r="1.6" fill="currentColor" />
          <circle cx="9.5" cy="4.5" r="1.1" fill="currentColor" opacity="0.7" />
          <circle cx="8" cy="9.5" r="1.35" fill="currentColor" opacity="0.85" />
        </svg>
      </div>
      <div className="leading-none">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[14px] font-semibold tracking-[-0.018em] lowercase text-ink-900">
            inklin
          </span>
          <span className="font-mono text-[9.5px] tracking-tight text-ink-400">
            /ˈɪŋklɪn/
          </span>
        </div>
        <div className="mt-1 font-mono text-[10px] tracking-tight uppercase text-ink-500">
          {count} {count === 1 ? 'note' : 'notes'}
        </div>
      </div>
    </motion.div>
  )
})

function IconButton({
  label, onClick, primary, children,
}: {
  label: string
  onClick: () => void
  primary?: boolean
  children: React.ReactNode
}) {
  return (
    <motion.button
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      whileHover={{ y: -0.5 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={[
        'grid place-items-center rounded-lg text-ink-700 hover:text-ink-900 transition-colors',
        primary ? 'h-8 w-8 glass-btn' : 'h-8 w-8 hover:bg-black/[0.05]',
      ].join(' ')}
    >
      {children}
    </motion.button>
  )
}

export default function Toolbar({
  scale, count, soundEnabled, dimmed,
  onZoomIn, onZoomOut, onResetView,
  onAdd, onToggleSound, playSound,
}: Props) {
  const wrap = (fn: () => void, sound: SoundName = 'tapFirm') => () => {
    playSound(sound)
    fn()
  }

  return (
    <>
      <Brand count={count} />

      {/* Bottom-center toolbar — liquid glass */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{
          opacity: dimmed ? 0 : 1,
          y: dimmed ? 14 : 0,
          scale: dimmed ? 0.95 : 1,
        }}
        transition={{
          delay: dimmed ? 0 : 0.18,
          ease: EASE_OUT,
          duration: dimmed ? 0.18 : 0.55,
        }}
        style={{ pointerEvents: dimmed ? 'none' : undefined }}
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
      >
        <div className="glass flex items-center gap-0.5 rounded-2xl px-1.5 py-1.5">
          <IconButton label="Add note" primary onClick={wrap(onAdd, 'create')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </IconButton>

          <span className="mx-1 h-5 w-px bg-black/[0.08]" />

          <IconButton label="Zoom out" onClick={wrap(onZoomOut)}>
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.7" />
              <path d="M9 9l3.2 3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M4 6h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </IconButton>

          <button
            onClick={wrap(onResetView)}
            className="min-w-[3.25rem] rounded-md px-1.5 py-1 font-mono text-[11px] tabular-nums tracking-tight text-ink-700 hover:text-ink-900 hover:bg-black/[0.05] transition-colors"
          >
            {Math.round(scale * 100)}%
          </button>

          <IconButton label="Zoom in" onClick={wrap(onZoomIn)}>
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.7" />
              <path d="M9 9l3.2 3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M6 4v4M4 6h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </IconButton>

          <span className="mx-1 h-5 w-px bg-black/[0.08]" />

          <IconButton label={soundEnabled ? 'Mute' : 'Unmute'} onClick={onToggleSound}>
            {soundEnabled ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 5.5h2L8 3v8L5 8.5H3v-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M10 5.2c.6.5 1 1.1 1 1.8s-.4 1.3-1 1.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 5.5h2L8 3v8L5 8.5H3v-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M10 5l3 3M13 5l-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            )}
          </IconButton>
        </div>
      </motion.div>

      {/* Top-right hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="pointer-events-none fixed right-5 top-5 z-50 hidden sm:block"
      >
        <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-tight text-ink-400">
          <Kbd>Double-click</Kbd>
          <span className="opacity-60">to add</span>
          <span className="opacity-30">·</span>
          <Kbd>Drag</Kbd>
          <span className="opacity-60">to pan</span>
        </div>
      </motion.div>
    </>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="glass-btn rounded-[5px] px-1.5 py-0.5 font-mono text-[10px] tracking-tight text-ink-700">
      {children}
    </kbd>
  )
}
