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

export async function getUsersResumes(userId: string): Promise<ResumeWithRelations[]> {
    const resumes = await prisma.resume.findMany({
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
    })

    return resumes ?? []
}
