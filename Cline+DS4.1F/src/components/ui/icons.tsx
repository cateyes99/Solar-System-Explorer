/**
 * Inline SVG icons.
 *
 * Hand-written so the app ships with no icon dependency, and so every icon
 * inherits `currentColor` and stays crisp at any size.
 */
interface IconProps {
  size?: number
  className?: string
}

function base(size: number, className: string) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
    focusable: false,
  }
}

export function PlayIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M7 5.5 18 12 7 18.5Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PauseIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="7" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" stroke="none" />
      <rect x="13.5" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function BackIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M14.5 6.5 9 12l5.5 5.5" />
      <path d="M19 6.5 13.5 12 19 17.5" opacity="0.5" />
    </svg>
  )
}

export function ForwardIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M9.5 6.5 15 12l-5.5 5.5" />
      <path d="M5 6.5 10.5 12 5 17.5" opacity="0.5" />
    </svg>
  )
}

export function SunIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.4M12 19v2.4M2.6 12H5M19 12h2.4M5.4 5.4 7 7M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6" />
    </svg>
  )
}

export function RocketIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3c3.2 2 4.6 5.2 4.6 9.2L12 15.6l-4.6-3.4C7.4 8.2 8.8 5 12 3Z" />
      <path d="M9.4 15.4 7 17.8M14.6 15.4 17 17.8M12 18.4v2.6" />
    </svg>
  )
}

export function SparkleIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9Z" />
      <path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z" />
    </svg>
  )
}

export function BookIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4.5 5.2A2 2 0 0 1 6.5 3.4H19v15.4H6.6a2 2 0 0 0-2 1.8Z" />
      <path d="M4.5 5.2v15.4" />
      <path d="M8.6 8.2h6.6M8.6 11.6h4.6" opacity="0.65" />
    </svg>
  )
}

export function QuestionIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.3a2.7 2.7 0 1 1 3.9 2.4c-.8.4-1.3 1-1.3 1.9" />
      <path d="M12 16.9h.01" />
    </svg>
  )
}

export function BulbIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M9 17.4h6M10 20.4h4" />
      <path d="M12 3.6a5.6 5.6 0 0 0-3.2 10.2c.6.4.9 1 .9 1.7h4.6c0-.7.3-1.3.9-1.7A5.6 5.6 0 0 0 12 3.6Z" />
    </svg>
  )
}

export function OrbitIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="9" ry="4.6" transform="rotate(-18 12 12)" />
      <circle cx="19.4" cy="8.8" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function TagIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4.6 10.6V5.2c0-.4.3-.6.6-.6h5.4c.2 0 .3.1.5.2l8 8-6 6-8-8a.7.7 0 0 1-.2-.5Z" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SettingsIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.4v2.2M12 18.4v2.2M4.9 7.8l1.9 1.1M17.2 15.1l1.9 1.1M4.9 16.2l1.9-1.1M17.2 8.9l1.9-1.1" />
    </svg>
  )
}

export function SoundOnIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M5 9.5h3l4-3.4v11.8l-4-3.4H5Z" />
      <path d="M15.2 9.4a3.6 3.6 0 0 1 0 5.2M17.6 7.2a7 7 0 0 1 0 9.6" />
    </svg>
  )
}

export function SoundOffIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M5 9.5h3l4-3.4v11.8l-4-3.4H5Z" />
      <path d="M15.4 10.2l4 3.6M19.4 10.2l-4 3.6" />
    </svg>
  )
}

export function MotionIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3.5 12h6.2l1.6-3.4 2.2 7 1.6-3.6h5.4" />
    </svg>
  )
}

export function HomeIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4.5 10.4 12 4.4l7.5 6v9.2h-15Z" />
      <path d="M9.6 19.6v-5.2h4.8v5.2" opacity="0.7" />
    </svg>
  )
}

export function CloseIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6" />
    </svg>
  )
}

export function HelpIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.6a2.5 2.5 0 1 1 3.6 2.3c-.7.4-1.2.9-1.2 1.7" />
      <path d="M12 16.6h.01" />
    </svg>
  )
}

export function LayersIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3.8 20 8l-8 4.2L4 8Z" />
      <path d="m4 12.4 8 4.2 8-4.2M4 16.4l8 4.2 8-4.2" opacity="0.6" />
    </svg>
  )
}