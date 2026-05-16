import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

type ActiveMarks = {
  bold: boolean
  italic: boolean
  unordered: boolean
  ordered: boolean
}

interface Props {
  /** The contenteditable host. We only show ourselves for selections inside it. */
  hostRef: React.RefObject<HTMLElement | null>
  /** Selection toolbar lives only while the host is being edited. */
  active: boolean
  /** Run a formatting command against the current selection. */
  onCommand: (cmd: 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList') => void
}

function readMarks(): ActiveMarks {
  if (typeof document === 'undefined') return { bold: false, italic: false, unordered: false, ordered: false }
  try {
    return {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      unordered: document.queryCommandState('insertUnorderedList'),
      ordered: document.queryCommandState('insertOrderedList'),
    }
  } catch {
    return { bold: false, italic: false, unordered: false, ordered: false }
  }
}

export default function SelectionToolbar({ hostRef, active, onCommand }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [marks, setMarks] = useState<ActiveMarks>(() => readMarks())

  useEffect(() => {
    if (!active) {
      setRect(null)
      return
    }

    const update = () => {
      const host = hostRef.current
      if (!host) {
        setRect(null)
        return
      }
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setRect(null)
        return
      }
      const range = sel.getRangeAt(0)
      // Only show when selection lives inside our host
      if (!host.contains(range.startContainer) || !host.contains(range.endContainer)) {
        setRect(null)
        return
      }
      const r = range.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) {
        setRect(null)
        return
      }
      setRect(r)
      setMarks(readMarks())
    }

    document.addEventListener('selectionchange', update)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      document.removeEventListener('selectionchange', update)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [active, hostRef])

  if (typeof document === 'undefined') return null

  // Center above the selection, clamp horizontally to viewport
  const PILL_W = 168
  const PILL_H = 36
  const GAP = 10
  let left = 0
  let top = 0
  if (rect) {
    left = rect.left + rect.width / 2 - PILL_W / 2
    left = Math.max(8, Math.min(window.innerWidth - PILL_W - 8, left))
    top = rect.top - PILL_H - GAP
    if (top < 8) top = rect.bottom + GAP
  }

  return createPortal(
    <AnimatePresence>
      {rect && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.16, ease: EASE_OUT }}
          style={{
            position: 'fixed',
            left,
            top,
            zIndex: 100,
          }}
          // Don't let pointerdown blur the editor — keep selection alive
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          className="glass flex h-9 items-center gap-0.5 rounded-full px-1.5"
        >
          <ToolBtn label="Bold" active={marks.bold} onClick={() => onCommand('bold')}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path
                d="M4 2.5h3.4a2.4 2.4 0 010 4.8H4V2.5zM4 7.3h3.9a2.5 2.5 0 010 5H4v-5z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </ToolBtn>
          <ToolBtn label="Italic" active={marks.italic} onClick={() => onCommand('italic')}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 2.5H6M8 11.5H4.5M8.5 2.5L5.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </ToolBtn>
          <span className="mx-1 h-4 w-px bg-black/[0.08] dark:bg-white/[0.12]" />
          <ToolBtn
            label="Bulleted list"
            active={marks.unordered}
            onClick={() => onCommand('insertUnorderedList')}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="3" cy="4" r="1" fill="currentColor" />
              <circle cx="3" cy="10" r="1" fill="currentColor" />
              <path d="M6 4h6M6 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </ToolBtn>
          <ToolBtn
            label="Numbered list"
            active={marks.ordered}
            onClick={() => onCommand('insertOrderedList')}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M6 4h6M6 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <text x="1" y="5.5" fontSize="4" fontFamily="ui-monospace, monospace" fill="currentColor">1</text>
              <text x="1" y="11.5" fontSize="4" fontFamily="ui-monospace, monospace" fill="currentColor">2</text>
            </svg>
          </ToolBtn>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function ToolBtn({
  label, active, onClick, children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      aria-pressed={active}
      whileTap={{ scale: 0.88 }}
      onPointerDown={(e) => e.preventDefault()}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={[
        'grid h-7 w-7 place-items-center rounded-full transition-colors',
        active
          ? 'bg-ink-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] dark:bg-white dark:text-ink-950'
          : 'text-ink-700 hover:text-ink-900 hover:bg-black/[0.06] dark:text-ink-200 dark:hover:text-white dark:hover:bg-white/[0.10]',
      ].join(' ')}
    >
      {children}
    </motion.button>
  )
}
