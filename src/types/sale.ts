export interface SaleItem {
  productId: number
  productName: string
  price: string
  quantity: number
}

export interface Sale {
  total: string
  items: SaleItem[]
  clientAmount?: number
  change?: number
}

export interface CartItem {
  productId: number
  productCode: string
  productName: string
  price: string
  quantity: number
}

export interface ProductSearchResult {
  id: number
  code: string
  name: string
  price: string
  createdAt: string
  updatedAt: string
  supermarket: string
}

// Interfaces pour la liste des ventes
export interface SaleUser {
  id: number
  username: string
  role: string
}

export interface SaleSupermarket {
  id: number
  name: string
  code: string
}

export interface SaleRecord {
  id: number
  total: number
  items: SaleItem[]
  date: string
  user: SaleUser
  supermarket: SaleSupermarket
}

export interface SalesPagination {
  total: number
  page: number
  limit: number
  pages: number
}

export interface SalesStats {
  today_total: number
  month_total: number
  view_type: string
}

export interface SalesUserInfo {
  username: string
  role: string
  supermarket: string
}

export interface SalesListResponse {
  sales: SaleRecord[]
  pagination: SalesPagination
  stats: SalesStats
  user_info: SalesUserInfo
}