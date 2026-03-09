import type { ICustomerRepository } from '../../domain/repositories/ICustomerRepository'
import type { Customer } from '../../domain/entities/Customer'
import type { CreateCustomerDTO } from '../dtos'

export class CreateCustomerUseCase {
  private customerRepository: ICustomerRepository;

  constructor(customerRepository: ICustomerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(customerData: CreateCustomerDTO): Promise<Customer> {
    const existingCustomer = await this.customerRepository.findByCedula(customerData.cedula)
    
    if (existingCustomer) {
      throw new Error(`Ya existe un cliente con la cédula ${customerData.cedula}`)
    }

    return await this.customerRepository.create(customerData)
  }
}
