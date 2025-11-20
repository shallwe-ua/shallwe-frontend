import * as React from 'react'
import { CheckboxGroupField } from '@/app/components/ui'

type SmokingTypeKey = 'smokes_iqos' | 'smokes_vape' | 'smokes_tobacco' | 'smokes_cigs'

export interface SmokingTypesValue {
  smokes_iqos: boolean | null
  smokes_vape: boolean | null
  smokes_tobacco: boolean | null
  smokes_cigs: boolean | null
}

export interface SmokingTypesFieldProps {
  value: SmokingTypesValue
  smokingLevel: number | null
  onChange: (field: SmokingTypeKey, checked: boolean) => void
  error?: string | null
  onErrorClear?: () => void
}

const options = [
  { label: 'IQOS', value: 'smokes_iqos' },
  { label: 'Vape', value: 'smokes_vape' },
  { label: 'Tobacco', value: 'smokes_tobacco' },
  { label: 'Cigarettes', value: 'smokes_cigs' },
]

export const SmokingTypesField: React.FC<SmokingTypesFieldProps> = ({
  value,
  smokingLevel,
  onChange,
  error,
  onErrorClear,
}) => {
  const values = options
    .filter((opt) => value[opt.value as SmokingTypeKey])
    .map((opt) => opt.value)

  const disabled = !smokingLevel

  return (
    <CheckboxGroupField
      label="Smoking Types"
      hint={disabled ? 'Select smoking level first' : 'Select all that apply'}
      error={error ?? undefined}
      values={values}
      onChange={(next) => {
        onErrorClear?.()
        options.forEach((opt) => {
          const checked = next.includes(opt.value)
          if (checked !== Boolean(value[opt.value as SmokingTypeKey])) {
            onChange(opt.value as SmokingTypeKey, checked)
          }
        })
      }}
      options={options.map((opt) => ({
        label: opt.label,
        value: opt.value,
      }))}
      direction="horizontal"
    />
  )
}
