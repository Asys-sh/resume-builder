import { useAtom } from 'jotai'
import { Plus } from 'lucide-react'
import {
  LanguageInput,
  ProjectCard,
} from '@/components/builder'
import {
  type Language,
  type Project,
  resumeDataAtom,
  setResumeDataAtom,
} from '@/stores/builder'

export function ProjectsExtras() {
  const [resumeData] = useAtom(resumeDataAtom)
  const [, setResumeDataPartial] = useAtom(setResumeDataAtom)

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

  // Language handlers
  const handleAddLanguage = (name: string, proficiency: string) => {
    const newLanguage: Language = {
      id: crypto.randomUUID(),
      name,
      proficiency,
      resumeId: '',
    }
    setResumeDataPartial({
      languages: [...resumeData.languages, newLanguage],
    })
  }

  const handleRemoveLanguage = (id: string) => {
    setResumeDataPartial({
      languages: resumeData.languages.filter((lang) => lang.id !== id),
    })
  }

  const handleUpdateProficiency = (id: string, proficiency: string) => {
    setResumeDataPartial({
      languages: resumeData.languages.map((lang) =>
        lang.id === id ? { ...lang, proficiency } : lang,
      ),
    })
  }

  return (
      <div className="flex flex-col gap-8 bg-secondary-bg/50 p-6 md:p-8 rounded-xl border border-border-color/30">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
            Projects & Languages
          </h1>
          <p className="text-text-subtle text-base font-normal leading-normal">
            Showcase side projects and the languages you speak.
          </p>
        </div>

        {/* Projects Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-text-main">Projects</h2>
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
            className="flex items-center justify-center p-4 bg-white/30 border-2 border-dashed border-border-color/50 rounded-lg text-text-subtle hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Languages Section */}
        <div className="flex flex-col gap-4 pt-6 border-t border-border-color/30">
          <h2 className="text-xl sm:text-2xl font-bold text-text-main">Languages</h2>
          <LanguageInput
            languages={resumeData.languages}
            onAdd={handleAddLanguage}
            onRemove={handleRemoveLanguage}
            onUpdateProficiency={handleUpdateProficiency}
          />
        </div>

      </div>
  )
}
