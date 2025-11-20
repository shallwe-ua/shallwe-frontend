import * as React from 'react'
import { RadioGroupField } from '@/app/components/ui'

export interface GenderFieldProps {
  value: 1 | 2 | null
  error?: string | null
  onChange: (value: 1 | 2) => void
  onErrorClear?: () => void
}

const options = [
  { label: 'Male', value: '1' },
  { label: 'Female', value: '2' },
]

export const GenderField: React.FC<GenderFieldProps> = ({ value, error, onChange, onErrorClear }) => (
  <RadioGroupField
    label="Gender"
    required
    error={error ?? undefined}
    value={value ? String(value) : null}
    name="gender"
    options={options}
    onChange={(val) => {
      onErrorClear?.()
      onChange(Number(val) as 1 | 2)
    }}
  />
)
