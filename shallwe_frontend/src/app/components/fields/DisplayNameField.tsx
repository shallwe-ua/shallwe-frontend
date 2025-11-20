import * as React from 'react'
import { TextField } from '@/app/components/ui'

export interface DisplayNameFieldProps {
  value: string | null
  error?: string | null
  onChange: (value: string | null) => void
  onErrorClear?: () => void
}

export const DisplayNameField: React.FC<DisplayNameFieldProps> = ({
  value,
  error,
  onChange,
  onErrorClear,
}) => (
  <TextField
    label="Display name (Cyrillic)"
    required
    error={error ?? undefined}
    value={value ?? ''}
    onChange={(e) => {
      onErrorClear?.()
      onChange(e.target.value || null)
    }}
    autoComplete="name"
    inputMode="text"
  />
)
