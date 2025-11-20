import * as React from 'react'
import { CheckboxField } from '@/app/components/ui'

export interface CoupleFieldProps {
  value: boolean
  error?: string | null
  onChange: (value: boolean) => void
  onErrorClear?: () => void
}

export const CoupleField: React.FC<CoupleFieldProps> = ({ value, error, onChange, onErrorClear }) => (
  <CheckboxField
    label="Apply as a couple"
    error={error ?? undefined}
    checked={value}
    onChange={(e) => {
      onErrorClear?.()
      onChange(e.target.checked)
    }}
    labelText="We're applying as a couple"
  />
)
