'use client'

import { BookUser, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ProfilePresetForm } from '@/components/settings/ProfilePresetForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ProfilePresetCreateBody } from '@/lib/schemas'
import type { ProfilePreset } from '@prisma-generated/client'

export default function ProfilesClient() {
  const [presets, setPresets] = useState<ProfilePreset[]>([])
  const [isLoadingPresets, setIsLoadingPresets] = useState(true)
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<ProfilePreset | null>(null)
  const [isSavingPreset, setIsSavingPreset] = useState(false)
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/profile-presets')
      .then((r) => r.json())
      .then((d) => setPresets(d.presets ?? []))
      .catch(() => toast.error('Failed to load saved profiles'))
      .finally(() => setIsLoadingPresets(false))
  }, [])

  const handleCreatePreset = async (data: ProfilePresetCreateBody) => {
    setIsSavingPreset(true)
    try {
      const res = await fetch('/api/profile-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create profile')
      setPresets((prev) => [...prev, json.preset])
      setIsPresetDialogOpen(false)
      toast.success('Profile saved')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setIsSavingPreset(false)
    }
  }

  const handleUpdatePreset = async (data: ProfilePresetCreateBody) => {
    if (!editingPreset) return
    setIsSavingPreset(true)
    try {
      const res = await fetch(`/api/profile-presets/${editingPreset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update profile')
      setPresets((prev) => prev.map((p) => (p.id === editingPreset.id ? json.preset : p)))
      setEditingPreset(null)
      setIsPresetDialogOpen(false)
      toast.success('Profile updated')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update profile')
    } finally {
      setIsSavingPreset(false)
    }
  }

  const handleDeletePreset = async (id: string) => {
    setDeletingPresetId(id)
    try {
      const res = await fetch(`/api/profile-presets/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setPresets((prev) => prev.filter((p) => p.id !== id))
      toast.success('Profile deleted')
    } catch {
      toast.error('Failed to delete profile')
    } finally {
      setDeletingPresetId(null)
    }
  }

  const openCreate = () => {
    setEditingPreset(null)
    setIsPresetDialogOpen(true)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-dark mb-2">Saved Profiles</h1>
        <p className="text-dark/70">
          Store your contact info sets and apply them in one click when building a resume.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border border-yellow bg-beige">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookUser className="h-5 w-5 text-secondary-accent" />
                <CardTitle>Your Profiles</CardTitle>
              </div>
              {!isLoadingPresets && presets.length < 20 && presets.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                  onClick={openCreate}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Profile
                </Button>
              )}
            </div>
            <CardDescription>
              Up to 20 profiles. Each profile holds a full name, headline, contact details, and
              links.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPresets ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-yellow/30 animate-pulse" />
                ))}
              </div>
            ) : presets.length === 0 ? (
              <button
                type="button"
                onClick={openCreate}
                className="w-full flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed border-yellow rounded-xl text-dark/50 hover:border-primary/50 hover:text-primary transition-colors"
              >
                <BookUser className="h-10 w-10 opacity-40" />
                <div className="text-center">
                  <p className="text-sm font-semibold">No saved profiles yet</p>
                  <p className="text-xs mt-0.5">
                    Click to create your first profile — then apply it instantly in the builder
                  </p>
                </div>
              </button>
            ) : (
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-3 border border-yellow rounded-lg bg-yellow/10"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-dark text-sm truncate">{preset.label}</p>
                      <p className="text-xs text-dark/60 truncate">
                        {[preset.email, preset.headline].filter(Boolean).join(' · ') ||
                          'No details'}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-dark/50 hover:text-primary hover:bg-primary/10"
                        onClick={() => {
                          setEditingPreset(preset)
                          setIsPresetDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-dark/50 hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleDeletePreset(preset.id)}
                        disabled={deletingPresetId === preset.id}
                      >
                        {deletingPresetId === preset.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog
        open={isPresetDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsPresetDialogOpen(false)
            setEditingPreset(null)
          }
        }}
      >
        <DialogContent className="bg-beige border-yellow w-[calc(100vw-2rem)] sm:w-auto sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPreset ? 'Edit Profile' : 'Add Saved Profile'}</DialogTitle>
            <DialogDescription>
              {editingPreset
                ? 'Update this saved profile.'
                : 'Save contact info to quickly fill the resume builder.'}
            </DialogDescription>
          </DialogHeader>
          <ProfilePresetForm
            initial={editingPreset ?? undefined}
            onSubmit={editingPreset ? handleUpdatePreset : handleCreatePreset}
            onCancel={() => {
              setIsPresetDialogOpen(false)
              setEditingPreset(null)
            }}
            isLoading={isSavingPreset}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
