import { useEffect, useRef } from 'react'

/**
 * Hook para ejecutar una función de actualización de forma automática cada cierto intervalo
 * @param refreshFunction - Función a ejecutar para actualizar los datos
 * @param intervalMs - Intervalo en milisegundos (por defecto 15 segundos)
 * @param enabled - Si está habilitado el auto-refresh (por defecto true)
 */
export const useAutoRefresh = (
  refreshFunction: () => void | Promise<void>,
  intervalMs: number = 15000, // 15 segundos por defecto
  enabled: boolean = true
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const refreshFunctionRef = useRef(refreshFunction)

  // Actualizar la referencia de la función cuando cambie
  useEffect(() => {
    refreshFunctionRef.current = refreshFunction
  }, [refreshFunction])

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Configurar el intervalo
    intervalRef.current = setInterval(() => {
      const currentRefreshFunction = refreshFunctionRef.current
      if (currentRefreshFunction) {
        try {
          const result = currentRefreshFunction()
          // Si la función es async, manejar la promesa
          if (result instanceof Promise) {
            result.catch((error) => {
              console.error('Error en auto-refresh:', error)
            })
          }
        } catch (error) {
          console.error('Error en auto-refresh:', error)
        }
      }
    }, intervalMs)

    // Cleanup al desmontar el componente
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [intervalMs, enabled])

  // Función para limpiar manualmente el intervalo
  const clearAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  return { clearAutoRefresh }
}

/**
 * Hook específico para auto-refresh de órdenes de servicio
 * Intervalo más corto para mantener los datos muy actualizados
 */
export const useServiceOrdersAutoRefresh = (
  refreshFunction: () => void | Promise<void>,
  enabled: boolean = true
) => {
  return useAutoRefresh(refreshFunction, 15000, enabled) // 15 segundos para órdenes
}

/**
 * Hook para auto-refresh de datos generales
 * Intervalo de 15 segundos para mantener todos los datos actualizados
 */
export const useGeneralAutoRefresh = (
  refreshFunction: () => void | Promise<void>,
  enabled: boolean = true
) => {
  return useAutoRefresh(refreshFunction, 15000, enabled) // 15 segundos para datos generales
}