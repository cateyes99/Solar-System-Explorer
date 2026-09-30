import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import { Icon, type IconName } from '../Icon'

type Variant = 'ghost' | 'solid' | 'outline'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: IconName
  iconAfter?: IconName
  active?: boolean
  children?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  ghost: 'text-ice-200/80 hover:text-ice-50 hover:bg-white/6',
  solid: 'bg-ice-50 text-void hover:bg-white',
  outline: 'border border-edge text-ice-200 hover:border-edge-strong hover:text-ice-50',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-[11px] gap-1.5 rounded-lg',
  md: 'h-10 px-3.5 text-[13px] gap-2 rounded-xl',
  lg: 'h-12 px-5 text-sm gap-2.5 rounded-xl',
}

/**
 * A single button primitive. Every control in the app uses it so focus rings,
 * hit areas and disabled states stay consistent.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'ghost', size = 'md', icon, iconAfter, active, className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      className={[
        'inline-flex items-center justify-center font-semibold tracking-wide whitespace-nowrap',
        'transition-colors duration-150 select-none',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
        SIZES[size],
        VARIANTS[variant],
        active ? 'bg-white/10 text-ice-50' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 19 : 16} />}
      {children}
      {iconAfter && <Icon name={iconAfter} size={size === 'lg' ? 19 : 16} />}
    </button>
  )
})

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName
  label: string
  active?: boolean
  size?: number
  badge?: ReactNode
}

/** Square icon-only button. `label` becomes the accessible name. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, active, size = 18, badge, className = '', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={[
        'relative inline-flex h-10 w-10 items-center justify-center rounded-xl',
        'border transition-colors duration-150',
        active
          ? 'border-edge-strong bg-white/12 text-ice-50'
          : 'border-transparent text-ice-200/75 hover:border-edge hover:bg-white/6 hover:text-ice-50',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <Icon name={icon} size={size} />
      {badge}
    </button>
  )
})