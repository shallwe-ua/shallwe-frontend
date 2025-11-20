import * as React from 'react'
import { SelectField } from '@/app/components/ui'

export interface OccupationFieldProps {
  value: number | null
  error?: string | null
  onChange: (value: number | null) => void
  onErrorClear?: () => void
}

export const OccupationField: React.FC<OccupationFieldProps> = ({
  value,
  error,
  onChange,
  onErrorClear,
}) => (
  <SelectField
    label="Occupation Type"
    error={error ?? undefined}
    value={value ?? ''}
    onChange={(e) => {
      onErrorClear?.()
      onChange(e.target.value ? Number(e.target.value) : null)
    }}
  >
    <option value="">Select...</option>
    <option value="1">Employed</option>
    <option value="2">Student</option>
    <option value="3">Unemployed</option>
    <option value="4">Retired</option>
  </SelectField>
)
