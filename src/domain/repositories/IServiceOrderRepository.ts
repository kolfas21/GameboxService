import type { ServiceOrder } from '../entities/ServiceOrder'
import type { CreateServiceOrderDTO, CreateMultipleDeviceOrderDTO, UpdateServiceOrderDTO } from '../../application/dtos'

export interface IServiceOrderRepository {
  findAll(): Promise<ServiceOrder[]>
  findById(id: string): Promise<ServiceOrder | null>
  findByCustomerId(customerId: string): Promise<ServiceOrder[]>
  findByStatus(status: string): Promise<ServiceOrder[]>
  findByTechnicianId(technicianId: string): Promise<ServiceOrder[]>
  create(data: CreateServiceOrderDTO): Promise<ServiceOrder>
  createMultiple(data: CreateMultipleDeviceOrderDTO): Promise<ServiceOrder[]>
  update(id: string, data: UpdateServiceOrderDTO): Promise<ServiceOrder>
  delete(id: string): Promise<void>
  markAsDelivered(orderId: string, deliveryNotes?: string): Promise<ServiceOrder>
  saveCompletionNotes(orderId: string, notes: string): Promise<ServiceOrder>
}
