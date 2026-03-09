/**
 * Utilidades para sanitización de inputs del usuario
 * Previene ataques XSS y asegura que los datos estén limpios antes de guardarlos
 */

export const sanitizeInput = {
  /**
   * Sanitiza texto básico (nombres, descripciones, observaciones)
   * Elimina scripts y etiquetas HTML, limita caracteres
   */
  text: (input: string): string => {
    if (!input) return ''
    
    return input
      .trim()
      // Eliminar scripts
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      // Eliminar etiquetas HTML
      .replace(/<[^>]+>/g, '')
      // Eliminar caracteres de control
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Limitar longitud
      .substring(0, 500)
  },

  /**
   * Sanitiza emails
   */
  email: (input: string): string => {
    if (!input) return ''
    return input.trim().toLowerCase()
  },

  /**
   * Sanitiza números de teléfono
   * Permite solo números, espacios, guiones, paréntesis y +
   */
  phone: (input: string): string => {
    if (!input) return ''
    return input.replace(/[^\d\s\-\+\(\)]/g, '').substring(0, 20)
  },

  /**
   * Sanitiza cédulas (solo números)
   */
  cedula: (input: string): string => {
    if (!input) return ''
    return input.replace(/\D/g, '').substring(0, 15)
  },

  /**
   * Sanitiza nombres (solo letras, espacios y algunos caracteres especiales)
   */
  name: (input: string): string => {
    if (!input) return ''
    
    return input
      .trim()
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']/g, '')
      .substring(0, 100)
  },

  /**
   * Sanitiza URLs con validación estricta contra ataques
   * Previene: javascript:, data:, vbscript:, file: URIs
   */
  url: (input: string): string => {
    if (!input) return ''
    
    const inputLower = input.trim().toLowerCase()
    
    // ✅ Lista negra de protocolos maliciosos
    const maliciousProtocols = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
      'about:',
      'blob:'
    ]
    
    if (maliciousProtocols.some(protocol => inputLower.startsWith(protocol))) {
      return ''
    }
    
    try {
      const url = new URL(input.trim())
      
      const allowedProtocols = ['http:', 'https:']
      if (!allowedProtocols.includes(url.protocol)) {
        return ''
      }
      
      return url.href
    } catch {
      // Si no es una URL válida, retornar vacío
      return ''
    }
  }
}
