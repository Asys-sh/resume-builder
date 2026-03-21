'use client'

import { useState } from 'react'
import { useSetAtom } from 'jotai'
import { ChevronDown, Loader2, BookUser } from 'lucide-react'
import { toast } from 'sonner'
import { setResumeDataAtom } from '@/stores/builder'
import type { ProfilePreset } from '@prisma-generated/client'

export function PresetPicker() {
  const setResumeDataPartial = useSetAtom(setResumeDataAtom)
  const [isOpen, setIsOpen] = useState(false)
  const [presets, setPresets] = useState<ProfilePreset[] | null>(null) // null = not loaded yet
  const [isLoading, setIsLoading] = useState(false)

  const handleOpen = async () => {
    setIsOpen(true)
    if (presets !== null) return // already loaded
    setIsLoading(true)
    try {
      const res = await fetch('/api/profile-presets')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPresets(data.presets ?? [])
    } catch {
      setPresets([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = (preset: ProfilePreset) => {
    const links = Array.isArray(preset.links) ? (preset.links as Array<{label: string; url: string}>).slice(0, 6) : []
    setResumeDataPartial({
      contactInfo: {
        fullName: preset.fullName ?? '',
        headline: preset.headline ?? '',
        email:    preset.email ?? '',
        phone:    preset.phone ?? '',
        address:  preset.address ?? '',
        links,
      },
    })
    toast.success(`"${preset.label}" applied`)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <BookUser className="h-3.5 w-3.5" />
        Apply saved profile
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1.5 z-20 w-64 bg-background-light border border-border-color/50 rounded-xl shadow-xl overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-4 w-4 animate-spin text-text-subtle" />
              </div>
            ) : presets && presets.length === 0 ? (
              <div className="p-4 text-center space-y-1">
                <p className="text-sm text-text-main font-medium">No saved profiles yet</p>
                <a
                  href="/dashboard?view=profiles"
                  className="text-xs text-primary underline"
                  onClick={() => setIsOpen(false)}
                >
                  Go to Settings to create one
                </a>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest px-3 pt-3 pb-1">
                  Select a profile — this will replace your current contact info
                </p>
                <ul>
                  {(presets ?? []).map((preset) => (
                    <li key={preset.id}>
                      <button
                        type="button"
                        onClick={() => handleApply(preset)}
                        className="w-full text-left px-3 py-2.5 hover:bg-secondary-bg/80 transition-colors"
                      >
                        <p className="text-sm font-semibold text-text-main truncate">{preset.label}</p>
                        <p className="text-xs text-text-subtle truncate">
                          {[preset.email, preset.headline].filter(Boolean).join(' · ') || 'No details'}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
