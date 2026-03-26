import { Lightbulb } from 'lucide-react'
import { ExportButtons, SharePanel } from '@/components/builder'

interface ReviewExportProps {
  onExport: (format: 'pdf' | 'word' | 'text') => void
  resumeId: string | null
}

export function ReviewExport({ onExport, resumeId }: ReviewExportProps) {
  return (
      <div className="flex flex-col gap-8 bg-secondary-bg/50 p-6 md:p-8 rounded-xl border border-border-color/30">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Review & Export</h1>
          <p className="text-text-subtle text-base font-normal leading-normal">
            Review your resume and export it in your preferred format.
          </p>
        </div>

        {/* Export Format Section */}
        <div className="flex flex-col gap-4 pt-6 border-t border-border-color/30">
          <h2 className="text-xl sm:text-2xl font-bold text-text-main">Export Format</h2>
          <ExportButtons onExport={onExport} />
        </div>

        {/* Share Section */}
        <div className="flex flex-col gap-4 pt-6 border-t border-border-color/30">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-main">Share Your Resume</h2>
            <p className="text-text-subtle text-sm mt-1">
              Create a public link anyone can view — no login required.
            </p>
          </div>
          <SharePanel resumeId={resumeId} />
        </div>

        {/* Pro Tip */}
        <div className="bg-highlight/30 rounded-lg border border-border-color/30 p-4 flex gap-3">
          <Lightbulb className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm text-text-main">
            <strong>Pro Tip:</strong> Tailor your resume for each job application by adjusting your
            summary and skills.
          </p>
        </div>

      </div>
  )
}
