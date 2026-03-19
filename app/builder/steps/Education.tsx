import { useAtom } from 'jotai'
import { EducationCard, NavigationButtons, StepProgress } from '@/components/builder'
import { type Education, resumeDataAtom, setResumeDataAtom } from '@/stores/builder'

interface EducationProps {
  onNext: () => void
  onPrevious: () => void
}

export function EducationStep({ onNext, onPrevious }: EducationProps) {
  const [resumeData] = useAtom(resumeDataAtom)
  const [, setResumeDataPartial] = useAtom(setResumeDataAtom)

  const handleAddEducation = () => {
    const newEducation: Education = {
      id: crypto.randomUUID(),
      degree: '',
      fieldOfStudy: '',
      school: '',
      startDate: new Date(),
      endDate: null,
      gpa: '',
      resumeId: '',
    }
    setResumeDataPartial({
      education: [...resumeData.education, newEducation],
    })
  }

  const handleRemoveEducation = (id: string) => {
    setResumeDataPartial({
      education: resumeData.education.filter((edu) => edu.id !== id),
    })
  }

  const handleUpdateEducation = (id: string, field: keyof Education, value: any) => {
    setResumeDataPartial({
      education: resumeData.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu,
      ),
    })
  }

  return (
    <>
      <StepProgress currentStep={5} totalSteps={7} stepLabel="Education" />
      <div className="flex flex-col gap-8 bg-secondary-bg/50 p-6 md:p-8 rounded-xl border border-border-color/30">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">Education</h1>
          <p className="text-text-subtle text-base font-normal leading-normal">
            Add your educational background, including degrees, certifications, and relevant
            coursework.
          </p>
        </div>

        {/* Education Cards */}
        <div className="flex flex-col gap-6">
          {resumeData.education.map((education, index) => (
            <EducationCard
              key={education.id}
              education={education}
              index={index}
              onUpdate={(field, value) => handleUpdateEducation(education.id, field, value)}
              onDelete={() => handleRemoveEducation(education.id)}
            />
          ))}

          {/* Add another education button */}
          <button
            type="button"
            onClick={handleAddEducation}
            className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-border-color bg-border-color/20 hover:bg-border-color/40 rounded-lg transition-colors"
          >
            <span className="material-symbols-rounded">add</span>
            <span className="text-base font-bold text-text-main">Add another education</span>
          </button>
        </div>

        {/* Navigation Buttons */}
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
