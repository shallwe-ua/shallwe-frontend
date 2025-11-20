import * as React from 'react'
import { TagField } from '@/app/components/ui'

export interface InterestsTagsFieldProps {
  value: string[]
  error?: string | null
  onChange: (value: string[]) => void
  validator?: (value: string[]) => string | null
  onErrorClear?: () => void
}

export const InterestsTagsField: React.FC<InterestsTagsFieldProps> = ({
  value,
  error,
  onChange,
  validator,
  onErrorClear,
}) => (
  <TagField
    label="Interests (up to 5)"
    hint={error ? undefined : 'Press Enter to add each hobby.'}
    error={error ?? undefined}
    value={value}
    onChange={(tags) => {
      onErrorClear?.()
      onChange(tags)
    }}
    beforeAddValidate={
      validator
        ? (newTag, currentTags) => {
            const candidate = [...currentTags, newTag]
            const validationError = validator(candidate)
            if (validationError) return false
            return true
          }
        : undefined
    }
    isEditOnRemove
    placeholder="Press Enter to add"
  />
)
