import * as React from 'react'
import { SelectField } from '@/app/components/ui'

export interface NeighbourlinessLevelFieldProps {
  value: number | null
  error?: string | null
  onChange: (value: number | null) => void
  onErrorClear?: () => void
}

export const NeighbourlinessLevelField: React.FC<NeighbourlinessLevelFieldProps> = ({
  value,
  error,
  onChange,
  onErrorClear,
}) => (
  <SelectField
    label="Neighbourliness Level"
    error={error ?? undefined}
    value={value ?? ''}
    onChange={(e) => {
      onErrorClear?.()
      onChange(e.target.value ? Number(e.target.value) : null)
    }}
  >
    <option value="">Select...</option>
    <option value="1">Low</option>
    <option value="2">Medium</option>
    <option value="3">High</option>
  </SelectField>
)
