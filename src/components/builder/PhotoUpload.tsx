'use client'

import { Camera, Loader2, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState } from 'react'

interface PhotoUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
}

export function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  const handleFile = async (file: File) => {
    if (!cloudName) {
      setError('Photo upload is not configured.')
      return
    }

    // Validate: images only, max 5 MB
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      // 1. Get signed params from our server
      const signRes = await fetch('/api/upload/sign', { method: 'POST' })
      if (!signRes.ok) throw new Error('Failed to get upload signature')
      const { signature, timestamp, apiKey, folder, signatureAlgorithm } = await signRes.json()

      // 2. Upload directly to Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', apiKey)
      formData.append('timestamp', String(timestamp))
      formData.append('signature', signature)
      formData.append('folder', folder)
      formData.append('signature_algorithm', signatureAlgorithm)

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('Upload failed')

      const data = await uploadRes.json()
      onChange(data.secure_url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-text-main">Profile Photo</p>
      <p className="text-xs text-text-subtle">Optional — appears on resume templates that support a photo.</p>

      <div className="flex items-center gap-4 mt-1">
        {/* Preview / drop zone */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: handled by button below */}
        <div
          className="relative h-20 w-20 rounded-full border-2 border-dashed border-border-color/50 bg-secondary-bg/50 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : value ? (
            <Image src={value} alt="Profile photo" fill className="object-cover" sizes="80px" />
          ) : (
            <Camera className="h-6 w-6 text-text-subtle" />
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 rounded-lg border border-border-color/50 bg-white text-sm font-semibold text-text-main hover:bg-secondary-bg/50 transition-colors disabled:opacity-50"
          >
            {value ? 'Change Photo' : 'Upload Photo'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              disabled={isUploading}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
