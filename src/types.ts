export type NoteTint =
  | 'cream'
  | 'banana'
  | 'sand'
  | 'coral'
  | 'rose'
  | 'blush'
  | 'lilac'
  | 'sky'
  | 'aqua'
  | 'mint'
  | 'sage'
  | 'slate'

export type NoteKind = 'note' | 'todo'

export interface TodoItem {
  id: string
  text: string
  done: boolean
}

export interface Note {
  id: string
  x: number
  y: number
  w: number
  h: number
  kind: NoteKind
  /** Sanitized HTML for kind='note'. Retained (but not displayed) when kind='todo'. */
  body: string
  /** Present when kind='todo'. */
  items?: TodoItem[]
  tint: NoteTint
  createdAt: number
  updatedAt: number
}

export interface Viewport {
  x: number
  y: number
  scale: number
}
