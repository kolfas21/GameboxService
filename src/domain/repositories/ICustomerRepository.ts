import type { Customer } from '../entities/Customer'
import type { CreateCustomerDTO, UpdateCustomerDTO } from '../../application/dtos'

export interface ICustomerRepository {
  findAll(): Promise<Customer[]>
  findById(id: string): Promise<Customer | null>
  findByCedula(cedula: string): Promise<Customer | null>
  create(data: CreateCustomerDTO): Promise<Customer>
  update(id: string, data: UpdateCustomerDTO): Promise<Customer>
  delete(id: string): Promise<void>
}
