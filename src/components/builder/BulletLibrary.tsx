'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen, ChevronRight, Search, X } from 'lucide-react'
import { BULLET_CATEGORIES, detectCategory, searchBullets } from '@/lib/bullet-library'
import { cn } from '@/lib/utils'

interface BulletLibraryProps {
  role: string
  onInsert: (text: string) => void
}

export function BulletLibrary({ role, onInsert }: BulletLibraryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [dropdownStyle, setDropdownStyle] = useState({ bottom: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setSelectedCategoryId(detectCategory(role))
  }, [role])

  const results = useMemo(
    () => searchBullets(search, selectedCategoryId),
    [search, selectedCategoryId],
  )

  const computePosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const panelWidth = 420
    // Center the panel on the trigger, clamped inside the viewport
    const idealLeft = rect.left + rect.width / 2 - panelWidth / 2
    setDropdownStyle({
      bottom: window.innerHeight - rect.top + 4,
      left: Math.max(8, Math.min(idealLeft, window.innerWidth - panelWidth - 8)),
      width: panelWidth,
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

  const handleInsert = (text: string) => {
    onInsert(text)
    handleClose()
  }

  // Recompute on scroll/resize
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
      const portal = document.getElementById('bullet-library-portal')
      if (portal?.contains(e.target as Node)) return
      if (triggerRef.current?.contains(e.target as Node)) return
      handleClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const panel = isOpen ? (
    // Flex column: header is NOT inside the scroll container so overflow-x works freely
    <div
      id="bullet-library-portal"
      style={{
        position: 'fixed',
        bottom: dropdownStyle.bottom,
        left: dropdownStyle.left,
        width: dropdownStyle.width,
        zIndex: 9999,
      }}
      className="flex flex-col bg-background-light border border-border-color/50 rounded-xl shadow-xl"
    >
      {/* Header: outside the scroll area — owns its own overflow context */}
      <div className="flex-none border-b border-border-color/30 px-3 pt-3 pb-2 flex flex-col gap-2">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-text-subtle pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bullets…"
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

        <div className="relative">
          <div
            className="flex gap-1.5 overflow-x-auto overscroll-contain scrollbar-none pb-0.5 pr-6"
            onWheel={(e) => {
              e.preventDefault()
              e.currentTarget.scrollLeft += e.deltaY + e.deltaX
            }}
          >
          <button
            type="button"
            onClick={() => setSelectedCategoryId(null)}
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
              selectedCategoryId === null
                ? 'bg-primary text-white'
                : 'bg-border-color/20 text-text-subtle hover:bg-border-color/40',
            )}
          >
            All
          </button>
          {BULLET_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)
              }
              className={cn(
                'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                selectedCategoryId === category.id
                  ? 'bg-primary text-white'
                  : 'bg-border-color/20 text-text-subtle hover:bg-border-color/40',
              )}
            >
              {category.label}
            </button>
          ))}
          </div>
          {/* Scroll hint: fade + chevron on the right */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 flex items-center">
            <div className="w-8 h-full bg-gradient-to-l from-background-light to-transparent" />
            <ChevronRight className="absolute right-0.5 h-3.5 w-3.5 text-text-subtle" />
          </div>
        </div>
      </div>

      {/* Bullet list: scrolls vertically in its own independent container */}
      <div className="overflow-y-auto overscroll-contain scrollbar-none max-h-52 flex flex-col divide-y divide-border-color/20">
        {results.length === 0 ? (
          <p className="px-3 py-4 text-xs text-text-subtle text-center">No matching bullets</p>
        ) : (
          results.map(({ category, bullets }) => (
            <div key={category.id}>
              {selectedCategoryId === null && (
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-text-subtle">
                  {category.label}
                </p>
              )}
              {bullets.map((bullet, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 px-3 py-2 hover:bg-border-color/10 transition-colors"
                >
                  <p className="text-xs text-text-main line-clamp-2 leading-relaxed flex-1">
                    {bullet}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleInsert(bullet)}
                    className="text-[10px] text-primary hover:underline shrink-0 mt-0.5"
                  >
                    + Insert
                  </button>
                </div>
              ))}
            </div>
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
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary transition-colors"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Browse examples
      </button>

      {typeof window !== 'undefined' && panel ? createPortal(panel, document.body) : null}
    </>
  )
}
