import * as React from 'react'
import { FormField, FormFieldProps } from './primitives/form-field'
import Locations from './Locations'

export interface LocationFieldProps extends Omit<FormFieldProps, 'children'> {
  value: string[]
  onChange: (value: string[]) => void
  error?: string | null
  onClearError: () => void
  initialLocationNames?: Record<string, string>
}

export const LocationField: React.FC<LocationFieldProps> = ({
  label,
  description,
  hint,
  error,
  required,
  className,
  value,
  onChange,
  onClearError,
  initialLocationNames,
}) => (
  <FormField
    label={label}
    description={description}
    hint={hint}
    error={error ?? undefined}
    required={required}
    className={className}
  >
    <Locations
      selectedLocations={value}
      initialLocationNames={initialLocationNames}
      onLocationsChange={onChange}
      error={error ?? undefined}
      onClearError={onClearError}
    />
  </FormField>
)
