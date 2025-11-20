import * as React from 'react'
import { FormField, FormFieldProps } from './primitives/form-field'
import { Checkbox, CheckboxProps } from './primitives/checkbox'
import { cn } from '@/lib/utils'

export type CheckboxFieldProps = FormFieldProps &
  Omit<CheckboxProps, 'className'> & {
    checkboxClassName?: string
    labelText?: string
    descriptionText?: string
  }

export const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(
  (
    {
      label,
      description,
      hint,
      error,
      required,
      className,
      checkboxClassName,
      labelText,
      descriptionText,
      ...checkboxProps
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
      <label className="flex cursor-pointer items-start gap-3">
        <Checkbox ref={ref} className={cn(checkboxClassName)} {...checkboxProps} />
        <div className="space-y-0.5">
          {labelText && <span className="text-sm font-semibold text-foreground">{labelText}</span>}
          {descriptionText && <p className="text-xs text-muted-foreground">{descriptionText}</p>}
        </div>
      </label>
    </FormField>
  )
)
CheckboxField.displayName = 'CheckboxField'
