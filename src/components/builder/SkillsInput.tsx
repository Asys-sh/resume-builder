'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { skills as allSkills } from '@/lib/arrays'
import type { Skill } from '@/stores/builder'

interface SkillsInputProps {
  skills: Skill[]
  onAdd: (name: string) => void
  onRemove: (id: string) => void
}

export function SkillsInput({ skills, onAdd, onRemove }: SkillsInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({ bottom: 0, left: 0, width: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const added = new Set(skills.map((s) => s.name.toLowerCase()))
    if (!inputValue.trim()) {
      return allSkills.filter((s) => !added.has(s.toLowerCase())).slice(0, 60)
    }
    const q = inputValue.toLowerCase()
    return allSkills
      .filter((s) => s.toLowerCase().includes(q) && !added.has(s.toLowerCase()))
      .slice(0, 60)
  }, [inputValue, skills])

  const computePosition = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDropdownStyle({
      bottom: window.innerHeight - rect.top + 4,
      left: rect.left,
      width: rect.width,
    })
  }

  // Open dropdown — always recomputes position so clicking a focused container works too
  const open = () => {
    computePosition()
    setIsOpen(true)
  }

  const handleAdd = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setInputValue('')
    // Explicitly keep open — calling open() recalculates position and sets isOpen true
    open()
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[0]) handleAdd(filtered[0])
      else if (inputValue.trim()) handleAdd(inputValue)
    }
    if (e.key === 'Escape') setIsOpen(false)
    if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      onRemove(skills[skills.length - 1].id)
    }
  }

  // Recompute position on scroll/resize while open
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

  // Close only when clicking outside both the container and the portal
  useEffect(() => {
    if (!isOpen) return
    function handleOutside(e: MouseEvent) {
      const portal = document.getElementById('skills-input-portal')
      if (portal?.contains(e.target as Node)) return
      if (containerRef.current?.contains(e.target as Node)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isOpen])

  const showDropdown = isOpen && filtered.length > 0

  const dropdown = showDropdown ? (
    <div
      id="skills-input-portal"
      style={{
        position: 'fixed',
        bottom: dropdownStyle.bottom,
        left: dropdownStyle.left,
        width: dropdownStyle.width,
        zIndex: 9999,
      }}
      className="max-h-48 overflow-y-auto overscroll-contain scrollbar-none bg-white border border-border-color/40 rounded-xl shadow-lg"
    >
      {filtered.map((skill) => (
        <button
          key={skill}
          type="button"
          // onMouseDown with preventDefault keeps focus on input
          // Then we call open() inside handleAdd to guarantee dropdown stays visible
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={() => handleAdd(skill)}
          className="w-full text-left px-3 py-2 text-sm text-text-main hover:bg-primary/5 transition-colors"
        >
          {skill}
        </button>
      ))}
    </div>
  ) : null

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: click-to-focus wrapper */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: click-to-focus wrapper */}
      <div
        ref={containerRef}
        className="flex flex-wrap gap-2 p-3 rounded-xl border border-border-color bg-white min-h-[52px] cursor-text focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all"
        // onClick always opens — works even when input is already focused
        onClick={() => {
          open()
          inputRef.current?.focus()
        }}
      >
        {skills.map((skill) => (
          <span
            key={skill.id}
            className="flex items-center gap-1 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full"
          >
            {skill.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(skill.id)
              }}
              className="hover:text-primary/60 transition-colors ml-0.5"
              aria-label={`Remove ${skill.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            open()
          }}
          onKeyDown={handleKeyDown}
          placeholder={skills.length === 0 ? 'Search or type a skill, press Enter to add…' : ''}
          className="flex-1 min-w-[160px] bg-transparent outline-none text-sm text-text-main placeholder:text-text-subtle/50 py-0.5"
        />
      </div>

      {typeof window !== 'undefined' && dropdown ? createPortal(dropdown, document.body) : null}
    </>
  )
}
