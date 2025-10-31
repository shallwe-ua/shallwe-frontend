export const MAX_PHOTO_FILE_SIZE = 20 * 1024 * 1024  // 20 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif']


export const validateProfilePhotoFile = (value: File) => {
  if (!ALLOWED_IMAGE_TYPES.includes(value!.type.toLowerCase())) {
    return 'Photo must be JPG, JPEG, PNG, HEIC, or HEIF.'
  }
  if (value!.size > MAX_PHOTO_FILE_SIZE) return 'Photo file size must be under 20MB.'
  return null
}
