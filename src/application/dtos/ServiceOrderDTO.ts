export interface DeviceItem {
  device_type: string
  device_brand: string
  device_model: string
  serial_number?: string
  problem_description: string
  observations?: string
}

export interface CreateServiceOrderDTO {
  customer_id: string
  device_type: string
  device_brand: string
  device_model: string
  serial_number?: string
  problem_description: string
  estimated_completion?: string
  observations?: string
}

export interface CreateMultipleDeviceOrderDTO {
  customer_id: string
  devices: DeviceItem[]
}

export interface UpdateServiceOrderDTO {
  status?: string
  assigned_technician_id?: string | null
  completed_by_id?: string | null
  completion_notes?: string | null
  repair_result?: 'repaired' | 'not_repaired' | null
  repair_cost?: number | null
  payment_method?: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro' | null
  payment_collected_by_id?: string | null
  delivery_notes?: string | null
  delivered_at?: string | null
  observations?: string | null
}
