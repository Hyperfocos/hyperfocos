import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-[#1A3A5C] text-white hover:bg-[#142E4A] focus-visible:ring-[#1A3A5C]':
              variant === 'primary',
            'border border-[#DDE3EB] bg-white text-[#1A2B3C] hover:bg-[#F2F5F8]':
              variant === 'secondary',
            'text-[#1A2B3C] hover:bg-[#F2F5F8]': variant === 'ghost',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
