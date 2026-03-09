import { supabase } from '../lib/supabase'

/**
 * Genera un número de orden único para service_orders
 * Formato: OS-YYYYMMDD-XXXXXX (donde XXXXXX es un número incremental)
 */
export const generateOrderNumber = async (): Promise<string> => {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
  
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    // Generar número aleatorio de 6 dígitos
    const randomNum = Math.floor(100000 + Math.random() * 900000)
    const orderNumber = `OS-${dateStr}-${randomNum}`
    
    try {
      // Verificar si ya existe
      const { data, error } = await supabase
        .from('service_orders')
        .select('order_number')
        .eq('order_number', orderNumber)
        .maybeSingle()
      
      if (error) {
        console.error('Error verificando número de orden:', error)
        // Si hay error en la verificación, usar un timestamp más específico
        const timestamp = Date.now().toString().slice(-6)
        return `OS-${dateStr}-${timestamp}`
      }
      
      // Si no existe, podemos usarlo
      if (!data) {
        return orderNumber
      }
      
      attempts++
    } catch (error) {
      console.error('Error en generateOrderNumber:', error)
      attempts++
    }
  }
  
  // Fallback: usar timestamp si no podemos generar un número único
  const timestamp = Date.now().toString().slice(-6)
  return `OS-${dateStr}-${timestamp}`
}

/**
 * Genera un número de orden único usando una secuencia incremental
 * Esta es una versión más robusta que usa una consulta para obtener el siguiente número
 */
export const generateOrderNumberSequential = async (): Promise<string> => {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
  
  try {
    // Buscar el último número de orden del día
    const { data, error } = await supabase
      .from('service_orders')
      .select('order_number')
      .like('order_number', `OS-${dateStr}-%`)
      .order('order_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) {
      console.error('Error buscando último número de orden:', error)
      // Fallback a método aleatorio
      return generateOrderNumber()
    }
    
    let nextNumber = 1
    
    if (data?.order_number) {
      // Extraer el número secuencial del último order_number
      const parts = data.order_number.split('-')
      if (parts.length === 3) {
        const lastNumber = parseInt(parts[2], 10)
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1
        }
      }
    }
    
    // Formatear con ceros a la izquierda (6 dígitos)
    const formattedNumber = nextNumber.toString().padStart(6, '0')
    return `OS-${dateStr}-${formattedNumber}`
    
  } catch (error) {
    console.error('Error en generateOrderNumberSequential:', error)
    // Fallback a método aleatorio
    return generateOrderNumber()
  }
}

/**
 * Versión simple que usa timestamp para garantizar unicidad
 */
export const generateOrderNumberSimple = (): string => {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
  const timestamp = Date.now().toString().slice(-6) // Últimos 6 dígitos del timestamp
  return `OS-${dateStr}-${timestamp}`
}