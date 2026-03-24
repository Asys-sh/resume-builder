'use client'

import { FileDown, FileText, FileType } from 'lucide-react'

interface ExportButtonsProps {
  onExport: (format: 'pdf' | 'word' | 'text') => void
}

export function ExportButtons({ onExport }: ExportButtonsProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* PDF Button - Primary */}
      <button
        type="button"
        onClick={() => onExport('pdf')}
        className="h-14 px-6 rounded-lg font-bold transition-colors bg-primary text-white hover:bg-primary/90 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <FileDown className="size-6" />
          <span>Download as PDF</span>
        </div>
        <span className="bg-white/20 px-3 py-1 rounded text-sm">Recommended</span>
      </button>

      {/* Word Button */}
      <button
        type="button"
        onClick={() => onExport('word')}
        className="h-14 px-6 rounded-lg font-bold transition-colors bg-border-color/60 text-text-main hover:bg-border-color/80 flex items-center gap-3"
      >
        <FileText className="size-6" />
        <span>Download as Word (.docx)</span>
      </button>

      {/* Plain Text Button */}
      <button
        type="button"
        onClick={() => onExport('text')}
        className="h-14 px-6 rounded-lg font-bold transition-colors bg-border-color/60 text-text-main hover:bg-border-color/80 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <FileType className="size-6" />
          <span>Download as Plain Text</span>
        </div>
        <span className="text-xs text-text-subtle">ATS-friendly</span>
      </button>
    </div>
  )
}
