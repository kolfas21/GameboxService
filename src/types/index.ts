export type UserRole = 'admin' | 'receptionist' | 'technician'

export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'outsourced'

export type ExternalRepairStatus = 'sent' | 'in_process' | 'ready' | 'returned' | 'cancelled'

export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  sede: string | null
  branch_phone: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  cedula: string
  full_name: string
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

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
  repair_result?: 'repaired' | 'not_repaired' | null
  repair_cost?: number | null
  payment_method?: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro' | null
  payment_collected_by_id?: string | null
  delivery_notes?: string | null
  delivered_at?: string | null
  created_at: string
  updated_at: string
  // Relations
  customer?: Customer
  assigned_technician?: User
  completed_by?: User
  received_by?: User
  external_repair?: Array<{
    id: string
    workshop?: {
      id: string
      name: string
      phone: string
    }
    external_status: string
    sent_date: string
  }>
}

export interface CompanySettings {
  id: string
  company_name: string
  logo_url: string | null
  // Feature flags
  features_enabled: {
    outsourcing: boolean
    warranty_tracking: boolean
    technician_stats: boolean
  }
  // Required fields configuration
  required_fields: {
    device_brand: boolean
    device_model: boolean
    serial_number: boolean
    problem_description: boolean
    observations: boolean
    estimated_completion: boolean
  }
  created_at: string
  updated_at: string
}

export interface ExternalWorkshop {
  id: string
  name: string
  contact_person: string | null
  phone: string
  email: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

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
  // Relations
  workshop?: ExternalWorkshop
  sent_by?: User
  received_by?: User
  service_order?: ServiceOrder
  // Campos de la vista v_external_repairs_full
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

export interface CreateExternalWorkshopData {
  name: string
  phone: string
  contact_person?: string
  email?: string
  address?: string
  notes?: string
}

export interface CreateExternalRepairData {
  service_order_id: string
  workshop_id: string
  problem_sent: string
  estimated_return_date?: string
  external_cost?: number
  notes?: string
}

export interface CreateCustomerData {
  cedula: string
  full_name: string
  phone?: string
  email?: string
}

export interface DeviceItem {
  device_type: string
  device_brand: string
  device_model: string
  serial_number?: string
  problem_description: string
  observations?: string
}

export interface CreateServiceOrderData {
  customer_id: string
  device_type: string
  device_brand: string
  device_model: string
  serial_number?: string
  problem_description: string
  estimated_completion?: string
}

export interface CreateMultipleDeviceOrderData {
  customer_id: string
  devices: DeviceItem[]
}
