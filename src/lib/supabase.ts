import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '../config/supabase'

export const supabase = createClient(
  supabaseConfig.url, 
  supabaseConfig.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'receptionist' | 'technician'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role: 'admin' | 'receptionist' | 'technician'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'receptionist' | 'technician'
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          cedula: string
          full_name: string
          phone: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cedula: string
          full_name: string
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cedula?: string
          full_name?: string
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      service_orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          device_type: string
          device_brand: string
          device_model: string
          problem_description: string
          status: 'pending' | 'in_progress' | 'completed' | 'delivered'
          priority: 'low' | 'medium' | 'high'
          assigned_technician_id: string | null
          completed_by_id: string | null
          received_by_id: string
          estimated_completion: string | null
          completion_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          customer_id: string
          device_type: string
          device_brand: string
          device_model: string
          problem_description: string
          status?: 'pending' | 'in_progress' | 'completed' | 'delivered'
          priority?: 'low' | 'medium' | 'high'
          assigned_technician_id?: string | null
          completed_by_id?: string | null
          received_by_id: string
          estimated_completion?: string | null
          completion_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string
          device_type?: string
          device_brand?: string
          device_model?: string
          problem_description?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'delivered'
          priority?: 'low' | 'medium' | 'high'
          assigned_technician_id?: string | null
          completed_by_id?: string | null
          received_by_id?: string
          estimated_completion?: string | null
          completion_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      company_settings: {
        Row: {
          id: string
          company_name: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
