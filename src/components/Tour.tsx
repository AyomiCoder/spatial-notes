import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { Note } from '../types'

interface Props {
  active: boolean
  step: number
  notes: Note[]
  onNext: () => void
  onFinish: () => void
  /** Select a specific note (used so the palette button renders on entering 'color'). */
  onSelectNote: (id: string) => void
}

type Snap = {
  count: number
  targetId: string | null
  targetX: number | null
  targetY: number | null
  targetW: number | null
  targetH: number | null
  targetTint: string | null
}

interface StepDef {
  id: 'welcome' | 'create' | 'move' | 'resize' | 'color' | 'done'
  title: string
  body: string
  /** Tip shown while waiting for the action — also used as the live progress label. */
  hint?: string
  /** Spotlight target. Returning null means no spotlight (centered card). */
  target?: (notes: Note[], tourNoteId: string | null) => HTMLElement | null
  /** True when the user has completed this step's action; enables Continue. */
  isDone?: (initial: Snap, current: Snap) => boolean
  /** Force the tip card to render above the target. Useful when the target
   * itself opens a popover downward (color picker, etc.) so the tip doesn't
   * collide with it. Defaults to "prefer below, fall back to above". */
  tipAbove?: boolean
}

function snap(notes: Note[], tourNoteId: string | null): Snap {
  const target = tourNoteId
    ? notes.find((n) => n.id === tourNoteId)
    : notes[notes.length - 1]
  return {
    count: notes.length,
    targetId: target?.id ?? null,
    targetX: target?.x ?? null,
    targetY: target?.y ?? null,
    targetW: target?.w ?? null,
    targetH: target?.h ?? null,
    targetTint: target?.tint ?? null,
  }
}

const STEPS: StepDef[] = [
  {
    id: 'welcome',
    title: 'Welcome to inklin',
    body: 'A tiny canvas for fast-moving thoughts. Five quick steps and you’re set.',
  },
  {
    id: 'create',
    title: 'Drop your first note',
    body: 'Tap the plus button below — or double-click anywhere on the canvas.',
    hint: 'Waiting for a new note…',
    target: () => document.querySelector('[data-tour="add-button"]') as HTMLElement | null,
    isDone: (init, now) => now.count > init.count,
  },
  {
    id: 'move',
    title: 'Move it around',
    body: 'Pick the note up and drag it somewhere new on the canvas.',
    hint: 'Waiting for a drag…',
    target: (_notes, tourId) =>
      tourId
        ? (document.querySelector(`[data-note-id="${tourId}"]`) as HTMLElement | null)
        : null,
    isDone: (init, now) =>
      init.targetId !== null &&
      init.targetId === now.targetId &&
      (init.targetX !== now.targetX || init.targetY !== now.targetY),
  },
  {
    id: 'resize',
    title: 'Resize it',
    body: 'Grab the corner at the bottom-right of the note and drag to stretch.',
    hint: 'Waiting for a resize…',
    target: (_notes, tourId) => {
      if (!tourId) return null
      const noteEl = document.querySelector(`[data-note-id="${tourId}"]`)
      if (!noteEl) return null
      return (noteEl.querySelector('[data-tour="resize"]') as HTMLElement | null) ?? null
    },
    // Keep the tip out of the bottom-right drag path.
    tipAbove: true,
    isDone: (init, now) =>
      init.targetId !== null &&
      init.targetId === now.targetId &&
      (init.targetW !== now.targetW || init.targetH !== now.targetH),
  },
  {
    id: 'color',
    title: 'Make it yours',
    body: 'Tap the palette icon on your note and pick a tint you like.',
    hint: 'Waiting for a color change…',
    target: (_notes, tourId) => {
      if (!tourId) return null
      const noteEl = document.querySelector(`[data-note-id="${tourId}"]`)
      if (!noteEl) return null
      return (noteEl.querySelector('[data-tour="palette"]') as HTMLElement | null) ?? null
    },
    // Color picker opens downward from the palette button — keep the tip
    // above so it doesn't sit on top of the picker.
    tipAbove: true,
    isDone: (init, now) =>
      init.targetId !== null &&
      init.targetId === now.targetId &&
      init.targetTint !== null &&
      now.targetTint !== init.targetTint,
  },
  {
    id: 'done',
    title: 'You’re ready',
    body: 'Drag a note to the trash to delete. Use the toolbar to zoom and toggle dark mode. The bell shows what’s new.',
  },
]

const TIP_W = 340
const TIP_PAD = 14
const SPOT_PAD = 12

