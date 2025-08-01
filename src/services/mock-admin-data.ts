import type { AdminDashboardData } from '@/types/dashboard'

// Données mock pour tester le dashboard admin
export const mockAdminDashboardData: AdminDashboardData = {
  "type": "admin",
  "supermarket": {
    "id": 1,
    "name": "Carrefour Abidjan",
    "code": "CAR_ABI"
  },
  "overview": {
    "total_users": 3,
    "total_products": 8
  },
  "revenue": {
    "total": 5680.40,
    "today": 89.50,
    "month": 1850.30
  },
  "cashiers_performance": [
    {
      "username": "marie_carrefour",
      "sales_count": 28,
      "revenue": 1250.80
    },
    {
      "username": "paul_carrefour", 
      "sales_count": 17,
      "revenue": 599.50
    }
  ],
  "last_7_days": [
    {
      "date": "2025-07-23",
      "revenue": 180.30,
      "sales": 7
    },
    {
      "date": "2025-07-24", 
      "revenue": 234.60,
      "sales": 9
    },
    {
      "date": "2025-07-25", 
      "revenue": 156.90,
      "sales": 6
    },
    {
      "date": "2025-07-26", 
      "revenue": 298.40,
      "sales": 12
    },
    {
      "date": "2025-07-27", 
      "revenue": 187.20,
      "sales": 8
    },
    {
      "date": "2025-07-28", 
      "revenue": 342.70,
      "sales": 15
    },
    {
      "date": "2025-07-29", 
      "revenue": 89.50,
      "sales": 4
    }
  ],
  "today_hourly": [
    {
      "hour": 8,
      "sales": 2,
      "revenue": 15.40
    },
    {
      "hour": 9,
      "sales": 5,
      "revenue": 28.90
    },
    {
      "hour": 10,
      "sales": 3,
      "revenue": 45.20
    },
    {
      "hour": 11,
      "sales": 0,
      "revenue": 0
    },
    {
      "hour": 12,
      "sales": 0,
      "revenue": 0
    }
  ]
}