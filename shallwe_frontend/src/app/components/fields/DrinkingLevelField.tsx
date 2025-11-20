import * as React from 'react'
import { SelectField } from '@/app/components/ui'

export interface DrinkingLevelFieldProps {
  value: number | null
  error?: string | null
  onChange: (value: number | null) => void
  onErrorClear?: () => void
}

export const DrinkingLevelField: React.FC<DrinkingLevelFieldProps> = ({
  value,
  error,
  onChange,
  onErrorClear,
}) => (
  <SelectField
    label="Drinking Level"
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
