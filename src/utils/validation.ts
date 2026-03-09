/**
 * Sistema de validación robusto para formularios
 * Proporciona validadores reutilizables y composables
 */

export const validators = {
  /**
   * Valida que un campo no esté vacío
   */
  required: (value: string, fieldName: string): string | null => {
    if (!value || value.trim() === '') {
      return `${fieldName} es requerido`
    }
    return null
  },

  /**
   * Valida longitud mínima
   */
  minLength: (value: string, min: number, fieldName: string): string | null => {
    if (value.length < min) {
      return `${fieldName} debe tener al menos ${min} caracteres`
    }
    return null
  },

  /**
   * Valida longitud máxima
   */
  maxLength: (value: string, max: number, fieldName: string): string | null => {
    if (value.length > max) {
      return `${fieldName} no puede exceder ${max} caracteres`
    }
    return null
  },

  /**
   * Valida formato de email
   */
  email: (value: string): string | null => {
    if (!value) return null
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Email inválido'
    }
    return null
  },

  /**
   * Valida formato de cédula (7-15 dígitos)
   */
  cedula: (value: string): string | null => {
    if (!value) return null
    
    const cedulaRegex = /^\d{7,15}$/
    if (!cedulaRegex.test(value)) {
      return 'Cédula inválida (7-15 dígitos)'
    }
    return null
  },

  /**
   * Valida formato de teléfono
   */
  phone: (value: string): string | null => {
    if (!value) return null
    
    const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/
    if (!phoneRegex.test(value)) {
      return 'Teléfono inválido'
    }
    return null
  },

  /**
   * Valida que solo contenga letras y espacios
   */
  onlyLetters: (value: string, fieldName: string): string | null => {
    if (!value) return null
    
    const lettersRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']+$/
    if (!lettersRegex.test(value)) {
      return `${fieldName} solo puede contener letras`
    }
    return null
  },

  /**
   * Valida que solo contenga números
   */
  onlyNumbers: (value: string, fieldName: string): string | null => {
    if (!value) return null
    
    if (!/^\d+$/.test(value)) {
      return `${fieldName} solo puede contener números`
    }
    return null
  }
}

/**
 * Ejecuta múltiples validaciones en un campo
 * Retorna el primer error encontrado o null si todo es válido
 */
export const validateField = (
  value: string,
  validations: Array<(v: string) => string | null>
): string | null => {
  for (const validation of validations) {
    const error = validation(value)
    if (error) return error
  }
  return null
}

/**
 * Valida un objeto completo usando un esquema de validación
 */
export const validateForm = <T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, Array<(v: any) => string | null>>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } => {
  const errors: Partial<Record<keyof T, string>> = {}
  let isValid = true

  for (const field in schema) {
    const value = data[field]
    const fieldValidations = schema[field]
    const error = validateField(String(value || ''), fieldValidations)
    
    if (error) {
      errors[field] = error
      isValid = false
    }
  }

  return { isValid, errors }
}
