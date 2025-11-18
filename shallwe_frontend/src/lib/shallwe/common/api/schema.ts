/* eslint-disable @typescript-eslint/no-explicit-any */
// --- API Error Response Type ---
export interface ApiErrorResponse {
  error?: string | Record<string, any>  // Can be a simple string or a structured object like {profile: {name: ["error"]}}
}
