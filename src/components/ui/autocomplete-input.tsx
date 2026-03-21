'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  className?: string
}

export function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder = 'Type to search…',
  className,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!value.trim()) return options.slice(0, 60)
    const q = value.toLowerCase()
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 60)
  }, [value, options])

  const computePosition = () => {
    if (!wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    setDropdownStyle({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }

  const open = () => {
    computePosition()
    setIsOpen(true)
  }

  const handleSelect = (option: string) => {
    onChange(option)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  useEffect(() => {
    if (!isOpen) return
    const handle = () => computePosition()
    window.addEventListener('scroll', handle, true)
    window.addEventListener('resize', handle)
    return () => {
      window.removeEventListener('scroll', handle, true)
      window.removeEventListener('resize', handle)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleOutside(e: MouseEvent) {
      const portal = document.getElementById('autocomplete-portal')
      if (portal?.contains(e.target as Node)) return
      if (wrapperRef.current?.contains(e.target as Node)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isOpen])

  const dropdown =
    isOpen && filtered.length > 0 ? (
      <div
        id="autocomplete-portal"
        style={{
          position: 'fixed',
          top: dropdownStyle.top,
          left: dropdownStyle.left,
          width: dropdownStyle.width,
          zIndex: 9999,
        }}
        className="max-h-52 overflow-y-auto overscroll-contain scrollbar-none bg-white border border-border-color/40 rounded-xl shadow-lg"
      >
        {filtered.map((option) => (
          <button
            key={option}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSelect(option)}
            className="w-full text-left px-3 py-2 text-sm text-text-main hover:bg-primary/5 transition-colors"
          >
            {option}
          </button>
        ))}
      </div>
    ) : null

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          open()
        }}
        onClick={open}
        onFocus={open}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder={placeholder}
        className={cn(
          'form-input h-10 w-full rounded-lg border border-border-color bg-white px-3 text-sm text-text-main placeholder:text-text-subtle/70 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all',
          className,
        )}
      />
      {typeof window !== 'undefined' && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  )
}
