'use client'

import { useRouter } from 'next/navigation'
import { Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { TEMPLATES } from '@/lib/templates'
import { ResumeData } from '@/stores/builder'
import { deleteResume } from '@/lib/utils'
import { ResumeWithRelations } from '@/lib/data'

// A4 page dimensions at 96 dpi
const PAGE_WIDTH = 794
// Scale factor: shrink the full-width page to fit inside the card preview area
const SCALE = 0.33
const PREVIEW_WIDTH = Math.round(PAGE_WIDTH * SCALE)   // ~262px
const PREVIEW_HEIGHT = 220                              // clip height of the card thumbnail

function mapToResumeData(resume: ResumeWithRelations): ResumeData {
    return {
        id: resume.id,
        title: resume.title,
        contactInfo: (resume.contactInfo as ResumeData['contactInfo']) ?? {
            fullName: '',
            headline: '',
            email: '',
            phone: '',
            address: '',
            linkedin: '',
            website: '',
        },
        summary: resume.summary ?? '',
        experiences: resume.experiences,
        skills: resume.skills,
        education: resume.education,
        projects: resume.projects,
        certifications: resume.certifications,
        languages: resume.languages,
        awards: [],
        currentStep: 1,
        selectedTemplate: resume.template ?? 'modern',
    }
}

function formatDate(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Updated today'
    if (days === 1) return 'Updated yesterday'
    if (days < 7) return `Updated ${days} days ago`

    return `Updated ${new Date(date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: new Date(date).getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })}`
}

interface ResumeCardProps {
    resume: ResumeWithRelations
}

export function ResumeCard({ resume }: ResumeCardProps) {
    const router = useRouter()
    const template = TEMPLATES.find((t) => t.id === (resume.template ?? 'modern')) ?? TEMPLATES[0]
    const TemplateComponent = template.component
    const resumeData = mapToResumeData(resume)

    const contactName = (resume.contactInfo as ResumeData['contactInfo'])?.fullName

    const handleDelete = async () => {
        try {
            const deleted = await deleteResume(resume.id)
            if (deleted) {
                toast.success('Resume deleted')
                router.refresh()
            } else {
                toast.error('Failed to delete resume')
            }
        } catch {
            toast.error('Failed to delete resume')
        }
    }

    return (
        <div className="group relative flex flex-col rounded-xl border border-border-color/40 overflow-hidden bg-white hover:shadow-lg hover:shadow-black/8 hover:border-primary/30 transition-all duration-200">
            {/* Live scaled preview */}
            <div
                className="relative overflow-hidden bg-gray-50 cursor-pointer"
                style={{ height: `${PREVIEW_HEIGHT}px`, width: `${PREVIEW_WIDTH}px` }}
                onClick={() => router.push(`/builder?resumeId=${resume.id}`)}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: `${PAGE_WIDTH}px`,
                        transform: `scale(${SCALE})`,
                        transformOrigin: 'top left',
                        pointerEvents: 'none',
                    }}
                >
                    <TemplateComponent resumeData={resumeData} />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-primary text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm border border-primary/20 translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
                        Open in Editor
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="px-3.5 py-3 flex items-start justify-between gap-2 border-t border-border-color/20">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-main truncate">
                        {contactName || resume.title || 'Untitled Resume'}
                    </p>
                    <p className="text-xs text-text-subtle mt-0.5">{formatDate(resume.updatedAt)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-text-subtle hover:text-primary hover:bg-primary/10"
                        aria-label="Edit resume"
                        onClick={() => router.push(`/builder?resumeId=${resume.id}`)}
                    >
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-text-subtle hover:text-red-500 hover:bg-red-50"
                        aria-label="Delete resume"
                        onClick={handleDelete}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
