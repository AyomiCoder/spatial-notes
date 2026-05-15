export type NoteTint =
  | 'cream'
  | 'rose'
  | 'sky'
  | 'mint'
  | 'lilac'
  | 'sand'

export interface Note {
  id: string
  x: number
  y: number
  w: number
  h: number
  body: string
  tint: NoteTint
  createdAt: number
  updatedAt: number
}

export interface Viewport {
  x: number
  y: number
  scale: number
}
