'use client'

import type * as React from 'react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export interface StepProgressProps {
  currentStep: number
  totalSteps?: number
  stepLabel: string
  className?: string
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  totalSteps = 6,
  stepLabel,
  className,
}) => {
  const normalizedStep = Math.max(0, Math.min(currentStep, totalSteps))
  const progressPercentage = (normalizedStep / totalSteps) * 100

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center bg-primary text-white text-xs font-bold rounded-full w-6 h-6 shrink-0">
            {currentStep}
          </span>
          <p className="text-base font-semibold text-text-main">{stepLabel}</p>
        </div>
        <span className="text-xs font-medium text-text-subtle tabular-nums">
          {currentStep} / {totalSteps}
        </span>
      </div>
      <Progress
        value={progressPercentage}
        className="h-1.5 rounded-full bg-border-color/30"
        indicatorClassName="bg-primary rounded-full transition-all duration-500"
      />
    </div>
  )
}

StepProgress.displayName = 'StepProgress'
