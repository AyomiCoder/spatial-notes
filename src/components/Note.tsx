import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Note, NoteTint } from '../types'
import type { SoundName } from '../lib/sounds'

interface TintStyle {
  bg: string
  accent: string
}

const TINT: Record<NoteTint, TintStyle> = {
  cream: { bg: 'bg-[var(--color-note-cream)]', accent: '#f5b800' },
  rose:  { bg: 'bg-[var(--color-note-rose)]',  accent: '#ff2d55' },
  sky:   { bg: 'bg-[var(--color-note-sky)]',   accent: '#007aff' },
  mint:  { bg: 'bg-[var(--color-note-mint)]',  accent: '#34c759' },
  lilac: { bg: 'bg-[var(--color-note-lilac)]', accent: '#af52de' },
  sand:  { bg: 'bg-[var(--color-note-sand)]',  accent: '#ff9500' },
}

const MIN_W = 180
const MIN_H = 120
const MAX_W = 600
const MAX_H = 700

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function buildShadow(accent: string, mode: 'rest' | 'selected' | 'editing' | 'dragging' | 'resizing') {
  const base =
    '0 1px 2px rgba(0,0,0,0.05), 0 6px 14px -4px rgba(0,0,0,0.08), 0 16px 36px -12px rgba(0,0,0,0.10)'
  if (mode === 'rest') return base
  if (mode === 'dragging' || mode === 'resizing')
    return `0 2px 4px rgba(0,0,0,0.08), 0 22px 50px -10px rgba(0,0,0,0.22), 0 32px 80px -20px ${hexToRgba(accent, 0.40)}`
  if (mode === 'selected')
    return `${base}, 0 18px 40px -12px ${hexToRgba(accent, 0.35)}, 0 8px 24px -8px ${hexToRgba(accent, 0.25)}`
  return `${base}, 0 24px 60px -16px ${hexToRgba(accent, 0.55)}, 0 12px 36px -10px ${hexToRgba(accent, 0.40)}`
}

const SPRING = { type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.7 }
const EASE_OUT = [0.16, 1, 0.3, 1] as const

interface Props {
  note: Note
  scale: number
  selected: boolean
  autoFocus?: boolean
  onSelect: () => void
  onChange: (patch: Partial<Note>) => void
  onDelete: () => void
  onDragStart: () => void
  onDragEnd: () => void
  onAutoFocused?: () => void
  playSound: (s: SoundName) => void
}

