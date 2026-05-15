import { useCallback, useEffect, useState } from 'react'
import { isSoundEnabled, play, primeAudio, setSoundEnabled, type SoundName } from '../lib/sounds'

export function useSound() {
  const [enabled, setEnabled] = useState(() => isSoundEnabled())

  useEffect(() => {
    const unlock = () => primeAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const trigger = useCallback((name: SoundName) => {
    if (enabled) play(name)
  }, [enabled])

  const toggle = useCallback(() => {
    setEnabled((v) => {
      const next = !v
      setSoundEnabled(next)
      if (next) play('toggle')
      return next
    })
  }, [])

  return { enabled, trigger, toggle }
}
