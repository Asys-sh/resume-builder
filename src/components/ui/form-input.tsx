'use client'

import { forwardRef, type ReactNode, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

interface FormInputProps {
  id: string
  label: string
  type?: 'text' | 'email' | 'password'
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  icon?: string
  rightLabel?: ReactNode
  className?: string
  name?: string
  required?: boolean
  disabled?: boolean
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      id,
      label,
      type = 'text',
      placeholder,
      value,
      onChange,
      error,
      icon,
      rightLabel,
      className,
      name,
      required,
      disabled,
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>{label}</Label>
          {rightLabel}
        </div>
        <div className="relative">
          {icon && (
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </span>
          )}
          <Input
            ref={ref}
            id={id}
            name={name || id}
            type={inputType}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={`h-14 ${icon ? 'pl-11' : 'pl-4'} ${type === 'password' ? 'pr-11' : 'pr-4'} border-secondary-accent bg-beige focus:ring-2 focus:ring-primary/50 ${
              error ? 'border-red-400' : ''
            } ${className || ''}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
              className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600"
            >
              {showPassword ? 'visibility' : 'visibility_off'}
            </button>
          )}
        </div>
        {error && (
          <p id={`${id}-error`} role="alert" className="flex items-center gap-1 text-red-400 text-sm text-destructive">
            <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
            {error}
          </p>
        )}
      </div>
    )
  },
)

FormInput.displayName = 'FormInput'
