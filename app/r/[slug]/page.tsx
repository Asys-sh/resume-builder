import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TEMPLATES } from '@/lib/templates'
import type { ResumeData } from '@/stores/builder'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PublicResumePage({ params }: Props) {
  const { slug } = await params

  const resume = await prisma.resume.findUnique({
    where: { publicSlug: slug, isPublic: true },
    include: {
      experiences:    true,
      skills:         true,
      education:      true,
      projects:       true,
      certifications: true,
      languages:      true,
    },
  })

  if (!resume) {
    notFound()
  }

  // ── SERVER-SIDE CONTACT STRIPPING ──────────────────────────────────────────
  // If hideContactInfo is true, blank all contact fields BEFORE any rendering.
  // This data never reaches the client — it is stripped here on the server.
  const rawContact = (resume.contactInfo as Record<string, any>) ?? {}
  const contactInfo = resume.hideContactInfo
    ? {
        fullName: rawContact.fullName ?? '',
        headline: rawContact.headline ?? '',
        email:    '',
        phone:    '',
        address:  '',
        links:    [],
      }
    : {
        fullName: rawContact.fullName ?? '',
        headline: rawContact.headline ?? '',
        email:    rawContact.email ?? '',
        phone:    rawContact.phone ?? '',
        address:  rawContact.address ?? '',
        links:    Array.isArray(rawContact.links) ? rawContact.links : [],
      }

  // ── Fire-and-forget view counter ──────────────────────────────────────────
  // Non-blocking — never delays page render
  prisma.resume.update({
    where: { id: resume.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {})

  // ── Build ResumeData for the template component ───────────────────────────
  const resumeData: ResumeData = {
    id:               resume.id,
    title:            resume.title,
    summary:          resume.summary ?? '',
    contactInfo,
    experiences:      resume.experiences.map((e) => ({ ...e, resumeId: resume.id })),
    skills:           resume.skills.map((s) => ({ ...s, resumeId: resume.id })),
    education:        resume.education.map((e) => ({ ...e, resumeId: resume.id })),
    projects:         resume.projects.map((p) => ({ ...p, resumeId: resume.id })),
    certifications:   resume.certifications.map((c) => ({ ...c, resumeId: resume.id })),
    languages:        resume.languages.map((l) => ({ ...l, resumeId: resume.id })),
    awards:           [],
    currentStep:      1,
    selectedTemplate: resume.template ?? 'modern',
  }

  const template = TEMPLATES.find((t) => t.id === resumeData.selectedTemplate) ?? TEMPLATES[0]
  const TemplateComponent = template.component

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="mx-auto" style={{ maxWidth: '794px' }}>
        <TemplateComponent resumeData={resumeData} />
      </div>
      <div className="text-center mt-6 pb-8">
        <a
          href="/"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Created with RoboResume
        </a>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const resume = await prisma.resume.findUnique({
    where: { publicSlug: slug, isPublic: true },
    select: { title: true, contactInfo: true },
  })

  if (!resume) return { title: 'Resume Not Found' }

  const contact = (resume.contactInfo as Record<string, any>) ?? {}
  const name = contact.fullName || resume.title

  return {
    title: `${name}'s Resume`,
    description: `View ${name}'s professional resume`,
  }
}
