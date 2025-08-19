import { API_CONFIG, buildApiUrl, type ApiResponse, type ApiError } from '@/config/api'

// Service API générique
class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken()
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  private handleAuthError(status: number): void {
    if (status === 401 || status === 403) {
      console.warn('🔒 Token JWT expiré ou invalide - Déconnexion automatique')
      
      // Émettre un événement global pour signaler l'expiration du token
      window.dispatchEvent(new CustomEvent('auth-token-expired', {
        detail: { 
          status,
          message: 'Votre session a expiré. Veuillez vous reconnecter.' 
        }
      }))
    }
  }

  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint)

    const isFormData = options.body instanceof FormData
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...(!isFormData ? API_CONFIG.headers : {}),
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        // Gérer l'expiration du token JWT
        this.handleAuthError(response.status)
        
        const errorData = await response.json().catch(() => ({}))
        const error: ApiError = {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          code: errorData.code || response.status.toString(),
          status: response.status
        }
        throw error
      }

      // Gérer les réponses 204 (No Content) pour les suppressions
      if (response.status === 204) {
        return { success: true, status: 204, data: null as T }
      }

      // Gérer les réponses sans contenu
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        return { success: true, status: response.status, data: null as T }
      }

      return await response.json()
    } catch (error) {
      if (error instanceof TypeError) {
        // Erreur réseau
        throw {
          message: 'Erreur de connexion au serveur',
          code: 'NETWORK_ERROR',
          status: 0
        } as ApiError
      }
      throw error
    }
  }

  // Méthodes HTTP courantes
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {}
    
    // Pour l'authentification, utiliser application/json
    if (endpoint === '/login' || endpoint === '/logout' || endpoint === '/verify-token') {
      headers['Accept'] = 'application/json'
    }
    
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiService = new ApiService()

// Fonctions utilitaires pour les endpoints courants
export const api = {
  // Authentification
  auth: {
    login: (credentials: any) => apiService.post('/login', credentials),
    logout: () => apiService.post('/logout'),
    verifyToken: () => apiService.post('/verify-token'),
    refreshToken: () => apiService.post('/refresh-token'),
  },

  // Utilisateurs
  users: {
    getAll: () => apiService.get('/users'),
    getById: (id: number) => apiService.get(`/users/${id}`),
    create: (user: any) => apiService.post('/users', user),
    update: (id: number, user: any) => apiService.put(`/users/${id}`, user),
    delete: (id: number) => apiService.delete(`/users/${id}`),
  },

  // Supermarchés
  supermarkets: {
    getAll: () => apiService.get('/supermarkets'),
    getById: (id: number) => apiService.get(`/supermarkets/${id}`),
    create: (supermarket: any) => apiService.post('/supermarkets', supermarket),
    update: (id: number, supermarket: any) => apiService.put(`/supermarkets/${id}`, supermarket),
    delete: (id: number) => apiService.delete(`/supermarkets/${id}`),
    uploadLogo: (id: number, logoFile: File) => {
      const formData = new FormData()
      formData.append('logo', logoFile)
      return apiService.request(`/supermarkets/${id}/logo`, {
        method: 'POST',
        body: formData,
        headers: {} // Remove Content-Type to let browser set multipart boundary
      })
    },
  },

  // Produits
  products: {
    getAll: () => apiService.get('/products?pagination=false'),
    getById: (id: number) => apiService.get(`/products/${id}`),
    create: (product: any) => apiService.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }),
    bulkCreate: (products: any) => apiService.request('/products/bulk', {
      method: 'POST',
      body: JSON.stringify(products),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }),
    uploadImage: (id: any, imageFille: File) => {
      const formData = new FormData()
      formData.append('image', imageFille)
      return apiService.request(`/products/${id}/image`, {
        method: 'POST',
        body: formData,
        headers: {} // Remove Content-Type to let browser set multipart boundary
      })
    },
    update: (id: number, product: any) => apiService.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }),
    delete: (id: number) => apiService.delete(`/products/${id}`),
  },

  // Ventes
  sales: {
    getAll: () => apiService.get('/sales'),
    getById: (id: number) => apiService.get(`/sales/${id}`),
    create: (sale: any) => apiService.post('/sales', sale),
    update: (id: number, sale: any) => apiService.put(`/sales/${id}`, sale),
    delete: (id: number) => apiService.delete(`/sales/${id}`),
    getList: () => apiService.get('/my-sales'),
  },

  // Restockage
  restock: {
    getAll: () => apiService.get('/restocks'),
    bulkRestock: (data: any) => apiService.post('/restock/bulk', data),
    delete: (id: number) => apiService.delete(`/restocks/${id}`),
  },

  // Tableau de bord
  dashboard: {
    getData: () => apiService.get('/dashboard'),
  },
}