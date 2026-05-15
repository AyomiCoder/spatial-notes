import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import NoteCard from './Note'
import Toolbar from './Toolbar'
import EmptyState from './EmptyState'
import { useNotes } from '../hooks/useNotes'
import { useSound } from '../hooks/useSound'
import { screenToWorld, usePanZoom } from '../hooks/usePanZoom'

const GRID_SIZE = 32

export default function Canvas() {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const { notes, create, update, remove, bringToFront } = useNotes()
  const { enabled: soundEnabled, trigger, toggle: toggleSound } = useSound()
  const { viewport, beginPan, updatePan, endPan, zoomBy, resetView } = usePanZoom({ targetRef: surfaceRef })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null)
  const panActive = useRef(false)

  // Background pan with pointer
  const onSurfacePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.target !== surfaceRef.current && !(e.target as HTMLElement).hasAttribute('data-surface')) return
    panActive.current = true
    setSelectedId(null)
    beginPan(e.clientX, e.clientY)
    surfaceRef.current?.setPointerCapture(e.pointerId)
  }, [beginPan])

  const onSurfacePointerMove = useCallback((e: React.PointerEvent) => {
    if (!panActive.current) return
    updatePan(e.clientX, e.clientY)
  }, [updatePan])

  const onSurfacePointerUp = useCallback((e: React.PointerEvent) => {
    if (panActive.current) {
      panActive.current = false
      endPan()
      surfaceRef.current?.releasePointerCapture?.(e.pointerId)
    }
  }, [endPan])

  const onSurfaceDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target !== surfaceRef.current && !(e.target as HTMLElement).hasAttribute('data-surface')) return
    const rect = surfaceRef.current!.getBoundingClientRect()
    const world = screenToWorld(viewport, e.clientX - rect.left, e.clientY - rect.top)
    const note = create(world.x, world.y)
    setSelectedId(note.id)
    setAutoFocusId(note.id)
    trigger('create')
  }, [viewport, create, trigger])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable
      if (isEditing) return

      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId) {
        e.preventDefault()
        trigger('delete')
        remove(selectedId)
        setSelectedId(null)
      } else if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault()
        trigger('tapFirm')
        resetView()
      } else if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        trigger('tapFirm')
        zoomBy(1.15)
      } else if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault()
        trigger('tapFirm')
        zoomBy(1 / 1.15)
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        const el = surfaceRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const world = screenToWorld(viewport, rect.width / 2, rect.height / 2)
        const note = create(world.x, world.y)
        setSelectedId(note.id)
        setAutoFocusId(note.id)
        trigger('create')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, remove, resetView, zoomBy, create, viewport, trigger])

  const addCentered = useCallback(() => {
    const el = surfaceRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const world = screenToWorld(viewport, rect.width / 2, rect.height / 2)
    const note = create(world.x, world.y)
    setSelectedId(note.id)
    setAutoFocusId(note.id)
  }, [viewport, create])

  // Pre-render an SVG dot grid that pans/zooms perfectly with the viewport.
  const gridStyle = useMemo<React.CSSProperties>(() => {
    const size = GRID_SIZE * viewport.scale
    return {
      backgroundImage:
        'radial-gradient(circle, color-mix(in oklab, currentColor 8%, transparent) 1px, transparent 1px)',
      backgroundSize: `${size}px ${size}px`,
      backgroundPosition: `${viewport.x}px ${viewport.y}px`,
    }
  }, [viewport])

  const transform = `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      {/* Ambient aurora — gives the liquid-glass toolbar real material to refract.
          Slow-drift gradient blob that sits roughly under the toolbar. */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          opacity: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
          backgroundPosition: { duration: 18, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: [
            'radial-gradient(60% 35% at 50% 100%, color-mix(in oklab, var(--color-accent-sky) 14%, transparent), transparent 70%)',
            'radial-gradient(45% 30% at 25% 95%, color-mix(in oklab, var(--color-accent-lilac) 12%, transparent), transparent 70%)',
            'radial-gradient(40% 25% at 75% 95%, color-mix(in oklab, var(--color-accent-rose) 10%, transparent), transparent 70%)',
            'radial-gradient(50% 30% at 50% 0%, color-mix(in oklab, var(--color-accent-cream) 8%, transparent), transparent 75%)',
          ].join(', '),
          backgroundSize: '200% 200%',
        }}
      />

      <div
        ref={surfaceRef}
        data-surface
        onPointerDown={onSurfacePointerDown}
        onPointerMove={onSurfacePointerMove}
        onPointerUp={onSurfacePointerUp}
        onPointerCancel={onSurfacePointerUp}
        onDoubleClick={onSurfaceDoubleClick}
        className={[
          'absolute inset-0 z-10 text-ink-900',
          panActive.current ? 'cursor-grabbing' : 'cursor-grab',
        ].join(' ')}
        style={gridStyle}
      >
        {/* World — everything inside transforms together */}
        <div
          className="absolute left-0 top-0"
          style={{
            transform,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          <AnimatePresence>
            {notes.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                scale={viewport.scale}
                selected={selectedId === n.id}
                autoFocus={autoFocusId === n.id}
                onAutoFocused={() => setAutoFocusId(null)}
                onSelect={() => {
                  setSelectedId(n.id)
                  bringToFront(n.id)
                }}
                onChange={(patch) => update(n.id, patch)}
                onDelete={() => {
                  remove(n.id)
                  setSelectedId(null)
                }}
                onDragStart={() => setDraggingId(n.id)}
                onDragEnd={() => setDraggingId(null)}
                playSound={trigger}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state — shown only when there are no notes */}
        <AnimatePresence>
          {notes.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute inset-0 z-0 grid place-items-center"
            >
              <EmptyState />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag shadow indicator — a hint that lift is happening */}
        {draggingId && (
          <div className="pointer-events-none absolute inset-0 z-20 bg-ink-950/[0.015]" />
        )}
      </div>

      <Toolbar
        scale={viewport.scale}
        count={notes.length}
        soundEnabled={soundEnabled}
        onZoomIn={() => zoomBy(1.2)}
        onZoomOut={() => zoomBy(1 / 1.2)}
        onResetView={resetView}
        onAdd={addCentered}
        onToggleSound={toggleSound}
        playSound={trigger}
      />
    </div>
  )
}
