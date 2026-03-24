'use client'

import { useAtom } from 'jotai'
import { Maximize2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { TEMPLATES } from '@/lib/templates'
import { resumeDataAtom, setResumeDataAtom } from '@/stores/builder'
import { cn } from '@/lib/utils'
import { ScoreMeter } from './ScoreMeter'
import { ATSReport } from './ATSReport'

/**
 * ResumePreview Component
 *
 * Renders a live preview of the resume using the selected template component.
 * Each template is self-contained and handles its own styling and layout.
 */
export function ResumePreview() {
  const [resumeData, setResumeData] = useAtom(resumeDataAtom)
  const [, setResumeDataPartial] = useAtom(setResumeDataAtom)
  const [expanded, setExpanded] = useState(false)
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
    <div className="flex flex-col gap-2 h-full min-h-0">
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

      {/* Live preview — fills remaining space, shrinks to fit */}
      <div className="relative flex-1 min-h-0 bg-white p-2 rounded-xl shadow-lg border border-border-color/20 group/preview overflow-hidden">
        {/* Expand button */}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="absolute top-3 left-3 z-10 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover/preview:opacity-100 hover:bg-black/70 transition-all duration-200"
          aria-label="Expand preview"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <div className="h-full w-full overflow-hidden">
          <TemplateComponent resumeData={resumeData} />
        </div>
      </div>

      {/* Expanded preview modal */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-3xl w-[90vw] h-[90vh] p-0 overflow-hidden bg-white border-none rounded-2xl">
          <DialogTitle className="sr-only">Resume Preview</DialogTitle>
          <div className="h-full w-full overflow-y-auto p-6">
            <div className="w-full" style={{ aspectRatio: '8.5/11' }}>
              <TemplateComponent resumeData={resumeData} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Score meter */}
      <div className="shrink-0">
        <ScoreMeter />
      </div>

      {/* ATS compatibility report */}
      <div className="shrink-0">
        <ATSReport resumeData={resumeData} />
      </div>
    </div>
  )
}
