import * as React from 'react'
import { CheckboxField } from '@/app/components/ui'

export interface ChildrenFieldProps {
  value: boolean
  error?: string | null
  onChange: (value: boolean) => void
  onErrorClear?: () => void
}

export const ChildrenField: React.FC<ChildrenFieldProps> = ({ value, error, onChange, onErrorClear }) => (
  <CheckboxField
    label="Children at home"
    error={error ?? undefined}
    checked={value}
    onChange={(e) => {
      onErrorClear?.()
      onChange(e.target.checked)
    }}
    labelText="Kids live with me"
  />
)
