import * as React from 'react'
import { DateField } from '@/app/components/ui'

export interface BirthDateFieldProps {
  value: string | null
  error?: string | null
  onChange: (value: string) => void
  onErrorClear?: () => void
}

export const BirthDateField: React.FC<BirthDateFieldProps> = ({ value, error, onChange, onErrorClear }) => (
  <DateField
    label="Birth date"
    required
    value={value}
    error={error ?? undefined}
    onChange={(val) => {
      onErrorClear?.()
      onChange(val)
    }}
  />
)
