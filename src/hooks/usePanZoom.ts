import { useCallback, useEffect, useRef, useState } from 'react'
import type { Viewport } from '../types'

const MIN_SCALE = 0.4
const MAX_SCALE = 2.5

interface Options {
  initial?: Viewport
  /** Element whose wheel/touch events drive the viewport. */
  targetRef: React.RefObject<HTMLElement | null>
}

/** Convert a screen-space point to world coordinates given the viewport. */
export function screenToWorld(v: Viewport, sx: number, sy: number) {
  return { x: (sx - v.x) / v.scale, y: (sy - v.y) / v.scale }
}

export function usePanZoom({ initial, targetRef }: Options) {
  const [viewport, setViewport] = useState<Viewport>(
    initial ?? { x: 0, y: 0, scale: 1 }
  )
  const vpRef = useRef(viewport)
  vpRef.current = viewport

  // Wheel: scroll-to-pan, ctrl/cmd+scroll or pinch-to-zoom
  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const v = vpRef.current

      // Trackpad pinch arrives as wheel + ctrlKey
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect()
        const cx = e.clientX - rect.left
        const cy = e.clientY - rect.top
        const factor = Math.exp(-e.deltaY * 0.01)
        const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor))
        // Zoom anchored on the cursor
        const k = nextScale / v.scale
        const nx = cx - (cx - v.x) * k
        const ny = cy - (cy - v.y) * k
        setViewport({ x: nx, y: ny, scale: nextScale })
      } else {
        setViewport({ x: v.x - e.deltaX, y: v.y - e.deltaY, scale: v.scale })
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [targetRef])

  // Drag-to-pan from the canvas background
  const panState = useRef<{ active: boolean; sx: number; sy: number; vx: number; vy: number } | null>(null)

  const beginPan = useCallback((sx: number, sy: number) => {
    const v = vpRef.current
    panState.current = { active: true, sx, sy, vx: v.x, vy: v.y }
  }, [])

  const updatePan = useCallback((sx: number, sy: number) => {
    const s = panState.current
    if (!s || !s.active) return
    setViewport((v) => ({ ...v, x: s.vx + (sx - s.sx), y: s.vy + (sy - s.sy) }))
  }, [])

  const endPan = useCallback(() => {
    if (panState.current) panState.current.active = false
  }, [])

  const zoomBy = useCallback((factor: number, cx?: number, cy?: number) => {
    setViewport((v) => {
      const el = targetRef.current
      const rect = el?.getBoundingClientRect()
      const px = cx ?? (rect ? rect.width / 2 : 0)
      const py = cy ?? (rect ? rect.height / 2 : 0)
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor))
      const k = next / v.scale
      return { x: px - (px - v.x) * k, y: py - (py - v.y) * k, scale: next }
    })
  }, [targetRef])

  const resetView = useCallback(() => {
    setViewport({ x: 0, y: 0, scale: 1 })
  }, [])

  return {
    viewport,
    setViewport,
    beginPan,
    updatePan,
    endPan,
    zoomBy,
    resetView,
  }
}
