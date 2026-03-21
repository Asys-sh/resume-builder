'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'
import type { ProfilePresetCreateBody } from '@/lib/schemas'
import type { ProfilePreset } from '@prisma-generated/client'

interface ProfilePresetFormProps {
  initial?: Partial<ProfilePreset>
  onSubmit: (data: ProfilePresetCreateBody) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function ProfilePresetForm({ initial, onSubmit, onCancel, isLoading }: ProfilePresetFormProps) {
  const [formValues, setFormValues] = useState({
    label: initial?.label ?? '',
    fullName: initial?.fullName ?? '',
    headline: initial?.headline ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    address: initial?.address ?? '',
    links: (initial?.links as Array<{ label: string; url: string }>) ?? [],
  })

  const handleChange = (field: keyof Omit<typeof formValues, 'links'>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const handleAddLink = () => {
    if (formValues.links.length >= 6) return
    setFormValues((prev) => ({ ...prev, links: [...prev.links, { label: '', url: '' }] }))
  }

  const handleRemoveLink = (index: number) => {
    setFormValues((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }))
  }

  const handleLinkChange = (index: number, field: 'label' | 'url', value: string) => {
    setFormValues((prev) => ({
      ...prev,
      links: prev.links.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formValues)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        id="preset-label"
        name="label"
        label="Profile Label"
        value={formValues.label}
        onChange={handleChange('label')}
        placeholder="e.g. Software Engineer, Freelance Designer"
        required
        disabled={isLoading}
        className="bg-white"
      />

      <FormInput
        id="preset-fullName"
        name="fullName"
        label="Full Name"
        value={formValues.fullName}
        onChange={handleChange('fullName')}
        placeholder="John Doe"
        disabled={isLoading}
        className="bg-white"
      />

      <FormInput
        id="preset-headline"
        name="headline"
        label="Headline"
        value={formValues.headline}
        onChange={handleChange('headline')}
        placeholder="Software Engineer"
        disabled={isLoading}
        className="bg-white"
      />

      <FormInput
        id="preset-email"
        name="email"
        label="Email"
        type="email"
        value={formValues.email}
        onChange={handleChange('email')}
        placeholder="john@example.com"
        disabled={isLoading}
        className="bg-white"
      />

      <FormInput
        id="preset-phone"
        name="phone"
        label="Phone"
        value={formValues.phone}
        onChange={handleChange('phone')}
        placeholder="+1 (555) 123-4567"
        disabled={isLoading}
        className="bg-white"
      />

      <FormInput
        id="preset-address"
        name="address"
        label="Address"
        value={formValues.address}
        onChange={handleChange('address')}
        placeholder="City, State, Country"
        disabled={isLoading}
        className="bg-white"
      />

      {/* Links Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-dark">Links</p>
          {formValues.links.length < 6 && (
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

        {formValues.links.length === 0 && (
          <button
            type="button"
            onClick={handleAddLink}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 border-dashed border-yellow/60 text-dark/50 text-sm hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add a link
          </button>
        )}

        {formValues.links.length > 0 && (
          <div className="flex flex-col gap-2">
            {formValues.links.map((link, i) => (
              <div key={i} className="flex gap-2 items-center">
                {/* Label input */}
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => handleLinkChange(i, 'label', e.target.value)}
                  placeholder="Label"
                  disabled={isLoading}
                  className="shrink-0 w-28 h-10 px-2 rounded-lg border border-yellow/50 bg-white text-xs font-semibold text-dark focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-50"
                />

                {/* URL input */}
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => handleLinkChange(i, 'url', e.target.value)}
                  placeholder="https://..."
                  disabled={isLoading}
                  className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-yellow/50 bg-white text-sm text-dark placeholder:text-dark/40 focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-50"
                />

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveLink(i)}
                  disabled={isLoading}
                  className="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg text-dark/50 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  aria-label="Remove link"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="border-yellow text-dark hover:bg-yellow/20"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-primary text-white hover:bg-primary/90"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
