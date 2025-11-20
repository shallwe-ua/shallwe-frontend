import * as React from 'react'
import { SelectField } from '@/app/components/ui'

export interface RoomSharingLevelFieldProps {
  value: number | null
  error?: string | null
  onChange: (value: number | null) => void
  onErrorClear?: () => void
}

export const RoomSharingLevelField: React.FC<RoomSharingLevelFieldProps> = ({
  value,
  error,
  onChange,
  onErrorClear,
}) => (
  <SelectField
    label="Room Sharing Level"
    error={error ?? undefined}
    value={value ?? ''}
    onChange={(e) => {
      onErrorClear?.()
      onChange(e.target.value ? Number(e.target.value) : null)
    }}
  >
    <option value="">Select...</option>
    <option value="1">Private Room Only</option>
    <option value="2">Shared Room Possible</option>
    <option value="3">Flexible (Any Arrangement)</option>
  </SelectField>
)
