'use client'

import { useState, useEffect } from 'react'
import { cleanDigits } from '@/lib/format'

interface CepInputProps {
  label?: string
  name?: string
  value?: string | null
  onChange?: (raw: string) => void
  error?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
}

function applyCepMask(digits: string): string {
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
}

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#E0E8F0',
}

export function CepInput({
  label, name, value, onChange, error, required, placeholder = '00000-000', disabled,
}: CepInputProps) {
  const [digits, setDigits] = useState<string>(cleanDigits(value ?? ''))

  useEffect(() => {
    setDigits(cleanDigits(value ?? ''))
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const d = cleanDigits(e.target.value).slice(0, 8)
    setDigits(d)
    onChange?.(d)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.40)' }}>
          {label}{required && ' *'}
        </label>
      )}
      <input
        type="text"
        inputMode="numeric"
        value={applyCepMask(digits)}
        placeholder={placeholder}
        onChange={handleChange}
        disabled={disabled}
        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all"
        style={{
          ...inputStyle,
          border: error ? '1px solid rgba(255,100,100,0.5)' : inputStyle.border,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      {name && <input type="hidden" name={name} value={digits} />}
      {error && <p className="text-xs" style={{ color: '#FF9090' }}>{error}</p>}
    </div>
  )
}
