import { env } from '@/config/env'


// --- HELPERS ---
export interface ApiError {
  message: string
  details?: any
}


const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined // Guard for server-side execution

  const value = ` ${document.cookie}`
  const parts = value.split(` ${name}=`)

  if (parts.length === 2) return parts.pop()?.split('').shift()

  return undefined
}


// --- BASE API CALL FUNCTION (TO EXTEND) ---
const baseApiCall = async (
  endpoint: string, options: RequestInit = {}, serverCookies?: string // Optional cookies string passed from server context (e.g., middleware)
): Promise<any> => {

  // Base config
  const { method = 'GET', headers = {}, body, ...restOptions } = options
  const url = `${env.NEXT_PUBLIC_SHALLWE_API_BASE_URL_EXTERNAL}/api/rest/${endpoint}`

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',  // Default, can be overridden
    ...(headers as Record<string, string>),  // Allow overriding defaults
  }

  // CSRF-token header
  let csrfToken: string | undefined = undefined

  if (!serverCookies && typeof window !== 'undefined') {
    csrfToken = getCookie('csrftoken')
  }

  if (csrfToken) {
    baseHeaders['X-CSRFToken'] = csrfToken
  }
  if (serverCookies) {
    baseHeaders['Cookie'] = serverCookies;
  }

  // Content-Type specific config
  let finalBody = body
  if (body) {
    if (body instanceof FormData) {
      delete baseHeaders['Content-Type']  // Browser will set it correctly with the boundary
    }
    else {
      finalBody = JSON.stringify(body)
    }
  }

  // API call logic
  try {
    const fetchOptions: RequestInit = {
      method,
      headers: baseHeaders,
      body: finalBody,
      ...restOptions,
    }

    if (!serverCookies) {
      fetchOptions.credentials = 'include' // Crucial for client-side: Include sessionid and csrftoken cookies
    }

    const response = await fetch(url, fetchOptions)

    // Handle HTTP errors
    if (!response.ok) {
      let errorData: any = { message: `HTTP Error: ${response.status} ${response.statusText}` }

      if (response.headers.get('content-type')?.includes('application/json')) {
        try {
          errorData = await response.json()
        }
        catch (e) {
          console.warn('Could not parse error response as JSON: ', e)
        }
      }

      const apiError: ApiError = {
        message: errorData.message || `HTTP Error: ${response.status}`,
        details: errorData,
      }
      throw apiError
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null
    }

    return response.json()
  }

  // Handle runtime errors (ours included)
  catch (error) {
    console.error(`API call failed for ${method} ${url}:`, error)

    if ((error as ApiError).message) {  // It's our defined error
      throw error
    }
    else {  // It's likely an unexpected error
      throw new Error(`Network or unexpected error during API call to ${url}: ${(error as Error).message}`)
    }
  }
}


// --- SPECIFIC API CALLS ---
// --- Auth ---
// Login
export const loginGoogle = async (code: string): Promise<any> => {
  return baseApiCall('auth/login/google/', {
    method: 'POST',
    body: { code } as any,
  })
}


// Logout
export const logout = async (): Promise<void> => {
  await baseApiCall('auth/logout/', {
    method: 'POST',
  })  // Note: The backend handles cookie invalidation. Frontend state cleanup is separate too.
}


// --- Access ---
// Profile status
export const getProfileStatus = async (serverCookies?: string): Promise<{ status: number }> => {
  try {
    await baseApiCall('access/profile-status/', {}, serverCookies)
    return { status: 200 }  // Authorized and profile exists
  }

  catch (error) {  // Catch expected (403/404), re-throw others
    const apiError = error as ApiError

    if (apiError.details && 'status' in apiError.details) {
      if (apiError.details.status === 403) {
        return { status: 403 }  // Unauthorized
      }
      else if (apiError.details.status === 404) {
        return { status: 404 }  // Authorized, but no profile
      }
      throw error
    }
    else {  // If details don't contain status, it's an unexpected issue
      throw error
    }
  }
}


// --- Profile ---
// Read profile
export const getProfile = async (): Promise<any> => {
  return baseApiCall('profile/me/')
}


// Create profile
export const createProfile = async (profileData: FormData): Promise<any> => {
  return baseApiCall('profile/me/', {
    method: 'POST',
    body: profileData,
  })
}


// Update profile
export const updateProfile = async (profileData: FormData): Promise<any> => {
  return baseApiCall('profile/me/', {
    method: 'PATCH',
    body: profileData,
  })
}


// Update profile visibility
export const updateProfileVisibility = async (isHidden: boolean): Promise<any> => {
  return baseApiCall('profile/visibility/', {
    method: 'PATCH',
    body: { is_hidden: isHidden } as any,
  })
}


// --- Locations ---
// Search locations
export const searchLocations = async (query: string): Promise<any> => {
  const params = new URLSearchParams({ query })
  return baseApiCall(`locations/search/?${params}`)
}


// --- Facecheck ---
// Perform facecheck
export const performFacecheck = async (imageFile: File): Promise<any> => {
  const formData = new FormData()
  formData.append('image', imageFile)

  return baseApiCall('photo/facecheck/', {
    method: 'POST',
    body: formData,
  })
}


// --- User ---
// Delete user
export const deleteUser = async (): Promise<void> => {
  await baseApiCall('auth/user/', {
    method: 'DELETE',
  })
}
