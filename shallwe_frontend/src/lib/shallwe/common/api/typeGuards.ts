import { ApiError } from '@/lib/shallwe/common/api/calls'


export const isApiError = (error: any): error is ApiError => {
  return (
    error &&
    typeof error === 'object' &&
    'message' in error
  )
}
