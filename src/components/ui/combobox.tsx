'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'
import { jobs_title } from '@/lib/arrays'
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

  // Use useMemo to create the Trie.
  // We assume staticOptions is relatively stable. If it changes, we rebuild the Trie.
  const trie = useMemo(() => {
    const manager = new TrieManager()
    if (staticOptions) {
      staticOptions.forEach((option) => {
        manager.insert(option.toLowerCase())
      })
    }
    return manager
  }, [staticOptions])

  // Handle outside click to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update loading state when input changes (before debounce)
  useEffect(() => {
    if (inputValue !== debouncedSearch) {
      setLoading(true)
    }
  }, [inputValue, debouncedSearch])

  // Perform search when debounced value or trie changes
  useEffect(() => {
    const results = trie.suggest(debouncedSearch.toLowerCase())
    setDisplayOptions(results)
    setLoading(false)
  }, [debouncedSearch, trie])

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

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
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
              <div className="py-6 text-center text-sm">{loading ? 'Loading...' : emptyText}</div>
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
                    'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer hover:bg-gray-100',
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
      )}
    </div>
  )
}
