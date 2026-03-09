import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ServiceOrder, CreateServiceOrderData, CreateMultipleDeviceOrderData } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { generateOrderNumberSimple } from '../utils/orderNumber'
import { useServiceOrdersRealtime } from './useRealtimeSubscription'

export const useServiceOrders = (autoRefresh: boolean = true) => {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const { user } = useAuth()

  const fetchServiceOrders = async () => {
    if (!user) {
      return
    }

    try {
      setLoading(true)
      let query = supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(*),
          assigned_technician:profiles!service_orders_assigned_technician_id_fkey(*),
          completed_by:profiles!service_orders_completed_by_id_fkey(*),
          received_by:profiles!service_orders_received_by_id_fkey(*),
          external_repair:external_repairs(
            id,
            workshop:external_workshops(
              id,
              name,
              phone
            ),
            external_status,
            sent_date
          )
        `)
        .order('created_at', { ascending: false })

      if (user?.role === 'technician') {
        query = query.or(`assigned_technician_id.eq.${user.id},status.eq.pending`)
      }

      const { data, error } = await query

      if (error) throw error
      setServiceOrders(data || [])
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('❌ Error fetching service orders:', err)
    } finally {
      setLoading(false)
    }
  }

  // Real-time subscription - Solo si hay usuario autenticado
  const { disconnect } = useServiceOrdersRealtime(
    fetchServiceOrders,
    autoRefresh && !!user // Solo real-time si está habilitado y hay usuario
  )

  // Cleanup real-time subscription when user logs out
  useEffect(() => {
    if (!user) {
      disconnect()
      setServiceOrders([]) // Clear data when user logs out
      setError(null)
      setLoading(false)
    }
  }, [user, disconnect])

  const getServiceOrdersByCustomer = async (customerId: string): Promise<ServiceOrder[]> => {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(*),
          assigned_technician:profiles!service_orders_assigned_technician_id_fkey(*),
          completed_by:profiles!service_orders_completed_by_id_fkey(*),
          received_by:profiles!service_orders_received_by_id_fkey(*),
          external_repair:external_repairs(
            id,
            workshop:external_workshops(
              id,
              name,
              phone
            ),
            external_status,
            sent_date
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching customer service orders:', err)
      return []
    }
  }

  const createServiceOrder = async (orderData: CreateServiceOrderData): Promise<ServiceOrder | null> => {
    try {
      if (!user) throw new Error('Usuario no autenticado')

      // Generar número de orden único
      const orderNumber = generateOrderNumberSimple()

      const orderToInsert = {
        ...orderData,
        order_number: orderNumber,
        received_by_id: user.id,
      }

      const { data: insertedOrder, error: insertError } = await supabase
        .from('service_orders')
        .insert(orderToInsert)
        .select('*')
        .single()

      if (insertError) {
        console.error('❌ Error insertando orden:', insertError)
        throw insertError
      }

      // Luego obtener la orden completa con las relaciones
      const { data: completeOrder, error: fetchError } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(*),
          assigned_technician:profiles!service_orders_assigned_technician_id_fkey(*),
          completed_by:profiles!service_orders_completed_by_id_fkey(*),
          received_by:profiles!service_orders_received_by_id_fkey(*)
        `)
        .eq('id', insertedOrder.id)
        .single()

      if (fetchError) {
        const basicOrder = {
          ...insertedOrder,
          customer: null,
          assigned_technician: null,
          received_by: null
        }
        setServiceOrders(prev => [basicOrder as ServiceOrder, ...prev])
        return basicOrder as ServiceOrder
      }

      // Update local state
      setServiceOrders(prev => [completeOrder, ...prev])
      return completeOrder
    } catch (err) {
      console.error('❌ Error completo:', err)
      setError(err instanceof Error ? err.message : 'Error al crear orden de servicio')
      return null
    }
  }

  const createMultipleDeviceOrder = async (orderData: CreateMultipleDeviceOrderData): Promise<ServiceOrder[]> => {
    try {
      if (!user) throw new Error('Usuario no autenticado')
      if (!orderData.devices || orderData.devices.length === 0) {
        throw new Error('Debe agregar al menos un dispositivo')
      }

      const createdOrders: ServiceOrder[] = []
      // Crear una orden por cada dispositivo
      for (const device of orderData.devices) {
        const orderNumber = generateOrderNumberSimple()

        const orderToInsert = {
          customer_id: orderData.customer_id,
          device_type: device.device_type,
          device_brand: device.device_brand,
          device_model: device.device_model,
          serial_number: device.serial_number || null,
          problem_description: device.problem_description,
          observations: device.observations || null,
          order_number: orderNumber,
          received_by_id: user.id,
        }

        // Insertar la orden
        const { data: insertedOrder, error: insertError } = await supabase
          .from('service_orders')
          .insert(orderToInsert)
          .select('*')
          .single()

        if (insertError) {
          console.error('❌ Error insertando orden:', insertError)
          throw insertError
        }

        // Obtener la orden completa con relaciones
        const { data: completeOrder, error: fetchError } = await supabase
          .from('service_orders')
          .select(`
            *,
            customer:customers(*),
            assigned_technician:profiles!service_orders_assigned_technician_id_fkey(*),
            completed_by:profiles!service_orders_completed_by_id_fkey(*),
            received_by:profiles!service_orders_received_by_id_fkey(*)
          `)
          .eq('id', insertedOrder.id)
          .single()

        if (fetchError) {
          const basicOrder = {
            ...insertedOrder,
            customer: null,
            assigned_technician: null,
            received_by: null
          }
          createdOrders.push(basicOrder as ServiceOrder)
        } else {
          createdOrders.push(completeOrder)
        }
      }

      setServiceOrders(prev => [...createdOrders, ...prev])
      
      return createdOrders
    } catch (err) {
      console.error('❌ Error creando órdenes múltiples:', err)
      setError(err instanceof Error ? err.message : 'Error al crear órdenes de servicio')
      return []
    }
  }

  const updateServiceOrder = async (id: string, updates: Partial<ServiceOrder>): Promise<boolean> => {
    try {
      // Si se devuelve a pendiente, limpiar TODOS los campos relacionados con asignación,
      // pago, entrega, completado y tercerización para dejar la orden en estado inicial limpio
      const returningToPending = updates.status === 'pending'
      const finalUpdates = returningToPending
        ? {
            ...updates,
            // Limpiar técnico y responsables
            assigned_technician_id: null,
            completed_by_id: null,
            payment_collected_by_id: null,
            // Limpiar resultado de reparación
            repair_result: null,
            completion_notes: null,
            // Limpiar datos de entrega y cobro
            delivered_at: null,
            delivery_notes: null,
            repair_cost: null,
            payment_method: null,
          }
        : updates

      const { error } = await supabase
        .from('service_orders')
        .update(finalUpdates)
        .eq('id', id)

      if (error) throw error

      // Si se devuelve a pendiente, cancelar TODAS las tercerizaciones activas
      if (returningToPending) {
        await supabase
          .from('external_repairs')
          .update({ external_status: 'cancelled' })
          .eq('service_order_id', id)
          .neq('external_status', 'cancelled')

        // Refrescar desde servidor para obtener datos actualizados (external_repair incluido)
        await fetchServiceOrders()
        return true
      }

      // Para otros cambios, actualizar estado local directamente
      setServiceOrders(prev => 
        prev.map(order => 
          order.id === id ? { ...order, ...finalUpdates } : order
        )
      )
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar orden')
      return false
    }
  }

  const assignTechnician = async (orderId: string, technicianId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('service_orders')
        .update({
          assigned_technician_id: technicianId,
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      if (error) throw error

      // Refresh data
      await fetchServiceOrders()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar técnico')
      return false
    }
  }

  const completeServiceOrder = async (
    orderId: string,
    completionNotes: string,
    repairResult: 'repaired' | 'not_repaired'
  ): Promise<boolean> => {
    try {
      if (!user) throw new Error('Usuario no autenticado')
      
      const { error } = await supabase
        .from('service_orders')
        .update({
          status: 'completed',
          completion_notes: completionNotes,
          repair_result: repairResult,
          completed_by_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()

      if (error) {
        console.error('❌ Error guardando completion_notes:', error)
        throw error
      }

      await fetchServiceOrders()
      
      return true
    } catch (err) {
      console.error('❌ Error completo:', err)
      setError(err instanceof Error ? err.message : 'Error al completar orden')
      return false
    }
  }

  const deliverServiceOrder = async (
    orderId: string,
    deliveryNotes?: string,
    repairCost?: number | null,
    paymentMethod?: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro' | null
  ): Promise<boolean> => {
    try {
      const now = new Date().toISOString()
      
      const { error } = await supabase
        .from('service_orders')
        .update({
          status: 'delivered',
          delivered_at: now,
          delivery_notes: deliveryNotes || null,
          repair_cost: repairCost ?? null,
          payment_method: paymentMethod ?? null,
          payment_collected_by_id: repairCost ? user?.id : null,
          updated_at: now,
        })
        .eq('id', orderId)

      if (error) throw error

      await fetchServiceOrders()
      return true
    } catch (err) {
      console.error('❌ Error marcando orden como entregada:', err)
      setError(err instanceof Error ? err.message : 'Error al entregar orden')
      return false
    }
  }

  const deleteServiceOrder = async (orderId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', orderId)

      if (error) throw error

      setServiceOrders(prev => prev.filter(order => order.id !== orderId))
      
      return true
    } catch (err) {
      console.error('❌ Error eliminando orden:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar orden')
      return false
    }
  }

  useEffect(() => {
    if (user) {
      fetchServiceOrders()
    }
  }, [user])

  return {
    serviceOrders,
    loading,
    error,
    lastRefresh,
    fetchServiceOrders,
    getServiceOrdersByCustomer,
    createServiceOrder,
    createMultipleDeviceOrder,
    updateServiceOrder,
    assignTechnician,
    completeServiceOrder,
    deliverServiceOrder,
    deleteServiceOrder,
  }
}
