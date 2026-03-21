import { useAtom } from 'jotai'
import { useState } from 'react'
import { toast } from 'sonner'
import { BuilderTextarea, NavigationButtons, StepProgress } from '@/components/builder'
import { resumeDataAtom, setResumeDataAtom } from '@/stores/builder'

interface ProfessionalSummaryProps {
  onNext: () => void
  onPrevious: () => void
}

export function ProfessionalSummary({ onNext, onPrevious }: ProfessionalSummaryProps) {
  const [resumeData] = useAtom(resumeDataAtom)
  const [, setResumeDataPartial] = useAtom(setResumeDataAtom)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSummaryChange = (value: string) => {
    setResumeDataPartial({ summary: value })
  }

  const handleAISummary = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'summary',
          skills: resumeData.skills.map((s) => s.name),
          currentContent: resumeData.summary,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          toast.error(data.message || 'AI quota reached. Upgrade to Pro for unlimited access.')
        } else {
          toast.error(data.error || data.message || 'Failed to generate summary')
        }
        return
      }
      setResumeDataPartial({ summary: data.result })
      toast.success('Summary generated!')
    } catch {
      toast.error('Connection error — check your internet and try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <StepProgress currentStep={3} totalSteps={7} stepLabel="Professional Summary" />
      <div className="flex flex-col gap-8 bg-secondary-bg/50 p-6 md:p-8 rounded-xl border border-border-color/30">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">
            Professional Summary
          </h1>
          <p className="text-text-subtle text-base font-normal leading-normal">
            Write a compelling 2-3 paragraph summary highlighting your career highlights and
            strengths.
          </p>
        </div>

        <div>
          <BuilderTextarea
            id="summary"
            label="Summary"
            value={resumeData.summary}
            onChange={(e) => handleSummaryChange(e.target.value)}
            placeholder="Start with your most recent role and key achievements..."
            rows={8}
            showAIButton={true}
            onAIClick={handleAISummary}
            disabled={isGenerating}
          />
          {isGenerating && (
            <p className="text-xs text-text-subtle mt-2 animate-pulse">Generating summary…</p>
          )}
        </div>

        <NavigationButtons
          onPrevious={onPrevious}
          onNext={onNext}
          previousDisabled={false}
          showPrevious={true}
          showNext={true}
        />
      </div>
    </>
  )
}
