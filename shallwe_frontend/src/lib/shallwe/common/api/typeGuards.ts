import { ApiError } from '@/lib/shallwe/common/api/calls'


export const isApiError = (error: unknown): error is ApiError => {
  return typeof error === 'object' && error !== null && 'message' in error
}
