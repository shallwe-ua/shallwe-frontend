// Shared validation field lists to keep setup and settings in sync

export const PROFILE_FIELDS_TO_VALIDATE = ['profile.name', 'profile.photo'] as const

export const ABOUT_FIELDS_TO_VALIDATE = [
  'about.birth_date',
  'about.gender',
  'about.is_couple',
  'about.has_children',
  'about.smoking_level',
  'about.other_animals',
  'about.interests',
  'about.bio',
  'about.occupation_type',
  'about.drinking_level',
  'about.neighbourliness_level',
  'about.guests_level',
  'about.parties_level',
  'about.bedtime_level',
  'about.neatness_level',
  'about.has_cats',
  'about.has_dogs',
  'about.has_reptiles',
  'about.has_birds',
  'about.smokes_iqos',
  'about.smokes_vape',
  'about.smokes_tobacco',
  'about.smokes_cigs',
] as const

export const RENT_PREFERENCES_FIELDS_TO_VALIDATE = [
  'rent_preferences.min_budget',
  'rent_preferences.max_budget',
  'rent_preferences.min_rent_duration_level',
  'rent_preferences.max_rent_duration_level',
  'rent_preferences.room_sharing_level',
  'rent_preferences.locations',
] as const

// Setup-specific step groupings reuse the same primitive lists to avoid drift
export const SETUP_STEP_0_FIELDS_TO_VALIDATE = PROFILE_FIELDS_TO_VALIDATE

export const SETUP_STEP_1_FIELDS_TO_VALIDATE = [
  'about.birth_date',
  'about.gender',
  'about.is_couple',
  'about.has_children',
  'about.smoking_level',
  'about.other_animals',
  'about.interests',
  'about.bio',
] as const

export const SETUP_STEP_2_FIELDS_TO_VALIDATE = [
  'rent_preferences.min_budget',
  'rent_preferences.max_budget',
  'rent_preferences.min_rent_duration_level',
  'rent_preferences.max_rent_duration_level',
  'rent_preferences.locations',
] as const
