import { prisma } from "./prisma"
import { Prisma } from "@prisma-generated/client"

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

const RESUMES_PER_PAGE = 12

export async function getUsersResumes(
    userId: string,
    page = 1
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
