'use client'

import type { Project } from '@/stores/builder'
import { BuilderFormField } from './BuilderFormField'
import { BuilderTextarea } from './BuilderTextarea'

interface ProjectCardProps {
  project: Project
  onUpdate: (field: keyof Project, value: any) => void
  onDelete: () => void
  index: number
}

export function ProjectCard({ project, onUpdate, onDelete, index }: ProjectCardProps) {
  return (
    <div className="p-6 bg-white/50 rounded-lg border border-border-color/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-main">Project {index + 1}</h3>
        <button
          type="button"
          onClick={onDelete}
          className="text-text-subtle hover:text-red-500 transition-colors"
          aria-label="Delete project"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Name and Link - Two Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BuilderFormField
            id={`project-${index}-name`}
            name={`project-${index}-name`}
            label="Project Name"
            value={project.title}
            onChange={(e) => onUpdate('title', e.target.value)}
            placeholder="E.g., E-commerce Platform"
            required
          />
          <BuilderFormField
            id={`project-${index}-link`}
            name={`project-${index}-link`}
            label="Project Link (Optional)"
            value={project.link || ''}
            onChange={(e) => onUpdate('link', e.target.value)}
            placeholder="https://github.com/username/project"
          />
        </div>

        {/* Description - Full Width with AI Button */}
        <BuilderTextarea
          id={`project-${index}-description`}
          label="Description"
          value={project.description || ''}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Describe what you built, technologies used, and impact..."
          rows={3}
          showAIButton={true}
        />

        {/* Technologies - Full Width */}
        <BuilderFormField
          id={`project-${index}-technologies`}
          name={`project-${index}-technologies`}
          label="Technologies Used"
          value={project.technologies || ''}
          onChange={(e) => onUpdate('technologies', e.target.value)}
          placeholder="E.g., React, Node.js, MongoDB, AWS"
        />
      </div>
    </div>
  )
}
