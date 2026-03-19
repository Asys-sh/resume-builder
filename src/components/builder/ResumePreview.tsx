'use client'

import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { TEMPLATES } from '@/lib/templates'
import { resumeDataAtom } from '@/stores/builder'

/**
 * ResumePreview Component
 *
 * Renders a live preview of the resume using the selected template component.
 * Each template is self-contained and handles its own styling and layout.
 */
export function ResumePreview() {
  const [resumeData, setResumeData] = useAtom(resumeDataAtom)
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
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 bg-white p-2 rounded-xl shadow-lg border border-border-color/20">
        <div className="h-full w-full overflow-hidden" style={{ aspectRatio: '8.5/11', maxHeight: '100%' }}>
          <TemplateComponent resumeData={resumeData} />
        </div>
      </div>
      <p className="text-center mt-3 text-sm text-text-subtle shrink-0">
        This is a live preview. Your changes will appear here.
      </p>
    </div>
  )
}
