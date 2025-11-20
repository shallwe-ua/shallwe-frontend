import * as React from 'react'
import { SelectField } from '@/app/components/ui'

export interface SmokingLevelFieldProps {
  value: number | null
  error?: string | null
  onChange: (value: number | null) => void
  onErrorClear?: () => void
}

export const SmokingLevelField: React.FC<SmokingLevelFieldProps> = ({
  value,
  error,
  onChange,
  onErrorClear,
}) => (
  <SelectField
    label="Smoking Level"
    error={error ?? undefined}
    value={value ?? ''}
    onChange={(e) => {
      onErrorClear?.()
      onChange(e.target.value ? Number(e.target.value) : null)
    }}
  >
    <option value="">Select...</option>
    <option value="1">Never</option>
    <option value="2">Rarely</option>
    <option value="3">Socially</option>
    <option value="4">Often</option>
  </SelectField>
)
