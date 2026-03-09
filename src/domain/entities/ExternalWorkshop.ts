export interface ExternalWorkshopRef {
  id: string
  name: string
  phone: string
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
