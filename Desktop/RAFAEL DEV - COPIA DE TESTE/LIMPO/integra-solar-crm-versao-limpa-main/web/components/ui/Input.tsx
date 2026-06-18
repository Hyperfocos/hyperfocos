import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, style, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={id}
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all',
            className
          )}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: error
              ? '1px solid rgba(255,100,100,0.5)'
              : '1px solid rgba(255,255,255,0.10)',
            color: '#E0E8F0',
            ...(style ?? {}),
          }}
          {...props}
        />
        {error ? (
          <p className="text-xs" style={{ color: '#FF9090' }}>
            {error}
          </p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
