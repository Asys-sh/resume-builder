import { NextResponse } from 'next/server'
import { z } from 'zod'

// Helper — parses and validates request body, returns typed data or a 400 response
export async function parseBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ')
      return {
        data: null,
        error: NextResponse.json(
          { error: `Validation error: ${message}` },
          { status: 400 },
        ),
      }
    }
    return { data: result.data, error: null }
  } catch {
    return {
      data: null,
      error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    }
  }
}

// ─── Contact Info ────────────────────────────────────────────────────────────

export const ContactInfoSchema = z.object({
  fullName: z.string().default(''),
  headline: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  address: z.string().default(''),
  links: z.array(
    z.object({
      label: z.string().default(''),
      url: z.string().default(''),
    })
  ).default([]),
})

// ─── Resume nested items ─────────────────────────────────────────────────────

export const ExperienceItemSchema = z.object({
  id: z.string().optional(),
  company: z.string(),
  role: z.string(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
})

export const EducationItemSchema = z.object({
  id: z.string().optional(),
  school: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string().optional().nullable(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  gpa: z.string().optional().nullable(),
})

export const SkillItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  level: z.string().optional().nullable(),
})

export const ProjectItemSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
  technologies: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
})

export const CertificationItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  issuer: z.string(),
  date: z.string().optional().nullable(),
})

export const LanguageItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  proficiency: z.string(),
})

export const AwardItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  issuer: z.string(),
  date: z.string().optional(),
})

// ─── Resume POST body ─────────────────────────────────────────────────────────

export const ResumeBodySchema = z.object({
  resumeId: z.string().nullish(),
  title: z.string().max(200, 'Title too long (max 200 characters)').optional(),
  data: z.object({
    summary: z.string().max(5000, 'Summary too long (max 5000 characters)').optional(),
    selectedTemplate: z.string().optional(),
    contactInfo: ContactInfoSchema,
    experiences: z.array(ExperienceItemSchema).default([]),
    skills: z.array(SkillItemSchema).default([]),
    education: z.array(EducationItemSchema).default([]),
    projects: z.array(ProjectItemSchema).default([]),
    certifications: z.array(CertificationItemSchema).default([]),
    languages: z.array(LanguageItemSchema).default([]),
    awards: z.array(AwardItemSchema).default([]),
  }),
})

export type ResumeBody = z.infer<typeof ResumeBodySchema>

// ─── Cover Letter ─────────────────────────────────────────────────────────────

export const CoverLetterCreateSchema = z.object({
  title: z.string().max(200, 'Title too long (max 200 characters)').optional(),
  content: z.string().max(50000, 'Content too long (max 50000 characters)').optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  jobDescription: z
    .string()
    .max(10000, 'Job description too long (max 10000 characters)')
    .optional(),
  resumeId: z.string().optional(),
  status: z.string().optional(),
})

export type CoverLetterCreateBody = z.infer<typeof CoverLetterCreateSchema>

export const CoverLetterUpdateSchema = z.object({
  title: z.string().max(200, 'Title too long (max 200 characters)').optional(),
  content: z.string().max(50000, 'Content too long (max 50000 characters)').optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  jobDescription: z
    .string()
    .max(10000, 'Job description too long (max 10000 characters)')
    .optional(),
  status: z.string().optional(),
})

export type CoverLetterUpdateBody = z.infer<typeof CoverLetterUpdateSchema>

// ─── User update ──────────────────────────────────────────────────────────────

export const UserUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
})

export type UserUpdateBody = z.infer<typeof UserUpdateSchema>

// ─── AI Assist ────────────────────────────────────────────────────────────────

export const AIAssistSchema = z.object({
  type: z.enum(['summary', 'description']),
  role: z.string().optional(),
  company: z.string().optional(),
  currentContent: z.string().optional(),
  // Accept non-array values (e.g. a stray string) and coerce them to []
  skills: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.string())),
})

export type AIAssistBody = z.infer<typeof AIAssistSchema>

// ─── AI Cover Letter ─────────────────────────────────────────────────────────

export const AICoverLetterSchema = z.object({
  jobDescription: z
    .string()
    .min(1, 'Job description is required')
    .max(10000, 'Job description too long'),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  resumeId: z.string().optional(),
})

export type AICoverLetterBody = z.infer<typeof AICoverLetterSchema>

// ─── AI Improve (resume improvement) ─────────────────────────────────────────

export const AIImproveSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  jobDescription: z
    .string()
    .min(1, 'Job description is required')
    .max(10000, 'Job description too long'),
})

export type AIImproveBody = z.infer<typeof AIImproveSchema>

// ─── Checkout ─────────────────────────────────────────────────────────────────

export const CheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  quantity: z.number().int().positive().optional().default(1),
  mode: z.string().optional().default('subscription'),
})

export type CheckoutBody = z.infer<typeof CheckoutSchema>

// ─── Profile Preset ───────────────────────────────────────────────────────────

export const ProfilePresetCreateSchema = z.object({
  label:    z.string().min(1, 'Label is required').max(100),
  fullName: z.string().max(200).optional(),
  headline: z.string().max(200).optional(),
  email:    z.string().email('Invalid email').max(200).optional().or(z.literal('')),
  phone:    z.string().max(50).optional(),
  address:  z.string().max(300).optional(),
  links: z.array(z.object({
    label: z.string().default(''),
    url:   z.string().default(''),
  })).max(10).default([]),
})

export const ProfilePresetUpdateSchema = ProfilePresetCreateSchema.partial()

export type ProfilePresetCreateBody = z.infer<typeof ProfilePresetCreateSchema>
export type ProfilePresetUpdateBody = z.infer<typeof ProfilePresetUpdateSchema>

// ─── Resume Share ─────────────────────────────────────────────────────────────

export const ResumeShareSchema = z.object({
  resumeId:        z.string().min(1),
  isPublic:        z.boolean(),
  hideContactInfo: z.boolean().optional(),
})

export type ResumeShareBody = z.infer<typeof ResumeShareSchema>
