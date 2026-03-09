import type { IServiceOrderRepository } from '../../domain/repositories/IServiceOrderRepository'
import type { ServiceOrder } from '../../domain/entities/ServiceOrder'

export class CompleteServiceOrderUseCase {
  private serviceOrderRepository: IServiceOrderRepository;

  constructor(serviceOrderRepository: IServiceOrderRepository) {
    this.serviceOrderRepository = serviceOrderRepository;
  }

  async execute(orderId: string, completionNotes: string, completedById: string): Promise<ServiceOrder> {
    if (!orderId) {
      throw new Error('El ID de la orden es requerido')
    }

    if (!completionNotes || completionNotes.trim().length === 0) {
      throw new Error('Las notas de completación son requeridas')
    }

    if (!completedById) {
      throw new Error('El ID del técnico es requerido')
    }

    const updatedOrder = await this.serviceOrderRepository.update(orderId, {
      status: 'completed',
      completion_notes: completionNotes
    })

    return updatedOrder
  }
}
