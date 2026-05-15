import { useCallback, useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import type { Note, NoteKind, NoteTint, TodoItem } from '../types'
import {
  htmlToLines,
  itemsToHtml,
  linesToItems,
  plainTextToHtml,
} from '../lib/format'

const STORAGE_KEY = 'spatial-notes:notes:v1'
const TINTS: NoteTint[] = [
  'cream', 'banana', 'sand', 'coral', 'rose', 'blush',
  'lilac', 'sky', 'aqua', 'mint', 'sage', 'slate',
]

type StoredNote = Partial<Note> & { id: string; body?: string }

function migrate(raw: StoredNote): Note {
  const looksLikeHtml = typeof raw.body === 'string' && /<\/?[a-z][^>]*>/i.test(raw.body)
  const body =
    raw.body == null
      ? ''
      : looksLikeHtml
        ? raw.body
        : plainTextToHtml(raw.body)
  return {
    id: raw.id,
    x: raw.x ?? 0,
    y: raw.y ?? 0,
    w: raw.w ?? 220,
    h: raw.h ?? 160,
    kind: (raw.kind as NoteKind) ?? 'note',
    body,
    items: Array.isArray(raw.items) ? (raw.items as TodoItem[]) : undefined,
    tint: (raw.tint as NoteTint) ?? 'cream',
    createdAt: raw.createdAt ?? Date.now(),
    updatedAt: raw.updatedAt ?? Date.now(),
  }
}

function load(): Note[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredNote[]
    return Array.isArray(parsed) ? parsed.map(migrate) : []
  } catch {
    return []
  }
}

function persist(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {
    // quota — ignore silently for now
  }
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => load())
  const tintCursor = useRef(0)

  useEffect(() => { persist(notes) }, [notes])

  const create = useCallback((x: number, y: number, tint?: NoteTint): Note => {
    const now = Date.now()
    const note: Note = {
      id: nanoid(8),
      x: Math.round(x - 110),
      y: Math.round(y - 70),
      w: 220,
      h: 160,
      kind: 'note',
      body: '',
      tint: tint ?? TINTS[tintCursor.current++ % TINTS.length]!,
      createdAt: now,
      updatedAt: now,
    }
    setNotes((prev) => [...prev, note])
    return note
  }, [])

  const update = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
    )
  }, [])

  const remove = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const bringToFront = useCallback((id: string) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === id)
      if (idx === -1 || idx === prev.length - 1) return prev
      const next = prev.slice()
      const [n] = next.splice(idx, 1)
      next.push(n!)
      return next
    })
  }, [])

  /**
   * Toggle between 'note' (rich HTML) and 'todo' (checkable items).
   * Converts content in both directions so nothing is silently dropped.
   */
  const toggleKind = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n
        if (n.kind === 'note') {
          const lines = htmlToLines(n.body)
          const seed = lines.length ? lines : ['']
          return {
            ...n,
            kind: 'todo',
            items: linesToItems(seed),
            updatedAt: Date.now(),
          }
        }
        const items = n.items ?? []
        // Drop trailing empties so the converted note doesn't show blank lines
        const trimmed = items.filter((it, i) =>
          it.text.trim().length || i < items.length - 1
        )
        return {
          ...n,
          kind: 'note',
          body: itemsToHtml(trimmed.filter((it) => it.text.trim().length)),
          items: undefined,
          updatedAt: Date.now(),
        }
      })
    )
  }, [])

  const clear = useCallback(() => setNotes([]), [])

  return { notes, create, update, remove, bringToFront, toggleKind, clear }
}
