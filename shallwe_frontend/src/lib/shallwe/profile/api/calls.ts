/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseApiCall } from "@/lib/shallwe/common/api/calls"
import { ProfileCreateData } from "./schema/create"
import { ProfileUpdateData } from "./schema/update"
import { formatMultipartFormData } from "./multipart"


// Read profile
export const getProfile = async (): Promise<any> => {
  return baseApiCall('profile/me/')
}


// Create profile
export const createProfile = async (profileData: ProfileCreateData): Promise<any> => {
  const formData = formatMultipartFormData(profileData)

  return baseApiCall('profile/me/', {
    method: 'POST',
    body: formData,
  })
}


// Update profile
export const updateProfile = async (profileData: ProfileUpdateData): Promise<any> => {
  const formData = formatMultipartFormData(profileData)
  formData.entries().forEach((pair) => console.log(pair[0], ':', pair[1]))

  return baseApiCall('profile/me/', {
    method: 'PATCH',
    body: formData,
  })
}


// Update profile visibility
export const updateProfileVisibility = async (isHidden: boolean): Promise<any> => {
  return baseApiCall('profile/visibility/', {
    method: 'PATCH',
    body: { is_hidden: isHidden } as any,
  })
}
