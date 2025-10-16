import { baseApiCall } from "@/lib/shallwe/common/api/calls"


// Perform facecheck
export const performFacecheck = async (imageFile: File): Promise<any> => {
  const formData = new FormData()
  formData.append('image', imageFile)

  return baseApiCall('photo/facecheck/', {
    method: 'POST',
    body: formData,
  })
}
