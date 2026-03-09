/**
 * Utilidades para formateo de fechas
 * Centraliza todo el formateo de fechas en la aplicación
 */

/**
 * Formato corto: 01/10/2025
 */
export const formatDateShort = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Formato largo: 01 de Octubre de 2025
 */
export const formatDateLong = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Formato con hora: 01/10/2025 14:30
 */
export const formatDateWithTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formato relativo: "Hace 2 horas", "Hace 3 días"
 */
export const formatDateRelative = (date: string | Date): string => {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
  
  // Si es más de una semana, mostrar fecha normal
  return formatDateShort(date)
}

/**
 * Solo la hora: 14:30
 */
export const formatTimeOnly = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formato para inputs de tipo date: 2025-10-01
 */
export const formatDateForInput = (date: string | Date): string => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formato para inputs de tipo datetime-local: 2025-10-01T14:30
 */
export const formatDateTimeForInput = (date: string | Date): string => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Día de la semana: "Lunes", "Martes", etc.
 */
export const formatDayOfWeek = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('es-ES', { weekday: 'long' })
}

/**
 * Verifica si una fecha es hoy
 */
export const isToday = (date: string | Date): boolean => {
  const today = new Date()
  const checkDate = new Date(date)
  
  return today.getDate() === checkDate.getDate() &&
         today.getMonth() === checkDate.getMonth() &&
         today.getFullYear() === checkDate.getFullYear()
}

/**
 * Verifica si una fecha es ayer
 */
export const isYesterday = (date: string | Date): boolean => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const checkDate = new Date(date)
  
  return yesterday.getDate() === checkDate.getDate() &&
         yesterday.getMonth() === checkDate.getMonth() &&
         yesterday.getFullYear() === checkDate.getFullYear()
}

/**
 * Formatea una fecha de forma inteligente:
 * - "Hoy a las 14:30" si es hoy
 * - "Ayer a las 10:15" si es ayer
 * - "01/10/2025" si es más antiguo
 */
export const formatDateSmart = (date: string | Date): string => {
  if (isToday(date)) {
    return `Hoy a las ${formatTimeOnly(date)}`
  }
  
  if (isYesterday(date)) {
    return `Ayer a las ${formatTimeOnly(date)}`
  }
  
  return formatDateShort(date)
}

/**
 * Objeto principal con todos los formateadores
 */
export const formatDate = {
  short: formatDateShort,
  long: formatDateLong,
  withTime: formatDateWithTime,
  relative: formatDateRelative,
  timeOnly: formatTimeOnly,
  forInput: formatDateForInput,
  dateTimeForInput: formatDateTimeForInput,
  dayOfWeek: formatDayOfWeek,
  smart: formatDateSmart,
  isToday,
  isYesterday
}
