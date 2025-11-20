import * as React from 'react'
import { FormField, FormFieldProps } from './primitives/form-field'
import { Checkbox, CheckboxProps } from './primitives/checkbox'
import { cn } from '@/lib/utils'

export type CheckboxGroupOption = {
  label: string
  value: string
  description?: string
  checkboxProps?: Omit<CheckboxProps, 'value' | 'checked' | 'onChange'>
}

export interface CheckboxGroupFieldProps extends FormFieldProps {
  values: string[]
  onChange: (values: string[]) => void
  options: CheckboxGroupOption[]
  direction?: 'vertical' | 'horizontal'
}

export const CheckboxGroupField: React.FC<CheckboxGroupFieldProps> = ({
  label,
  description,
  hint,
  error,
  required,
  className,
  values,
  onChange,
  options,
  direction = 'vertical',
}) => {
  const toggleValue = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...new Set([...values, value])])
    } else {
      onChange(values.filter((v) => v !== value))
    }
  }

  return (
    <FormField
      label={label}
      description={description}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div className={cn('flex gap-3', direction === 'vertical' ? 'flex-col' : 'flex-wrap')}>
        {options.map((option) => {
          const checked = values.includes(option.value)
          return (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border border-border bg-card px-3.5 py-3 transition hover:border-primary"
            >
              <Checkbox
                checked={checked}
                onChange={(e) => toggleValue(option.value, e.target.checked)}
                {...option.checkboxProps}
              />
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">{option.label}</div>
                {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
              </div>
            </label>
          )
        })}
      </div>
    </FormField>
  )
}
