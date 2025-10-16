import { baseApiCall } from "@/lib/shallwe/common/api/calls"


// Search locations
export const searchLocations = async (query: string): Promise<any> => {
  const params = new URLSearchParams({ query })
  return baseApiCall(`locations/search/?${params}`)
}
