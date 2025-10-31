import { ApiError, baseApiCall } from "@/lib/shallwe/common/api/calls"
import { ProfileStatusResponse } from "./schema"


// Profile status
export const getProfileStatus = async (serverCookies?: string): Promise<ProfileStatusResponse> => {
  try {
    await baseApiCall('access/profile-status/', {}, serverCookies)
    return { status: 200 }  // Authorized and profile exists
  }

  catch (error) {  // Catch expected (403/404), re-throw others
    const apiError = error as ApiError

    if ('status' in apiError) {
      if (apiError.status === 403) {
        return { status: 403 }  // Unauthorized
      }
      else if (apiError.status === 404) {
        return { status: 404 }  // Authorized, but no profile
      }
      else throw error  // Unexpected status - uknown error
    }
    else throw error  // No status - uknown error
  }
}
