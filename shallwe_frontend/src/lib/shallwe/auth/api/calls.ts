/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseApiCall } from '@/lib/shallwe/common/api/calls'


// Login
export const loginGoogle = async (code: string): Promise<{key: string}> => {
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


// Delete user
export const deleteUser = async (): Promise<void> => {
  await baseApiCall('auth/user/', {
    method: 'DELETE',
  })
}
