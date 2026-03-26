import { Sparkles } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AIAssistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ariaLabel?: string
}

export const AIAssistButton = React.forwardRef<HTMLButtonElement, AIAssistButtonProps>(
  ({ className, onClick, disabled, ariaLabel, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel || 'Generate with AI'}
        title="Generate with AI"
        className={cn(
          'size-9 rounded-lg transition-all duration-200',
          'bg-primary/10 text-primary border border-primary/20',
          'hover:bg-primary hover:text-white hover:border-primary hover:shadow-md hover:shadow-primary/25 hover:scale-105',
          'active:scale-95',
          'flex items-center justify-center',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-primary/10 disabled:hover:text-primary disabled:hover:shadow-none',
          className,
        )}
        {...props}
      >
        <Sparkles className="h-[18px] w-[18px]" />
      </button>
    )
  },
)

AIAssistButton.displayName = 'AIAssistButton'
