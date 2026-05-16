import { useCallback, useEffect, useRef, useState } from 'react'
import type { Viewport } from '../types'

const MIN_SCALE = 0.4
const MAX_SCALE = 2.5
const STORAGE_KEY = 'inklin:viewport:v1'
const PERSIST_DEBOUNCE_MS = 200

interface Options {
  initial?: Viewport
  /** Element whose wheel/touch events drive the viewport. */
  targetRef: React.RefObject<HTMLElement | null>
}

/** Convert a screen-space point to world coordinates given the viewport. */
export function screenToWorld(v: Viewport, sx: number, sy: number) {
  return { x: (sx - v.x) / v.scale, y: (sy - v.y) / v.scale }
}

// Read a persisted viewport from localStorage, validating each field. We never
// trust the stored value blindly — a corrupt entry should fall back to a sane
// default rather than break panning.
function loadStoredViewport(): Viewport | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Viewport>
    if (
      typeof parsed.x !== 'number' || !Number.isFinite(parsed.x) ||
      typeof parsed.y !== 'number' || !Number.isFinite(parsed.y) ||
      typeof parsed.scale !== 'number' || !Number.isFinite(parsed.scale)
    ) return null
    return {
      x: parsed.x,
      y: parsed.y,
      scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, parsed.scale)),
    }
  } catch {
    return null
  }
}

export function usePanZoom({ initial, targetRef }: Options) {
  const [viewport, setViewport] = useState<Viewport>(
    () => loadStoredViewport() ?? initial ?? { x: 0, y: 0, scale: 1 }
  )
  const vpRef = useRef(viewport)
  vpRef.current = viewport

  // Persist viewport with a small debounce so a continuous pan doesn't write
  // to localStorage on every frame. The trailing edge captures the resting
  // position the user expects to come back to.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(viewport))
      } catch {
        // quota — ignore silently
      }
    }, PERSIST_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [viewport])

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

  // Drag-to-pan from the canvas background. We RAF-throttle the state writes:
  // pointermove can fire many times per frame, and committing each one to
  // React state pegs the main thread (every Note re-renders along with the
  // grid/aurora). Coalescing to once-per-frame keeps panning visually smooth.
  const panState = useRef<{
    active: boolean
    sx: number; sy: number
    vx: number; vy: number
    latestX: number; latestY: number
    rafId: number | null
  } | null>(null)

  const beginPan = useCallback((sx: number, sy: number) => {
    const v = vpRef.current
    panState.current = {
      active: true,
      sx, sy,
      vx: v.x, vy: v.y,
      latestX: sx, latestY: sy,
      rafId: null,
    }
  }, [])

  const flushPan = useCallback(() => {
    const s = panState.current
    if (!s) return
    s.rafId = null
    if (!s.active) return
    setViewport((v) => ({ ...v, x: s.vx + (s.latestX - s.sx), y: s.vy + (s.latestY - s.sy) }))
  }, [])

  const updatePan = useCallback((sx: number, sy: number) => {
    const s = panState.current
    if (!s || !s.active) return
    s.latestX = sx
    s.latestY = sy
    if (s.rafId === null) s.rafId = requestAnimationFrame(flushPan)
  }, [flushPan])

  const endPan = useCallback(() => {
    const s = panState.current
    if (!s) return
    s.active = false
    if (s.rafId !== null) {
      cancelAnimationFrame(s.rafId)
      s.rafId = null
    }
    // Commit one final flush so the resting viewport matches the last pointer
    // position, even if the user released between scheduled frames.
    setViewport((v) => ({ ...v, x: s.vx + (s.latestX - s.sx), y: s.vy + (s.latestY - s.sy) }))
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