function formatStamp(ts: number) {
  const d = new Date(ts)
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function NoteCard({
  note, scale, selected, autoFocus,
  onSelect, onChange, onDelete, onDragStart, onDragEnd, onAutoFocused, playSound,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const dragState = useRef<{
    sx: number; sy: number
    ox: number; oy: number
    dx: number; dy: number
    moved: boolean
    rafId: number | null
    finalX: number; finalY: number
  } | null>(null)

  const resizeState = useRef<{
    sx: number; sy: number
    ow: number; oh: number
    rafId: number | null
    finalW: number; finalH: number
  } | null>(null)

  const [editing, setEditing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(() => note.body.length === 0)
  const tint = TINT[note.tint] ?? TINT.cream

  // Sync editor DOM when body changes from outside (e.g. localStorage hydration)
  useEffect(() => {
    const el = editorRef.current
    if (el && !editing && el.innerText !== note.body) {
      el.innerText = note.body
    }
    setIsEmpty(note.body.length === 0)
  }, [note.body, editing])

  // Reliable focus: useLayoutEffect fires after DOM mutations (contenteditable
  // already applied) but before paint, so the caret appears in the same frame
  // the user sees the edit-state transition. This replaces the RAF approach
  // which raced React's commit and could leave the editor unfocused.
  useLayoutEffect(() => {
    if (!editing) return
    const el = editorRef.current
    if (!el) return
    el.focus({ preventScroll: true })
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }, [editing])

  // ─── Drag ───────────────────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    if (editing) return
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    dragState.current = {
      sx: e.clientX, sy: e.clientY,
      ox: note.x, oy: note.y,
      dx: 0, dy: 0,
      moved: false,
      rafId: null,
      finalX: note.x, finalY: note.y,
    }
  }

  const applyDragTransform = () => {
    const s = dragState.current
    const el = wrapperRef.current
    if (!s || !el) return
    s.rafId = null
    el.style.transform = `translate3d(${s.dx}px, ${s.dy}px, 0)`
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const s = dragState.current
    if (!s) return
    const dx = (e.clientX - s.sx) / scale
    const dy = (e.clientY - s.sy) / scale

    if (!s.moved && Math.hypot(dx, dy) > 3) {
      s.moved = true
      setDragging(true)
      onSelect()
      onDragStart()
      playSound('pickup')
    }
    if (s.moved) {
      s.dx = dx
      s.dy = dy
      s.finalX = s.ox + dx
      s.finalY = s.oy + dy
      if (s.rafId === null) s.rafId = requestAnimationFrame(applyDragTransform)
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const s = dragState.current
    dragState.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    if (!s) return
    if (s.rafId !== null) cancelAnimationFrame(s.rafId)

    if (s.moved) {
      if (wrapperRef.current) wrapperRef.current.style.transform = ''
      onChange({ x: s.finalX, y: s.finalY })
      onDragEnd()
      setDragging(false)
      playSound('drop')
    } else {
      enterEditing()
    }
  }

  // ─── Resize ─────────────────────────────────────────────────────────────
  const handleResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    onSelect()
    setResizing(true)
    resizeState.current = {
      sx: e.clientX, sy: e.clientY,
      ow: note.w, oh: note.h,
      rafId: null,
      finalW: note.w, finalH: note.h,
    }
    playSound('pickup')
  }

  const applyResize = () => {
    const s = resizeState.current
    const el = wrapperRef.current
    if (!s || !el) return
    s.rafId = null
    el.style.width = `${s.finalW}px`
    el.style.height = `${s.finalH}px`
  }

  const handleResizeMove = (e: React.PointerEvent) => {
    const s = resizeState.current
    if (!s) return
    const dx = (e.clientX - s.sx) / scale
    const dy = (e.clientY - s.sy) / scale
    s.finalW = Math.max(MIN_W, Math.min(MAX_W, s.ow + dx))
    s.finalH = Math.max(MIN_H, Math.min(MAX_H, s.oh + dy))
    if (s.rafId === null) s.rafId = requestAnimationFrame(applyResize)
  }

  const handleResizeUp = (e: React.PointerEvent) => {
    const s = resizeState.current
    resizeState.current = null
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    if (!s) return
    if (s.rafId !== null) cancelAnimationFrame(s.rafId)
    onChange({ w: s.finalW, h: s.finalH })
    setResizing(false)
    playSound('drop')
  }

  // ─── Edit ───────────────────────────────────────────────────────────────
  const enterEditing = () => {
    if (editing) return
    onSelect()
    setEditing(true)
    playSound('tapSoft')
  }

  useEffect(() => {
    if (!autoFocus) return
    enterEditing()
    onAutoFocused?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus])

  // Cleanup any in-flight RAF + pointer capture if the note unmounts mid-drag
  useEffect(() => {
    return () => {
      if (dragState.current?.rafId) cancelAnimationFrame(dragState.current.rafId)
      if (resizeState.current?.rafId) cancelAnimationFrame(resizeState.current.rafId)
    }
  }, [])

  const mode = resizing ? 'resizing' : dragging ? 'dragging' : editing ? 'editing' : selected ? 'selected' : 'rest'
  const shadow = buildShadow(tint.accent, mode)
  const interacting = dragging || resizing

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        left: note.x,
        top: note.y,
        width: note.w,
        height: note.h,
        zIndex: interacting ? 50 : editing ? 40 : selected ? 30 : 10,
        willChange: interacting ? 'transform, width, height' : 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 8 }}
        animate={{
          opacity: 1,
          y: editing ? -2 : 0,
          scale: dragging ? 1.035 : editing ? 1.012 : 1,
          boxShadow: shadow,
        }}
        exit={{ opacity: 0, scale: 0.9, y: -6, transition: { duration: 0.18 } }}
        transition={interacting ? { duration: 0.18, ease: EASE_OUT } : SPRING}
        whileHover={editing || interacting ? undefined : { y: -1 }}
        className={[
          'group relative h-full w-full rounded-md flex flex-col',
          tint.bg,
          'text-ink-900',
          editing ? 'cursor-text' : dragging ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing',
          'no-select overflow-hidden',
        ].join(' ')}
      >
        {/* Top bar — delete X. Hidden while editing OR interacting. */}
        <div className="relative flex h-7 shrink-0 items-center justify-end px-2 pt-2">
          <AnimatePresence>
            {selected && !editing && !interacting && (
              <motion.button
                data-no-drag
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.16, ease: EASE_OUT }}
                whileTap={{ scale: 0.88 }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  playSound('delete')
                  onDelete()
                }}
                aria-label="Delete note"
                className="grid h-6 w-6 place-items-center rounded-full text-ink-900/55 hover:text-ink-900 hover:bg-black/[0.08] transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Editable body — flex-1 so it fills the resizable area */}
        <div className="relative flex-1 overflow-auto px-4 pb-3 pt-1">
          <div
            ref={editorRef}
            data-no-drag={editing ? '' : undefined}
            contentEditable={editing}
            suppressContentEditableWarning
            spellCheck={editing}
            onInput={(e) => {
              const v = (e.target as HTMLDivElement).innerText
              setIsEmpty(v.length === 0)
              onChange({ body: v })
            }}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                ;(e.target as HTMLDivElement).blur()
              }
            }}
            className={[
              'text-[15px] leading-[1.5] tracking-[-0.005em] text-ink-900',
              'whitespace-pre-wrap break-words text-pretty',
              'caret-ink-900 outline-none',
              editing ? 'cursor-text' : '',
            ].join(' ')}
          />

          <AnimatePresence>
            {isEmpty && !interacting && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: editing ? 0.32 : 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                className="pointer-events-none absolute left-4 top-1 text-[15px] leading-[1.5] tracking-[-0.005em] text-ink-800"
              >
                {editing ? 'Type a thought…' : 'Empty note'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer — hides on edit AND on interaction */}
        <motion.div
          animate={{
            opacity: editing || interacting ? 0 : 1,
            y: editing || interacting ? 4 : 0,
          }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          className="shrink-0 px-4 pb-2.5 pt-0 font-mono text-[10px] tracking-tight uppercase text-ink-700/55"
        >
          {formatStamp(note.updatedAt)}
        </motion.div>

        {/* Resize handle — bottom-right grip. Fades in on hover/selection. */}
        <motion.div
          data-no-drag
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
          onPointerCancel={handleResizeUp}
          aria-label="Resize note"
          initial={false}
          animate={{ opacity: selected || resizing ? 1 : 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          className="absolute right-0 bottom-0 z-10 h-5 w-5 cursor-nwse-resize"
          style={{ touchAction: 'none' }}
        >
          <svg
            viewBox="0 0 16 16"
            className="absolute right-1 bottom-1 h-3 w-3 text-ink-900/40"
            fill="none"
          >
            <path d="M14 6L6 14M14 11L11 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default memo(NoteCard)
