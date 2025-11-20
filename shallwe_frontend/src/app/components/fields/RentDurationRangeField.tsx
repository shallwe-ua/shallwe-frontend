import * as React from 'react'
import { SelectRangeField } from '@/app/components/ui'

const options = [
  { value: '1', label: '1 month' },
  { value: '2', label: '2 months' },
  { value: '3', label: '3 months' },
  { value: '4', label: '6 months' },
  { value: '5', label: '1 year' },
]

export interface RentDurationRangeFieldProps {
  min: number | null
  max: number | null
  minError?: string | null
  maxError?: string | null
  onChange: (which: 'min' | 'max', value: number | null) => void
}

export const RentDurationRangeField: React.FC<RentDurationRangeFieldProps> = ({
  min,
  max,
  minError,
  maxError,
  onChange,
}) => (
  <SelectRangeField
    label="Rent duration"
    error={minError || maxError || undefined}
    fromProps={{
      label: 'Min',
      value: min ?? '',
      onChange: (e) => onChange('min', e.target.value ? Number(e.target.value) : null),
      children: (
        <>
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </>
      ),
    }}
    toProps={{
      label: 'Max',
      value: max ?? '',
      onChange: (e) => onChange('max', e.target.value ? Number(e.target.value) : null),
      children: (
        <>
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </>
      ),
    }}
  />
)
