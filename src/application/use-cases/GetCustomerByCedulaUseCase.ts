import type { ICustomerRepository } from '../../domain/repositories/ICustomerRepository'
import type { Customer } from '../../domain/entities/Customer'

export class GetCustomerByCedulaUseCase {
  private customerRepository: ICustomerRepository;

  constructor(customerRepository: ICustomerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(cedula: string): Promise<Customer | null> {
    if (!cedula || cedula.trim().length === 0) {
      throw new Error('La cédula es requerida')
    }

    return await this.customerRepository.findByCedula(cedula.trim())
  }
}
