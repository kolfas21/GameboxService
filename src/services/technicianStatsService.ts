/**
 * Servicio para gestión de estadísticas de técnicos
 * Capa de servicios - Arquitectura Limpia
 */

import { supabase } from '../lib/supabase'
import type { ServiceOrder, User as UserType } from '../types'

export interface TechnicianStats {
  id: string
  full_name: string
  email: string
  totalCompleted: number
  thisWeek: number
  thisMonth: number
  thisYear: number
  completedOrders: ServiceOrder[]
  inProgressOrders: ServiceOrder[]
  avgCompletionTime: number
  totalRevenue: number
}

/**
 * Obtiene todos los técnicos activos
 */
export const fetchTechnicians = async (): Promise<UserType[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'technician')
      .order('full_name')

    if (error) throw error
    return data || []
  } catch (err) {
    throw err
  }
}

/**
 * Obtiene todas las órdenes ENTREGADAS con información del técnico que las completó
 * NOTA: Solo cuenta órdenes con status 'delivered' (entregadas al cliente)
 * Si completed_by_id es NULL, usa assigned_technician_id como fallback
 */
export const fetchCompletedOrders = async (): Promise<ServiceOrder[]> => {
  try {
    const { data, error } = await supabase
      .from('service_orders')
      .select(`
        *,
        customer:customers(*),
        assigned_technician:profiles!service_orders_assigned_technician_id_fkey(*),
        completed_by:profiles!service_orders_completed_by_id_fkey(*),
        received_by:profiles!service_orders_received_by_id_fkey(*)
      `)
      .eq('status', 'delivered')
      .order('delivered_at', { ascending: false })

    if (error) throw error
    
    return data || []
  } catch (err) {
    throw err
  }
}

/**
 * Obtiene todas las órdenes en progreso
 */
export const fetchInProgressOrders = async (): Promise<ServiceOrder[]> => {
  try {
    const { data, error } = await supabase
      .from('service_orders')
      .select(`
        *,
        customer:customers(*),
        assigned_technician:profiles!service_orders_assigned_technician_id_fkey(*),
        completed_by:profiles!service_orders_completed_by_id_fkey(*),
        received_by:profiles!service_orders_received_by_id_fkey(*)
      `)
      .eq('status', 'in_progress')
      .not('assigned_technician_id', 'is', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    throw err
  }
}

/**
 * Calcula estadísticas para un técnico específico
 * LÓGICA: Usa completed_by_id si existe, sino usa assigned_technician_id
 */
export const calculateTechnicianStats = (
  technician: UserType,
  completedOrders: ServiceOrder[],
  inProgressOrders: ServiceOrder[]
): TechnicianStats => {
  // Filtrar órdenes completadas por este técnico
  // FALLBACK: Si completed_by_id es NULL, usar assigned_technician_id
  const techCompletedOrders = completedOrders.filter(order => {
    const completedBy = order.completed_by_id || order.assigned_technician_id
    return completedBy === technician.id
  })
  
  // Filtrar órdenes en progreso de este técnico
  const techInProgressOrders = inProgressOrders.filter(
    order => order.assigned_technician_id === technician.id
  )

  // Calcular estadísticas por período (basado en fecha de entrega)
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  const thisWeek = techCompletedOrders.filter(order => {
    if (!order.delivered_at) return false
    const deliveredDate = new Date(order.delivered_at)
    return deliveredDate >= oneWeekAgo
  }).length

  const thisMonth = techCompletedOrders.filter(order => {
    if (!order.delivered_at) return false
    const deliveredDate = new Date(order.delivered_at)
    return deliveredDate >= oneMonthAgo
  }).length

  const thisYear = techCompletedOrders.filter(order => {
    if (!order.delivered_at) return false
    const deliveredDate = new Date(order.delivered_at)
    return deliveredDate >= oneYearAgo
  }).length

  const avgCompletionTime = techCompletedOrders.length > 0 
    ? techCompletedOrders.reduce((sum, order) => {
        const created = new Date(order.created_at)
        const completed = new Date(order.updated_at)
        return sum + (completed.getTime() - created.getTime())
      }, 0) / techCompletedOrders.length / (1000 * 60 * 60 * 24) // días
    : 0

  return {
    id: technician.id,
    full_name: technician.full_name || technician.email?.split('@')[0] || 'Técnico',
    email: technician.email,
    totalCompleted: techCompletedOrders.length,
    thisWeek,
    thisMonth,
    thisYear,
    completedOrders: techCompletedOrders,
    inProgressOrders: techInProgressOrders,
    avgCompletionTime,
    totalRevenue: techCompletedOrders.length * 15000 // Estimado
  }
}

/**
 * Obtiene estadísticas completas de todos los técnicos
 */
export const fetchTechnicianStatistics = async (): Promise<TechnicianStats[]> => {
  try {
    const [technicians, completedOrders, inProgressOrders] = await Promise.all([
      fetchTechnicians(),
      fetchCompletedOrders(),
      fetchInProgressOrders()
    ])

    const stats = technicians.map(tech => 
      calculateTechnicianStats(tech, completedOrders, inProgressOrders)
    )

    stats.sort((a, b) => b.totalCompleted - a.totalCompleted)

    return stats
  } catch (err) {
    throw err
  }
}
