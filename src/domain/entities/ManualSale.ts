import type { Customer } from './Customer'
import type { User } from './User'

export type ManualSaleProductType = 'new_console' | 'used_console' | 'accessory' | 'other'
export type ManualSalePaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto' | 'otro'
export type ManualSaleStatus = 'active' | 'cancelled'
export type ManualSaleWhatsappStatus = 'pending' | 'sent' | 'failed'

export interface ManualSaleItem {
  id: string
  manual_sale_id: string
  product_type: ManualSaleProductType
  product_name: string
  description: string | null
  serial_number: string | null
  quantity: number
  unit_price: number
  discount: number
  subtotal: number
  warranty_months: number | null
  warranty_end_date: string | null
  created_at: string
  updated_at: string
}

export interface ManualSale {
  id: string
  invoice_number: string
  client_id: string
  user_id: string
  sale_date: string
  warranty_type: string | null
  warranty_start_date: string | null
  warranty_end_date: string | null
  warranty_days: number | null
  subtotal: number
  discount_total: number
  total: number
  payment_method: ManualSalePaymentMethod
  payment_detail: string | null
  observations: string | null
  status: ManualSaleStatus
  cancelled_by: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  client_name: string
  client_document: string
  client_phone: string
  client_email: string | null
  client_address: string | null
  created_at: string
  updated_at: string
  client?: Customer
  user?: User
  cancelled_by_user?: User
  items?: ManualSaleItem[]
  whatsapp_logs?: ManualSaleWhatsappLog[]
}

export interface ManualSaleWhatsappLog {
  id: string
  manual_sale_id: string
  client_id: string
  user_id: string
  phone: string
  chat_id: string
  message: string
  ticket_path: string | null
  status: ManualSaleWhatsappStatus
  provider: string
  provider_message_id: string | null
  error_message: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

export interface ManualSaleItemInput {
  product_type: ManualSaleProductType
  product_name: string
  description?: string
  serial_number?: string
  quantity: number
  unit_price: number
  discount?: number
  warranty_months?: number
  warranty_end_date?: string
}

export interface ManualSaleClientInput {
  id?: string
  full_name: string
  cedula: string
  phone: string
  email?: string
  address?: string
}

export interface CreateManualSaleInput {
  client: ManualSaleClientInput
  items: ManualSaleItemInput[]
  warranty_start_date?: string
  warranty_type?: string
  warranty_days?: number
  warranty_end_date?: string
  payment_method: ManualSalePaymentMethod
  payment_detail?: string
  observations?: string
}
