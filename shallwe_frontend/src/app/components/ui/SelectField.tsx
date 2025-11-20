import * as React from 'react'
import { FormField, FormFieldProps } from './primitives/form-field'
import { Select, SelectProps } from './primitives/select'

export type SelectFieldProps = FormFieldProps &
  Omit<SelectProps, 'className'> & {
    selectClassName?: string
  }

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    { label, description, hint, error, required, selectClassName, className, children, ...selectProps },
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
      <Select ref={ref} className={selectClassName} {...selectProps}>
        {children}
      </Select>
    </FormField>
  )
)
SelectField.displayName = 'SelectField'
