'use client'

import { useAtomValue } from 'jotai'
import { resumeDataAtom } from '@/stores/builder'
import { scoreResume } from '@/lib/resume-scorer'

export function useResumeScore() {
  const resumeData = useAtomValue(resumeDataAtom)
  return scoreResume(resumeData)
}
