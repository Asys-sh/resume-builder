'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Certification } from '@/stores/builder'
import { BuilderFormField } from './BuilderFormField'

interface CertificationCardProps {
  certification: Certification
  onUpdate: (field: keyof Certification, value: string) => void
  onDelete: () => void
  index: number
}

export function CertificationCard({ certification, onUpdate, onDelete, index }: CertificationCardProps) {
  return (
    <div className="p-5 bg-white/50 rounded-lg border border-border-color/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-text-main">Certification {index + 1}</h3>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="text-text-subtle hover:text-primary transition-colors"
              aria-label={`Delete certification ${index + 1}`}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this certification?</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogTrigger asChild>
                <Button variant="outline">Keep</Button>
              </DialogTrigger>
              <Button variant="destructive" onClick={onDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4">
        <BuilderFormField
          id={`cert-name-${certification.id}`}
          label="Certification Name"
          value={certification.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder="e.g., AWS Certified Solutions Architect"
          required
        />
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <BuilderFormField
              id={`cert-issuer-${certification.id}`}
              label="Issuing Organization"
              value={certification.issuer}
              onChange={(e) => onUpdate('issuer', e.target.value)}
              placeholder="e.g., Amazon Web Services"
            />
          </div>
          <div className="flex-1">
            <BuilderFormField
              id={`cert-date-${certification.id}`}
              label="Date Obtained"
              value={certification.date || ''}
              onChange={(e) => onUpdate('date', e.target.value)}
              placeholder="e.g., March 2024"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
