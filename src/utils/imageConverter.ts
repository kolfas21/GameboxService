/**
 * Utility for converting images to base64 format
 * Used for embedding images in print templates
 */

/**
 * Converts an image URL to base64 string
 * @param imageUrl - URL or path to the image
 * @returns Promise<string> - Base64 encoded image string
 */
export const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert image to base64'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error converting image to base64:', error)
    throw error
  }
}

/**
 * Preloads an image and returns base64 string
 * Useful for ensuring image is loaded before printing
 * @param imageUrl - URL or path to the image
 * @returns Promise<string> - Base64 encoded image string
 */
export const preloadImageAsBase64 = async (imageUrl: string): Promise<string> => {
  return convertImageToBase64(imageUrl)
}
