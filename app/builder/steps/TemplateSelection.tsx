import { useAtom } from 'jotai'
import { NavigationButtons, StepProgress, TemplateSelector } from '@/components/builder'
import { resumeDataAtom, setResumeDataAtom } from '@/stores/builder'

interface TemplateSelectionProps {
  onNext: () => void
  onPrevious: () => void
}

export function TemplateSelection({ onNext, onPrevious }: TemplateSelectionProps) {
  const [resumeData] = useAtom(resumeDataAtom)
  const [, setResumeDataPartial] = useAtom(setResumeDataAtom)

  const handleTemplateSelect = (template: string) => {
    setResumeDataPartial({
      selectedTemplate: template,
    })
  }

  return (
    <>
      <StepProgress currentStep={1} totalSteps={7} stepLabel="Choose Template" />
      <div className="flex flex-col gap-8 bg-secondary-bg/50 p-6 md:p-8 rounded-xl border border-border-color/30">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">Choose Template</h1>
          <p className="text-text-subtle text-base font-normal leading-normal">
            Select a template to get started with your resume.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <TemplateSelector
            selectedTemplate={resumeData.selectedTemplate}
            onSelect={handleTemplateSelect}
          />
        </div>

        <NavigationButtons
          onPrevious={onPrevious}
          onNext={onNext}
          previousDisabled={true}
          showPrevious={false}
          showNext={true}
        />
      </div>
    </>
  )
}
