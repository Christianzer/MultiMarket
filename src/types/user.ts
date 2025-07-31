export type UserRole = 'super_admin' | 'admin' | 'caissier'

export interface User {
  id: number
  username: string
  role: UserRole
  createdAt: string
  supermarket?: {
    id: number
    name: string
    code: string
  } | null
}

export interface CreateUserRequest {
  username: string
  password: string
  role: UserRole
  supermarket?: string
}

export interface UpdateUserRequest {
  username?: string
  password?: string
  role?: UserRole
  supermarket?: string
}