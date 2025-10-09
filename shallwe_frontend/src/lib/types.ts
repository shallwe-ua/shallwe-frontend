// --- API Response Types ---
export interface ProfileStatusResponse {
  status: number   // 200, 403, 404
}


// --- API Error Response Type ---
export interface ApiErrorResponse {
  error?: string | Record<string, any>  // Can be a simple string or a structured object like {profile: {name: ["error"]}}
}


// --- Profile Data Type ---
export interface UserProfile {
  profile: {
  is_hidden: boolean
  name: string
  photo_w768: string  // Photo url in different sizes (per specific usages)
  photo_w540: string
  photo_w192: string
  photo_w64: string
  }
  rent_preferences: {
    min_budget: number
    max_budget: number
    min_rent_duration_level?: number
    max_rent_duration_level?: number
    room_sharing_level: number
    locations: LocationsData  // Defined below
  }
  about: {
    birth_date: string  // YYYY-MM-DD
    gender: 1 | 2  // Per API spec
    is_couple: boolean
    has_children: boolean
    occupation_type?: 1 | 2 | 3 | 4
    drinking_level?: 1 | 2 | 3 | 4
    smoking_level?: 1 | 2 | 3 | 4
    smokes_iqos?: boolean
    smokes_vape?: boolean
    smokes_tobacco?: boolean
    smokes_cigs?: boolean
    neighbourliness_level?: 1 | 2 | 3
    guests_level?: 1 | 2 | 3
    parties_level?: 1 | 2 | 3
    bedtime_level?: 1 | 2 | 3 | 4
    neatness_level?: 1 | 2 | 3
    has_cats?: boolean
    has_dogs?: boolean
    has_reptiles?: boolean
    has_birds?: boolean
    other_animals?: string[]  // Up to 5 strings
    interests?: string[]  // Up to 5 strings
    bio?: string  // Up to 1024 chars
  }
}


// --- Locations Data Type ---
export interface LocationsData {
  regions?: Region[]
  cities?: City[]
  other_ppls?: OtherPpl[]
}

export interface Region {
  hierarchy: string
  region_name: string
}

export interface City {
  hierarchy: string
  region_name: string
  ppl_name: string
  districts?: District[]
}

export interface District {
  hierarchy: string
  district_name: string
}

export interface OtherPpl {
  hierarchy: string
  region_name: string
  subregion_name: string
  ppl_name: string
}


// --- API Request Body Type (Profile Creation/Update) ---
// These might be represented differently in the component state before being converted to FormData
export interface ProfileFormData {
  profile: {
    name: string
    photo?: File  // File object for upload
  }
  about: {
    birth_date: string  // YYYY-MM-DD
    gender: 1 | 2
    is_couple: boolean
    has_children: boolean
    occupation_type?: 1 | 2 | 3 | 4
    drinking_level?: 1 | 2 | 3 | 4
    smoking_level?: 1 | 2 | 3 | 4
    smokes_iqos?: boolean
    smokes_vape?: boolean
    smokes_tobacco?: boolean
    smokes_cigs?: boolean
    neighbourliness_level?: 1 | 2 | 3
    guests_level?: 1 | 2 | 3
    parties_level?: 1 | 2 | 3
    bedtime_level?: 1 | 2 | 3 | 4
    neatness_level?: 1 | 2 | 3
    has_cats?: boolean
    has_dogs?: boolean
    has_reptiles?: boolean
    has_birds?: boolean
    other_animals?: string[]
    interests?: string[]
    bio?: string
  }
  rent_preferences: {
    min_budget: number
    max_budget: number
    min_rent_duration_level?: number
    max_rent_duration_level?: number
    room_sharing_level?: 1 | 2 | 3
    locations: string[]  // Array of hierarchy strings
  }
}
