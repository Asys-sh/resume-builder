import { useAtom } from 'jotai'
import { useState } from 'react'
import { ExperienceCard, NavigationButtons, SkillTag, StepProgress } from '@/components/builder'
import { Combobox } from '@/components/ui/combobox'
import { skills } from '@/lib/arrays'
import { type Experience, resumeDataAtom, type Skill, setResumeDataAtom } from '@/stores/builder'

interface ExperienceSkillsProps {
  onNext: () => void
  onPrevious: () => void
}

export function ExperienceSkills({ onNext, onPrevious }: ExperienceSkillsProps) {
  const [resumeData] = useAtom(resumeDataAtom)
  const [, setResumeDataPartial] = useAtom(setResumeDataAtom)
  const [skillInput, setSkillInput] = useState('')

  // Experience handlers
  const handleAddExperience = () => {
    const newExperience: Experience = {
      id: crypto.randomUUID(),
      role: '',
      company: '',
      location: '',
      startDate: new Date(),
      endDate: null,
      description: '',
      resumeId: '', // Will be set when saving or we might need to make it optional in store type if not strictly typed against Prisma yet?
      // Wait, Prisma type has resumeId. But in store we might not have it yet.
      // The store interface extends Prisma type.
      // If I look at builder.ts, I am using Prisma.Experience directly.
      // Prisma.Experience has resumeId: string.
      // This might be an issue if we don't have a resumeId yet.
      // But for now let's just put empty string or make it optional in a local type if needed.
      // Actually, let's check builder.ts again. I am exporting Experience = Prisma.Experience.
      // So it requires resumeId.
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setResumeDataPartial({
      experiences: [...resumeData.experiences, newExperience],
    })
  }

  const handleRemoveExperience = (id: string) => {
    setResumeDataPartial({
      experiences: resumeData.experiences.filter((exp) => exp.id !== id),
    })
  }

  const handleUpdateExperience = (id: string, field: keyof Experience, value: any) => {
    setResumeDataPartial({
      experiences: resumeData.experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp,
      ),
    })
  }

  // Skills handlers
  const handleAddSkill = (skillName?: string) => {
    const nameToAdd = skillName || skillInput
    if (!nameToAdd.trim()) return
    if (resumeData.skills.some((s) => s.name.toLowerCase() === nameToAdd.trim().toLowerCase()))
      return

    const newSkill: Skill = {
      id: crypto.randomUUID(),
      name: nameToAdd.trim(),
      level: null,
      resumeId: '',
    }
    setResumeDataPartial({
      skills: [...resumeData.skills, newSkill],
    })
    setSkillInput('')
  }

  const handleRemoveSkill = (id: string) => {
    setResumeDataPartial({
      skills: resumeData.skills.filter((skill) => skill.id !== id),
    })
  }

  return (
    <>
      <StepProgress currentStep={3} totalSteps={7} stepLabel="Experience & Skills" />
      <div className="flex flex-col gap-8 bg-secondary-bg/50 p-6 md:p-8 rounded-xl border border-border-color/30">
        {/* Work Experience Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">
              Work Experience
            </h1>
            <p className="text-text-subtle text-base font-normal leading-normal">
              Share your relevant work history. Start with your most recent job.
            </p>
          </div>

          {/* Experience Cards */}
          <div className="flex flex-col gap-6">
            {resumeData.experiences.map((experience, index) => (
              <ExperienceCard
                key={experience.id}
                experience={experience}
                index={index}
                onUpdate={(field, value) => handleUpdateExperience(experience.id, field, value)}
                onDelete={() => handleRemoveExperience(experience.id)}
              />
            ))}

            {/* Add Experience Button */}
            <button
              type="button"
              onClick={handleAddExperience}
              className="flex items-center justify-center gap-2 p-5 border-2 border-dashed border-border-color/50 rounded-xl text-text-subtle hover:border-primary hover:text-primary hover:bg-primary/5 active:scale-[0.99] transition-all"
            >
              <span className="material-symbols-outlined !text-xl">add_circle</span>
              <span className="font-semibold text-sm">Add another experience</span>
            </button>
          </div>
        </div>

        {/* Skills Section */}
        <div className="pt-8 border-t border-border-color/30 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold">Skills</h2>
            <p className="text-text-subtle text-base font-normal leading-normal">
              Highlight your key skills.
            </p>
          </div>

          {/* Existing Skills */}
          {resumeData.skills.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {resumeData.skills.map((skill) => (
                <SkillTag
                  key={skill.id}
                  skill={skill}
                  onRemove={() => handleRemoveSkill(skill.id)}
                />
              ))}
            </div>
          )}

          {/* Add Skill Input */}
          <div className="flex items-end gap-4">
            <div className="flex-1 relative flex flex-col gap-2">
              <span className="text-base font-medium text-text-main">Add a skill</span>
              <Combobox
                value={skillInput}
                onSelect={(value) => {
                  setSkillInput(value)
                  handleAddSkill(value)
                }}
                placeholder="e.g., UI/UX Design"
                searchPlaceholder="Search skills..."
                staticOptions={skills}
              />
            </div>
            <button
              type="button"
              onClick={() => handleAddSkill()}
              className="h-10 px-6 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Add
            </button>
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
