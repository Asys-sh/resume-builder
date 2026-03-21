'use client'

import { useAtom } from 'jotai'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { BuilderFormField, NavigationButtons, PresetPicker, StepProgress } from '@/components/builder'
import { resumeDataAtom, setResumeDataAtom } from '@/stores/builder'
import { cn } from '@/lib/utils'

interface ContactInfoProps {
  onNext: () => void
  onPrevious: () => void
}

const LINK_TYPES = [
  { value: 'LinkedIn', placeholder: 'linkedin.com/in/yourname' },
  { value: 'GitHub', placeholder: 'github.com/yourname' },
  { value: 'Portfolio', placeholder: 'yourportfolio.com' },
  { value: 'Behance', placeholder: 'behance.net/yourname' },
  { value: 'Dribbble', placeholder: 'dribbble.com/yourname' },
  { value: 'Twitter/X', placeholder: 'twitter.com/yourname' },
  { value: 'YouTube', placeholder: 'youtube.com/@yourname' },
  { value: 'Other', placeholder: 'yourlink.com' },
] as const

function isValidUrl(value: string): boolean {
  if (!value.trim()) return true // empty is fine
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`)
    return url.hostname.includes('.')
  } catch {
    return false
  }
}

export function ContactInfo({ onNext, onPrevious }: ContactInfoProps) {
  const [resumeData] = useAtom(resumeDataAtom)
  const [, setResumeDataPartial] = useAtom(setResumeDataAtom)
  const [urlErrors, setUrlErrors] = useState<Record<number, string>>({})

  const handleContactChange = (field: keyof Omit<typeof resumeData.contactInfo, 'links'>, value: string) => {
    setResumeDataPartial({
      contactInfo: {
        ...resumeData.contactInfo,
        [field]: value,
      },
    })
  }

  const links = resumeData.contactInfo.links ?? []

  const handleAddLink = () => {
    if (links.length >= 6) return
    setResumeDataPartial({
      contactInfo: {
        ...resumeData.contactInfo,
        links: [...links, { label: 'LinkedIn', url: '' }],
      },
    })
  }

  const handleRemoveLink = (index: number) => {
    const next = links.filter((_, i) => i !== index)
    setResumeDataPartial({
      contactInfo: { ...resumeData.contactInfo, links: next },
    })
    setUrlErrors((prev) => {
      const updated = { ...prev }
      delete updated[index]
      return updated
    })
  }

  const handleLinkChange = (index: number, field: 'label' | 'url', value: string) => {
    const next = links.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    setResumeDataPartial({
      contactInfo: { ...resumeData.contactInfo, links: next },
    })
    if (field === 'url') {
      setUrlErrors((prev) => ({ ...prev, [index]: '' }))
    }
  }

  const handleUrlBlur = (index: number, value: string) => {
    if (value.trim() && !isValidUrl(value)) {
      setUrlErrors((prev) => ({ ...prev, [index]: 'Please enter a valid URL' }))
    } else {
      setUrlErrors((prev) => ({ ...prev, [index]: '' }))
    }
  }

  const placeholder = (label: string) =>
    LINK_TYPES.find((t) => t.value === label)?.placeholder ?? 'yourlink.com'

  return (
    <>
      <StepProgress currentStep={1} totalSteps={7} stepLabel="Contact Info" />
      <div className="flex flex-col gap-8 bg-secondary-bg/50 p-6 md:p-8 rounded-xl border border-border-color/30">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">
            Contact Information
          </h1>
          <p className="text-text-subtle text-base font-normal leading-normal">
            Let's start with the basics. Enter your contact information below.
          </p>
        </div>

        {/* Apply saved profile */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-subtle">Quickly fill from a saved profile</p>
          <PresetPicker />
        </div>

        <div className="flex flex-col gap-6">
          {/* Row 1: Full Name and Headline */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 min-w-40">
              <BuilderFormField
                id="fullName"
                name="fullName"
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={resumeData.contactInfo.fullName}
                onChange={(e) => handleContactChange('fullName', e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-40">
              <BuilderFormField
                id="headline"
                name="headline"
                label="Headline"
                type="text"
                placeholder="Software Engineer"
                value={resumeData.contactInfo.headline}
                onChange={(e) => handleContactChange('headline', e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Email and Phone */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 min-w-40">
              <BuilderFormField
                id="email"
                name="email"
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                value={resumeData.contactInfo.email}
                onChange={(e) => handleContactChange('email', e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-40">
              <BuilderFormField
                id="phone"
                name="phone"
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={resumeData.contactInfo.phone}
                onChange={(e) => handleContactChange('phone', e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Address */}
          <div>
            <BuilderFormField
              id="address"
              name="address"
              label="Address"
              type="text"
              placeholder="City, State, Country"
              value={resumeData.contactInfo.address}
              onChange={(e) => handleContactChange('address', e.target.value)}
            />
          </div>

          {/* Links Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-main">Links</p>
                <p className="text-xs text-text-subtle mt-0.5">
                  LinkedIn, GitHub, Portfolio, or any other profile
                </p>
              </div>
              {links.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Link
                </button>
              )}
            </div>

            {links.length === 0 && (
              <button
                type="button"
                onClick={handleAddLink}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 border-dashed border-border-color/60 text-text-subtle text-sm hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add a link
              </button>
            )}

            {links.length > 0 && (
              <div className="flex flex-col gap-2">
                {links.map((link, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    {/* Type dropdown */}
                    <select
                      value={link.label}
                      onChange={(e) => handleLinkChange(i, 'label', e.target.value)}
                      className="shrink-0 h-10 px-2 rounded-lg border border-border-color/50 bg-background-light text-xs font-semibold text-text-main focus:outline-none focus:border-primary/60 transition-colors"
                    >
                      {LINK_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.value}
                        </option>
                      ))}
                    </select>

                    {/* URL input */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => handleLinkChange(i, 'url', e.target.value)}
                        onBlur={(e) => handleUrlBlur(i, e.target.value)}
                        placeholder={placeholder(link.label)}
                        className={cn(
                          'w-full h-10 px-3 rounded-lg border text-sm bg-background-light text-text-main placeholder:text-text-subtle/60 focus:outline-none transition-colors',
                          urlErrors[i]
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-border-color/50 focus:border-primary/60',
                        )}
                      />
                      {urlErrors[i] && (
                        <p className="text-xs text-red-500 mt-1">{urlErrors[i]}</p>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(i)}
                      className="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg text-text-subtle hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label="Remove link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <NavigationButtons
          onPrevious={onPrevious}
          onNext={onNext}
          previousDisabled={false}
          showPrevious={true}
          showNext={true}
        />
      </div>
    </>
  )
}
