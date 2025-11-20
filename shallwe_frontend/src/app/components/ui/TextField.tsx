import * as React from 'react'
import { FormField, FormFieldProps } from './primitives/form-field'
import { Input, InputProps } from './primitives/input'

export type TextFieldProps = FormFieldProps &
  Omit<InputProps, 'className'> & {
    inputClassName?: string
  }

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      description,
      hint,
      error,
      required,
      inputClassName,
      className,
      ...inputProps
    },
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
      <Input ref={ref} className={inputClassName} {...inputProps} />
    </FormField>
  )
)
TextField.displayName = 'TextField'
