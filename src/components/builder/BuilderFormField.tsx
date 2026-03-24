import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

export interface BuilderFormFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'url'
  error?: string
}

export const BuilderFormField = React.forwardRef<HTMLInputElement, BuilderFormFieldProps>(
  (
    {
      id,
      label,
      type = 'text',
      placeholder,
      value,
      onChange,
      className,
      name,
      required,
      error,
      ...props
    },
    ref,
  ) => {
    const fieldId = id || name || ''

    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId} className="text-base font-medium text-text-main">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        <input
          ref={ref}
          id={fieldId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          aria-invalid={!!error}
          aria-required={required || undefined}
          aria-describedby={error ? fieldId + '-error' : undefined}
          className={cn(
            'form-input h-14 rounded-lg border border-border-color bg-white p-[15px]',
            'text-text-main placeholder:text-text-subtle/70',
            'focus:ring-2 focus:ring-primary/30 focus:border-primary',
            error && 'border-red-400',
            className,
          )}
          {...props}
        />
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

BuilderFormField.displayName = 'BuilderFormField'
