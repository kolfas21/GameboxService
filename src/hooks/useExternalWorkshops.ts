import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ExternalWorkshop, CreateExternalWorkshopData } from '../types'
import { useAuth } from '../contexts/AuthContext'

export const useExternalWorkshops = () => {
  const [workshops, setWorkshops] = useState<ExternalWorkshop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchWorkshops = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('external_workshops')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      setWorkshops(data || [])
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error al cargar talleres externos:', err)
    } finally {
      setLoading(false)
    }
  }

  const createWorkshop = async (
    workshop: CreateExternalWorkshopData
  ): Promise<{ data: ExternalWorkshop | null; error: string | null }> => {
    if (!user || (user.role !== 'admin' && user.role !== 'receptionist')) {
      return { data: null, error: 'No tienes permisos para crear talleres externos' }
    }

    try {
      const { data, error } = await supabase
        .from('external_workshops')
        .insert([workshop])
        .select()
        .single()

      if (error) throw error

      await fetchWorkshops()
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error al crear taller externo:', err)
      return { data: null, error: errorMessage }
    }
  }

  const updateWorkshop = async (
    id: string,
    updates: Partial<CreateExternalWorkshopData>
  ): Promise<{ error: string | null }> => {
    if (!user || (user.role !== 'admin' && user.role !== 'receptionist')) {
      return { error: 'No tienes permisos para actualizar talleres externos' }
    }

    try {
      const { error } = await supabase
        .from('external_workshops')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await fetchWorkshops()
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error al actualizar taller externo:', err)
      return { error: errorMessage }
    }
  }

  const toggleWorkshopStatus = async (
    id: string,
    is_active: boolean
  ): Promise<{ error: string | null }> => {
    if (!user || (user.role !== 'admin' && user.role !== 'receptionist')) {
      return { error: 'No tienes permisos para cambiar el estado de talleres externos' }
    }

    try {
      const { error } = await supabase
        .from('external_workshops')
        .update({ is_active })
        .eq('id', id)

      if (error) throw error

      await fetchWorkshops()
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error al cambiar estado del taller externo:', err)
      return { error: errorMessage }
    }
  }

  const deleteWorkshop = async (id: string): Promise<{ error: string | null }> => {
    if (!user || user.role !== 'admin') {
      return { error: 'Solo administradores pueden eliminar talleres externos' }
    }

    try {
      // Verificar si el taller tiene reparaciones activas (no completadas)
      const { data: repairs, error: checkError } = await supabase
        .from('external_repairs')
        .select('id')
        .eq('workshop_id', id)
        .eq('external_status', 'sent')
        .limit(1)

      if (checkError) throw checkError

      if (repairs && repairs.length > 0) {
        return { 
          error: 'No se puede eliminar este taller porque tiene reparaciones activas. Completa todas las reparaciones primero.' 
        }
      }

      // Eliminar reparaciones completadas antes de eliminar el taller
      const { error: deleteRepairsError } = await supabase
        .from('external_repairs')
        .delete()
        .eq('workshop_id', id)
        .eq('external_status', 'returned')

      if (deleteRepairsError) throw deleteRepairsError

      // Eliminar el taller
      const { error } = await supabase
        .from('external_workshops')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchWorkshops()
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error al eliminar taller externo:', err)
      return { error: errorMessage }
    }
  }

  useEffect(() => {
    fetchWorkshops()
  }, [])

  return {
    workshops,
    loading,
    error,
    createWorkshop,
    updateWorkshop,
    toggleWorkshopStatus,
    deleteWorkshop,
    refetch: fetchWorkshops
  }
}
