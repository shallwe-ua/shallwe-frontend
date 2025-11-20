import * as React from 'react'
import { TextareaField } from '@/app/components/ui'
import { cn } from '@/lib/utils'

export interface BioFieldProps {
  value: string | null
  error?: string | null
  onChange: (value: string | null) => void
  onErrorClear?: () => void
}

export const BioField: React.FC<BioFieldProps> = ({ value, error, onChange, onErrorClear }) => (
  <TextareaField
    label="Bio (up to 1024 chars)"
    error={error ?? undefined}
    value={value ?? ''}
    onChange={(e) => {
      onErrorClear?.()
      onChange(e.target.value || null)
    }}
    rows={3}
    textareaClassName={cn(
      'min-h-[120px]',
      (error || (value && value.length > 1024)) && 'ring-2 ring-destructive'
    )}
    showCount
    maxLength={1024}
  />
)
