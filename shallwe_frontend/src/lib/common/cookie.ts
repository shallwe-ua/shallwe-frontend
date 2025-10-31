export const getDocumentCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') {
    console.warn(`${getDocumentCookie.name}: 'document' is not available (likely running on the server).`)
    return undefined
  }

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  
  if (parts.length === 2) return parts.pop()?.split(';').shift()
}
