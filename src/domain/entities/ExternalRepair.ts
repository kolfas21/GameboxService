import type { User } from './User'
import type { ExternalWorkshop, ExternalWorkshopRef } from './ExternalWorkshop'
import type { ServiceOrder } from './ServiceOrder'

export type ExternalRepairStatus = 'sent' | 'in_process' | 'ready' | 'returned' | 'cancelled'

export interface ExternalRepair {
  id: string
  service_order_id: string
  workshop_id: string
  sent_date: string
  sent_by_id: string
  external_status: ExternalRepairStatus
  estimated_return_date: string | null
  actual_return_date: string | null
  external_cost: number | null
  problem_sent: string
  work_done: string | null
  notes: string | null
  received_by_id: string | null
  created_at: string
  updated_at: string
  workshop?: ExternalWorkshop | ExternalWorkshopRef
  sent_by?: User
  received_by?: User
  service_order?: ServiceOrder
  order_number?: string
  device_type?: string
  device_brand?: string
  device_model?: string
  serial_number?: string | null
  customer_name?: string
  customer_phone?: string | null
  workshop_name?: string
  workshop_phone?: string
  contact_person?: string | null
  sent_by_name?: string | null
  received_by_name?: string | null
}
