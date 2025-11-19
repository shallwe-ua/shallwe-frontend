import * as React from 'react'
import { cn } from '@/lib/utils'

export interface MetaPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon?: React.ReactNode
}

export const MetaPill = React.forwardRef<HTMLSpanElement, MetaPillProps>(
  ({ className, icon, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'surface-chip inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium',
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  )
)
MetaPill.displayName = 'MetaPill'
