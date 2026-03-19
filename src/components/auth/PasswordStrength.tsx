'use client'

import { Check, X } from 'lucide-react'

const RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

function getStrength(password: string) {
  const passed = RULES.filter((r) => r.test(password)).length
  if (passed <= 1) return { level: 'weak', color: 'bg-red-500', width: '20%', label: 'Weak' }
  if (passed <= 2) return { level: 'fair', color: 'bg-orange-500', width: '40%', label: 'Fair' }
  if (passed <= 3) return { level: 'good', color: 'bg-yellow-500', width: '60%', label: 'Good' }
  if (passed <= 4) return { level: 'strong', color: 'bg-emerald-400', width: '80%', label: 'Strong' }
  return { level: 'excellent', color: 'bg-emerald-500', width: '100%', label: 'Excellent' }
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const strength = getStrength(password)

  return (
    <div className="space-y-2.5 pt-1">
      {/* Strength bar */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
            style={{ width: strength.width }}
          />
        </div>
        <span className={`text-xs font-semibold min-w-[60px] text-right ${
          strength.level === 'weak' ? 'text-red-500' :
          strength.level === 'fair' ? 'text-orange-500' :
          strength.level === 'good' ? 'text-yellow-600' :
          'text-emerald-600'
        }`}>
          {strength.label}
        </span>
      </div>

      {/* Checklist */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {RULES.map((rule) => {
          const passed = rule.test(password)
          return (
            <li key={rule.label} className="flex items-center gap-1.5 text-xs">
              {passed ? (
                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
              ) : (
                <X className="h-3 w-3 text-slate-300 shrink-0" />
              )}
              <span className={passed ? 'text-emerald-700' : 'text-slate-400'}>
                {rule.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
