import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AIAssistButton } from './AIAssistButton'

export interface BuilderTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string
  label: string
  error?: string
  showAIButton?: boolean
  onAIClick?: () => void
}

export const BuilderTextarea = React.forwardRef<HTMLTextAreaElement, BuilderTextareaProps>(
  (
    {
      id,
      label,
      placeholder,
      value,
      onChange,
      rows = 4,
      className,
      name,
      required,
      error,
      showAIButton = true,
      onAIClick,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={id} className="text-base font-medium text-text-main">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </Label>
        <div className="relative">
          <textarea
            ref={ref}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            required={required}
            className={cn(
              'form-input w-full rounded-lg border border-border-color bg-white p-[15px]',
              'text-text-main placeholder:text-text-subtle/70',
              showAIButton && 'pr-12',
              error && 'border-red-400',
              className,
            )}
            {...props}
          />
          {showAIButton && (
            <AIAssistButton onClick={onAIClick} className="absolute top-2 right-2" />
          )}
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    )
  },
)

BuilderTextarea.displayName = 'BuilderTextarea'
