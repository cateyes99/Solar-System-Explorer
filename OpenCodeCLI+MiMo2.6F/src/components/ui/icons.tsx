import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = (props: IconProps): IconProps => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export const PlayIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" stroke="none" />
  </svg>
)

export const PauseIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
    <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
  </svg>
)

export const FastIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 5v14l7-7-7-7Z" fill="currentColor" stroke="none" />
    <path d="M13 5v14l7-7-7-7Z" fill="currentColor" stroke="none" />
  </svg>
)

export const CogIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M4.7 7.5l2.1 1.2M17.2 15.3l2.1 1.2M4.7 16.5l2.1-1.2M17.2 8.7l2.1-1.2" />
  </svg>
)

export const BookIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14.5H6.5A2.5 2.5 0 0 0 4 20V5.5Z" />
    <path d="M4 20a2.5 2.5 0 0 1 2.5-2.5H19V21H6.5A2.5 2.5 0 0 1 4 20Z" />
  </svg>
)

export const RocketIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 2.5c3.2 2 5 5.4 5 9.2l-2.4 3.4H9.4L7 11.7c0-3.8 1.8-7.2 5-9.2Z" />
    <circle cx="12" cy="10" r="1.8" />
    <path d="M9.4 15.1 7 21l3.2-1.6M14.6 15.1 17 21l-3.2-1.6" />
  </svg>
)

export const SparkIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  </svg>
)

export const CloseIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const GlobeIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17" />
  </svg>
)

export const CrosshairIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
  </svg>
)

export const RouteIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <path d="M8.5 18h5.2a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8" />
  </svg>
)

export const SoundOnIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4v-5Z" />
    <path d="M15.5 9.2a4 4 0 0 1 0 5.6M18 6.8a7.5 7.5 0 0 1 0 10.4" />
  </svg>
)

export const SoundOffIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4v-5Z" />
    <path d="M16 10l4 4M20 10l-4 4" />
  </svg>
)

export const HelpIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.7" />
    <circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
  </svg>
)

export const FlagIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M6 21V4M6 4.5h11l-2.2 3.6L17 12H6" />
  </svg>
)

export const LightbulbIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M9.5 17.5h5M10 20.5h4" />
    <path d="M12 3.5a5.5 5.5 0 0 1 3.2 9.9c-.6.5-1 1.2-1.1 2h-4.2c-.1-.8-.5-1.5-1.1-2A5.5 5.5 0 0 1 12 3.5Z" />
  </svg>
)