export default function Tour({ active, step, notes, onNext, onFinish, onSelectNote }: Props) {
  const maskId = useId()
  const current = STEPS[step]
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const initialSnapRef = useRef<Snap | null>(null)
  const lastStepRef = useRef<number>(-1)
  const tourNoteIdRef = useRef<string | null>(null)

  // On step entry, snapshot the relevant canvas state so isDone has a baseline.
  // We anchor on a specific note ID the moment 'create' completes so subsequent
  // steps follow the same note even if the user creates more.
  useEffect(() => {
    if (!active || !current) return
    if (lastStepRef.current === step) return
    lastStepRef.current = step

    // Pin tourNoteId when entering the 'move' step (i.e., create just completed)
    if (current.id === 'move' && !tourNoteIdRef.current && notes.length > 0) {
      tourNoteIdRef.current = notes[notes.length - 1]!.id
    }
    // Steps that need their per-note control visible require the note to be
    // selected — the resize handle and palette button both fade out otherwise.
    if ((current.id === 'resize' || current.id === 'color') && tourNoteIdRef.current) {
      onSelectNote(tourNoteIdRef.current)
    }
    initialSnapRef.current = snap(notes, tourNoteIdRef.current)
  }, [active, step, current, notes, onSelectNote])

  // Reset anchor when the whole tour ends so a replay starts fresh.
  useEffect(() => {
    if (!active) {
      tourNoteIdRef.current = null
      lastStepRef.current = -1
      initialSnapRef.current = null
    }
  }, [active])

  // Track the target's bounding rect via rAF. Cheap, and survives any layout
  // shift (note drags, zoom, viewport resize, etc.).
  useEffect(() => {
    if (!active || !current) return
    if (!current.target) {
      setTargetRect(null)
      return
    }
    let rafId: number | null = null
    const tick = () => {
      const el = current.target!(notes, tourNoteIdRef.current)
      if (el) {
        const r = el.getBoundingClientRect()
        setTargetRect((prev) => {
          if (
            prev &&
            prev.x === r.x && prev.y === r.y &&
            prev.width === r.width && prev.height === r.height
          ) return prev
          return r
        })
      } else {
        setTargetRect((prev) => (prev === null ? prev : null))
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => { if (rafId !== null) cancelAnimationFrame(rafId) }
  }, [active, current, notes])

  const stepDone = useMemo(() => {
    if (!current) return false
    if (!current.isDone) return true // welcome/done are always advanceable
    if (!initialSnapRef.current) return false
    return current.isDone(initialSnapRef.current, snap(notes, tourNoteIdRef.current))
  }, [current, notes])

  if (!active || !current) return null

  const isLast = step === STEPS.length - 1
  const tipPos = computeTipPlacement(targetRect, current.tipAbove === true)

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[200]" aria-live="polite">
      {/* Dim layer with optional rectangular cutout around the target.
          Pointer events pass through to the canvas so users can interact. */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <motion.rect
                initial={false}
                animate={{
                  x: targetRect.x - SPOT_PAD,
                  y: targetRect.y - SPOT_PAD,
                  width: targetRect.width + SPOT_PAD * 2,
                  height: targetRect.height + SPOT_PAD * 2,
                }}
                rx={14}
                ry={14}
                fill="black"
                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              />
            )}
          </mask>
        </defs>
        <motion.rect
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          width="100%"
          height="100%"
          fill="rgba(8, 8, 12, 0.55)"
          mask={`url(#${maskId})`}
        />
      </svg>

      {/* Pulsing ring around the spotlight target — draws the eye even more. */}
      <AnimatePresence>
        {targetRect && (
          <motion.div
            key={`ring-${current.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-none absolute"
            style={{
              left: targetRect.x - SPOT_PAD,
              top: targetRect.y - SPOT_PAD,
              width: targetRect.width + SPOT_PAD * 2,
              height: targetRect.height + SPOT_PAD * 2,
              borderRadius: 14,
            }}
          >
            <motion.div
              aria-hidden
              animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.025, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0"
              style={{
                borderRadius: 14,
                boxShadow:
                  '0 0 0 1.5px color-mix(in oklab, var(--color-accent-sky) 85%, white), ' +
                  '0 0 24px 2px color-mix(in oklab, var(--color-accent-sky) 60%, transparent)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="glass pointer-events-auto absolute rounded-[16px]"
          style={{
            left: tipPos.x,
            top: tipPos.y,
            width: TIP_W,
            maxWidth: 'calc(100vw - 24px)',
            padding: TIP_PAD + 4,
          }}
        >
          {/* Header — progress dots + skip */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={[
                    'h-1.5 rounded-full transition-all duration-300',
                    i === step
                      ? 'w-6 bg-ink-900 dark:bg-white'
                      : i < step
                        ? 'w-1.5 bg-ink-900/70 dark:bg-white/70'
                        : 'w-1.5 bg-ink-900/20 dark:bg-white/25',
                  ].join(' ')}
                />
              ))}
            </div>
            <button
              onClick={onFinish}
              className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100 transition-colors"
            >
              Skip tour
            </button>
          </div>

          <h2 className="text-[18px] font-semibold leading-[1.2] tracking-[-0.018em] text-ink-900 dark:text-ink-100">
            {current.title}
          </h2>
          <p className="mt-1.5 text-[13px] leading-[1.5] tracking-[-0.005em] text-ink-600 dark:text-ink-300">
            {current.body}
          </p>

          {current.hint && (
            <div className="mt-3 flex items-center gap-2 text-[11.5px] tracking-tight">
              <motion.span
                aria-hidden
                animate={
                  stepDone
                    ? { opacity: 1, scale: 1 }
                    : { opacity: [0.35, 1, 0.35] }
                }
                transition={
                  stepDone
                    ? { type: 'spring', stiffness: 500, damping: 18 }
                    : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                }
                className={[
                  'grid h-3.5 w-3.5 place-items-center rounded-full',
                  stepDone
                    ? 'bg-emerald-500'
                    : 'bg-ink-500/40 dark:bg-ink-400/40',
                ].join(' ')}
              >
                {stepDone && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path
                      d="M1.5 4.2l1.6 1.6L6.5 2.2"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </motion.span>
              <span
                className={
                  stepDone
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-ink-500 dark:text-ink-400'
                }
              >
                {stepDone ? 'Nice — tap Continue.' : current.hint}
              </span>
            </div>
          )}

          {/* Continue / Let's go */}
          <div className="mt-4 flex items-center justify-end">
            <motion.button
              onClick={isLast ? onFinish : onNext}
              disabled={!stepDone}
              whileHover={stepDone ? { y: -0.5 } : undefined}
              whileTap={stepDone ? { scale: 0.97 } : undefined}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className={[
                'h-9 rounded-[8px] px-5 text-[13px] font-semibold tracking-[-0.01em] transition-opacity',
                stepDone
                  ? 'bg-ink-950 text-white dark:bg-white dark:text-ink-950'
                  : 'bg-ink-950/30 text-white/70 cursor-not-allowed dark:bg-white/20 dark:text-ink-950/70',
              ].join(' ')}
              style={{
                boxShadow: stepDone
                  ? 'inset 0 1px 0 rgba(255,255,255,0.14), 0 4px 12px -2px rgba(0,0,0,0.30)'
                  : 'none',
              }}
            >
              {isLast ? 'Let’s go' : 'Continue'}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  )
}

// Place the tip near the target with a safe gap; if there's no target,
// center it. Always keep it on-screen with 12px viewport padding.
// When `preferAbove` is true (e.g. when the target opens a downward popover),
// we abandon target-anchoring entirely and pin the card to the top-center of
// the viewport — that's the only position guaranteed to never collide with
// whatever the target opens beneath itself, regardless of where the user
// has dragged the note.
function computeTipPlacement(rect: DOMRect | null, preferAbove: boolean) {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1280
  const h = typeof window !== 'undefined' ? window.innerHeight : 800
  const approxH = 220
  const SAFE = 12
  const GAP = 22

  if (!rect) {
    return {
      x: Math.max(SAFE, (w - TIP_W) / 2),
      y: Math.max(SAFE, (h - approxH) / 2),
    }
  }

  if (preferAbove) {
    // Top-center of viewport, ignoring rect — the spotlight + pulsing ring
    // still tell the user which control to click.
    return {
      x: Math.max(SAFE, Math.min(w - TIP_W - SAFE, (w - TIP_W) / 2)),
      y: SAFE + 16,
    }
  }

  let x = rect.x + rect.width / 2 - TIP_W / 2
  x = Math.max(SAFE, Math.min(w - TIP_W - SAFE, x))

  const belowY = rect.bottom + GAP
  const aboveY = rect.top - approxH - GAP
  const aboveFits = aboveY >= SAFE
  const belowFits = belowY + approxH <= h - SAFE

  let y: number
  if (belowFits) y = belowY
  else if (aboveFits) y = aboveY
  else y = Math.max(SAFE, Math.min(h - approxH - SAFE, belowY))

  return { x, y }
}
