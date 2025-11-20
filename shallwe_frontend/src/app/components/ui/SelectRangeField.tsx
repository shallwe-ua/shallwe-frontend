import * as React from 'react'
import { FormField, FormFieldProps } from './primitives/form-field'
import { Select, SelectProps } from './primitives/select'
import { cn } from '@/lib/utils'

type SelectEndProps = Omit<SelectProps, 'className'> & { className?: string; label?: string }

export interface SelectRangeFieldProps extends FormFieldProps {
  fromProps: SelectEndProps
  toProps: SelectEndProps
  directionLabel?: string
}

export const SelectRangeField: React.FC<SelectRangeFieldProps> = ({
  label,
  description,
  hint,
  error,
  required,
  className,
  fromProps,
  toProps,
  directionLabel,
}) => (
  <FormField
    label={label}
    description={description}
    hint={hint}
    error={error}
    required={required}
    className={className}
  >
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <RangeSelect {...fromProps} />
      <RangeSelect {...toProps} />
    </div>
    {directionLabel && (
      <p className="text-xs text-muted-foreground">
        {directionLabel}
      </p>
    )}
  </FormField>
)

const RangeSelect: React.FC<SelectEndProps> = ({ label, className, children, ...props }) => (
  <div className="stack stack-xs">
    {label && <span className="text-sm font-semibold text-foreground">{label}</span>}
    <Select className={cn(className)} {...props}>
      {children}
    </Select>
  </div>
)
