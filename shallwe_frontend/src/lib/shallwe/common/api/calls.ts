import { env } from '@/config/env'


// --- HELPERS ---
export interface ApiError {
  message: string
  details?: any
}


export const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined // Guard for server-side execution

  const value = ` ${document.cookie}`
  const parts = value.split(` ${name}=`)

  if (parts.length === 2) return parts.pop()?.split('').shift()

  return undefined
}


// --- BASE API CALL FUNCTION (TO EXTEND) ---
export const baseApiCall = async (
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

    return response.text().then(text => text ? JSON.parse(text) : null)  // Avoid error when body is empty
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
