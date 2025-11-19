import * as React from 'react'
import { cn } from '@/lib/utils'

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={cn(
        'h-4 w-4 rounded-[calc(var(--radius-xs)/1.5)] border border-border/80 bg-card text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  )
)
Checkbox.displayName = 'Checkbox'
