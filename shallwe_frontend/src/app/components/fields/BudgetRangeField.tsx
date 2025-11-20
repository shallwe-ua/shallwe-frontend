import * as React from 'react'
import { NumberRangeField } from '@/app/components/ui'

export interface BudgetRangeFieldProps {
  min: number | null
  max: number | null
  minError?: string | null
  maxError?: string | null
  onChange: (which: 'min' | 'max', value: number | null) => void
}

export const BudgetRangeField: React.FC<BudgetRangeFieldProps> = ({
  min,
  max,
  minError,
  maxError,
  onChange,
}) => (
  <NumberRangeField
    label="Budget range"
    minProps={{
      label: 'Min',
      value: min ?? '',
      onChange: (e) => onChange('min', e.target.value ? Number(e.target.value) : null),
      'aria-invalid': Boolean(minError),
    }}
    maxProps={{
      label: 'Max',
      value: max ?? '',
      onChange: (e) => onChange('max', e.target.value ? Number(e.target.value) : null),
      'aria-invalid': Boolean(maxError),
    }}
    hint={minError || maxError ? undefined : 'Set both to help matches fit your budget'}
    error={minError || maxError || undefined}
  />
)
