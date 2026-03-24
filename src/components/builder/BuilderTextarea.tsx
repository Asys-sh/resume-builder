import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'
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
    forwardedRef,
  ) => {
    const fieldId = id || name || ''
    const internalRef = React.useRef<HTMLTextAreaElement>(null)
    React.useImperativeHandle(forwardedRef, () => internalRef.current!)

    // Auto-grow: reset to auto then expand to full scroll height + ~2 lines of padding
    React.useEffect(() => {
      const el = internalRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight + 40, 300)}px`
    }, [value])

    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId} className="text-base font-medium text-text-main">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        <div className="relative">
          <textarea
            ref={internalRef}
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            required={required}
            aria-invalid={!!error}
            aria-required={required || undefined}
            aria-describedby={error ? fieldId + '-error' : undefined}
            className={cn(
              'form-input w-full rounded-lg border border-border-color bg-white p-[15px] scrollbar-none resize-none max-h-[300px] overflow-y-auto',
              'text-text-main placeholder:text-text-subtle/70',
              'focus:ring-2 focus:ring-primary/30 focus:border-primary',
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
        {error && (
          <p id={fieldId + '-error'} className="flex items-center gap-1 text-sm text-red-400">
            <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
            {error}
          </p>
        )}
      </div>
    )
  },
)

BuilderTextarea.displayName = 'BuilderTextarea'
