import { AboutBaseFields, RentPreferencesBaseFields } from "./common"


export interface ProfileCreateProfileFields {
  name: string
  photo: File
}


export interface LocationsCreateFields {
  locations?: string[]
}


export interface ProfileCreateData {
  profile: ProfileCreateProfileFields

  about: {
    birth_date: string  // YYYY-MM-DD
    gender: 1 | 2
    is_couple: boolean
    has_children: boolean
  } & Partial<Omit<AboutBaseFields, 'birth_date' | 'gender' | 'is_couple' | 'has_children'>>  // Other optional fields

  rent_preferences: {
    min_budget: number
    max_budget: number
  } & Partial<Omit<RentPreferencesBaseFields, 'min_budget' | 'max_budget'>> // Other optional fields
    & LocationsCreateFields
}
