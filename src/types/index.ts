export type { UserRole, User } from '../domain/entities/User'
export type { Customer } from '../domain/entities/Customer'
export type {
  ServiceStatus,
  RepairResult,
  PaymentMethod,
  ServiceOrder,
} from '../domain/entities/ServiceOrder'
export type {
  FeaturesEnabled,
  RequiredFields,
  CompanySettings,
} from '../domain/entities/CompanySettings'
export type {
  ExternalWorkshopRef,
  ExternalWorkshop,
} from '../domain/entities/ExternalWorkshop'
export type {
  ExternalRepairStatus,
  ExternalRepair,
} from '../domain/entities/ExternalRepair'

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
