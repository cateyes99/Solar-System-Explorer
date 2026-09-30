import { useEffect, useState } from 'react'

/**
 * Subscribes to a media query. Returns false during server rendering, which is
 * fine because this app is client-only.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

export interface ViewportLayout {
  /** Phone-sized: < 768px. */
  isMobile: boolean
  /** Tablet-sized: 768px – 1023px. */
  isTablet: boolean
  /** True for phones and tablets, where overlays become bottom sheets. */
  isCompact: boolean
  isDesktop: boolean
}

/**
 * Viewport class driving the switch between desktop, tablet and mobile layouts.
 *
 * The compact breakpoint is deliberately coarser than "mobile": a centred nav
 * bar and a floating side panel cannot share an 834px tablet, so both become a
 * bottom sheet there instead.
 */
export function useLayout(): ViewportLayout {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isCompact = useMediaQuery('(max-width: 1023px)')
  return { isMobile, isTablet: isCompact && !isMobile, isCompact, isDesktop: !isCompact }
}