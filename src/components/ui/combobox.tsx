'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'
import { TrieManager } from '@/lib/trie'
import { cn } from '@/lib/utils'

export interface ComboboxProps {
  value?: string
  onSelect: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  staticOptions?: string[]
}

export function Combobox({
  value,
  onSelect,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  staticOptions,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const debouncedSearch = useDebounce(inputValue, 200)

  const [displayOptions, setDisplayOptions] = useState<string[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  })

  const trie = useMemo(() => {
    const manager = new TrieManager()
    if (staticOptions) {
      staticOptions.forEach((option) => {
        manager.insert(option.toLowerCase())
      })
    }
    return manager
  }, [staticOptions])

  // Compute dropdown position from trigger rect (fixed = viewport-relative, no scroll offset)
  const updateDropdownPosition = () => {
    if (!wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    setDropdownStyle({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }

  // Open: compute position
  useEffect(() => {
    if (open) {
      updateDropdownPosition()
    }
  }, [open])

  // Recompute on scroll/resize while open
  useEffect(() => {
    if (!open) return
    const handle = () => updateDropdownPosition()
    window.addEventListener('scroll', handle, true)
    window.addEventListener('resize', handle)
    return () => {
      window.removeEventListener('scroll', handle, true)
      window.removeEventListener('resize', handle)
    }
  }, [open])

  // Handle outside click to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        // Also allow clicks inside the portal dropdown
        const portal = document.getElementById('combobox-portal-root')
        if (portal && portal.contains(event.target as Node)) return
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Loading state before debounce
  useEffect(() => {
    if (inputValue !== debouncedSearch) {
      setLoading(true)
    }
  }, [inputValue, debouncedSearch])

  // Search results after debounce
  useEffect(() => {
    const results = trie.suggest(debouncedSearch.toLowerCase())
    setDisplayOptions(results)
    setLoading(false)
  }, [debouncedSearch, trie])

  const dropdown = open ? (
    <div
      id="combobox-portal-root"
      style={{
        position: 'fixed',
        top: dropdownStyle.top,
        left: dropdownStyle.left,
        width: dropdownStyle.width,
        zIndex: 9999,
      }}
      className="max-h-60 overflow-auto overscroll-contain rounded-md border bg-white p-1 text-popover-foreground shadow-md ring-1 ring-black ring-opacity-5"
    >
      <div className="flex items-center border-b px-3">
        <input
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={searchPlaceholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>
      <div className="py-1">
        {loading && (
          <div className="py-6 text-center text-sm">Loading...</div>
        )}
        {!loading && displayOptions.length === 0 && (
          <div className="py-6 text-center text-sm">{emptyText}</div>
        )}
        {!loading &&
          displayOptions.map((option) => (
            // biome-ignore lint/a11y/noStaticElementInteractions: handled by child buttons
            // biome-ignore lint/a11y/useKeyWithClickEvents: handled by child buttons
            <div
              key={option}
              className={cn(
                'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100',
                value === option && 'bg-gray-100',
              )}
              onClick={() => {
                onSelect(option)
                setOpen(false)
                setInputValue('')
              }}
            >
              <Check
                className={cn('mr-2 h-4 w-4', value === option ? 'opacity-100' : 'opacity-0')}
              />
              {option}
            </div>
          ))}
      </div>
    </div>
  ) : null

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between font-normal text-left bg-white"
        onClick={() => setOpen(!open)}
      >
        {value || placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {typeof window !== 'undefined' && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  )
}
