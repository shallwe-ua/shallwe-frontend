import * as React from 'react'
import { PhotoField } from '@/app/components/ui'
import { performFacecheck } from '@/lib/shallwe/photo/api/calls'
import { validateProfilePhotoFile } from '@/lib/shallwe/photo/formstates/validators'

export interface ProfilePhotoFieldProps {
  value: File | null
  initialPhotoUrl?: string | null
  error?: string | null
  onChange: (file: File | null) => void
  onError: (error: string) => void
  onErrorClear: () => void
}

export const ProfilePhotoField: React.FC<ProfilePhotoFieldProps> = ({
  value,
  initialPhotoUrl,
  error,
  onChange,
  onError,
  onErrorClear,
}) => (
  <PhotoField
    label="Profile Photo"
    description="Clear, square photos crop best."
    required
    value={value}
    initialPhotoUrl={initialPhotoUrl}
    error={error ?? undefined}
    onChange={onChange}
    onError={onError}
    onClearError={onErrorClear}
    validateRawFile={validateProfilePhotoFile}
    validateCroppedFile={async (file) => {
      try {
        const result = await performFacecheck(file)
        if (!result.success) {
          return result.error || 'Facecheck failed. Please ensure your photo contains a clear face.'
        }
        return null
      } catch (facecheckError) {
        const message = facecheckError instanceof Error ? facecheckError.message : 'An error occurred during photo validation.'
        return message
      }
    }}
  />
)
