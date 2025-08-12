export interface Product {
  id: number
  code: string
  name: string
  price: string // Prix en FCFA
  stock?: number
  image?: string // URL de l'image
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
  stock?: number
}

export interface UpdateProductRequest {
  code?: string
  name?: string
  price?: string // Prix en FCFA
  stock?: number
}

export interface CreateProductWithImageRequest {
  code: string
  name: string
  price: string // Prix en FCFA
  stock?: number
  image?: File
}

export interface UpdateProductWithImageRequest {
  code?: string
  name?: string
  price?: string // Prix en FCFA
  stock?: number
  image?: File
}