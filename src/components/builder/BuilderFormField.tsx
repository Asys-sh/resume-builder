import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

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
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={id} className="text-base font-medium text-text-main">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </Label>
        <input
          ref={ref}
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={cn(
            'form-input h-14 rounded-lg border border-border-color bg-white p-[15px]',
            'text-text-main placeholder:text-text-subtle/70',
            error && 'border-red-400',
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    )
  },
)

BuilderFormField.displayName = 'BuilderFormField'
