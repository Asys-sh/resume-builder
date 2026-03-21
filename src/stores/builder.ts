import type {
  Certification,
  CoverLetter,
  Education,
  Experience,
  Language,
  Prisma,
  Project,
  Skill,
} from '@prisma-generated/client'
import { atom } from 'jotai'

// Re-export types for convenience
export type { Certification, Education, Experience, Language, Project, Skill }

export type ContactInfo = Prisma.JsonObject

export type Award = {
  id: string
  name: string
  issuer: string
  date: string
}

export interface ResumeData {
  id?: string
  title: string
  contactInfo: {
    fullName: string
    headline: string
    email: string
    phone: string
    address: string
    links: Array<{ label: string; url: string }>
  }
  experiences: Experience[]
  skills: Skill[]
  summary: string
  education: Education[]
  projects: Project[]
  certifications: Certification[]
  awards: Award[]
  languages: Language[]
  currentStep: number
  /** Template ID from TEMPLATES array (e.g., 'modern', 'classic', 'minimalist', 'creative') */
  selectedTemplate: string
  coverLetter?: CoverLetter
}

/** Initial empty state for resume data */
export const initialResumeData: ResumeData = {
  title: 'Untitled Resume',
  contactInfo: {
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    address: '',
    links: [],
  },
  experiences: [],
  skills: [],
  summary: '',
  education: [],
  projects: [],
  certifications: [],
  awards: [],
  languages: [],
  currentStep: 1,
  selectedTemplate: 'modern',
  coverLetter: undefined,
}

/** Resume data atom - in-memory only, no persistence */
export const resumeDataAtom = atom<ResumeData>(initialResumeData)

/** Setter atom for partial updates. Nested objects/arrays must be passed completely to avoid data loss. */
export const setResumeDataAtom = atom(null, (get, set, update: Partial<ResumeData>) => {
  set(resumeDataAtom, {
    ...get(resumeDataAtom),
    ...update,
  })
})

export const currentStepAtom = atom((get) => get(resumeDataAtom).currentStep)

/** Setter atom for currentStep. Clamps value to range [1, 7]. */
export const setCurrentStepAtom = atom(null, (get, set, step: number) => {
  const clampedStep = Math.max(1, Math.min(7, step))
  set(resumeDataAtom, {
    ...get(resumeDataAtom),
    currentStep: clampedStep,
  })
})

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/** Validates contact info: requires fullName and valid email */
export function validateContactInfo(contactInfo: ResumeData['contactInfo']): ValidationResult {
  const errors: string[] = []

  if (!contactInfo.fullName || contactInfo.fullName.trim() === '') {
    errors.push('Full name is required')
  }

  if (!contactInfo.email || contactInfo.email.trim() === '') {
    errors.push('Email is required')
  } else {
    // Basic email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactInfo.email)) {
      errors.push('Please enter a valid email address')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/** Validates work experience: requires at least one entry with all required fields */
export function validateExperience(experiences: Experience[]): ValidationResult {
  const errors: string[] = []

  if (experiences.length === 0) {
    errors.push('Please add at least one work experience')
    return { isValid: false, errors }
  }

  experiences.forEach((exp, index) => {
    if (!exp.role || exp.role.trim() === '') {
      errors.push(`Experience ${index + 1}: Job title is required`)
    }
    if (!exp.company || exp.company.trim() === '') {
      errors.push(`Experience ${index + 1}: Company name is required`)
    }
    if (!exp.startDate) {
      errors.push(`Experience ${index + 1}: Start date is required`)
    }
    // Description is optional in Prisma schema but we might want to enforce it in UI
    // if (!exp.description || exp.description.trim() === '') {
    // 	errors.push(`Experience ${index + 1}: Job description is required`)
    // }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/** Validates skills: requires at least 3 skills */
export function validateSkills(skills: Skill[]): ValidationResult {
  const errors: string[] = []

  if (skills.length < 3) {
    errors.push('Please add at least 3 skills to showcase your expertise')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/** Validates professional summary: requires at least 50 characters */
export function validateSummary(summary: string | null): ValidationResult {
  const errors: string[] = []

  if (!summary || summary.trim().length < 50) {
    errors.push('Please write at least 50 characters for your professional summary')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/** Validates education: optional section, but if present all required fields must be filled */
export function validateEducation(education: Education[]): ValidationResult {
  const errors: string[] = []

  // Education is optional, so empty array is valid
  if (education.length === 0) {
    return { isValid: true, errors: [] }
  }

  // If education entries exist, validate required fields
  education.forEach((edu, index) => {
    if (!edu.degree || edu.degree.trim() === '') {
      errors.push(`Education ${index + 1}: Degree is required`)
    }
    if (!edu.school || edu.school.trim() === '') {
      errors.push(`Education ${index + 1}: School is required`)
    }
    if (!edu.startDate) {
      errors.push(`Education ${index + 1}: Start date is required`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/** Validates projects: all optional, always returns valid */
export function validateProjects(_projects: Project[]): ValidationResult {
  return {
    isValid: true,
    errors: [],
  }
}

/** Validates template selection: requires non-empty template ID */
export function validateTemplate(selectedTemplate: string | null): ValidationResult {
  if (!selectedTemplate || selectedTemplate.trim() === '') {
    return {
      isValid: false,
      errors: ['Please select a template to proceed'],
    }
  }
  return {
    isValid: true,
    errors: [],
  }
}

/** Routes to appropriate validator based on step number */
export function validateStep(step: number, data: ResumeData): ValidationResult {
  switch (step) {
    case 1:
      return validateContactInfo(data.contactInfo)
    case 2: {
      // Step 2 combines experience and skills validation
      const expValidation = validateExperience(data.experiences)
      const skillsValidation = validateSkills(data.skills)

      const combinedErrors = [...expValidation.errors, ...skillsValidation.errors]

      return {
        isValid: expValidation.isValid && skillsValidation.isValid,
        errors: combinedErrors,
      }
    }
    case 3:
      return validateSummary(data.summary)
    case 4:
      return validateEducation(data.education)
    case 5:
      return validateProjects(data.projects)
    case 6:
      // Target Job & Cover Letter step - optional
      return { isValid: true, errors: [] }
    case 7:
      // Review step doesn't need validation
      return { isValid: true, errors: [] }
    default:
      return { isValid: true, errors: [] }
  }
}
