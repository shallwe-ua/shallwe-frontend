export interface AboutBaseFields {
  birth_date: string  // YYYY-MM-DD
  gender: 1 | 2  // m | f
  is_couple: boolean
  has_children: boolean
  occupation_type: 1 | 2 | 3 | 4 | null
  drinking_level: 1 | 2 | 3 | 4 | null
  smoking_level: 1 | 2 | 3 | 4 | null
  smokes_iqos: boolean
  smokes_vape: boolean
  smokes_tobacco: boolean
  smokes_cigs: boolean
  neighbourliness_level: 1 | 2 | 3 | null
  guests_level: 1 | 2 | 3 | null
  parties_level: 1 | 2 | 3 | null
  bedtime_level: 1 | 2 | 3 | 4 | null
  neatness_level: 1 | 2 | 3 | null
  has_cats: boolean
  has_dogs: boolean
  has_reptiles: boolean
  has_birds: boolean
  other_animals: string[]  // Up to 5 strings
  interests: string[]  // Up to 5 strings
  bio: string | null  // Up to 1024 chars
}


export interface RentPreferencesBaseFields {
  min_budget: number
  max_budget: number
  min_rent_duration_level: number
  max_rent_duration_level: number
  room_sharing_level: number
}
