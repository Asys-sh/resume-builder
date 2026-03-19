import { ExportButtons, NavigationButtons, StepProgress } from '@/components/builder'

interface ReviewExportProps {
  onPrevious: () => void
  onExport: (format: 'pdf' | 'word' | 'text') => void
}

export function ReviewExport({ onPrevious, onExport }: ReviewExportProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <StepProgress currentStep={7} totalSteps={7} stepLabel="Review & Export" />
        <span className="text-primary text-base font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">check_circle</span>
          Complete!
        </span>
      </div>
      <div className="flex flex-col gap-8 bg-secondary-bg/50 p-6 md:p-8 rounded-xl border border-border-color/30">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">Review & Export</h1>
          <p className="text-text-subtle text-base font-normal leading-normal">
            Review your resume and export it in your preferred format.
          </p>
        </div>

        {/* Export Format Section */}
        <div className="flex flex-col gap-4 pt-6 border-t border-border-color/30">
          <h2 className="text-2xl font-bold text-text-main">Export Format</h2>
          <ExportButtons onExport={onExport} />
        </div>

        {/* Pro Tip */}
        <div className="bg-highlight/30 rounded-lg border border-border-color/30 p-4 flex gap-3">
          <span className="material-symbols-rounded text-primary">lightbulb</span>
          <p className="text-sm text-text-main">
            <strong>Pro Tip:</strong> Tailor your resume for each job application by adjusting your
            summary and skills.
          </p>
        </div>

        <NavigationButtons
          onPrevious={onPrevious}
          onNext={() => {}} // No next step
          previousDisabled={false}
          showPrevious={true}
          showNext={false}
        />
      </div>
    </>
  )
}
