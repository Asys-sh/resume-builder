'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropdownStyle {
  bottom: number
  left: number
  width: number
}

interface ItemPickerProps {
  options: string[]
  onSelect: (value: string) => void
  triggerLabel: string
  triggerIcon?: React.ReactNode
  searchPlaceholder?: string
  triggerClassName?: string
}

export function ItemPicker({
  options,
  onSelect,
  triggerLabel,
  triggerIcon,
  searchPlaceholder = 'Search…',
  triggerClassName,
}: ItemPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<DropdownStyle>({ bottom: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return options.slice(0, 80)
    const q = search.toLowerCase()
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 80)
  }, [search, options])

  const computePosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    // Open upward: bottom of dropdown aligns 4px above trigger top
    setDropdownStyle({
      bottom: window.innerHeight - rect.top + 4,
      left: rect.left,
      width: Math.max(rect.width, 288), // at least 288px (w-72)
    })
  }

  const handleOpen = () => {
    computePosition()
    setIsOpen(true)
    setSearch('')
  }

  const handleClose = () => {
    setIsOpen(false)
    setSearch('')
  }

  const handleSelect = (value: string) => {
    onSelect(value)
    handleClose()
  }

  // Recompute on scroll/resize while open
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

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      const portal = document.getElementById('item-picker-portal')
      if (portal && portal.contains(e.target as Node)) return
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) return
      handleClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const dropdown = isOpen ? (
    <div
      id="item-picker-portal"
      style={{
        position: 'fixed',
        bottom: dropdownStyle.bottom,
        left: dropdownStyle.left,
        width: dropdownStyle.width,
        zIndex: 9999,
      }}
      className="max-h-64 overflow-y-auto overscroll-contain scrollbar-none bg-background-light border border-border-color/50 rounded-xl shadow-xl"
    >
      {/* Sticky search */}
      <div className="sticky top-0 bg-background-light border-b border-border-color/30 px-3 pt-3 pb-2">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-text-subtle pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-md border border-border-color/50 bg-white/60 pl-8 pr-8 text-sm text-text-main placeholder:text-text-subtle focus:outline-none focus:ring-1 focus:ring-primary/40"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 text-text-subtle hover:text-text-main"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col divide-y divide-border-color/20">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-xs text-text-subtle text-center">No results</p>
        ) : (
          filtered.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3 py-2 text-xs text-text-main hover:bg-border-color/10 transition-colors"
            >
              {item}
            </button>
          ))
        )}
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={isOpen ? handleClose : handleOpen}
        className={cn(
          'flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm',
          triggerClassName,
        )}
      >
        {triggerIcon}
        {triggerLabel}
      </button>

      {typeof window !== 'undefined' && dropdown ? createPortal(dropdown, document.body) : null}
    </>
  )
}
