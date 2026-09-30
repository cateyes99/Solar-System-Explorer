import type { SVGProps } from 'react'

export type IconName =
  | 'sun'
  | 'sizes'
  | 'distances'
  | 'gravity'
  | 'seasons'
  | 'moon'
  | 'orbit'
  | 'rocket'
  | 'tour'
  | 'lightbulb'
  | 'ruler'
  | 'sound'
  | 'mute'
  | 'label'
  | 'gear'
  | 'help'
  | 'play'
  | 'pause'
  | 'back'
  | 'forward'
  | 'close'
  | 'home'
  | 'question'
  | 'flask'
  | 'book'
  | 'target'
  | 'chevron-right'
  | 'sparkle'
  | 'layers'
  | 'rotate'
  | 'skip'
  | 'eye'

const PATHS: Record<IconName, string> = {
  sun: 'M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M18 6l-1.4 1.4M7.4 16.6L6 18M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  sizes: 'M4 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm5.5-2.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm6-6a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
  distances: 'M3 12h18M7 9v6M11 8v8M15 10v4M19 11v2',
  gravity: 'M12 3v9m0 0-3 6m3-6 3 6M4 8h16M12 8l3-4M12 8 9 4',
  seasons: 'M12 3v18M12 6a6 6 0 0 1 0 12M12 6a6 6 0 0 0 0 12',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z',
  orbit: 'M12 12m-2.5 0a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0M4 12a8 8 0 0 1 8-8m8 8a8 8 0 0 1-8 8',
  rocket: 'M12 3c3.5 2.4 5 6 5 9.5l-2.5 3H9.5L7 12.5C7 9 8.5 5.4 12 3Zm0 7.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM9.5 18l-2 3 3-1 1-2m2 0 1 2 3 1-2-3',
  tour: 'M4 6h16v12H4zM9 10l4 2-4 2v-4Z',
  lightbulb: 'M9 17h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3Z',
  ruler: 'M3 14 14 3l7 7L10 21l-7-7Zm4.5-1.5 2 2m2-5 2 2m2-5 2 2',
  sound: 'M5 9v6h3l4 3V6L8 9H5Zm11-1a4 4 0 0 1 0 8',
  mute: 'M5 9v6h3l4 3V6L8 9H5Zm11 0 4 6m0-6-4 6',
  label: 'M3 6h10l5 6-5 6H3V6Zm4 4h.01',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm8 3-2.2-.5a6 6 0 0 0-.6-1.4l1.1-2-1.8-1.8-2 1.1a6 6 0 0 0-1.4-.6L12.6 4h-2.4l-.4 2.3a6 6 0 0 0-1.4.6l-2-1.1L4.5 7.6l1.1 2a6 6 0 0 0-.6 1.4L3 11.6v2.4l2.3.4c.1.5.3 1 .6 1.4l-1.1 2L6.6 19.6l2-1.1c.4.3.9.5 1.4.6l.4 2.3h2.4l.4-2.3c.5-.1 1-.3 1.4-.6l2 1.1 1.8-1.8-1.1-2c.3-.4.5-.9.6-1.4l2.1-.5v-2.4Z',
  help: 'M9.2 9a3 3 0 1 1 4 2.8c-.8.3-1.2 1-1.2 1.7v.5M12 17.5v.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
  play: 'M8 5.5v13l11-6.5-11-6.5Z',
  pause: 'M9 5v14M15 5v14',
  back: 'M11 6 5 12l6 6M18 6l-6 6 6 6',
  forward: 'M13 6l6 6-6 6M6 6l6 6-6 6',
  close: 'M6 6l12 12M18 6 6 18',
  home: 'M4 11 12 4l8 7v9H4v-9Zm5 9v-6h6v6',
  question: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5v.01M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.4M12 16.5v.01',
  flask: 'M10 3h4M11 3v6L5.6 18a2 2 0 0 0 1.7 3h9.4a2 2 0 0 0 1.7-3L13 9V3M8 14h8',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Zm0 0v15M8 7h8M8 11h6',
  target: 'M12 12m-8 0a8 8 0 1 0 16 0 8 8 0 1 0-16 0M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M12 2v3m0 14v3M2 12h3m14 0h3',
  'chevron-right': 'M9 6l6 6-6 6',
  sparkle: 'M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Zm6 9 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13Z',
  layers: 'M12 3 3 8l9 5 9-5-9-5Zm9 9-9 5-9-5m18 4.5-9 5-9-5',
  rotate: 'M20 12a8 8 0 1 1-2.6-5.9M20 4v4h-4',
  skip: 'M6 6l8 6-8 6V6Zm11 0v12',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

/** Line-art icon set — one consistent stroke weight across the whole UI. */
export function Icon({ name, size = 18, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
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