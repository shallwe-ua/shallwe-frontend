import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'destructive'
}

const variantStyles: Record<NonNullable<AlertProps['variant']>, string> = {
  info: 'border-brand/40 bg-brand/5 text-foreground',
  success: 'border-emerald-500/30 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-500/30 bg-amber-50 text-amber-900',
  destructive: 'border-destructive/40 bg-destructive/10 text-destructive-foreground',
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative w-full rounded-lg border px-4 py-3 text-sm shadow-sm',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
)
Alert.displayName = 'Alert'
