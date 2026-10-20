import type { SVGProps } from 'react'

const PATHS = {
  play: 'M8 5.5v13l11-6.5z',
  pause: 'M7 5h4v14H7zM13 5h4v14h-4z',
  close: 'M6 6l12 12M18 6L6 18',
  settings:
    'M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 13a7.5 7.5 0 000-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 00-1.7-1L15 3.5h-4l-.4 2.5a7.6 7.6 0 00-1.7 1l-2.4-1-2 3.4 2 1.6a7.5 7.5 0 000 2l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 001.7 1l.4 2.5h4l.4-2.5a7.6 7.6 0 001.7-1l2.4 1 2-3.4z',
  soundOn: 'M4 9.5v5h4l5 4v-13l-5 4zM16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12',
  soundOff: 'M4 9.5v5h4l5 4v-13l-5 4zM17 9.5l5 5M22 9.5l-5 5',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z',
  target: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM12 1v3M12 20v3M1 12h3M20 12h3',
  follow: 'M4 17c3-6 7-9 16-10M20 7l-4-2M20 7l-2 4M6 18.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z',
  shuffle: 'M3 7h3.5c4 0 6 10 10 10H21M3 17h3.5c1.6 0 2.8-1.6 3.8-3.5M13.7 9.5c1-1.9 2.2-2.5 2.8-2.5H21M18 4l3 3-3 3M18 14l3 3-3 3',
  book: 'M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5A1.5 1.5 0 014 17.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5z',
  sparkles: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  rocket:
    'M14 4c3-1 5.5-1 6 0 1 .5 1 3 0 6l-6 6-4-4zM10 12l-4 1-3 3 4 1M12 14l-1 4 3 3 1-4M15.5 8.5a1 1 0 100-.01',
  film: 'M4 5h16v14H4zM4 9h16M4 15h16M8 5v4M12 5v4M16 5v4M8 15v4M12 15v4M16 15v4',
  help: 'M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9.5a2.5 2.5 0 114 2c-1 .6-1.5 1.2-1.5 2.5M12 17h.01',
  question: 'M9 9a3 3 0 115 2.2c-1.2.8-2 1.6-2 3M12 18h.01',
  chevronLeft: 'M15 5l-7 7 7 7',
  chevronRight: 'M9 5l7 7-7 7',
  chevronUp: 'M5 15l7-7 7 7',
  chevronDown: 'M5 9l7 7 7-7',
  skip: 'M5 5l9 7-9 7zM16 5h3v14h-3z',
  stop: 'M6 6h12v12H6z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 8.5a1 1 0 100-.01',
  orbit: 'M12 9a3 3 0 100 6 3 3 0 000-6zM3 12c0-2.5 4-4.5 9-4.5s9 2 9 4.5-4 4.5-9 4.5-9-2-9-4.5z',
  motion: 'M4 12h4l2-6 4 12 2-6h4',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  plus: 'M12 5v14M5 12h14',
  today: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z',
  lightbulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z',
  boost: 'M13 2L4 14h7l-1 8 9-12h-7z',
  home: 'M3 11l9-7 9 7M5 10v10h14V10',
  flask: 'M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3M7.5 15h9',
  check: 'M5 12.5l4.5 4.5L19 7.5',
} as const

export type IconName = keyof typeof PATHS

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  const filled = name === 'play' || name === 'pause' || name === 'stop' || name === 'skip'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
