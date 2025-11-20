import * as React from 'react'
import { cn } from '@/lib/utils'

export type Step = {
  id: string
  label: string
  description?: string
}

export interface StepperProps {
  steps: Step[]
  currentIndex: number
  onStepClick?: (index: number) => void
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentIndex, onStepClick }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {steps.map((step, idx) => {
          const isActive = idx === currentIndex
          const isComplete = idx < currentIndex
          const circleClasses = cn(
            'flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold transition',
            {
              'border-primary bg-primary text-primary-foreground': isActive,
              'border-primary bg-brand-weak text-primary': isComplete && !isActive,
            }
          )

          const labelClasses = cn('text-sm font-semibold text-foreground', {
            'text-primary': isActive,
          })

          const buttonProps = onStepClick
            ? { role: 'button', onClick: () => onStepClick(idx), tabIndex: 0 }
            : {}

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-3">
                <div className={circleClasses} {...buttonProps}>
                  {isComplete ? '✓' : idx + 1}
                </div>
                <div className="space-y-0.5">
                  <div className={labelClasses}>{step.label}</div>
                  {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
                </div>
              </div>
              {idx < steps.length - 1 && <div className="flex-1 border-t border-border md:mx-5" />}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
