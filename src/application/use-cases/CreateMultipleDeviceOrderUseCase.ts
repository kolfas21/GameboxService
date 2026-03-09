import type { IServiceOrderRepository } from '../../domain/repositories/IServiceOrderRepository'
import type { ServiceOrder } from '../../domain/entities/ServiceOrder'
import type { CreateMultipleDeviceOrderDTO } from '../dtos'

export class CreateMultipleDeviceOrderUseCase {
  private serviceOrderRepository: IServiceOrderRepository;

  constructor(serviceOrderRepository: IServiceOrderRepository) {
    this.serviceOrderRepository = serviceOrderRepository;
  }

  async execute(orderData: CreateMultipleDeviceOrderDTO): Promise<ServiceOrder[]> {
    if (!orderData.customer_id) {
      throw new Error('El ID del cliente es requerido')
    }

    if (!orderData.devices || orderData.devices.length === 0) {
      throw new Error('Debe agregar al menos un dispositivo')
    }

    for (const device of orderData.devices) {
      if (!device.device_type || !device.device_brand || !device.device_model) {
        throw new Error('Todos los dispositivos deben tener tipo, marca y modelo')
      }

      if (!device.problem_description || device.problem_description.trim().length === 0) {
        throw new Error('Todos los dispositivos deben tener una descripción del problema')
      }
    }

    return await this.serviceOrderRepository.createMultiple(orderData)
  }
}
