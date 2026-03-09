import type { IServiceOrderRepository } from '../../domain/repositories/IServiceOrderRepository'
import type { ServiceOrder } from '../../domain/entities/ServiceOrder'

export class AssignTechnicianUseCase {
  private serviceOrderRepository: IServiceOrderRepository;

  constructor(serviceOrderRepository: IServiceOrderRepository) {
    this.serviceOrderRepository = serviceOrderRepository;
  }

  async execute(orderId: string, technicianId: string): Promise<ServiceOrder> {
    if (!orderId) {
      throw new Error('El ID de la orden es requerido')
    }

    if (!technicianId) {
      throw new Error('El ID del técnico es requerido')
    }

    return await this.serviceOrderRepository.update(orderId, {
      assigned_technician_id: technicianId,
      status: 'in_progress'
    })
  }
}
