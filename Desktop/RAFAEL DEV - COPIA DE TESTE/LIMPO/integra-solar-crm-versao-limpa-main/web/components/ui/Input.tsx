import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={id}
            className="text-xs font-bold uppercase tracking-wide text-[#3D5166]"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-md border border-[#DDE3EB] bg-white px-3.5 py-2.5 text-sm text-[#1A2B3C] placeholder:text-[#A8BCCE] outline-none transition-all focus:border-[#1A3A5C] focus:ring-2 focus:ring-[#1A3A5C]/10',
            { 'border-red-500 focus:border-red-500 focus:ring-red-500/10': !!error },
            className
          )}
          {...props}
        />
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
