'use client'

import { Check } from 'lucide-react'
import { TEMPLATES } from '@/lib/templates'
import { cn } from '@/lib/utils'

interface TemplateSelectorProps {
  selectedTemplate: string
  onSelect: (template: string) => void
}

export function TemplateSelector({ selectedTemplate, onSelect }: TemplateSelectorProps) {
  if (TEMPLATES.length === 0) {
    return <div className="text-center p-8 text-text-subtle">No templates available</div>
  }

  return (
    <div className="grid grid-cols-2 gap-5">
      {TEMPLATES.map((template) => {
        const isSelected = selectedTemplate === template.id

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={cn(
              'group relative flex flex-col rounded-xl border-2 overflow-hidden transition-all duration-200 text-left',
              'hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5',
              isSelected ? 'border-primary shadow-md shadow-primary/15' : 'border-border-color/40',
            )}
          >
            {/* Selected badge */}
            {isSelected && (
              <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                <Check className="size-3.5" />
                Selected
              </div>
            )}

            {/* Preview area */}
            <div
              className={cn(
                'p-4 transition-colors',
                isSelected ? 'bg-primary/5' : 'bg-gray-50 group-hover:bg-primary/[0.03]',
              )}
            >
              {template.previewComponent}
            </div>

            {/* Info footer */}
            <div className="px-4 py-3 bg-white border-t border-border-color/20 flex flex-col gap-0.5">
              <p
                className={cn('font-bold text-sm', isSelected ? 'text-primary' : 'text-text-main')}
              >
                {template.name}
              </p>
              <p className="text-xs text-text-subtle leading-relaxed">{template.description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
