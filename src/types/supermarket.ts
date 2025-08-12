export interface Supermarket {
  id: number
  name: string
  code: string
  address: string
  phone: string
  logo: string | null
  primaryColor: string
  secondaryColor: string
  active: boolean
  createdAt: string
}

export interface CreateSupermarketRequest {
  name: string
  code: string
  address: string
  phone: string
}

export interface UpdateSupermarketRequest {
  name: string
  address: string
  phone: string
  code: string
}