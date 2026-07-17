import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Hook para suscribirse a cambios en tiempo real de una tabla
 * Solo actualiza cuando hay cambios reales en la base de datos
 */
export const useRealtimeSubscription = (
  table: string,
  callback: () => void | Promise<void>,
  enabled: boolean = true
) => {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const callbackRef = useRef(callback)

  const disconnectChannel = async () => {
    if (!channelRef.current) return
    const channel = channelRef.current
    channelRef.current = null

    try {
      // removeChannel asegura limpiar el registro interno del cliente,
      // evitando reutilizar un canal ya suscrito.
      await supabase.removeChannel(channel)
    } catch (error) {
      console.error('Error desconectando canal real-time:', error)
    }
  }

  // Actualizar la referencia del callback
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) {
      // Si está deshabilitado, desconectar
      void disconnectChannel()
      return () => {
        void disconnectChannel()
      }
    }

    const channelName = `${table}_changes_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Crear suscripción en tiempo real
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: table
        },
        () => {
          // Ejecutar callback cuando hay cambios
          const currentCallback = callbackRef.current
          if (currentCallback) {
            try {
              const result = currentCallback()
              if (result instanceof Promise) {
                result.catch((error) => {
                  console.error('Error en callback de real-time:', error)
                })
              }
            } catch (error) {
              console.error('Error en callback de real-time:', error)
            }
          }
        }
      )
      .subscribe()

    // Cleanup al desmontar
    return () => {
      void disconnectChannel()
    }
  }, [table, enabled])

  // Función para desconectar manualmente
  const disconnect = () => {
    void disconnectChannel()
  }

  return { disconnect }
}

/**
 * Hook específico para órdenes de servicio
 * Se actualiza solo cuando hay cambios en la tabla service_orders
 */
export const useServiceOrdersRealtime = (
  callback: () => void | Promise<void>,
  enabled: boolean = true
) => {
  return useRealtimeSubscription('service_orders', callback, enabled)
}

/**
 * Hook específico para clientes
 * Se actualiza solo cuando hay cambios en la tabla customers
 */
export const useCustomersRealtime = (
  callback: () => void | Promise<void>,
  enabled: boolean = true
) => {
  return useRealtimeSubscription('customers', callback, enabled)
}

/**
 * Hook específico para usuarios/perfiles
 * Se actualiza solo cuando hay cambios en la tabla profiles
 */
export const useProfilesRealtime = (
  callback: () => void | Promise<void>,
  enabled: boolean = true
) => {
  return useRealtimeSubscription('profiles', callback, enabled)
}