'use client'

import { useMemo, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { languages as languageList } from '@/lib/arrays'
import type { Language } from '@/stores/builder'
import { cn } from '@/lib/utils'

const PROFICIENCY_OPTIONS = ['Native', 'Fluent', 'Conversational', 'Basic'] as const

interface LanguageInputProps {
  languages: Language[]
  onAdd: (name: string, proficiency: string) => void
  onRemove: (id: string) => void
  onUpdateProficiency: (id: string, proficiency: string) => void
}

export function LanguageInput({ languages, onAdd, onRemove, onUpdateProficiency }: LanguageInputProps) {
  const [input, setInput] = useState('')
  const [proficiency, setProficiency] = useState<string>('Native')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const existingNames = useMemo(
    () => new Set(languages.map((l) => l.name.toLowerCase())),
    [languages],
  )

  const suggestions = useMemo(() => {
    if (!input.trim()) return []
    const q = input.toLowerCase()
    return languageList
      .filter((l) => l.toLowerCase().includes(q) && !existingNames.has(l.toLowerCase()))
      .slice(0, 8)
  }, [input, existingNames])

  const handleAdd = (name?: string) => {
    const nameToAdd = (name || input).trim()
    if (!nameToAdd) return
    if (existingNames.has(nameToAdd.toLowerCase())) return
    onAdd(nameToAdd, proficiency)
    setInput('')
    setProficiency('Native')
    setShowSuggestions(false)
    setHighlightIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        handleAdd(suggestions[highlightIndex])
      } else {
        handleAdd()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => Math.max(prev - 1, -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightIndex(-1)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Added languages */}
      {languages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <div
              key={lang.id}
              className="flex items-center gap-1.5 bg-highlight rounded-full pl-3.5 pr-1.5 py-1.5 border border-primary/15"
            >
              <span className="text-sm font-medium text-text-main">{lang.name}</span>
              <select
                value={lang.proficiency}
                onChange={(e) => onUpdateProficiency(lang.id, e.target.value)}
                className="text-xs font-medium text-text-subtle bg-transparent border-none outline-none cursor-pointer py-0 pl-0 pr-1 appearance-none"
                aria-label={`Proficiency for ${lang.name}`}
                style={{ backgroundImage: 'none' }}
              >
                {PROFICIENCY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onRemove(lang.id)}
                className="p-0.5 rounded-full text-text-subtle hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label={`Remove ${lang.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2 items-end">
        {/* Language name with autocomplete */}
        <div className="relative flex-1 min-w-0">
          <label htmlFor="language-input" className="text-base font-medium text-text-main block mb-2">
            Language
          </label>
          <input
            ref={inputRef}
            id="language-input"
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setShowSuggestions(true)
              setHighlightIndex(-1)
            }}
            onFocus={() => input.trim() && setShowSuggestions(true)}
            onBlur={() => {
              // Delay to allow click on suggestion
              setTimeout(() => setShowSuggestions(false), 150)
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g., French"
            autoComplete="off"
            role="combobox"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls="language-suggestions"
            aria-activedescendant={highlightIndex >= 0 ? `lang-opt-${highlightIndex}` : undefined}
            className="form-input h-14 w-full rounded-lg border border-border-color bg-white p-[15px] text-text-main placeholder:text-text-subtle/70 focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul
              ref={listRef}
              id="language-suggestions"
              role="listbox"
              className="absolute z-20 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-border-color/50 rounded-lg shadow-lg"
            >
              {suggestions.map((suggestion, i) => (
                <li
                  key={suggestion}
                  id={`lang-opt-${i}`}
                  role="option"
                  aria-selected={highlightIndex === i}
                  className={cn(
                    'px-3 py-2 text-sm cursor-pointer transition-colors',
                    highlightIndex === i
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-main hover:bg-border-color/10',
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleAdd(suggestion)
                  }}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Proficiency */}
        <div className="shrink-0 w-40">
          <label htmlFor="language-proficiency" className="text-base font-medium text-text-main block mb-2">
            Level
          </label>
          <select
            id="language-proficiency"
            value={proficiency}
            onChange={(e) => setProficiency(e.target.value)}
            className="form-input h-14 w-full rounded-lg border border-border-color bg-white p-[15px] text-text-main appearance-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            {PROFICIENCY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={() => handleAdd()}
          disabled={!input.trim()}
          className="shrink-0 h-14 w-14 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Add language"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
