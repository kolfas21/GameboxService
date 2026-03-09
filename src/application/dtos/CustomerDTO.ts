export interface CreateCustomerDTO {
  cedula: string
  full_name: string
  phone?: string
  email?: string
}

export interface UpdateCustomerDTO {
  cedula?: string
  full_name?: string
  phone?: string | null
  email?: string | null
}
