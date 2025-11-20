import * as React from 'react'
import { FormField, FormFieldProps } from './primitives/form-field'
import ProfilePhotoPick from './ProfilePhotoPick'

export interface PhotoFieldProps extends Omit<FormFieldProps, 'children'> {
  value: File | null
  initialPhotoUrl?: string | null
  onChange: (file: File | null) => void
  onError: (error: string) => void
  onClearError: () => void
  validateRawFile?: (file: File) => string | null
  validateCroppedFile?: (file: File) => Promise<string | null>
}

export const PhotoField: React.FC<PhotoFieldProps> = ({
  label,
  description,
  hint,
  error,
  required,
  className,
  value,
  initialPhotoUrl,
  onChange,
  onError,
  onClearError,
  validateRawFile,
  validateCroppedFile,
}) => (
  <FormField
    label={label}
    description={description}
    hint={hint}
    error={error}
    required={required}
    className={className}
  >
    <ProfilePhotoPick
      initialFile={value}
      initialPhotoUrl={initialPhotoUrl}
      onCropComplete={onChange}
      onError={onError}
      onClearError={onClearError}
      validateRawFile={validateRawFile}
      validateCroppedFile={validateCroppedFile}
    />
  </FormField>
)
