'use client'

import { useState, useEffect, useRef } from 'react'
import { DayPicker } from 'react-day-picker'
import { ptBR } from 'date-fns/locale'
import { format, parse, isValid } from 'date-fns'
import 'react-day-picker/dist/style.css'

interface DatePickerProps {
  label?: string
  name?: string
  value?: string | null  // ISO: "2026-06-18"
  onChange?: (iso: string) => void
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

export function DatePicker({
  label, name, value, onChange, error, required, placeholder = 'dd/mm/aaaa', disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [inputVal, setInputVal] = useState<string>('')
  const [selected, setSelected] = useState<Date | undefined>(undefined)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const d = parse(value, 'yyyy-MM-dd', new Date())
      if (isValid(d)) {
        setSelected(d)
        setInputVal(format(d, 'dd/MM/yyyy'))
      }
    } else {
      setSelected(undefined)
      setInputVal('')
    }
  }, [value])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleDaySelect(day: Date | undefined) {
    setSelected(day)
    if (day && isValid(day)) {
      const iso = format(day, 'yyyy-MM-dd')
      setInputVal(format(day, 'dd/MM/yyyy'))
      onChange?.(iso)
    }
    setOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setInputVal(v)
    if (v.length === 10) {
      const d = parse(v, 'dd/MM/yyyy', new Date())
      if (isValid(d)) {
        setSelected(d)
        onChange?.(format(d, 'yyyy-MM-dd'))
      }
    }
  }

  const isoValue = selected && isValid(selected) ? format(selected, 'yyyy-MM-dd') : ''

  return (
    <div className="flex flex-col gap-1.5 relative" ref={ref}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.40)' }}>
          {label}{required && ' *'}
        </label>
      )}
      <input
        type="text"
        inputMode="numeric"
        value={inputVal}
        placeholder={placeholder}
        onChange={handleInputChange}
        onFocus={() => !disabled && setOpen(true)}
        disabled={disabled}
        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all"
        style={{
          ...inputStyle,
          border: error ? '1px solid rgba(255,100,100,0.5)' : inputStyle.border,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      {name && <input type="hidden" name={name} value={isoValue} />}
      {error && <p className="text-xs" style={{ color: '#FF9090' }}>{error}</p>}

      {open && (
        <div
          className="absolute z-50 top-full mt-1 rounded-xl border border-white/10 shadow-xl"
          style={{ background: '#141826' }}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleDaySelect}
            locale={ptBR}
            style={{ color: '#E0E8F0' }}
          />
        </div>
      )}
    </div>
  )
}
