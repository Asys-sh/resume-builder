'use client'

import { X } from 'lucide-react'
import type { Skill } from '@/stores/builder'

interface SkillTagProps {
  skill: Skill
  onRemove: () => void
}

export function SkillTag({ skill, onRemove }: SkillTagProps) {
  return (
    <div className="flex items-center gap-2 bg-highlight text-text-main text-sm font-medium px-4 py-2 rounded-full">
      <span>{skill.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-text-subtle hover:text-text-main transition-colors"
        aria-label={`Remove ${skill.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
