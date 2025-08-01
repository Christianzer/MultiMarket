// Types pour les données du tableau de bord Super Admin

export interface DashboardOverview {
  total_supermarkets: number
  active_supermarkets: number
  total_users: number
  total_products: number
}

export interface DashboardRevenue {
  total: number
  today: number
  month: number
}

export interface TopSupermarket {
  name: string
  code: string
  revenue: number
  sales_count: number
}

export interface DailyData {
  date: string
  revenue: number
  sales: number
}

export interface UsersByRole {
  role: string
  count: number
}

export interface SuperAdminDashboardData {
  type: 'super_admin'
  overview: DashboardOverview
  revenue: DashboardRevenue
  top_supermarkets: TopSupermarket[]
  last_7_days: DailyData[]
  users_by_role: UsersByRole[]
}