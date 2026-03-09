import type { ICustomerRepository } from '../../domain/repositories/ICustomerRepository'
import type { Customer } from '../../domain/entities/Customer'
import type { CreateCustomerDTO, UpdateCustomerDTO } from '../../application/dtos'
import { supabase } from '../supabase/supabaseClient'

export class SupabaseCustomerRepository implements ICustomerRepository {
  async findAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async findById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async findByCedula(cedula: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('cedula', cedula.trim())
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }
    
    return data
  }

  async create(customerData: CreateCustomerDTO): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, updates: UpdateCustomerDTO): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
