import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'destructive'
}

const variantStyles: Record<NonNullable<AlertProps['variant']>, string> = {
  info: 'border-border bg-brand-weak text-foreground',
  success: 'border-success bg-success-soft text-success',
  warning: 'border-warning bg-warning-soft text-warning',
  destructive: 'border-destructive bg-destructive-soft text-destructive',
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
