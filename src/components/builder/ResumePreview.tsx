'use client'

import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { TEMPLATES } from '@/lib/templates'
import { resumeDataAtom, setResumeDataAtom } from '@/stores/builder'
import { cn } from '@/lib/utils'
import { ScoreMeter } from './ScoreMeter'

/**
 * ResumePreview Component
 *
 * Renders a live preview of the resume using the selected template component.
 * Each template is self-contained and handles its own styling and layout.
 */
export function ResumePreview() {
  const [resumeData, setResumeData] = useAtom(resumeDataAtom)
  const [, setResumeDataPartial] = useAtom(setResumeDataAtom)
  const { selectedTemplate } = resumeData

  const template = TEMPLATES.find((t) => t.id === selectedTemplate)
  const TemplateComponent = template?.component || TEMPLATES[0]?.component

  // Normalize stale template ID by updating resumeData to the default template
  useEffect(() => {
    if (TEMPLATES.length === 0) return
    if (!template && selectedTemplate) {
      console.warn(
        `Template '${selectedTemplate}' not found, normalizing to default template '${TEMPLATES[0].id}'`,
      )
      setResumeData({
        ...resumeData,
        selectedTemplate: TEMPLATES[0].id,
      })
    }
  }, [template, selectedTemplate, resumeData, setResumeData])

  // Guard against empty TEMPLATES array
  if (TEMPLATES.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg border border-border-color/20 text-center">
        <p className="text-text-subtle">No templates available</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Template strip */}
      <div className="shrink-0 flex items-center gap-2">
        <span className="text-[10px] font-bold text-text-subtle uppercase tracking-widest shrink-0">
          Template
        </span>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {TEMPLATES.map((t) => {
            const isSelected = selectedTemplate === t.id
            return (
              <div key={t.id} className="relative group shrink-0">
                {/* Hover thumbnail preview */}
                {!isSelected && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-28 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-20 shadow-lg rounded-lg overflow-hidden border border-border-color/40 bg-white">
                    {t.previewComponent}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setResumeDataPartial({ selectedTemplate: t.id })}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 border',
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-background-light text-text-subtle border-border-color/50 hover:border-primary/50 hover:text-text-main',
                  )}
                >
                  {t.name}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Live preview */}
      <div className="flex-1 min-h-0 bg-white p-2 rounded-xl shadow-lg border border-border-color/20">
        <div className="h-full w-full overflow-hidden" style={{ aspectRatio: '8.5/11', maxHeight: '100%' }}>
          <TemplateComponent resumeData={resumeData} />
        </div>
      </div>

      {/* Score meter */}
      <ScoreMeter />
    </div>
  )
}
