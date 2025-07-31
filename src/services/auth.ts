import type { LoginRequest, LoginResponse } from '@/types/auth'
import { API_CONFIG, buildApiUrl, type ApiResponse, type ApiError } from '@/config/api'

// Service d'authentification
class AuthService {
  private baseUrl = API_CONFIG.baseURL


  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.apiCall<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
    
    // L'API retourne directement l'objet
    return response
  }

  async logout(): Promise<void> {
    await this.apiCall('/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      await this.apiCall('/verify-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return true
    } catch {
      return false
    }
  }

  // Méthode pour faire de vrais appels API
  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = buildApiUrl(endpoint)
    
    const response = await fetch(url, {
      ...API_CONFIG,
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error: ApiError = {
        message: errorData.message || `API Error: ${response.statusText}`,
        code: errorData.code,
        status: response.status
      }
      throw error
    }

    return response.json()
  }
}

export const authService = new AuthService()