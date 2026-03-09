import type { IServiceOrderRepository } from '../../domain/repositories/IServiceOrderRepository'
import type { ServiceOrder } from '../../domain/entities/ServiceOrder'

export class GetServiceOrdersUseCase {
  private serviceOrderRepository: IServiceOrderRepository;

  constructor(serviceOrderRepository: IServiceOrderRepository) {
    this.serviceOrderRepository = serviceOrderRepository;
  }

  async execute(): Promise<ServiceOrder[]> {
    return await this.serviceOrderRepository.findAll()
  }
}

export class GetServiceOrderByIdUseCase {
  private serviceOrderRepository: IServiceOrderRepository;

  constructor(serviceOrderRepository: IServiceOrderRepository) {
    this.serviceOrderRepository = serviceOrderRepository;
  }

  async execute(orderId: string): Promise<ServiceOrder | null> {
    if (!orderId) {
      throw new Error('El ID de la orden es requerido')
    }

    return await this.serviceOrderRepository.findById(orderId)
  }
}

export class GetServiceOrdersByCustomerUseCase {
  private serviceOrderRepository: IServiceOrderRepository;

  constructor(serviceOrderRepository: IServiceOrderRepository) {
    this.serviceOrderRepository = serviceOrderRepository;
  }

  async execute(customerId: string): Promise<ServiceOrder[]> {
    if (!customerId) {
      throw new Error('El ID del cliente es requerido')
    }

    return await this.serviceOrderRepository.findByCustomerId(customerId)
  }
}

export class GetServiceOrdersByStatusUseCase {
  private serviceOrderRepository: IServiceOrderRepository;

  constructor(serviceOrderRepository: IServiceOrderRepository) {
    this.serviceOrderRepository = serviceOrderRepository;
  }

  async execute(status: string): Promise<ServiceOrder[]> {
    if (!status) {
      throw new Error('El estado es requerido')
    }

    return await this.serviceOrderRepository.findByStatus(status)
  }
}

export class GetServiceOrdersByTechnicianUseCase {
  private serviceOrderRepository: IServiceOrderRepository;

  constructor(serviceOrderRepository: IServiceOrderRepository) {
    this.serviceOrderRepository = serviceOrderRepository;
  }

  async execute(technicianId: string): Promise<ServiceOrder[]> {
    if (!technicianId) {
      throw new Error('El ID del técnico es requerido')
    }

    return await this.serviceOrderRepository.findByTechnicianId(technicianId)
  }
}
