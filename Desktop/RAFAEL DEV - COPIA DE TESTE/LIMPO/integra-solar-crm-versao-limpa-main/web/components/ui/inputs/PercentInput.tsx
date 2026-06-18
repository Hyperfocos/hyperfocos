'use client'

import { useState, useEffect } from 'react'

interface PercentInputProps {
  label?: string
  name?: string
  value?: number | null
  onChange?: (value: number) => void
  error?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
}

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#E0E8F0',
}

export function PercentInput({
  label, name, value, onChange, error, required, placeholder = '0,00%', disabled,
}: PercentInputProps) {
  const [display, setDisplay] = useState<string>(value != null ? String(value).replace('.', ',') : '')

  useEffect(() => {
    setDisplay(value != null ? String(value).replace('.', ',') : '')
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace('%', '').trim()
    setDisplay(raw)
    const n = parseFloat(raw.replace(',', '.'))
    if (!isNaN(n)) onChange?.(n)
  }

  function handleBlur() {
    const n = parseFloat(display.replace(',', '.'))
    if (!isNaN(n)) {
      setDisplay(n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    }
  }

  const rawValue = parseFloat(display.replace(',', '.'))

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.40)' }}>
          {label}{required && ' *'}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={display}
          placeholder={placeholder}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all pr-8"
          style={{
            ...inputStyle,
            border: error ? '1px solid rgba(255,100,100,0.5)' : inputStyle.border,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>%</span>
      </div>
      {name && <input type="hidden" name={name} value={isNaN(rawValue) ? '' : rawValue.toFixed(2)} />}
      {error && <p className="text-xs" style={{ color: '#FF9090' }}>{error}</p>}
    </div>
  )
}
