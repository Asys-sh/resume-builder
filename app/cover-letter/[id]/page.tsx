'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, ArrowLeft, Download } from 'lucide-react'
import { toast } from 'sonner'

export default function CoverLetterEditor({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [data, setData] = useState({
        title: '',
        content: '',
        jobTitle: '',
        companyName: '',
        jobDescription: ''
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/cover-letters/${id}`)
                if (res.ok) {
                    const json = await res.json()
                    setData(json.coverLetter)
                } else {
                    toast.error('Failed to load cover letter')
                    router.push('/dashboard/cover-letters')
                }
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [id, router])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await fetch(`/api/cover-letters/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (res.ok) {
                toast.success('Cover letter saved!')
            } else {
                throw new Error('Failed to save')
            }
        } catch (error) {
            toast.error('Failed to save cover letter')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDownload = () => {
        // Simple text download for now
        const element = document.createElement("a");
        const file = new Blob([data.content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${data.title || 'cover-letter'}.txt`;
        document.body.appendChild(element);
        element.click();
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold">Edit Cover Letter</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Changes
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-1 space-y-4">
                        <div className="space-y-2">
                            <Label>Document Title</Label>
                            <Input
                                value={data.title}
                                onChange={(e) => setData({ ...data, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Job Title</Label>
                            <Input
                                value={data.jobTitle || ''}
                                onChange={(e) => setData({ ...data, jobTitle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Company</Label>
                            <Input
                                value={data.companyName || ''}
                                onChange={(e) => setData({ ...data, companyName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Job Description</Label>
                            <Textarea
                                className="min-h-[200px] text-xs"
                                value={data.jobDescription || ''}
                                onChange={(e) => setData({ ...data, jobDescription: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <Label>Content</Label>
                        <Textarea
                            className="min-h-[600px] font-mono p-6 text-base leading-relaxed"
                            value={data.content}
                            onChange={(e) => setData({ ...data, content: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
