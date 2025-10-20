import { LocationsReadFields } from "@/lib/shallwe/locations/api/schema"
import { AboutBaseFields, RentPreferencesBaseFields } from "./common"


export interface ProfileProfileReadFields {
    is_hidden: boolean
    name: string
    photo_w768: string  // Photo url in different sizes (per specific usages)
    photo_w540: string
    photo_w192: string
    photo_w64: string
}


export interface ProfileReadData {
  profile: ProfileProfileReadFields
  rent_preferences: RentPreferencesBaseFields & {
    locations: LocationsReadFields
  }
  about: AboutBaseFields
}
