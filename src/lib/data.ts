import type { Prisma } from '@prisma-generated/client'
import { RESUMES_GROUP_FETCH_MAX, RESUMES_PER_PAGE } from './constants'
import { prisma } from './prisma'

export type ResumeWithRelations = Prisma.ResumeGetPayload<{
  include: {
    experiences: true
    skills: true
    education: true
    projects: true
    certifications: true
    languages: true
  }
}>


export async function getUsersResumes(
  userId: string,
  page = 1,
): Promise<{ resumes: ResumeWithRelations[]; total: number; hasMore: boolean }> {
  const skip = (page - 1) * RESUMES_PER_PAGE

  const [resumes, total] = await Promise.all([
    prisma.resume.findMany({
      where: { userId },
      include: {
        experiences: true,
        skills: true,
        education: true,
        projects: true,
        certifications: true,
        languages: true,
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: RESUMES_PER_PAGE,
    }),
    prisma.resume.count({ where: { userId } }),
  ])

  return {
    resumes: resumes ?? [],
    total,
    hasMore: skip + resumes.length < total,
  }
}

export type ResumeStub = Prisma.ResumeGetPayload<{
  include: {
    experiences: true
    skills: true
    education: true
    projects: true
    certifications: true
    languages: true
  }
}>

export type GroupedResume = ResumeStub & { children: ResumeStub[] }

export type GroupedResumes = {
  bases: GroupedResume[]
  orphans: ResumeStub[]
}

export async function getGroupedResumes(userId: string): Promise<GroupedResumes> {
  const all = await prisma.resume.findMany({
    where: { userId },
    include: {
      experiences: true,
      skills: true,
      education: true,
      projects: true,
      certifications: true,
      languages: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: RESUMES_GROUP_FETCH_MAX,
  })

  const baseMap = new Map<string, GroupedResume>()
  const orphans: ResumeStub[] = []

  // First pass: collect all bases (parentResumeId === null)
  for (const r of all) {
    if (r.parentResumeId === null) {
      baseMap.set(r.id, { ...r, children: [] })
    }
  }

  // Second pass: attach children to their parent, or mark as orphan
  for (const r of all) {
    if (r.parentResumeId !== null) {
      const parent = baseMap.get(r.parentResumeId)
      if (parent) {
        parent.children.push(r)
      } else {
        // Parent was deleted (SetNull), treat as standalone
        orphans.push(r)
      }
    }
  }

  const bases = [...baseMap.values()]

  return { bases, orphans }
}
