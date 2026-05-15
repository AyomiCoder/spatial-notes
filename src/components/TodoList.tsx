import { useEffect, useLayoutEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { nanoid } from 'nanoid'
import type { TodoItem } from '../types'
import type { SoundName } from '../lib/sounds'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

interface Props {
  items: TodoItem[]
  accent: string
  /** Focus the first item right after a fresh note is converted to a todo. */
  autoFocus?: boolean
  onChange: (items: TodoItem[]) => void
  onAutoFocused?: () => void
  playSound: (s: SoundName) => void
}

export default function TodoList({
  items, accent, autoFocus, onChange, onAutoFocused, playSound,
}: Props) {
  // We need a stable ref to call onChange in handlers without re-binding every render
  const itemsRef = useRef(items)
  itemsRef.current = items

  const containerRef = useRef<HTMLDivElement>(null)
  // Track which item id should receive focus on next render (after Enter, etc.)
  const pendingFocusRef = useRef<{ id: string; caret: 'start' | 'end' } | null>(null)

  useLayoutEffect(() => {
    const pending = pendingFocusRef.current
    if (!pending) return
    pendingFocusRef.current = null
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-item-id="${pending.id}"]`)
    if (!el) return
    el.focus({ preventScroll: true })
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(pending.caret === 'start')
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  })

  useEffect(() => {
    if (!autoFocus) return
    const first = itemsRef.current[0]
    if (!first) return
    pendingFocusRef.current = { id: first.id, caret: 'end' }
    onAutoFocused?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus])

  const setItems = (next: TodoItem[]) => onChange(next)

  const updateText = (id: string, text: string) => {
    setItems(itemsRef.current.map((it) => (it.id === id ? { ...it, text } : it)))
  }

  const toggle = (id: string) => {
    playSound('toggle')
    setItems(itemsRef.current.map((it) => (it.id === id ? { ...it, done: !it.done } : it)))
  }

  const insertAfter = (id: string) => {
    const idx = itemsRef.current.findIndex((it) => it.id === id)
    if (idx === -1) return
    const newItem: TodoItem = { id: nanoid(6), text: '', done: false }
    const next = itemsRef.current.slice()
    next.splice(idx + 1, 0, newItem)
    pendingFocusRef.current = { id: newItem.id, caret: 'end' }
    setItems(next)
  }

  const removeAt = (id: string) => {
    const idx = itemsRef.current.findIndex((it) => it.id === id)
    if (idx === -1) return
    if (itemsRef.current.length === 1) {
      // Keep at least one row, just clear it
      setItems([{ ...itemsRef.current[0]!, text: '', done: false }])
      pendingFocusRef.current = { id: itemsRef.current[0]!.id, caret: 'end' }
      return
    }
    const next = itemsRef.current.slice()
    next.splice(idx, 1)
    const focusTarget = next[Math.max(0, idx - 1)]
    if (focusTarget) pendingFocusRef.current = { id: focusTarget.id, caret: 'end' }
    setItems(next)
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-0.5" data-no-drag>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <Row
            key={item.id}
            item={item}
            accent={accent}
            onToggle={() => toggle(item.id)}
            onText={(t) => updateText(item.id, t)}
            onEnter={() => insertAfter(item.id)}
            onBackspaceEmpty={() => removeAt(item.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface RowProps {
  item: TodoItem
  accent: string
  onToggle: () => void
  onText: (t: string) => void
  onEnter: () => void
  onBackspaceEmpty: () => void
}

function Row({ item, accent, onToggle, onText, onEnter, onBackspaceEmpty }: RowProps) {
  const textRef = useRef<HTMLDivElement>(null)

  // Keep DOM in sync if `text` changes from outside (storage hydration, conversion)
  useEffect(() => {
    const el = textRef.current
    if (el && el.innerText !== item.text) {
      el.innerText = item.text
    }
  }, [item.text])

  return (
    <motion.div
      initial={{ opacity: 0, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2, transition: { duration: 0.14 } }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className="group flex items-start gap-2 py-0.5"
    >
      <button
        type="button"
        aria-label={item.done ? 'Mark not done' : 'Mark done'}
        aria-pressed={item.done}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="relative grid shrink-0 place-items-center rounded-full transition-colors"
        style={{
          width: '1em',
          height: '1em',
          marginTop: '0.32em',
          fontSize: '15px',
          backgroundColor: item.done ? accent : 'transparent',
          boxShadow: item.done
            ? `inset 0 0 0 1px ${accent}`
            : `inset 0 0 0 1.25px color-mix(in oklab, currentColor 35%, transparent)`,
        }}
      >
        <AnimatePresence>
          {item.done && (
            <motion.svg
              key="check"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.14, ease: EASE_OUT }}
              viewBox="0 0 12 12"
              fill="none"
              style={{ width: '0.72em', height: '0.72em' }}
            >
              <path
                d="M3 6.3l2 2 4-4.6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>

      <div className="relative flex-1">
        <div
          ref={textRef}
          data-item-id={item.id}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onPointerDown={(e) => e.stopPropagation()}
          onInput={(e) => onText((e.target as HTMLDivElement).innerText)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onEnter()
            } else if (e.key === 'Backspace') {
              const el = e.currentTarget as HTMLDivElement
              if (el.innerText.length === 0) {
                e.preventDefault()
                onBackspaceEmpty()
              }
            }
          }}
          className={[
            'text-[15px] leading-[1.5] tracking-[-0.005em] caret-ink-900 outline-none',
            'whitespace-pre-wrap break-words text-pretty',
            'transition-[color,opacity] duration-200',
            item.done ? 'text-ink-700/55' : 'text-ink-900',
          ].join(' ')}
        />
        {/* Animated strikethrough overlay */}
        <motion.span
          aria-hidden
          initial={false}
          animate={{ scaleX: item.done ? 1 : 0 }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
          className="pointer-events-none absolute left-0 right-0 top-1/2 h-[1.5px] origin-left bg-ink-900/45"
          style={{ transform: 'translateY(-1px)' }}
        />
      </div>
    </motion.div>
  )
}
