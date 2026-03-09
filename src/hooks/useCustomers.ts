import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Customer, CreateCustomerData } from '../types'
import { useCustomersRealtime } from './useRealtimeSubscription'
import { useAuth } from '../contexts/AuthContext'

export const useCustomers = (autoRefresh: boolean = false) => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const { user } = useAuth()

  // Real-time subscription - Solo si hay usuario autenticado
  const { disconnect } = useCustomersRealtime(() => {
    if (autoRefresh && user) {
      fetchCustomers()
    }
  })

  // Cleanup real-time subscription when user logs out
  useEffect(() => {
    if (!user) {
      disconnect()
      setCustomers([]) // Clear data when user logs out
      setError(null)
      setLoading(false)
    }
  }, [user, disconnect])

  const fetchCustomers = async () => {
    if (!user) {
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('❌ Error fetching customers:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCustomerByCedula = async (cedula: string): Promise<Customer | null> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('cedula', cedula.trim())
        .maybeSingle()

      if (error) {
        console.error('❌ Error buscando cliente:', error)
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }
      
      return data
    } catch (err) {
      console.error('❌ Error completo buscando cliente:', err)
      return null
    }
  }

  const createCustomer = async (customerData: CreateCustomerData): Promise<Customer | null> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single()

      if (error) {
        throw error
      }
      
      setCustomers(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cliente')
      return null
    }
  }

  const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id ? { ...customer, ...updates } : customer
        )
      )
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar cliente')
      return false
    }
  }

  const deleteCustomer = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCustomers(prev => prev.filter(customer => customer.id !== id))
      return true
    } catch (err) {
      console.error('❌ Error eliminando cliente:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar cliente')
      return false
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  return {
    customers,
    loading,
    error,
    lastRefresh,
    fetchCustomers,
    getCustomerByCedula,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  }
}
