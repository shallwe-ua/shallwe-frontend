import * as React from 'react'
import { FormField, FormFieldProps } from './primitives/form-field'
import { Input, InputProps } from './primitives/input'
import { cn } from '@/lib/utils'

type NumberEndProps = Omit<InputProps, 'type' | 'className'> & {
  className?: string
  label?: string
}

export interface NumberRangeFieldProps extends FormFieldProps {
  minProps: NumberEndProps
  maxProps: NumberEndProps
}

export const NumberRangeField = React.forwardRef<HTMLDivElement, NumberRangeFieldProps>(
  ({ label, description, hint, error, required, className, minProps, maxProps }, ref) => (
    <FormField
      ref={ref}
      label={label}
      description={description}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <RangeInput {...minProps} />
        <RangeInput {...maxProps} />
      </div>
    </FormField>
  )
)
NumberRangeField.displayName = 'NumberRangeField'

const RangeInput: React.FC<NumberEndProps> = ({ label, className, ...props }) => (
  <div className="stack stack-xs">
    {label && <span className="text-sm font-semibold text-foreground">{label}</span>}
    <Input type="number" className={cn(className)} {...props} />
  </div>
)
