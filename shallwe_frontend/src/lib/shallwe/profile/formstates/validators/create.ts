import { ProfileCreateFormState } from '../states'
import { getNestedValue, validateProfileCrossFieldRules, ValidationResult, validators } from './common'


export const validateProfileCreateFields = (
  formState: ProfileCreateFormState, 
  fieldsToValidate: string[]
): ValidationResult => {
  const errors: Record<string, string> = {}

  // Validate individual fields
  for (const fieldPath of fieldsToValidate) {
    const validator = validators[fieldPath]
    if (validator) {
      const value = getNestedValue(formState, fieldPath)
      const error = validator(value, formState)
      if (error) {
        errors[fieldPath] = error
      }
    }
  }

  // Validate cross-field relationships
  const crossFieldErrors = validateProfileCrossFieldRules(formState, fieldsToValidate)
  Object.assign(errors, crossFieldErrors)

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
