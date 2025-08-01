// Types pour les données du tableau de bord

// Types communs
export interface DashboardRevenue {
  total: number
  today: number
  month: number
}

export interface DailyData {
  date: string
  revenue: number
  sales: number
}

export interface HourlyData {
  hour: number
  sales: number
  revenue: number
}

// Types Super Admin
export interface DashboardOverview {
  total_supermarkets: number
  active_supermarkets: number
  total_users: number
  total_products: number
}

export interface TopSupermarket {
  name: string
  code: string
  revenue: number
  sales_count: number
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

// Types Admin
export interface SupermarketInfo {
  id: number
  name: string
  code: string
}

export interface AdminOverview {
  total_users: number
  total_products: number
}

export interface CashierPerformance {
  username: string
  sales_count: number
  revenue: number
}

export interface AdminDashboardData {
  type: 'admin'
  supermarket: SupermarketInfo
  overview: AdminOverview
  revenue: DashboardRevenue
  cashiers_performance: CashierPerformance[]
  last_7_days: DailyData[]
  today_hourly: HourlyData[]
}