'use client'

import { useAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AuthDialog } from '@/components/AuthDialog'
import { ResumePreview } from '@/components/builder'
import { useDebounce } from '@/hooks/use-debounce'
import {
  currentStepAtom,
  initialResumeData,
  resumeDataAtom,
  setCurrentStepAtom,
  setResumeDataAtom,
  validateStep,
} from '@/stores/builder'
import { userAtom } from '@/stores/user'
import { BuilderHeader } from './BuilderHeader'
import { ContactInfo } from './steps/ContactInfo'
import { EducationStep } from './steps/Education'
import { ExperienceSkills } from './steps/ExperienceSkills'
import { ProfessionalSummary } from './steps/ProfessionalSummary'
import { ProjectsExtras } from './steps/ProjectsExtras'
import { ReviewExport } from './steps/ReviewExport'
import { TargetJob } from './steps/TargetJob'
import { TemplateSelection } from './steps/TemplateSelection'

export default function BuilderPage() {
  const [resumeData] = useAtom(resumeDataAtom)
  const [, setResumeDataPartial] = useAtom(setResumeDataAtom)
  const [currentStep] = useAtom(currentStepAtom)
  const [, setCurrentStep] = useAtom(setCurrentStepAtom)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [resumeId, setResumeId] = useState<string | null>(null)
  const resumeIdRef = useRef<string | null>(null)
  const isSavingRef = useRef(false)
  const [user] = useAtom(userAtom)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const debouncedResumeData = useDebounce(resumeData, 2000)
  const isFirstRender = useRef(true)

  // Initialize resumeId from URL on mount (single source of truth)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search)
    const resumeIdParam = urlSearchParams.get('resumeId')
    if (resumeIdParam && resumeIdParam !== 'new') {
      resumeIdRef.current = resumeIdParam
      setResumeId(resumeIdParam)
    } else {
      // Reset state for new resume
      setResumeDataPartial(initialResumeData)
      setCurrentStep(1)
    }
  }, [])

  // Fetch resume data when resumeId is set
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — resumeIdRef avoids stale closure
  useEffect(() => {
    if (resumeId && user) {
      const controller = new AbortController()

      const fetchResume = async () => {
        try {
          const res = await fetch('/api/resumes?resumeId=' + resumeId, {
            signal: controller.signal,
          })
          if (res.ok) {
            const data = await res.json()
            setResumeDataPartial(data)
          }
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.error('Failed to fetch resume:', err)
            toast.error('Failed to load resume. Please refresh the page.')
          }
        }
      }

      fetchResume()
      return () => controller.abort()
    }
  }, [resumeId, user])

  const handleNext = () => {
    // Validate current step before proceeding
    const validation = validateStep(currentStep, resumeData)

    if (!validation.isValid) {
      // Show validation errors and prevent step change
      setValidationErrors(validation.errors)
      return
    }

    // Clear errors and proceed to next step
    setValidationErrors([])
    setCurrentStep(currentStep + 1)

    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrevious = () => {
    // Clear validation errors when going back
    setValidationErrors([])
    setCurrentStep(currentStep - 1)

    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveResume = async (silent = false) => {
    if (!user) {
      if (!silent) setShowAuthModal(true)
      return
    }

    // Prevent concurrent saves — if one is already in-flight, skip
    if (isSavingRef.current) return
    isSavingRef.current = true
    setIsSaving(true)

    // Read from ref so we always get the latest ID even across concurrent calls
    const currentResumeId = resumeIdRef.current

    try {
      const response = await fetch('/api/resumes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: currentResumeId,
          data: resumeData,
          title: resumeData.contactInfo.fullName || 'Untitled Resume',
          template: resumeData.selectedTemplate,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save')
      }

      const result = await response.json()
      if (result.success) {
        // Update ref immediately (synchronous) so any save triggered right
        // after this will use the correct ID without waiting for a re-render
        resumeIdRef.current = result.resumeId
        setResumeId(result.resumeId)
        setLastSaved(new Date())
        if (!silent) {
          toast.success('Resume saved!')
        }
      }
    } catch (error) {
      console.error('Save error:', error)
      if (!silent) toast.error('Failed to save resume. Please try again.')
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }

  const handleSave = () => {
    saveResume(false)
  }

  // Auto-save effect — fires 2s after the user stops typing
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — stable refs excluded
  useEffect(() => {
    // Skip the very first render so we don't save stale initial state on mount
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (user) {
      saveResume(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedResumeData])

  const handleDownload = async (format: 'pdf' | 'word' | 'text' = 'pdf') => {
    if (format === 'pdf') {
      try {
        // Dynamically import to avoid SSR issues with @react-pdf/renderer
        const { pdf } = await import('@react-pdf/renderer')
        const { ResumePDF } = await import('@/components/pdf/ResumePDF')

        const blob = await pdf(<ResumePDF data={resumeData} />).toBlob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `resume-${resumeData.contactInfo.fullName.replace(/\s+/g, '-').toLowerCase() || 'draft'}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error generating PDF:', error)
        toast.error('Failed to generate PDF. Please try again.')
      }
    } else if (format === 'word') {
      try {
        const { generateDocx } = await import('@/lib/docx-generator')
        await generateDocx(resumeData)
      } catch (error) {
        console.error('Error generating Word document:', error)
        toast.error('Failed to generate Word document. Please try again.')
      }
    } else {
      toast.info('Text export coming soon!')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light">
      <BuilderHeader
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={handleSave}
        onDownload={handleDownload}
        userInitials={
          user?.name
            ?.split(' ')
            .map((w) => w[0].toUpperCase())
            .join('') ?? '?'
        }
      />
      <AuthDialog open={showAuthModal} onOpenChange={setShowAuthModal} />

      {/* Main Content */}
      <main className="flex-grow w-full max-w-screen-2xl mx-auto px-6 md:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12">
          {/* Left Column - Form */}
          <div className="flex flex-col gap-8">
            {/* Validation Errors Display */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 text-red-600">
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-900 font-bold text-lg mb-2">
                      Please fix the following errors:
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: validation errors have no stable id
                        <li key={index} className="text-red-800 text-sm">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <TemplateSelection onNext={handleNext} onPrevious={handlePrevious} />
            )}
            {currentStep === 2 && <ContactInfo onNext={handleNext} onPrevious={handlePrevious} />}
            {currentStep === 3 && (
              <ExperienceSkills onNext={handleNext} onPrevious={handlePrevious} />
            )}
            {currentStep === 4 && (
              <ProfessionalSummary onNext={handleNext} onPrevious={handlePrevious} />
            )}
            {currentStep === 5 && <EducationStep onNext={handleNext} onPrevious={handlePrevious} />}
            {currentStep === 6 && (
              <ProjectsExtras onNext={handleNext} onPrevious={handlePrevious} />
            )}
            {currentStep === 7 && <TargetJob onNext={handleNext} onBack={handlePrevious} />}
            {currentStep === 8 && (
              <ReviewExport onPrevious={handlePrevious} onExport={handleDownload} />
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="hidden lg:block sticky top-24 h-[calc(100vh-8rem)]">
            <ResumePreview />
          </div>
        </div>
      </main>
    </div>
  )
}
