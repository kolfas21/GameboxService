export type UserRole = 'admin' | 'receptionist' | 'technician'

export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  sede: string | null
  created_at: string
  updated_at: string
}
