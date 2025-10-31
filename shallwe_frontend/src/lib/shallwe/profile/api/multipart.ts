import { ProfileCreateData } from "./schema/create"
import { ProfileUpdateData } from "./schema/update"


/** Converts JSON-like data object into the multipart format that backend expects
* 
*   Rules:
*   - group__field -> simple field key
*   - group__field[] -> list field key
*   - string 'null' for nulls
*/
export const formatMultipartFormData = (data: ProfileCreateData | ProfileUpdateData): FormData => {
  const formData = new FormData()

  const parseParamGroup = (groupName: keyof (ProfileCreateData | ProfileUpdateData)) => {
    const groupData: Record<string, any> | undefined = data[groupName]

    if (!groupData) return

    Object.entries(groupData).forEach(([key, value]) => {
      const baseKey = `${groupName}__${key}`
      const appendValue = (value: any, key?: string) => formData.append(key ? key : baseKey, value)
      
      if (value !== undefined) {
        if (value === null) appendValue('null')  // Make nulls backend-friendly
        else if (value instanceof File) appendValue(value)  // Handle Files as is
        else if (Array.isArray(value)) {
          const listKey = `${baseKey}[]`
          if (value.length === 0) appendValue('', listKey)  // Handle empty lists -> backend expects [] marker
          else value.forEach(item => appendValue(item, listKey))
        }
        else appendValue(value.toString())  // Stringify the rest
      }
    })
  }

  (Object.keys(data) as Array<keyof (ProfileCreateData | ProfileUpdateData)>).forEach(groupName => {
    parseParamGroup(groupName)
  })

  return formData
}
