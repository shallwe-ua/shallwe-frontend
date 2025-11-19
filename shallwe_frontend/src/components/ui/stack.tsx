import * as React from 'react'
import { cn } from '@/lib/utils'

type StackGap = 'xs' | 'sm' | 'md' | 'lg'

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: StackGap
}

const gapClasses: Record<StackGap, string> = {
  xs: 'stack-xs',
  sm: 'stack-sm',
  md: 'stack-md',
  lg: 'stack-lg',
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap = 'md', ...props }, ref) => {
    return <div ref={ref} className={cn('stack', gapClasses[gap], className)} {...props} />
  }
)
Stack.displayName = 'Stack'
