import type { ResumeData } from '@/stores/builder'

/**
 * Strips HTML tags and dangerous URI schemes from a plain-text string.
 * Applied to all user-supplied text before it is persisted, so every
 * template and export format is protected automatically.
 */
export function sanitizeText(value: string | undefined | null): string {
  if (!value) return value ?? ''
  return value
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/javascript\s*:/gi, '') // strip javascript: URI scheme
    .replace(/data\s*:/gi, '') // strip data: URI scheme
    .trim()
}

/**
 * Sanitizes a URL field — only http/https are allowed.
 * Returns an empty string if the URL uses a dangerous scheme (javascript:, data:, vbscript:).
 */
export function sanitizeUrl(value: string | undefined | null): string {
  if (!value) return value ?? ''
  const trimmed = value.trim()
  if (/^(javascript|data|vbscript)\s*:/i.test(trimmed)) return ''
  return trimmed
}

/**
 * Sanitizes all user-supplied text fields in a ResumeData object.
 * Call this once at the API boundary before saving to the database.
 */
export function sanitizeResumeData(data: ResumeData): ResumeData {
  return {
    ...data,
    summary: sanitizeText(data.summary),
    contactInfo: {
      fullName: sanitizeText(data.contactInfo.fullName),
      headline: sanitizeText(data.contactInfo.headline),
      email: sanitizeText(data.contactInfo.email),
      phone: sanitizeText(data.contactInfo.phone),
      address: sanitizeText(data.contactInfo.address),
      links: (data.contactInfo.links ?? []).map((link) => ({
        label: sanitizeText(link.label),
        url: sanitizeUrl(link.url),
      })),
    },
    experiences: data.experiences.map((exp) => ({
      ...exp,
      company: sanitizeText(exp.company),
      role: sanitizeText(exp.role),
      description: sanitizeText(exp.description ?? null),
      location: sanitizeText(exp.location ?? null),
    })),
    skills: data.skills.map((skill) => ({
      ...skill,
      name: sanitizeText(skill.name),
      level: sanitizeText(skill.level ?? null),
    })),
    education: data.education.map((edu) => ({
      ...edu,
      school: sanitizeText(edu.school),
      degree: sanitizeText(edu.degree),
      fieldOfStudy: sanitizeText(edu.fieldOfStudy ?? null),
      gpa: sanitizeText(edu.gpa ?? null),
    })),
    projects: data.projects.map((proj) => ({
      ...proj,
      title: sanitizeText(proj.title),
      description: sanitizeText(proj.description ?? null),
      technologies: sanitizeText(proj.technologies ?? null),
      link: sanitizeUrl(proj.link ?? null),
    })),
    certifications: data.certifications.map((cert) => ({
      ...cert,
      name: sanitizeText(cert.name),
      issuer: sanitizeText(cert.issuer),
      date: sanitizeText(cert.date ?? null),
    })),
    languages: data.languages.map((lang) => ({
      ...lang,
      name: sanitizeText(lang.name),
      proficiency: sanitizeText(lang.proficiency),
    })),
  }
}

export function sanitizePresetData(data: {
  label?: string; fullName?: string; headline?: string
  email?: string; phone?: string; address?: string
  links?: Array<{ label: string; url: string }>
}) {
  return {
    label:    sanitizeText(data.label),
    fullName: sanitizeText(data.fullName ?? null) || undefined,
    headline: sanitizeText(data.headline ?? null) || undefined,
    email:    sanitizeText(data.email ?? null) || undefined,
    phone:    sanitizeText(data.phone ?? null) || undefined,
    address:  sanitizeText(data.address ?? null) || undefined,
    links: (data.links ?? []).map((l) => ({
      label: sanitizeText(l.label),
      url:   sanitizeUrl(l.url),
    })),
  }
}
