'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus, FileText, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'

interface CoverLetter {
    id: string
    title: string
    jobTitle?: string
    companyName?: string
    updatedAt: string
    status: string
}

export default function CoverLettersPage() {
    const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchCoverLetters()
    }, [])

    const fetchCoverLetters = async () => {
        try {
            const res = await fetch('/api/cover-letters')
            if (res.ok) {
                const data = await res.json()
                setCoverLetters(data.coverLetters)
            }
        } catch (error) {
            console.error('Failed to fetch cover letters', error)
            toast.error('Failed to load cover letters')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this cover letter?')) return

        try {
            const res = await fetch(`/api/cover-letters/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setCoverLetters(prev => prev.filter(cl => cl.id !== id))
                toast.success('Cover letter deleted')
            } else {
                toast.error('Failed to delete cover letter')
            }
        } catch (error) {
            console.error('Failed to delete cover letter', error)
            toast.error('Failed to delete cover letter')
        }
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cover Letters</h1>
                    <p className="text-muted-foreground">Manage your tailored cover letters.</p>
                </div>
                <Link href="/builder">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Application
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : coverLetters.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">No cover letters yet</h3>
                    <p className="text-muted-foreground mb-4">Start a new resume to generate a cover letter.</p>
                    <Link href="/builder">
                        <Button variant="outline">Go to Builder</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {coverLetters.map((cl) => (
                        <Card key={cl.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="line-clamp-1">{cl.title}</CardTitle>
                                <CardDescription>
                                    {cl.jobTitle ? `${cl.jobTitle} at ${cl.companyName || 'Unknown Company'}` : 'Untitled Position'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">
                                    Last updated {new Date(cl.updatedAt).toLocaleDateString()}
                                </p>
                                <div className="mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    {cl.status}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(cl.id)} className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                                <Link href={`/cover-letter/${cl.id}`}>
                                    <Button variant="outline" size="sm">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
