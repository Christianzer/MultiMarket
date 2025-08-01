import { defineStore } from 'pinia'
import type { AuthState, LoginRequest, User } from '@/types/auth'
import { authService } from '@/services/auth'
import { useAppStore } from './app'
import { buildLogoUrl } from '@/config/api'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem(TOKEN_KEY),
    user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
    isAuthenticated: false
  }),

  getters: {
    isLoggedIn: (state) => state.isAuthenticated && !!state.token,
    currentUser: (state) => state.user,
    userRole: (state) => state.user?.role,
    supermarket: (state) => state.user?.supermarket,
    hasCustomBranding: (state) => !!state.user?.supermarket
  },

  actions: {
    async login(credentials: LoginRequest) {
      try {
        const response = await authService.login(credentials)
        
        // Stocker le token et l'utilisateur
        this.token = response.token
        this.user = response.user
        this.isAuthenticated = true

        // Persister dans localStorage
        localStorage.setItem(TOKEN_KEY, response.token)
        localStorage.setItem(USER_KEY, JSON.stringify(response.user))

        // Appliquer le thème personnalisé si disponible
        this.applyCustomBranding()

        return response
      } catch (error) {
        this.clearAuth()
        throw error
      }
    },

    async logout() {
      try {
        await authService.logout()
      } catch (error) {
        console.warn('Erreur lors de la déconnexion:', error)
      } finally {
        this.clearAuth()
        this.resetBranding()
      }
    },

    async initAuth() {
      const token = this.token
      if (token) {
        try {
          const isValid = await authService.verifyToken(token)
          if (isValid) {
            this.isAuthenticated = true
            this.applyCustomBranding()
          } else {
            this.clearAuth()
          }
        } catch {
          this.clearAuth()
        }
      }
    },

    clearAuth() {
      this.token = null
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },

    applyCustomBranding() {
      if (this.user?.supermarket) {
        const appStore = useAppStore()
        appStore.setBranding({
          logo: buildLogoUrl(this.user.supermarket.logo) || '/favicon.ico',
          primaryColor: this.user.supermarket.primaryColor || 'hsl(263.4,70%,50.4%)',
          secondaryColor: this.user.supermarket.secondaryColor || 'hsl(215,27.9%,16.9%)',
          supermarketName: this.user.supermarket.name
        })
      }
    },

    resetBranding() {
      const appStore = useAppStore()
      appStore.resetBranding()
    },

    updateUser(user: User) {
      this.user = user
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      this.applyCustomBranding()
    }
  }
})