import * as React from 'react'
import { MetaPill, MetaPillProps } from './primitives/meta-pill'
import { cn } from '@/lib/utils'

type Tone = 'default' | 'success' | 'warning' | 'danger'

const toneClasses: Record<Tone, string> = {
  default: 'bg-brand-weak text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-destructive-soft text-destructive',
}

export interface StatusChipProps extends MetaPillProps {
  tone?: Tone
}

export const StatusChip: React.FC<StatusChipProps> = ({ tone = 'default', className, ...props }) => (
  <MetaPill className={cn(toneClasses[tone], className)} {...props} />
)
