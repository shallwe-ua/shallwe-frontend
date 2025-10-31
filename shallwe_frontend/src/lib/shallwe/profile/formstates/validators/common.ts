import { validateProfilePhotoFile } from "@/lib/shallwe/photo/formstates/validators"
import { ProfileCreateFormState } from "../states"


export const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}


export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}


export const isEmptyValue = (value: any): boolean => {
  return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
}


const getAge = (birthDate: Date): number => {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}


export const RU_UA_CHARS = /^[а-яА-ЯёЁіІїЇєЄґҐ'`]+$/u
export const RU_UA_CHARS_WITH_HYPHEN = /^[а-яА-ЯёЁіІїЇєЄґҐ\-`]+$/u
export const RU_UA_CHARS_WITH_SPACE = /^[а-яА-ЯёЁіІїЇєЄґҐ\s\-`]+$/u


type ProfileFieldValidator = (value: any, formData: ProfileCreateFormState) => string | null


interface StringListValidationConfig {
  maxItems: number
  itemName: string
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  patternError?: string
}


export const createStringListValidator = (config: StringListValidationConfig): ProfileFieldValidator => {
  return (value: string[] | null) => {
    if (!Array.isArray(value)) return `${config.itemName} must be a list, not ${typeof value}.`
    if (value.length === 0) return null // Empty list is a legit value
    
    if (value!.length > config.maxItems) {
      return `${config.itemName} list must have up to ${config.maxItems} items.`
    }
    
    const uniqueItems = new Set(value!)
    if (uniqueItems.size !== value!.length) {
      return `${config.itemName} list must have unique items.`
    }
    
    if (config.minLength || config.maxLength || config.pattern) {
      for (const item of value!) {
        if (config.pattern && !config.pattern.test(item)) {
          return config.patternError || `Some of ${config.itemName.toLowerCase()} have invalid format.`
        }
        if (config.minLength && config.maxLength) {
          if (item.length < config.minLength || item.length > config.maxLength) {
            return `Each ${config.itemName.toLowerCase()} must be between ${config.minLength} and ${config.maxLength} characters.`
          }
        }
      }
    }
    
    return null
  }
}


export const validators: Record<string, ProfileFieldValidator> = {

  'profile.name': (value: string | null) => {
    if (isEmptyValue(value)) return 'Name is required.'
    if (value!.length < 2 || value!.length > 16) return 'Name must be between 2 and 16 characters.'
    if (!RU_UA_CHARS.test(value!)) return 'Name must contain only RU/UA characters, apostrophe, or backtick.'
    return null
  },

  'profile.photo': (value: File | null) => {
    if (isEmptyValue(value)) return 'Photo is required.'
    else return validateProfilePhotoFile(value!)
  },

  'about.birth_date': (value: string | null) => {
    if (isEmptyValue(value)) return 'Birth date is required.'
    const age = getAge(new Date(value!))
    if (age < 16 || age > 120) return 'Age must be between 16 and 120.'
    return null
  },

  'about.gender': (value: number | null) => {
    if (isEmptyValue(value)) return 'Gender is required.'
    return null
  },

  'about.is_couple': (value: boolean | null) => {
    if (isEmptyValue(value)) return 'Is couple status is required.'
    return null
  },

  'about.has_children': (value: boolean | null) => {
    if (isEmptyValue(value)) return 'Has children status is required.'
    return null
  },

  'about.smoking_level': (value: number | null, formData: ProfileCreateFormState) => {
    if (value !== null && value !== undefined) {
      const hasSmokingType = formData.about.smokes_iqos || formData.about.smokes_vape || 
                             formData.about.smokes_tobacco || formData.about.smokes_cigs
      if (!hasSmokingType && value > 1) {
        return 'If smoking level is greater than 1, at least one smoking type must be selected.'
      }
      if (hasSmokingType && value <= 1) {
        return 'If smoking level is less than or equal to 1, none of smoking types can be selected.'
      }
    }
    return null
  },

  'about.smokes_iqos': (value: boolean | null) => {
    if (value === null || value === undefined) return 'Smokes IQOS field cannot be unset'
    return null
  },

  'about.smokes_vape': (value: boolean | null) => {
    if (value === null || value === undefined) return 'Smokes vape field cannot be unset'
    return null
  },

  'about.smokes_tobacco': (value: boolean | null) => {
    if (value === null || value === undefined) return 'Smokes tobacco field cannot be unset'
    return null
  },

  'about.smokes_cigs': (value: boolean | null) => {
    if (value === null || value === undefined) return 'Smokes cigarettes field cannot be unset'
    return null
  },

  'about.has_cats': (value: boolean | null) => {
    if (value === null || value === undefined) return 'Has cats field cannot be unset'
    return null
  },

  'about.has_dogs': (value: boolean | null) => {
    if (value === null || value === undefined) return 'Has dogs field cannot be unset'
    return null
  },

  'about.has_reptiles': (value: boolean | null) => {
    if (value === null || value === undefined) return 'Has reptiles field cannot be unset'
    return null
  },

  'about.has_birds': (value: boolean | null) => {
    if (value === null || value === undefined) return 'Has birds field cannot be unset'
    return null
  },

  'about.other_animals': createStringListValidator({
    maxItems: 5,
    itemName: 'Other animals',
    minLength: 2,
    maxLength: 32,
    pattern: RU_UA_CHARS_WITH_HYPHEN,
    patternError: 'Each animal name must contain only RU/UA characters, hyphen, or backtick.'
  }),

  'about.interests': createStringListValidator({
    maxItems: 5,
    itemName: 'Interests',
    minLength: 2,
    maxLength: 32,
    pattern: RU_UA_CHARS_WITH_SPACE,
    patternError: 'Each interest must contain only RU/UA characters, space, hyphen, or backtick.'
  }),

  'about.bio': (value: string | null) => {
    if (isEmptyValue(value)) return null
    if (value!.length > 1024) return 'Bio must be up to 1024 characters.'
    return null
  },

  'rent_preferences.min_budget': (value: number | null) => {
    if (isEmptyValue(value)) return 'Min budget is required.'
    if (value! < 0 || value! > 99999) return 'Min budget must be between 0 and 99999.'
    return null
  },

  'rent_preferences.max_budget': (value: number | null) => {
    if (isEmptyValue(value)) return 'Max budget is required.'
    if (value! < 0 || value! > 99999) return 'Max budget must be between 0 and 99999.'
    return null
  },

  'rent_preferences.min_rent_duration_level': (value: number | null) => {
    if (value === null || value === undefined) return 'Min rent duration level field cannot be unset'
    return null
  },

  'rent_preferences.max_rent_duration_level': (value: number | null) => {
    if (value === null || value === undefined) return 'Max rent duration level field cannot be unset'
    return null
  },

  'rent_preferences.room_sharing_level': (value: number | null) => {
    if (value === null || value === undefined) return 'Room sharing level field cannot be unset'
    return null
  },

  'rent_preferences.locations': createStringListValidator({
    maxItems: 30,
    itemName: 'Locations'
  })
}


export const validateProfileCrossFieldRules = (
  formData: ProfileCreateFormState,
  fieldsToValidate: string[]
): Record<string, string> => {
  const errors: Record<string, string> = {}

  // Budget relationship - show error on max_budget field
  if (fieldsToValidate.includes('rent_preferences.min_budget') || 
      fieldsToValidate.includes('rent_preferences.max_budget')) {
    const { min_budget, max_budget } = formData.rent_preferences
    if (min_budget !== null && max_budget !== null && min_budget > max_budget) {
      errors['rent_preferences.max_budget'] = 'Max budget must be greater than or equal to min budget.'
    }
  }

  // Duration relationship - show error on min_rent_duration_level field
  if (fieldsToValidate.includes('rent_preferences.min_rent_duration_level') || 
      fieldsToValidate.includes('rent_preferences.max_rent_duration_level')) {
    const { min_rent_duration_level, max_rent_duration_level } = formData.rent_preferences
    
    if ((min_rent_duration_level !== null && max_rent_duration_level === null) || 
        (min_rent_duration_level === null && max_rent_duration_level !== null)) {
      errors['rent_preferences.min_rent_duration_level'] = 'Both min and max duration levels must be provided together.'
    }
    else if (min_rent_duration_level !== null && max_rent_duration_level !== null && 
             min_rent_duration_level > max_rent_duration_level) {
      errors['rent_preferences.max_rent_duration_level'] = 'Max duration level must be greater than or equal to min duration level.'
    }
  }

  return errors
}
