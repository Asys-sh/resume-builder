import { type NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'

/** Shape of a resume snapshot JSON blob */
interface SnapshotData {
  title?: string
  summary?: string
  template?: string
  contactInfo?: Record<string, string | string[] | Array<{ label: string; url: string }>>
  tailoredFor?: string
  experiences?: Array<{
    company?: string; role?: string; startDate?: string; endDate?: string
    description?: string; location?: string
  }>
  skills?: Array<{ name?: string; level?: string }>
  education?: Array<{
    school?: string; degree?: string; fieldOfStudy?: string
    startDate?: string; endDate?: string; gpa?: string
  }>
  projects?: Array<{
    title?: string; description?: string; link?: string
    technologies?: string; startDate?: string; endDate?: string
  }>
  certifications?: Array<{ name?: string; issuer?: string; date?: string }>
  languages?: Array<{ name?: string; proficiency?: string }>
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> },
) {
  try {
    const user = await getServerUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, snapshotId } = await params

    // Verify snapshot ownership
    const snapshot = await prisma.resumeSnapshot.findUnique({
      where: { id: snapshotId },
      include: { resume: { select: { userId: true } } },
    })

    if (!snapshot || snapshot.resumeId !== id || snapshot.resume.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const limited = checkRateLimit('snapshot-restore:' + user.id, 10, 3_600_000)
    if (limited) return limited

    const snap = snapshot.data as SnapshotData

    await prisma.$transaction(async (tx) => {
      // Auto-snapshot current state before overwriting
      const currentResume = await tx.resume.findUnique({
        where: { id },
        include: {
          experiences: true,
          skills: true,
          education: true,
          projects: true,
          certifications: true,
          languages: true,
        },
      })

      if (currentResume) {
        // Strip internal fields — only store resume content
        const autoSnapshotData = {
          title: currentResume.title,
          summary: currentResume.summary,
          template: currentResume.template,
          contactInfo: currentResume.contactInfo,
          tailoredFor: currentResume.tailoredFor,
          experiences: currentResume.experiences.map(({ company, role, startDate, endDate, description, location }) => ({ company, role, startDate, endDate, description, location })),
          skills: currentResume.skills.map(({ name, level }) => ({ name, level })),
          education: currentResume.education.map(({ school, degree, fieldOfStudy, startDate, endDate, gpa }) => ({ school, degree, fieldOfStudy, startDate, endDate, gpa })),
          projects: currentResume.projects.map(({ title, description, link, technologies, startDate, endDate }) => ({ title, description, link, technologies, startDate, endDate })),
          certifications: currentResume.certifications.map(({ name, issuer, date }) => ({ name, issuer, date })),
          languages: currentResume.languages.map(({ name, proficiency }) => ({ name, proficiency })),
        }

        // Enforce 20-snapshot limit, excluding the snapshot being restored
        const count = await tx.resumeSnapshot.count({ where: { resumeId: id } })
        if (count >= 20) {
          const oldest = await tx.resumeSnapshot.findFirst({
            where: { resumeId: id, id: { not: snapshotId } },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
          })
          if (oldest) await tx.resumeSnapshot.delete({ where: { id: oldest.id } })
        }

        await tx.resumeSnapshot.create({
          data: {
            resumeId: id,
            data: autoSnapshotData,
            label: `Before restore – ${new Date().toISOString()}`,
          },
        })
      }

      // Update resume's own fields from snapshot data
      await tx.resume.update({
        where: { id },
        data: {
          title: sanitizeText(snap.title),
          summary: sanitizeText(snap.summary),
          template: snap.template,
          contactInfo: snap.contactInfo,
          tailoredFor: sanitizeText(snap.tailoredFor),
        },
      })

      // Delete all existing related rows
      await tx.experience.deleteMany({ where: { resumeId: id } })
      await tx.skill.deleteMany({ where: { resumeId: id } })
      await tx.education.deleteMany({ where: { resumeId: id } })
      await tx.project.deleteMany({ where: { resumeId: id } })
      await tx.certification.deleteMany({ where: { resumeId: id } })
      await tx.language.deleteMany({ where: { resumeId: id } })

      // Re-create relations from snapshot data using explicit allowlists
      const experiences = snap.experiences ?? []
      const skills = snap.skills ?? []
      const education = snap.education ?? []
      const projects = snap.projects ?? []
      const certifications = snap.certifications ?? []
      const languages = snap.languages ?? []

      if (experiences.length > 0) {
        await tx.experience.createMany({
          data: experiences.map((e) => ({
            resumeId: id,
            company: sanitizeText(e.company ?? ''),
            role: sanitizeText(e.role ?? ''),
            startDate: e.startDate ? new Date(e.startDate) : new Date(),
            endDate: e.endDate ? new Date(e.endDate) : null,
            description: sanitizeText(e.description ?? null),
            location: sanitizeText(e.location ?? null),
          })),
        })
      }
      if (skills.length > 0) {
        await tx.skill.createMany({
          data: skills.map((s) => ({
            resumeId: id,
            name: sanitizeText(s.name ?? ''),
            level: sanitizeText(s.level ?? null),
          })),
        })
      }
      if (education.length > 0) {
        await tx.education.createMany({
          data: education.map((ed) => ({
            resumeId: id,
            school: sanitizeText(ed.school ?? ''),
            degree: sanitizeText(ed.degree ?? ''),
            fieldOfStudy: sanitizeText(ed.fieldOfStudy ?? null),
            startDate: ed.startDate ? new Date(ed.startDate) : new Date(),
            endDate: ed.endDate ? new Date(ed.endDate) : null,
            gpa: sanitizeText(ed.gpa ?? null),
          })),
        })
      }
      if (projects.length > 0) {
        await tx.project.createMany({
          data: projects.map((p) => ({
            resumeId: id,
            title: sanitizeText(p.title ?? ''),
            description: sanitizeText(p.description ?? null),
            link: p.link ? sanitizeUrl(p.link) : null,
            technologies: p.technologies ?? null,
            startDate: p.startDate ? new Date(p.startDate) : null,
            endDate: p.endDate ? new Date(p.endDate) : null,
          })),
        })
      }
      if (certifications.length > 0) {
        await tx.certification.createMany({
          data: certifications.map((c) => ({
            resumeId: id,
            name: sanitizeText(c.name ?? ''),
            issuer: sanitizeText(c.issuer ?? ''),
            date: sanitizeText(c.date ?? null),
          })),
        })
      }
      if (languages.length > 0) {
        await tx.language.createMany({
          data: languages.map((l) => ({
            resumeId: id,
            name: sanitizeText(l.name ?? ''),
            proficiency: sanitizeText(l.proficiency ?? ''),
          })),
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error restoring snapshot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
