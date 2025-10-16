import { ProfileCreateData } from "../api/schema/create"


type UndefinedForbidden<T> = Exclude<T, undefined>


type ProfileCreateFormStateField<T> = 
  T extends any[] ? UndefinedForbidden<T> :
  UndefinedForbidden<T> | null


// For FormState fields primitives are nullable
// Undefined/optional is dropped everywhere to keep all fields explicitly tracked
type ProfileCreateFormStateFieldsRequired<T> = {
  [K in keyof T]-?: ProfileCreateFormStateField<T[K]>
}


type ProfileFormStateProfileFields = ProfileCreateFormStateFieldsRequired<ProfileCreateData['profile']>
type ProfileFormStateAboutFields = ProfileCreateFormStateFieldsRequired<ProfileCreateData['about']>
type ProfileFormStateRentPreferencesFields = ProfileCreateFormStateFieldsRequired<ProfileCreateData['rent_preferences']>


export interface ProfileCreateFormState {
  profile: ProfileFormStateProfileFields
  about: ProfileFormStateAboutFields
  rent_preferences: ProfileFormStateRentPreferencesFields
}


// Initial State
export const ProfileCreateFormStateInitial: ProfileCreateFormState = {
  profile: {
    name: null,
    photo: null
  },
  about: {
    birth_date: null,
    gender: null,
    is_couple: null,
    has_children: null,
    occupation_type: null,
    drinking_level: null,
    smoking_level: null,
    smokes_iqos: null,
    smokes_vape: null,
    smokes_tobacco: null,
    smokes_cigs: null,
    neighbourliness_level: null,
    guests_level: null,
    parties_level: null,
    bedtime_level: null,
    neatness_level: null,
    has_cats: null,
    has_dogs: null,
    has_reptiles: null,
    has_birds: null,
    other_animals: [],
    interests: [],
    bio: null
  },
  rent_preferences: {
    min_budget: null,
    max_budget: null,
    min_rent_duration_level: null,
    max_rent_duration_level: null,
    room_sharing_level: null,
    locations: []
  }
}
