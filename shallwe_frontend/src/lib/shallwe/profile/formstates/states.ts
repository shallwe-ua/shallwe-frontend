import { ProfileCreateData } from "../api/schema/create"
import { ProfileReadData } from "../api/schema/read"
import { extractHierarchyStrings } from "./collectors/update"


type UndefinedForbidden<T> = Exclude<T, undefined>


type ProfileCreateFormStateField<T> = 
  T extends any[] ? UndefinedForbidden<T> :
  UndefinedForbidden<T> | null


// For CreateFormState fields primitives are nullable (for initial)
// Undefined/optional is dropped everywhere to keep all fields explicitly tracked
type ProfileCreateFormStateFieldsRequired<T> = {
  [K in keyof T]-?: ProfileCreateFormStateField<T[K]>
}


export interface ProfileCreateFormState {
  profile: ProfileCreateFormStateFieldsRequired<ProfileCreateData['profile']>
  about: ProfileCreateFormStateFieldsRequired<ProfileCreateData['about']>
  rent_preferences: ProfileCreateFormStateFieldsRequired<ProfileCreateData['rent_preferences']>
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


// For CreateFormState fields primitives are nullable (for initial)
// Undefined/optional is dropped everywhere to keep all fields explicitly tracked
type ProfileUpdateFormStateFieldsRequired<T> = {
  [K in keyof T]-?: UndefinedForbidden<T[K]>
}


export interface ProfileUpdateFormState {
  profile: ProfileUpdateFormStateFieldsRequired<Omit<ProfileCreateData['profile'], 'photo'>> & {
    photo: File | null
  }
  about: ProfileUpdateFormStateFieldsRequired<ProfileCreateData['about']>
  rent_preferences: ProfileUpdateFormStateFieldsRequired<ProfileCreateData['rent_preferences']>
}


export const getProfileUpdateFormStateInitial = (initialProfileData: ProfileReadData): ProfileUpdateFormState => {
 // Initialize editFormState from initialProfileData
  // Required fields are pre-populated from profileData
  const ProfileUpdateFormStateInitial: ProfileUpdateFormState = {
    profile: {
      name: initialProfileData.profile.name,
      photo: null, // Initialize photo to null, meaning "no change intended". The cropper will show the existing photo URL.
    },
    about: {
      birth_date: initialProfileData.about.birth_date,
      gender: initialProfileData.about.gender,
      is_couple: initialProfileData.about.is_couple,
      has_children: initialProfileData.about.has_children,
      // Initialize other 'about' fields from profileData
      occupation_type: initialProfileData.about.occupation_type,
      drinking_level: initialProfileData.about.drinking_level,
      smoking_level: initialProfileData.about.smoking_level,
      smokes_iqos: initialProfileData.about.smokes_iqos,
      smokes_vape: initialProfileData.about.smokes_vape,
      smokes_tobacco: initialProfileData.about.smokes_tobacco,
      smokes_cigs: initialProfileData.about.smokes_cigs,
      neighbourliness_level: initialProfileData.about.neighbourliness_level,
      guests_level: initialProfileData.about.guests_level,
      parties_level: initialProfileData.about.parties_level,
      bedtime_level: initialProfileData.about.bedtime_level,
      neatness_level: initialProfileData.about.neatness_level,
      has_cats: initialProfileData.about.has_cats,
      has_dogs: initialProfileData.about.has_dogs,
      has_reptiles: initialProfileData.about.has_reptiles,
      has_birds: initialProfileData.about.has_birds,
      other_animals: initialProfileData.about.other_animals || [],
      interests: initialProfileData.about.interests || [],
      bio: initialProfileData.about.bio,
    },
    rent_preferences: {
      min_budget: initialProfileData.rent_preferences.min_budget,
      max_budget: initialProfileData.rent_preferences.max_budget,
      min_rent_duration_level: initialProfileData.rent_preferences.min_rent_duration_level,
      max_rent_duration_level: initialProfileData.rent_preferences.max_rent_duration_level,
      room_sharing_level: initialProfileData.rent_preferences.room_sharing_level,
      locations: extractHierarchyStrings(initialProfileData.rent_preferences.locations), // Convert object to array
    }
  }

  return ProfileUpdateFormStateInitial
}
