import { ProfileCreateData } from "../../api/schema/create"
import { ProfileCreateFormState } from "../states"


// This function basically assures that we are collecting state correctly as per API data requirements
// Check that required fields are in place, omit sending optional as nulls
export function collectProfileCreateDataFromState(formState: ProfileCreateFormState): ProfileCreateData {
  // Validate required fields
  const requiredChecks = [
    { value: formState.profile.name, field: 'name' },
    { value: formState.profile.photo, field: 'photo' },
    { value: formState.about.birth_date, field: 'birth_date' },
    { value: formState.about.gender, field: 'gender' },
    { value: formState.about.is_couple, field: 'is_couple' },
    { value: formState.about.has_children, field: 'has_children' },
    { value: formState.rent_preferences.min_budget, field: 'min_budget' },
    { value: formState.rent_preferences.max_budget, field: 'max_budget' },
  ]

  const missingRequiredField = requiredChecks.find(check => check.value === null)
  if (missingRequiredField) {
    throw new Error(`${missingRequiredField.field} is required for creation`)
  }

  // Helper to filter out nulls from non-required fields
  const filterNonNullOptionalValues = <T extends Record<string, any>>(obj: T, requiredKeys: string[]): Partial<T> => {
    const result: Partial<T> = {}
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== null && !requiredKeys.includes(key)) {
        (result as any)[key] = value
      }
    })
    return result
  }

  return {
    profile: {
      name: formState.profile.name!,
      photo: formState.profile.photo!,
    },
    about: {
      birth_date: formState.about.birth_date!,
      gender: formState.about.gender!,
      is_couple: formState.about.is_couple!,
      has_children: formState.about.has_children!,
      ...filterNonNullOptionalValues(
        formState.about, ['birth_date', 'gender', 'is_couple', 'has_children']
      ) as Partial<Omit<ProfileCreateData['about'], 'birth_date' | 'gender' | 'is_couple' | 'has_children'>>,
    },
    rent_preferences: {
      min_budget: formState.rent_preferences.min_budget!,
      max_budget: formState.rent_preferences.max_budget!,
      ...filterNonNullOptionalValues(
        formState.rent_preferences, ['min_budget', 'max_budget']
      ) as Partial<Omit<ProfileCreateData['rent_preferences'], 'min_budget' | 'max_budget'>>,
    }
  }
}
