import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ExternalRepair, CreateExternalRepairData } from '../types'
import { useAuth } from '../contexts/AuthContext'

export const useExternalRepairs = () => {
  const [repairs, setRepairs] = useState<ExternalRepair[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchRepairs = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('v_external_repairs_full')
        .select('*')
        .order('sent_date', { ascending: false })

      if (error) throw error

      setRepairs(data || [])
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error al cargar reparaciones externas:', err)
    } finally {
      setLoading(false)
    }
  }

  const createRepair = async (
    repair: CreateExternalRepairData
  ): Promise<{ data: ExternalRepair | null; error: string | null }> => {
    if (!user || (user.role !== 'admin' && user.role !== 'receptionist' && user.role !== 'technician')) {
      return { data: null, error: 'No tienes permisos para crear reparaciones externas' }
    }

    try {
      const { data, error } = await supabase
        .from('external_repairs')
        .insert([repair])
        .select()
        .single()

      if (error) throw error

      // Actualizar el estado de la orden de servicio a 'in_progress' (tercerizada)
      if (repair.service_order_id) {
        await supabase
          .from('service_orders')
          .update({ status: 'in_progress' })
          .eq('id', repair.service_order_id)
      }

      await fetchRepairs()
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error al crear reparación externa:', err)
      return { data: null, error: errorMessage }
    }
  }

  const updateRepair = async (
    id: string,
    updates: Partial<CreateExternalRepairData>
  ): Promise<{ error: string | null }> => {
    if (!user || (user.role !== 'admin' && user.role !== 'receptionist' && user.role !== 'technician')) {
      return { error: 'No tienes permisos para actualizar reparaciones externas' }
    }

    try {
      const { error } = await supabase
        .from('external_repairs')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await fetchRepairs()
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error al actualizar reparación externa:', err)
      return { error: errorMessage }
    }
  }

  const markAsReturned = async (
    id: string,
    actualReturnDate: string,
    workDone?: string
  ): Promise<{ error: string | null }> => {
    if (!user || (user.role !== 'admin' && user.role !== 'receptionist' && user.role !== 'technician')) {
      return { error: 'No tienes permisos para marcar reparaciones como devueltas' }
    }

    try {
      // Obtener la reparación externa para saber qué orden actualizar
      const { data: repairData, error: fetchError } = await supabase
        .from('external_repairs')
        .select('service_order_id')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Actualizar la reparación externa
      const { error: updateError } = await supabase
        .from('external_repairs')
        .update({
          external_status: 'returned',
          actual_return_date: actualReturnDate,
          work_done: workDone
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Cambiar el estado de la orden de servicio a 'completed' (lista para entregar al cliente)
      if (repairData?.service_order_id) {
        await supabase
          .from('service_orders')
          .update({ status: 'completed' })
          .eq('id', repairData.service_order_id)
      }

      await fetchRepairs()
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error al marcar reparación como devuelta:', err)
      return { error: errorMessage }
    }
  }

  const getRepairByOrderId = async (orderId: string): Promise<ExternalRepair | null> => {
    try {
      const { data, error } = await supabase
        .from('v_external_repairs_full')
        .select('*')
        .eq('service_order_id', orderId)
        .single()

      if (error) throw error

      return data
    } catch (err) {
      console.error('Error al obtener reparación externa por orden:', err)
      return null
    }
  }

  useEffect(() => {
    fetchRepairs()
  }, [])

  return {
    repairs,
    loading,
    error,
    createRepair,
    updateRepair,
    markAsReturned,
    getRepairByOrderId,
    refetch: fetchRepairs
  }
}
