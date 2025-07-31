export interface Product {
  id: number
  code: string
  name: string
  price: string // Prix en FCFA
  createdAt: string
  updatedAt: string
  supermarket: {
    id: number
    name: string
    code: string
  }
}

export interface CreateProductRequest {
  code: string
  name: string
  price: string // Prix en FCFA
}

export interface UpdateProductRequest {
  code?: string
  name?: string
  price?: string // Prix en FCFA
}