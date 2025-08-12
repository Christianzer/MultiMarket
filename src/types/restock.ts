export interface RestockItem {
  productId: number
  quantity: number
}

export interface BulkRestockRequest {
  items: RestockItem[]
  note?: string
}

export interface Restock {
  id: number
  product: {
    id: number
    code: string
    name: string
    image:string
  }
  quantity: number
  note: string
  createdAt: string
  user: {
    username: string
  }
}


export interface RestockFormItem {
  productId: string
  quantity: string
}