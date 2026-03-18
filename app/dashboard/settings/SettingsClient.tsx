'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { FormInput } from '@/components/ui/form-input'
import { Separator } from '@/components/ui/separator'
import { Download, Trash2, Save, AlertTriangle, User } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useAtom } from 'jotai'
import { userAtom } from '@/stores/user'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'

export default function SettingsClient() {
    const router = useRouter()
    const [user, setUser] = useAtom(userAtom)
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    // Update form data when user atom changes
    useEffect(() => {
        if (user) {
            setFormData((prev) => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }))
        }
    }, [user])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            toast.error('New passwords do not match')
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch('/api/user/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update profile')
            }

            // Update local state
            if (user) {
                setUser({ ...user, name: data.user.name, email: data.user.email })
            }

            toast.success('Profile updated successfully')
            setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to update profile')
        } finally {
            setIsLoading(false)
        }
    }

    const handleExportData = async () => {
        try {
            const res = await fetch('/api/user/export')
            if (!res.ok) throw new Error('Failed to export data')

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `robo-resume-data-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success('Data exported successfully')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export data')
        }
    }

    const handleDeleteAccount = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/user/delete', { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete account')

            // Redirect to home or login
            window.location.href = '/'
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Failed to delete account')
            setIsDeleteDialogOpen(false)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (user === undefined) {
            // Optional: Add a small delay or check if we are sure initialization is done
            // But since layout hydrates it, undefined usually means not logged in if we assume layout always runs.
            // However, to be safe and avoid flash of redirect if it takes a moment:
            // Actually, if initialUser is passed to provider, it should be there.
            // If it's undefined, it means no user.
            const timer = setTimeout(() => {
                if (!user) router.push('/auth?login=true')
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [user, router])

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-3xl font-bold text-dark mb-2">Account Settings</h1>
                <p className="text-dark/70">Manage your profile, security, and data preferences.</p>
            </motion.div>

            {/* Profile Settings */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <Card className="border border-yellow bg-beige">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-secondary-accent" />
                            <CardTitle>Profile Information</CardTitle>
                        </div>
                        <CardDescription>Update your personal details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <FormInput
                                id="name"
                                name="name"
                                label="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your name"
                                icon="person"
                            />
                            <FormInput
                                id="email"
                                name="email"
                                label="Email Address"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your@email.com"
                                icon="mail"
                            />

                            <Separator className="my-4 bg-yellow/50" />

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-dark">Change Password</h3>
                                <FormInput
                                    id="currentPassword"
                                    name="currentPassword"
                                    label="Current Password"
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    placeholder="Required to set new password"
                                    icon="lock"
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput
                                        id="newPassword"
                                        name="newPassword"
                                        label="New Password"
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        placeholder="Min. 8 characters"
                                        icon="lock"
                                    />
                                    <FormInput
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        label="Confirm New Password"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm new password"
                                        icon="lock"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isLoading} className="bg-primary text-white">
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                    <Save className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Data Management */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <Card className="border border-yellow bg-beige">
                    <CardHeader>
                        <CardTitle>Data Management</CardTitle>
                        <CardDescription>Control your data and account existence.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Export Data */}
                        <div className="flex items-center justify-between p-4 border border-yellow rounded-lg bg-yellow/10">
                            <div>
                                <h3 className="font-medium text-dark">Export Your Data</h3>
                                <p className="text-sm text-dark/70">Download a copy of your personal data, including resumes and history.</p>
                            </div>
                            <Button variant="outline" onClick={handleExportData} className="border-primary text-primary hover:bg-primary hover:text-white">
                                <Download className="mr-2 h-4 w-4" />
                                Export Data
                            </Button>
                        </div>

                        <Separator className="bg-yellow" />

                        {/* Delete Account */}
                        <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                            <div>
                                <h3 className="font-medium text-red-600 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Delete Account
                                </h3>
                                <p className="text-sm text-red-600/80">
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                            </div>
                            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Account
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-beige border-yellow">
                                    <DialogHeader>
                                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                                        <DialogDescription>
                                            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                                        <Button variant="destructive" onClick={handleDeleteAccount} disabled={isLoading}>
                                            {isLoading ? 'Deleting...' : 'Delete Account'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
