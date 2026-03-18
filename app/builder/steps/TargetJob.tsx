import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NavigationButtons } from '@/components/builder';
import { useAtom } from 'jotai';
import { resumeDataAtom } from '@/stores/builder';
import type { CoverLetter } from '@prisma-generated/client';
import { Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface TargetJobProps {
    onNext: () => void;
    onBack: () => void;
}

export const TargetJob: React.FC<TargetJobProps> = ({ onNext, onBack }) => {
    const [resumeData, setResumeData] = useAtom(resumeDataAtom);
    const [isGenerating, setIsGenerating] = useState(false);

    React.useEffect(() => {
        if (!resumeData.coverLetter) {
            setResumeData((prev) => ({
                ...prev,
                coverLetter: {
                    title: 'Cover Letter',
                    content: '',
                    jobTitle: null,
                    companyName: null,
                    jobDescription: null,
                    status: 'draft'
                } as Partial<CoverLetter> as CoverLetter
            }));
        }
    }, []);

    const handleGenerate = async () => {
        if (!resumeData.coverLetter?.jobDescription) {
            toast.error('Please enter a job description first');
            return;
        }

        if (!resumeData.id) {
            toast.error('Please save your resume first before generating a cover letter');
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch('/api/ai/cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumeId: resumeData.id,
                    jobDescription: resumeData.coverLetter.jobDescription,
                    jobTitle: resumeData.coverLetter.jobTitle,
                    companyName: resumeData.coverLetter.companyName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    toast.error(data.message || 'AI quota reached. Upgrade to Pro for unlimited access.');
                } else {
                    toast.error(data.error || data.message || 'Failed to generate cover letter');
                }
                return;
            }

            setResumeData((prev) => ({
                ...prev,
                coverLetter: {
                    ...prev.coverLetter!,
                    content: data.content
                }
            }));
            toast.success('Cover letter generated!');
        } catch {
            toast.error('Connection error — check your internet and try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const updateField = (field: string, value: string) => {
        setResumeData((prev) => ({
            ...prev,
            coverLetter: {
                ...prev.coverLetter!,
                [field]: value
            }
        }));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">Target Job & Cover Letter</h2>
                <p className="text-muted-foreground">
                    Tailor your application by providing the job details. We&apos;ll generate a custom cover letter for you.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column: Job Details */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                            id="jobTitle"
                            placeholder="e.g. Senior Frontend Engineer"
                            className="bg-white"
                            value={resumeData.coverLetter?.jobTitle || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('jobTitle', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                            id="companyName"
                            placeholder="e.g. Acme Corp"
                            className="bg-white"
                            value={resumeData.coverLetter?.companyName || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('companyName', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="jobDescription">Job Description</Label>
                        <Textarea
                            id="jobDescription"
                            placeholder="Paste the full job description here..."
                            className="min-h-[200px] bg-white"
                            value={resumeData.coverLetter?.jobDescription || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('jobDescription', e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !resumeData.coverLetter?.jobDescription}
                        className="w-full"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating…
                            </>
                        ) : (
                            <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Generate Cover Letter
                            </>
                        )}
                    </Button>
                </div>

                {/* Right Column: Cover Letter Editor */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="content">Cover Letter Content</Label>
                        <Textarea
                            id="content"
                            placeholder="Your cover letter will appear here..."
                            className="min-h-[400px] font-mono text-sm bg-white"
                            value={resumeData.coverLetter?.content || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('content', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <NavigationButtons
                onPrevious={onBack}
                onNext={onNext}
                showPrevious={true}
                showNext={true}
                nextLabel="Next: Review & Export"
            />
        </div>
    );
};
