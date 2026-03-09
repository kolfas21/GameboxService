import type { IServiceOrderRepository } from '../../domain/repositories/IServiceOrderRepository'
import type { ServiceOrder } from '../../domain/entities/ServiceOrder'

export class DeliverServiceOrderUseCase {
  private serviceOrderRepository: IServiceOrderRepository;

  constructor(serviceOrderRepository: IServiceOrderRepository) {
    this.serviceOrderRepository = serviceOrderRepository;
  }

  async execute(orderId: string, deliveryNotes?: string): Promise<ServiceOrder> {
    if (!orderId) {
      throw new Error('El ID de la orden es requerido')
    }

    return await this.serviceOrderRepository.markAsDelivered(orderId, deliveryNotes)
  }
}
