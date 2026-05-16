import { useEffect, useState } from 'react'

const STORAGE_KEY = 'inklin:tour:v1'

interface Options {
  /** Gate the first-run auto-start. Pass `false` while another piece of UI
   * (e.g. the credits intro modal) is taking the user's attention; flip to
   * `true` when it's safe for the tour to fire. start() always works
   * regardless, so the manual replay button is independent of this. */
  canStart?: boolean
}

/**
 * Drives the first-run interactive tour. Auto-starts ~1.4s after `canStart`
 * becomes true when no prior completion is in localStorage; the consumer
 * can also call start() to replay it manually. Steps live in Tour.tsx; this
 * hook only owns the active/step/seen state and the storage flag.
 */
export function useTour({ canStart = true }: Options = {}) {
  const [active, setActive] = useState<boolean>(false)
  const [step, setStep] = useState<number>(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!canStart) return
    let seen = false
    try { seen = localStorage.getItem(STORAGE_KEY) === 'seen' } catch {}
    if (seen) return
    // Wait a beat so the initial entrance animations settle before we dim.
    const t = window.setTimeout(() => setActive(true), 1400)
    return () => window.clearTimeout(t)
  }, [canStart])

  const start = () => {
    // Clear the seen flag so isDone snapshots reset cleanly via the effect
    // that watches lastStepRef in Tour.tsx.
    setStep(0)
    setActive(true)
  }

  const next = () => setStep((s) => s + 1)

  const finish = () => {
    setActive(false)
    setStep(0)
    try { localStorage.setItem(STORAGE_KEY, 'seen') } catch {}
  }

  return { active, step, start, next, finish }
}
