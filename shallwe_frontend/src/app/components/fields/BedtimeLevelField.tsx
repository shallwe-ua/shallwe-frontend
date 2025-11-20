import * as React from 'react'
import { SelectField } from '@/app/components/ui'

export interface BedtimeLevelFieldProps {
  value: number | null
  error?: string | null
  onChange: (value: number | null) => void
  onErrorClear?: () => void
}

export const BedtimeLevelField: React.FC<BedtimeLevelFieldProps> = ({
  value,
  error,
  onChange,
  onErrorClear,
}) => (
  <SelectField
    label="Bedtime"
    error={error ?? undefined}
    value={value ?? ''}
    onChange={(e) => {
      onErrorClear?.()
      onChange(e.target.value ? Number(e.target.value) : null)
    }}
  >
    <option value="">Select...</option>
    <option value="1">Early (around 22:00)</option>
    <option value="2">Midnight</option>
    <option value="3">Late (around 02:00)</option>
    <option value="4">Very Late (around 04:00)</option>
  </SelectField>
)
