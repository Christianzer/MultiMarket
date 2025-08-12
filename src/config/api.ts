// Configuration de l'API
export const API_CONFIG = {
  baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'https://multi.ciatci.com/public/index.php/api'),
  timeout: 10000, // 10 secondes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}

// Variables d'environnement
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'SuperMarket Admin',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
}

// Fonction utilitaire pour construire les URLs d'API
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.baseURL.replace(/\/$/, '') // Supprimer le slash final
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${baseUrl}${cleanEndpoint}`
}

// Fonction utilitaire pour construire l'URL complète d'un logo
export const buildLogoUrl = (logoPath: string | null | undefined): string | null => {
  if (!logoPath) return null

  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath
  }

  const baseUrl = API_CONFIG.baseURL.replace(/\/(index\.php)?\/api$/, '')
  const cleanPath = logoPath.startsWith('/') ? logoPath : `/${logoPath}`
  return `${baseUrl}${cleanPath}`
}


// Types pour les réponses API
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  status?: number
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}