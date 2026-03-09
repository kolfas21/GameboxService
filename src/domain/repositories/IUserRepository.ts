import type { User } from '../entities/User'

export interface IUserRepository {
  findAll(): Promise<User[]>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByRole(role: string): Promise<User[]>
  updateProfile(id: string, data: Partial<User>): Promise<User>
}
