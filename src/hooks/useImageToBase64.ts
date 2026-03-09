import { useState, useEffect } from 'react'
import { convertImageToBase64 } from '../utils/imageConverter'

/**
 * Custom hook for converting and caching image to base64
 * @param imageUrl - URL or path to the image
 * @returns Object containing base64 string, loading state, and error
 */
export const useImageToBase64 = (imageUrl: string) => {
  const [base64, setBase64] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadImage = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await convertImageToBase64(imageUrl)
        
        if (isMounted) {
          setBase64(result)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      isMounted = false
    }
  }, [imageUrl])

  return { base64, loading, error }
}
