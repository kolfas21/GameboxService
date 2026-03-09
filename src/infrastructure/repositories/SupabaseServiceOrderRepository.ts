import type { IServiceOrderRepository } from '../../domain/repositories/IServiceOrderRepository'
import type { ServiceOrder } from '../../domain/entities/ServiceOrder'
import type { CreateServiceOrderDTO, CreateMultipleDeviceOrderDTO, UpdateServiceOrderDTO } from '../../application/dtos'
import { supabase } from '../supabase/supabaseClient'
import { generateOrderNumberSimple } from '../../utils/orderNumber'

export class SupabaseServiceOrderRepository implements IServiceOrderRepository {
  private readonly selectQuery = `
    *,
    customer:customers(*),
    assigned_technician:profiles!service_orders_assigned_technician_id_fkey(*),
    completed_by:profiles!service_orders_completed_by_id_fkey(*),
    received_by:profiles!service_orders_received_by_id_fkey(*)
  `

  async findAll(): Promise<ServiceOrder[]> {
    const { data, error } = await supabase
      .from('service_orders')
      .select(this.selectQuery)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async findById(id: string): Promise<ServiceOrder | null> {
    const { data, error } = await supabase
      .from('service_orders')
      .select(this.selectQuery)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async findByCustomerId(customerId: string): Promise<ServiceOrder[]> {
    const { data, error } = await supabase
      .from('service_orders')
      .select(this.selectQuery)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async findByStatus(status: string): Promise<ServiceOrder[]> {
    const { data, error } = await supabase
      .from('service_orders')
      .select(this.selectQuery)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async findByTechnicianId(technicianId: string): Promise<ServiceOrder[]> {
    const { data, error } = await supabase
      .from('service_orders')
      .select(this.selectQuery)
      .eq('assigned_technician_id', technicianId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async create(orderData: CreateServiceOrderDTO): Promise<ServiceOrder> {
    const orderNumber = generateOrderNumberSimple()
    
    const orderToInsert = {
      ...orderData,
      order_number: orderNumber,
    }

    const { data: insertedOrder, error: insertError } = await supabase
      .from('service_orders')
      .insert(orderToInsert)
      .select('*')
      .single()

    if (insertError) throw insertError

    const { data: completeOrder, error: fetchError } = await supabase
      .from('service_orders')
      .select(this.selectQuery)
      .eq('id', insertedOrder.id)
      .single()

    if (fetchError) {
      const basicOrder = {
        ...insertedOrder,
        customer: null,
        assigned_technician: null,
        completed_by: null,
        received_by: null
      }
      return basicOrder as ServiceOrder
    }

    return completeOrder
  }

  async createMultiple(orderData: CreateMultipleDeviceOrderDTO): Promise<ServiceOrder[]> {
    if (!orderData.devices || orderData.devices.length === 0) {
      throw new Error('Debe agregar al menos un dispositivo')
    }

    const createdOrders: ServiceOrder[] = []

    for (const device of orderData.devices) {
      const orderNumber = generateOrderNumberSimple()

      const orderToInsert = {
        customer_id: orderData.customer_id,
        device_type: device.device_type,
        device_brand: device.device_brand,
        device_model: device.device_model,
        serial_number: device.serial_number || null,
        problem_description: device.problem_description,
        observations: device.observations || null,
        order_number: orderNumber,
      }

      const { data: insertedOrder, error: insertError } = await supabase
        .from('service_orders')
        .insert(orderToInsert)
        .select('*')
        .single()

      if (insertError) throw insertError

      const { data: completeOrder, error: fetchError } = await supabase
        .from('service_orders')
        .select(this.selectQuery)
        .eq('id', insertedOrder.id)
        .single()

      if (fetchError) {
        const basicOrder = {
          ...insertedOrder,
          customer: null,
          assigned_technician: null,
          completed_by: null,
          received_by: null
        }
        createdOrders.push(basicOrder as ServiceOrder)
      } else {
        createdOrders.push(completeOrder)
      }
    }

    return createdOrders
  }

  async update(id: string, updates: UpdateServiceOrderDTO): Promise<ServiceOrder> {
    const { data, error } = await supabase
      .from('service_orders')
      .update(updates)
      .eq('id', id)
      .select(this.selectQuery)
      .single()

    if (error) throw error
    return data
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('service_orders')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async markAsDelivered(orderId: string, deliveryNotes?: string): Promise<ServiceOrder> {
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('service_orders')
      .update({
        status: 'delivered',
        delivered_at: now,
        delivery_notes: deliveryNotes || null,
        updated_at: now,
      })
      .eq('id', orderId)
      .select(this.selectQuery)
      .single()

    if (error) throw error
    return data
  }

  async saveCompletionNotes(orderId: string, notes: string): Promise<ServiceOrder> {
    const { data, error } = await supabase
      .from('service_orders')
      .update({
        status: 'completed',
        completion_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select(this.selectQuery)
      .single()

    if (error) throw error
    return data
  }
}
