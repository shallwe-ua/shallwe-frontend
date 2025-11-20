import * as React from 'react'
import { FormField, FormFieldProps } from './primitives/form-field'
import { Radio, RadioProps } from './primitives/radio'
import { cn } from '@/lib/utils'

type RadioOption = {
  label: string
  value: string
  description?: string
  radioProps?: Omit<RadioProps, 'value' | 'name' | 'checked' | 'onChange'>
}

export interface RadioGroupFieldProps extends FormFieldProps {
  name: string
  value: string | null
  onChange: (value: string) => void
  options: RadioOption[]
  direction?: 'vertical' | 'horizontal'
}

export const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  label,
  description,
  hint,
  error,
  required,
  className,
  name,
  value,
  onChange,
  options,
  direction = 'vertical',
}) => (
  <FormField
    label={label}
    description={description}
    hint={hint}
    error={error}
    required={required}
    className={className}
  >
    <div className={cn('flex gap-3', direction === 'vertical' ? 'flex-col' : 'flex-wrap')}>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border border-border bg-card px-3.5 py-3 transition hover:border-primary"
        >
          <Radio
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            {...option.radioProps}
          />
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">{option.label}</div>
            {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
          </div>
        </label>
      ))}
    </div>
  </FormField>
)
