'use client'

import { useAtom } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AuthDialog } from '@/components/AuthDialog'
import { NavigationButtons, ResumePreview, StepProgress } from '@/components/builder'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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

const STEP_LABELS = [
  'Contact Info',
  'Experience & Skills',
  'Professional Summary',
  'Education & Certifications',
  'Projects & Languages',
  'Target Job',
  'Review & Export',
]

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
  const [, setLastSaved] = useState<Date | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPreviewSheet, setShowPreviewSheet] = useState(false)
  const formPaneRef = useRef<HTMLDivElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const debouncedResumeData = useDebounce(resumeData, 2000)
  // Snapshot of the last data that was successfully saved or loaded from the server.
  // Auto-save compares against this — if nothing changed, the save is skipped.
  // This is robust against React Strict Mode double-invoking effects (unlike boolean flags).
  const lastSyncedSnapshot = useRef(JSON.stringify(initialResumeData))

  // Check if the form pane has more content below the fold
  const checkScroll = useCallback(() => {
    const el = formPaneRef.current
    if (!el) return
    const threshold = 8 // px tolerance
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > threshold)
  }, [])

  // Re-check on step change and after content settles
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — recheck when step changes
  useEffect(() => {
    checkScroll()
    // Re-check after a short delay to account for content rendering
    const timer = setTimeout(checkScroll, 150)
    return () => clearTimeout(timer)
  }, [currentStep, checkScroll])

  // Attach scroll listener to the form pane
  useEffect(() => {
    const el = formPaneRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    return () => el.removeEventListener('scroll', checkScroll)
  }, [checkScroll])

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
      // Snapshot matches the blank state — auto-save will skip until the user edits something
      lastSyncedSnapshot.current = JSON.stringify(initialResumeData)
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
            // Mark the loaded state as "already synced" so auto-save doesn't echo it back
            lastSyncedSnapshot.current = JSON.stringify({ ...initialResumeData, ...data })
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
    const validation = validateStep(currentStep, resumeData)

    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      // Scroll to top so the error banner is visible
      formPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setValidationErrors([])
    setCurrentStep(currentStep + 1)

    // Scroll form pane to top for better UX
    formPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

    // Focus the new step heading for accessibility
    setTimeout(() => {
      const heading = document.querySelector('h1')
      if (heading) {
        ;(heading as HTMLElement).focus()
      }
    }, 100)
  }

  const handlePrevious = () => {
    // Clear validation errors when going back
    setValidationErrors([])
    setCurrentStep(currentStep - 1)

    // Scroll form pane to top for better UX
    formPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

    // Focus the new step heading for accessibility
    setTimeout(() => {
      const heading = document.querySelector('h1')
      if (heading) {
        ;(heading as HTMLElement).focus()
      }
    }, 100)
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
      const response = await fetch('/api/resumes', {
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
        // Record what we just saved so the next auto-save comparison is accurate
        lastSyncedSnapshot.current = JSON.stringify(resumeData)
        if (silent) {
          toast('Saved', {
            duration: 1500,
            icon: '✓',
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
              fontSize: '13px',
              padding: '10px 14px',
              minHeight: 'unset',
            },
          })
        } else {
          toast.success('Resume saved!')
        }
      }
    } catch (error) {
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
    if (!user) return
    // Only save if something actually changed since the last save/load.
    // JSON.stringify on the debounced value is stable — it won't change unless
    // the user genuinely edited something. This is also immune to React Strict
    // Mode double-invoking the effect, because the snapshot comparison is
    // idempotent no matter how many times it runs.
    const snapshot = JSON.stringify(debouncedResumeData)
    if (snapshot === lastSyncedSnapshot.current) return
    saveResume(true)
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
        const pdfName = resumeData.contactInfo.fullName
          ? `${resumeData.contactInfo.fullName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_')}_Resume.pdf`
          : 'Resume.pdf'
        link.download = pdfName
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
    <div className="flex flex-col h-screen overflow-hidden bg-background-light">
      <BuilderHeader
        isSaving={isSaving}
        onSave={handleSave}
        onDownload={handleDownload}
        resumeId={resumeId}
      />
      <AuthDialog open={showAuthModal} onOpenChange={setShowAuthModal} />

      {/* Preview toggle for tablet/mobile (below xl) */}
      <button
        type="button"
        className="fixed bottom-24 sm:bottom-20 right-6 block xl:hidden z-30 bg-primary text-white px-5 py-3 rounded-full shadow-lg font-semibold text-sm"
        onClick={() => setShowPreviewSheet(true)}
      >
        Preview
      </button>

      {/* Preview Sheet for tablet/mobile */}
      <Sheet open={showPreviewSheet} onOpenChange={setShowPreviewSheet}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl flex flex-col p-0 bg-background-light">
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border-color/30">
            <SheetTitle className="text-base font-semibold pr-10">Preview</SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
            <ResumePreview />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <section className="flex-1 min-h-0 w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-4 overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-2 xl:gap-12 h-full overflow-hidden">
          {/* Left Column - Form */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            {/* Pinned: Step Progress */}
            <div className="shrink-0 mb-4">
              <StepProgress
                currentStep={currentStep}
                totalSteps={7}
                stepLabel={STEP_LABELS[currentStep - 1]}
              />
            </div>

            {/* Validation Errors (above scrollable area, always visible) */}
            {validationErrors.length > 0 && (
              <div className="shrink-0 mb-4 bg-red-50 border-2 border-red-300 rounded-xl p-4 md:p-6">
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

            {/* Scrollable form content */}
            <div className="relative flex-1 min-h-0">
              <div ref={formPaneRef} className="h-full overflow-y-auto scrollbar-none">
                {currentStep === 1 && <ContactInfo />}
                {currentStep === 2 && <ExperienceSkills />}
                {currentStep === 3 && <ProfessionalSummary />}
                {currentStep === 4 && <EducationStep />}
                {currentStep === 5 && <ProjectsExtras />}
                {currentStep === 6 && <TargetJob />}
                {currentStep === 7 && (
                  <ReviewExport onExport={handleDownload} resumeId={resumeId} />
                )}
              </div>
              {/* Scroll indicator fade */}
              <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background-light to-transparent transition-opacity duration-300"
                style={{ opacity: canScrollDown ? 1 : 0 }}
                aria-hidden="true"
              />
            </div>

            {/* Pinned: Navigation Buttons */}
            <div className="shrink-0 pt-3">
              <NavigationButtons
                onPrevious={handlePrevious}
                onNext={handleNext}
                showPrevious={currentStep > 1}
                showNext={currentStep < 7}
              />
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="hidden xl:flex xl:flex-col min-h-0 overflow-hidden">
            <ResumePreview />
          </div>
        </div>
      </section>
    </div>
  )
}
