export interface Supermarket {
  id: number
  name: string
  code: string
  logo: string
  primaryColor: string | null
  secondaryColor: string | null
}


export interface User {
  id: number
  username: string
  role: string
  supermarket: Supermarket | null
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
}