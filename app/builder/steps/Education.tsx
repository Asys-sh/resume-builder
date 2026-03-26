import { useAtom } from 'jotai'
import { Plus } from 'lucide-react'
import { CertificationCard, EducationCard } from '@/components/builder'
import {
  type Certification,
  type Education,
  resumeDataAtom,
  setResumeDataAtom,
} from '@/stores/builder'

export function EducationStep() {
  const [resumeData] = useAtom(resumeDataAtom)
  const [, setResumeDataPartial] = useAtom(setResumeDataAtom)

  // Education handlers
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

  // Certification handlers
  const handleAddCertification = () => {
    const newCert: Certification = {
      id: crypto.randomUUID(),
      name: '',
      issuer: '',
      date: '',
      resumeId: '',
    }
    setResumeDataPartial({
      certifications: [...resumeData.certifications, newCert],
    })
  }

  const handleRemoveCertification = (id: string) => {
    setResumeDataPartial({
      certifications: resumeData.certifications.filter((cert) => cert.id !== id),
    })
  }

  const handleUpdateCertification = (id: string, field: keyof Certification, value: string) => {
    setResumeDataPartial({
      certifications: resumeData.certifications.map((cert) =>
        cert.id === id ? { ...cert, [field]: value } : cert,
      ),
    })
  }

  return (
      <div className="flex flex-col gap-8 bg-secondary-bg/50 p-6 md:p-8 rounded-xl border border-border-color/30">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">
            Education & Certifications
          </h1>
          <p className="text-text-subtle text-base font-normal leading-normal">
            Add your degrees, schools, and any professional certifications.
          </p>
        </div>

        {/* Education Cards */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-text-main">Education</h2>
          <div className="flex flex-col gap-4">
            {resumeData.education.map((education, index) => (
              <EducationCard
                key={education.id}
                education={education}
                index={index}
                onUpdate={(field, value) => handleUpdateEducation(education.id, field, value)}
                onDelete={() => handleRemoveEducation(education.id)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddEducation}
            className="flex items-center justify-center p-4 border-2 border-dashed border-border-color/50 bg-white/30 rounded-lg text-text-subtle hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Certifications */}
        <div className="flex flex-col gap-4 pt-6 border-t border-border-color/30">
          <h2 className="text-2xl font-bold text-text-main">Certifications</h2>
          <div className="flex flex-col gap-4">
            {resumeData.certifications.map((cert, index) => (
              <CertificationCard
                key={cert.id}
                certification={cert}
                index={index}
                onUpdate={(field, value) => handleUpdateCertification(cert.id, field, value)}
                onDelete={() => handleRemoveCertification(cert.id)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddCertification}
            className="flex items-center justify-center p-4 border-2 border-dashed border-border-color/50 bg-white/30 rounded-lg text-text-subtle hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

      </div>
  )
}
