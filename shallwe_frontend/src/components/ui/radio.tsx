import * as React from 'react'
import { cn } from '@/lib/utils'

export type RadioProps = React.InputHTMLAttributes<HTMLInputElement>

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, ...props }, ref) => (
    <input
      type="radio"
      ref={ref}
      className={cn(
        'h-4 w-4 rounded-full border border-border text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  )
)
Radio.displayName = 'Radio'
