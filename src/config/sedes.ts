/**
 * Configuración de Teléfonos por Sede
 */

export const TELEFONOS_SEDES: Record<string, string> = {
  'Sede Parque Caldas': '3116638302',
  'Sede Sanandresito': '3147748865',
  'Sede Principal': '3116638302'
}

/**
 * Obtiene el teléfono de una sede
 */
export const getTelefonoSede = (sede: string | null | undefined): string => {
  if (!sede) return '3116638302'
  
  // Búsqueda directa
  if (TELEFONOS_SEDES[sede]) {
    return TELEFONOS_SEDES[sede]
  }
  
  // Búsqueda flexible
  const sedeNormalizada = sede.toLowerCase()
  
  if (sedeNormalizada.includes('parque') || sedeNormalizada.includes('caldas')) {
    return '3116638302'
  }
  
  if (sedeNormalizada.includes('sanandresito')) {
    return '3147748865'
  }
  
  return '3116638302' // Por defecto
}
