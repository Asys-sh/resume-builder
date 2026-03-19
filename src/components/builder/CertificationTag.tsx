'use client'

import type { Certification } from '@/stores/builder'

interface CertificationTagProps {
  certification: Certification
  onRemove: () => void
}

export function CertificationTag({ certification, onRemove }: CertificationTagProps) {
  return (
    <span className="bg-highlight text-text-main rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2">
      {certification.name}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-red-500 transition-colors"
        aria-label="Remove certification"
      >
        <span className="material-symbols-outlined !text-base">close</span>
      </button>
    </span>
  )
}
