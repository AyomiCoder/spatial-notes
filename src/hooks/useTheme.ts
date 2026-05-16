import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'inklin:theme'

function readStored(): Theme | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' ? v : null
}

function systemPreference(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Theme is stored under [data-theme] on <html>. Initial value comes from
 * localStorage; if the user has never picked, we follow system preference.
 * Once the user explicitly toggles, we stop tracking system changes.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readStored() ?? systemPreference())
  const [hasUserPick, setHasUserPick] = useState<boolean>(() => readStored() !== null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (hasUserPick) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setThemeState(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [hasUserPick])

  const setTheme = (next: Theme) => {
    setThemeState(next)
    setHasUserPick(true)
    localStorage.setItem(STORAGE_KEY, next)
  }
  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return { theme, setTheme, toggle }
}
