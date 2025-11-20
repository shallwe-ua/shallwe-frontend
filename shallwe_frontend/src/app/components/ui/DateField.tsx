import * as React from 'react'

import { FormField, FormFieldProps } from './primitives/form-field'
import BirthDateSelect from './BirthDateSelect'

export interface DateFieldProps extends Omit<FormFieldProps, 'children'> {
  value: string | null
  onChange: (value: string) => void
}

export const DateField: React.FC<DateFieldProps> = ({
  label,
  description,
  hint,
  error,
  required,
  className,
  value,
  onChange,
}) => {
  return (
    <FormField
      label={label}
      description={description}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <BirthDateSelect
        inputId="birth-date"
        currentValue={value}
        onChange={onChange}
        error={error}
      />
    </FormField>
  )
}
