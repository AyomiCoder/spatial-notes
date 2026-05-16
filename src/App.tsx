import { useState } from 'react'
import Canvas from './components/Canvas'
import ChangelogModal from './components/ChangelogModal'
import CreditsModal from './components/CreditsModal'
import DevSignature from './components/DevSignature'
import MobileNotice from './components/MobileNotice'
import { useIsMobile } from './hooks/useIsMobile'
import { useTheme } from './hooks/useTheme'
import { useTour } from './hooks/useTour'

const CREDITS_SEEN_KEY = 'spatial-notes:credits:v1'

function readCreditsSeen(): boolean {
  if (typeof window === 'undefined') return true
  try { return localStorage.getItem(CREDITS_SEEN_KEY) === 'seen' } catch { return true }
}

export default function App() {
  const isMobile = useIsMobile()
  // Theme lives at App so [data-theme] gets applied to <html> regardless of
  // which branch we render (mobile notice or full canvas). Otherwise mobile
  // users would never see dark mode at all.
  const { theme, toggle: toggleTheme } = useTheme()
  // The credits modal is the first thing a new visitor sees. Block the tour
  // auto-start until it's been dismissed so the two pieces of intro UI don't
  // fight for the user's attention. Returning users (credits already seen)
  // start with the gate open.
  const [creditsDismissed, setCreditsDismissed] = useState(() => readCreditsSeen())
  const tour = useTour({ canStart: creditsDismissed })

  if (isMobile) return <MobileNotice />
  return (
    <>
      <Canvas tour={tour} theme={theme} onToggleTheme={toggleTheme} />
      <DevSignature />
      <ChangelogModal />
      <CreditsModal onDismiss={() => setCreditsDismissed(true)} />
    </>
  )
}
