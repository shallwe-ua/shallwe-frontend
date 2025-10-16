import { ProfileCreateData } from "./schema/create"
import { ProfileUpdateData } from "./schema/update"


// This parses our JSON-like contract format into final multipart format that API expects
export const formatMultipartFormData = (data: ProfileCreateData | ProfileUpdateData): FormData => {
  const formData = new FormData()


  const parseParamGroup = (groupName: keyof (ProfileCreateData | ProfileUpdateData)) => {
    const groupData: Record<string, any> | undefined = data[groupName]

    if (!groupData) return

    Object.entries(groupData).forEach(([key, value]) => {
      const formKey = `${groupName}[${key}]`
      const appendValue = (value: any) => formData.append(formKey, value)
      
      if (value !== undefined) {
        if (value === null) appendValue('null')  // Make nulls backend-friendly
        else if (value instanceof File) appendValue(value)  // Handle Files as is
        else if (Array.isArray(value)) value.forEach(item => appendValue(item))  // Flatten arrays
        else appendValue(value.toString())  // Stringify the rest
      }
    })
  }


  (Object.keys(data) as Array<keyof (ProfileCreateData | ProfileUpdateData)>).forEach(groupName => {
    parseParamGroup(groupName)
  })

  return formData
}
