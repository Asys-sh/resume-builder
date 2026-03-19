import { useAtom } from 'jotai'
import { useState } from 'react'
import {
  BuilderFormField,
  BuilderSelect,
  CertificationTag,
  LanguageTag,
  NavigationButtons,
  ProjectCard,
  StepProgress,
} from '@/components/builder'
import { Combobox } from '@/components/ui/combobox'
import { languages } from '@/lib/arrays'
import {
  type Certification,
  type Language,
  type Project,
  resumeDataAtom,
  setResumeDataAtom,
} from '@/stores/builder'

interface ProjectsExtrasProps {
  onNext: () => void
  onPrevious: () => void
}

export function ProjectsExtras({ onNext, onPrevious }: ProjectsExtrasProps) {
  const [resumeData] = useAtom(resumeDataAtom)
  const [, setResumeDataPartial] = useAtom(setResumeDataAtom)
  const [certificationInput, setCertificationInput] = useState('')
  const [languageInput, setLanguageInput] = useState('')
  const [languageProficiency, setLanguageProficiency] = useState('Native')

  // Project handlers
  // Project handlers
  const handleAddProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: '',
      link: '',
      description: '',
      technologies: '',
      startDate: null,
      endDate: null,
      resumeId: '',
    }
    setResumeDataPartial({
      projects: [...resumeData.projects, newProject],
    })
  }

  const handleRemoveProject = (id: string) => {
    setResumeDataPartial({
      projects: resumeData.projects.filter((project) => project.id !== id),
    })
  }

  const handleUpdateProject = (id: string, field: keyof Project, value: any) => {
    setResumeDataPartial({
      projects: resumeData.projects.map((project) =>
        project.id === id ? { ...project, [field]: value } : project,
      ),
    })
  }

  // Certification handlers
  const handleAddCertification = () => {
    if (!certificationInput.trim()) return

    const newCertification: Certification = {
      id: crypto.randomUUID(),
      name: certificationInput.trim(),
      issuer: '',
      date: '',
      resumeId: '',
    }
    setResumeDataPartial({
      certifications: [...resumeData.certifications, newCertification],
    })
    setCertificationInput('')
  }

  const handleRemoveCertification = (id: string) => {
    setResumeDataPartial({
      certifications: resumeData.certifications.filter((cert) => cert.id !== id),
    })
  }

  // Language handlers
  const handleAddLanguage = () => {
    const nameToAdd = languageInput.trim()
    if (!nameToAdd) return
    if (resumeData.languages.some((l) => l.name.toLowerCase() === nameToAdd.toLowerCase())) return

    const newLanguage: Language = {
      id: crypto.randomUUID(),
      name: nameToAdd,
      proficiency: languageProficiency,
      resumeId: '',
    }
    setResumeDataPartial({
      languages: [...resumeData.languages, newLanguage],
    })
    setLanguageInput('')
    setLanguageProficiency('Native')
  }

  const handleRemoveLanguage = (id: string) => {
    setResumeDataPartial({
      languages: resumeData.languages.filter((lang) => lang.id !== id),
    })
  }

  return (
    <>
      <StepProgress currentStep={6} totalSteps={7} stepLabel="Projects & Extras" />
      <div className="flex flex-col gap-8 bg-secondary-bg/50 p-6 md:p-8 rounded-xl border border-border-color/30">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">
            Projects & Extras
          </h1>
          <p className="text-text-subtle text-base font-normal leading-normal">
            Showcase your projects, certifications, and languages to stand out from the crowd.
          </p>
        </div>

        {/* Projects Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-text-main">Projects</h2>
          <div className="space-y-4">
            {resumeData.projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onUpdate={(field, value) => handleUpdateProject(project.id, field, value)}
                onDelete={() => handleRemoveProject(project.id)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddProject}
            className="flex items-center justify-center gap-2 p-4 bg-white/30 border-2 border-dashed border-border-color/50 rounded-lg text-text-subtle hover:border-primary hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Add another project</span>
          </button>
        </div>

        {/* Certifications Section */}
        <div className="flex flex-col gap-4 pt-6 border-t border-border-color/30">
          <h2 className="text-2xl font-bold text-text-main">Certifications</h2>
          {resumeData.certifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {resumeData.certifications.map((cert) => (
                <CertificationTag
                  key={cert.id}
                  certification={cert}
                  onRemove={() => handleRemoveCertification(cert.id)}
                />
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <BuilderFormField
              id="certificationInput"
              name="certificationInput"
              label=""
              value={certificationInput}
              onChange={(e) => setCertificationInput(e.target.value)}
              placeholder="E.g., AWS Certified Solutions Architect"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCertification()
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddCertification}
              className="mt-auto h-12 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Languages Section */}
        <div className="flex flex-col gap-4 pt-6 border-t border-border-color/30">
          <h2 className="text-2xl font-bold text-text-main">Languages</h2>
          {resumeData.languages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {resumeData.languages.map((lang) => (
                <LanguageTag
                  key={lang.id}
                  language={lang}
                  onRemove={() => handleRemoveLanguage(lang.id)}
                />
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Combobox
              value={languageInput}
              onSelect={(value) => {
                setLanguageInput(value)
              }}
              placeholder="Select or type a language"
              searchPlaceholder="Search languages..."
              staticOptions={languages}
            />
            <div className="flex gap-2">
              <BuilderSelect
                id="languageProficiency"
                label=""
                className="h-10"
                value={languageProficiency}
                onValueChange={setLanguageProficiency}
                options={[
                  { value: 'Native', label: 'Native' },
                  { value: 'Fluent', label: 'Fluent' },
                  { value: 'Conversational', label: 'Conversational' },
                  { value: 'Basic', label: 'Basic' },
                ]}
              />
              <button
                type="button"
                onClick={handleAddLanguage}
                className="mt-auto h-12 px-6 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                Add
              </button>
            </div>
          </div>
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
