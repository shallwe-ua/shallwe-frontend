import { baseApiCall } from "@/lib/shallwe/common/api/calls"
import { LocationsReadFields } from "./schema"


// Search locations
export const searchLocations = async (query: string): Promise<LocationsReadFields> => {
  const params = new URLSearchParams({ query })
  // try {
    return baseApiCall(`locations/search/?${params}`) as Promise<LocationsReadFields>
//   }
//   catch (error) {
//     console.log((error as ApiError).status)
//     const apiError = error as ApiError
//     if ('status' in apiError && apiError.status === 404) {
//       return Promise.resolve(emptyLocationsReadData)
//     }
//     else throw error
//   }
}
