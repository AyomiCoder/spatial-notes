import { useEffect, useState } from 'react'

/** Anything narrower than an iPad portrait gets the "made for bigger screens" page. */
const MOBILE_BREAKPOINT = 768

function read() {
  if (typeof window === 'undefined') return false
  return window.innerWidth < MOBILE_BREAKPOINT
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(read)

  useEffect(() => {
    const onResize = () => setIsMobile(read())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return isMobile
}
