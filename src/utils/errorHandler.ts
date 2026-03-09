/**
 * Manejador centralizado de errores
 * Evita exponer información sensible al usuario en producción
 */

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  timestamp?: Date
}

/**
 * Maneja errores de forma segura
 * En desarrollo muestra detalles, en producción mensajes genéricos
 */
export const handleError = (
  error: unknown,
  context?: string | ErrorContext
): string => {
  const timestamp = new Date().toISOString()
  const contextStr = typeof context === 'string' ? context : context?.component || 'unknown'

  // Log completo en consola (siempre)
  console.error(`❌ Error ${contextStr ? `in ${contextStr}` : ''} [${timestamp}]:`, error)

  // Si hay contexto adicional, loggearlo
  if (typeof context === 'object') {
    console.error('Context:', context)
  }

  // Mensaje para el usuario
  let userMessage = 'Ocurrió un error inesperado. Por favor intenta nuevamente.'

  // En desarrollo, mostrar más detalles
  if (import.meta.env.DEV) {
    if (error instanceof Error) {
      userMessage = `[DEV] ${error.message}`
      
      // Si hay stack trace, mostrarlo en consola
      if (error.stack) {
        console.error('Stack:', error.stack)
      }
    } else {
      userMessage = `[DEV] ${String(error)}`
    }
  } else {
    // En producción, mensajes seguros y específicos según el tipo de error
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase()
      
      // Errores de red
      if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
        userMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.'
      }
      // Timeout
      else if (errorMsg.includes('timeout')) {
        userMessage = 'La operación tardó demasiado. Por favor, intenta nuevamente.'
      }
      // Errores de autenticación
      else if (errorMsg.includes('auth') || errorMsg.includes('unauthorized')) {
        userMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.'
      }
      else if (errorMsg.includes('permission') || errorMsg.includes('forbidden')) {
        userMessage = 'No tienes permisos para realizar esta acción.'
      }
      // Errores de validación
      else if (errorMsg.includes('validation') || errorMsg.includes('invalid')) {
        userMessage = 'Los datos ingresados no son válidos. Verifica e intenta nuevamente.'
      }
      else if (errorMsg.includes('required')) {
        userMessage = 'Por favor, completa todos los campos obligatorios.'
      }
      // Errores de recursos
      else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        userMessage = 'El recurso solicitado no existe o fue eliminado.'
      }
      else if (errorMsg.includes('conflict') || errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
        userMessage = 'Ya existe un registro con estos datos.'
      }
      // Rate limiting
      else if (errorMsg.includes('rate') || errorMsg.includes('429')) {
        userMessage = 'Has excedido el límite de solicitudes. Espera un momento.'
      }
      // Por defecto, no exponer el mensaje original
      else {
        userMessage = 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'
      }
    }
  }

  return userMessage
}

/**
 * Maneja errores de forma asíncrona con callback opcional
 */
export const handleAsyncError = async (
  fn: () => Promise<void>,
  context?: string | ErrorContext,
  onError?: (message: string) => void
): Promise<boolean> => {
  try {
    await fn()
    return true
  } catch (error) {
    const message = handleError(error, context)
    if (onError) {
      onError(message)
    }
    return false
  }
}

/**
 * Wrapper para funciones que pueden lanzar errores
 */
export const tryCatch = <T>(
  fn: () => T,
  fallback: T,
  context?: string | ErrorContext
): T => {
  try {
    return fn()
  } catch (error) {
    handleError(error, context)
    return fallback
  }
}

/**
 * Log de información (no errores)
 */
export const logInfo = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`ℹ️ ${message}`, data || '')
  }
}

/**
 * Log de advertencia
 */
export const logWarning = (message: string, data?: any) => {
  console.warn(`⚠️ ${message}`, data || '')
}
