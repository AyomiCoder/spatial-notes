import { useCallback, useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import type { Note, NoteTint } from '../types'

const STORAGE_KEY = 'spatial-notes:notes:v1'
const TINTS: NoteTint[] = ['cream', 'rose', 'sky', 'mint', 'lilac', 'sand']

function load(): Note[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Note[]
    return Array.isArray(parsed) ? parsed : []
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

  const clear = useCallback(() => setNotes([]), [])

  return { notes, create, update, remove, bringToFront, clear }
}
