import type { IServiceOrderRepository } from '../../domain/repositories/IServiceOrderRepository'
import type { ServiceOrder } from '../../domain/entities/ServiceOrder'
import type { CreateServiceOrderDTO } from '../dtos'

export class CreateServiceOrderUseCase {
  private serviceOrderRepository: IServiceOrderRepository;

  constructor(serviceOrderRepository: IServiceOrderRepository) {
    this.serviceOrderRepository = serviceOrderRepository;
  }

  async execute(orderData: CreateServiceOrderDTO): Promise<ServiceOrder> {
    if (!orderData.customer_id) {
      throw new Error('El ID del cliente es requerido')
    }

    if (!orderData.device_type || !orderData.device_brand || !orderData.device_model) {
      throw new Error('Los datos del dispositivo son requeridos')
    }

    if (!orderData.problem_description || orderData.problem_description.trim().length === 0) {
      throw new Error('La descripción del problema es requerida')
    }

    return await this.serviceOrderRepository.create(orderData)
  }
}
