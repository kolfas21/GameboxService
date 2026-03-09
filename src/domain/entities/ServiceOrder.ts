import type { Customer } from './Customer'
import type { User } from './User'
import type { ExternalWorkshopRef } from './ExternalWorkshop'

export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'outsourced'

export type RepairResult = 'repaired' | 'not_repaired'

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro'

export interface ServiceOrder {
  id: string
  order_number: string
  customer_id: string
  device_type: string
  device_brand: string
  device_model: string
  serial_number: string | null
  problem_description: string
  observations: string | null
  status: ServiceStatus
  assigned_technician_id: string | null
  completed_by_id: string | null
  received_by_id: string
  estimated_completion: string | null
  completion_notes: string | null
  repair_result?: RepairResult | null
  repair_cost?: number | null
  payment_method?: PaymentMethod | null
  payment_collected_by_id?: string | null
  delivery_notes?: string | null
  delivered_at?: string | null
  created_at: string
  updated_at: string
  customer?: Customer
  assigned_technician?: User
  completed_by?: User
  received_by?: User
  external_repair?: Array<{
    id: string
    workshop?: ExternalWorkshopRef
    external_status: string
    sent_date: string
  }>
}
