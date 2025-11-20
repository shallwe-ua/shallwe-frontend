import * as React from 'react'
import { FormField, FormFieldProps } from './primitives/form-field'
import { Input, InputProps } from './primitives/input'

export type NumberFieldProps = FormFieldProps &
  Omit<InputProps, 'type' | 'className'> & {
    inputClassName?: string
  }

export const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(
  (
    { label, description, hint, error, required, inputClassName, className, ...inputProps },
    ref
  ) => (
    <FormField
      label={label}
      description={description}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <Input ref={ref} type="number" className={inputClassName} {...inputProps} />
    </FormField>
  )
)
NumberField.displayName = 'NumberField'
