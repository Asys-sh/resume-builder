import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AlertCircle, ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

/**
 * Props for the BuilderSelect component.
 *
 * Note: This component uses `onValueChange` instead of the standard React `onChange`
 * event handler. The `onValueChange` callback is intentionally simplified to receive
 * only the selected value as a string `(value: string) => void`, rather than the full
 * React change event. This design avoids confusion with native select onChange semantics
 * and provides a cleaner API for handling value changes.
 */
export interface BuilderSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  id: string
  label: string
  options: SelectOption[]
  placeholder?: string
  error?: string
  onValueChange?: (value: string) => void
}

export const BuilderSelect = React.forwardRef<HTMLSelectElement, BuilderSelectProps>(
  (
    {
      id,
      label,
      value,
      onValueChange,
      options,
      placeholder,
      className,
      name,
      required,
      error,
      ...props
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onValueChange?.(e.target.value)
    }

    const fieldId = id || name || ''

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <Label htmlFor={fieldId} className="text-base font-medium text-text-main">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </Label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            name={name}
            value={value}
            onChange={handleChange}
            required={required}
            aria-invalid={!!error}
            aria-required={required || undefined}
            aria-describedby={error ? fieldId + '-error' : undefined}
            className={cn(
              'form-input h-14 w-full appearance-none rounded-lg border border-border-color bg-white p-[15px] pr-10',
              'text-text-main',
              'focus:ring-2 focus:ring-primary/30 focus:border-primary',
              error && 'border-red-400',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none text-text-subtle" />
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

BuilderSelect.displayName = 'BuilderSelect'
