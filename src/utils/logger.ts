/**
 * Sistema de logging seguro
 * Previene exposición de información sensible en producción
 */

const isDevelopment = import.meta.env.DEV

/**
 * Logger seguro que solo funciona en desarrollo
 * En producción, los logs críticos se pueden enviar a servicios como Sentry
 */
export const logger = {
  /**
   * Log informativo - Solo en desarrollo
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('ℹ️', ...args)
    }
  },

  /**
   * Advertencia - Solo en desarrollo
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('⚠️', ...args)
    }
  },

  /**
   * Error - Siempre se loggea pero de forma segura
   * En producción se podría enviar a servicio de monitoreo
   */
  error: (context: string, error: unknown) => {
    if (isDevelopment) {
      console.error(`❌ ${context}:`, error)
    } else {
      // En producción, solo loggear el contexto, no el error completo
      console.error(`❌ Error in ${context}`)
      
      // TODO: Enviar a servicio de monitoreo (ej: Sentry)
      // Sentry.captureException(error, { tags: { context } })
    }
  },

  /**
   * Debug - Solo en desarrollo
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('🐛', ...args)
    }
  },

  /**
   * Success - Solo en desarrollo
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('✅', ...args)
    }
  },

  /**
   * Tabla - Solo en desarrollo
   */
  table: (data: any) => {
    if (isDevelopment) {
      console.table(data)
    }
  },

  /**
   * Tiempo de inicio - Solo en desarrollo
   */
  time: (label: string) => {
    if (isDevelopment) {
      console.time(label)
    }
  },

  /**
   * Tiempo de fin - Solo en desarrollo
   */
  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label)
    }
  },

  /**
   * Grupo - Solo en desarrollo
   */
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label)
    }
  },

  /**
   * Fin de grupo - Solo en desarrollo
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd()
    }
  }
}

/**
 * Helper para loggear operaciones de red de forma segura
 */
export const logNetworkRequest = (
  method: string,
  endpoint: string,
  status?: number
) => {
  if (isDevelopment) {
    const emoji = status && status >= 200 && status < 300 ? '✅' : '❌'
    console.log(`${emoji} ${method} ${endpoint}`, status ? `[${status}]` : '')
  }
}

/**
 * Helper para loggear cambios de estado de forma segura
 */
export const logStateChange = (
  component: string,
  oldState: any,
  newState: any
) => {
  if (isDevelopment) {
    console.group(`🔄 State change in ${component}`)
    console.log('Old:', oldState)
    console.log('New:', newState)
    console.groupEnd()
  }
}

/**
 * Helper para loggear datos sensibles SOLO en desarrollo
 * NUNCA usar esto con datos reales de clientes
 */
export const logSensitive = (label: string, data: any) => {
  if (isDevelopment) {
    console.warn('🔐 SENSITIVE DATA:', label, data)
  }
}
