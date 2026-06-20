'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Buscar cliente...' }: SearchBarProps) {
  const [local, setLocal] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setLocal(value) }, [value])

  function handleChange(v: string) {
    setLocal(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(v), 150)
  }

  return (
    <div className="relative" style={{ minWidth: 240, maxWidth: 360 }}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 rounded-xl text-sm text-white outline-none transition-all"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
      />
      {local && (
        <button
          onClick={() => { setLocal(''); onChange('') }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/10 transition-colors"
        >
          <X size={13} style={{ color: 'rgba(255,255,255,0.35)' }} />
        </button>
      )}
    </div>
  )
}

export function filterBySearch<T extends Record<string, any>>(
  items: T[],
  search: string,
  fields: (keyof T)[]
): T[] {
  if (!search.trim()) return items
  const normalized = search.toLowerCase().replace(/[.\-()/ ]/g, '')
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field]
      if (val == null) return false
      const str = String(val).toLowerCase().replace(/[.\-()/ ]/g, '')
      return str.includes(normalized)
    })
  )
}
