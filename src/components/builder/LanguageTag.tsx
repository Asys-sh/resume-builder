'use client'

import { X } from 'lucide-react'
import type { Language } from '@/stores/builder'

interface LanguageTagProps {
  language: Language
  onRemove: () => void
}

export function LanguageTag({ language, onRemove }: LanguageTagProps) {
  return (
    <span className="bg-highlight text-text-main rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2">
      {language.name} - {language.proficiency}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-red-500 transition-colors"
        aria-label="Remove language"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}
