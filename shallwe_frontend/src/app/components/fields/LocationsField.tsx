import * as React from 'react'
import { LocationField } from '@/app/components/ui'

export interface LocationsFieldProps {
  value: string[]
  error?: string | null
  onChange: (value: string[]) => void
  onClearError: () => void
  initialLocationNames?: Record<string, string>
}

export const LocationsField: React.FC<LocationsFieldProps> = ({
  value,
  error,
  onChange,
  onClearError,
  initialLocationNames,
}) => (
  <LocationField
    label="Locations"
    hint={error ? undefined : 'Pick up to 30 distinct areas; overlaps auto-clear.'}
    error={error ?? undefined}
    value={value}
    onChange={onChange}
    onClearError={onClearError}
    initialLocationNames={initialLocationNames}
  />
)
