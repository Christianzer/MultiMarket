// Service de surveillance du token JWT
import { useAuthStore } from '@/stores/auth'

interface JWTPayload {
  exp?: number
  iat?: number
  [key: string]: any
}

class TokenWatcher {
  private checkInterval: NodeJS.Timeout | null = null
  private readonly CHECK_INTERVAL = 30 * 1000 // Vérifier toutes les 30 secondes
  private readonly EXPIRY_WARNING_TIME = 2 * 60 * 1000 // Avertir 2 minutes avant expiration

  /**
   * Décoder le payload d'un token JWT
   */
  private decodeJWTPayload(token: string): JWTPayload | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null
      
      const payload = parts[1]
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      return JSON.parse(decoded) as JWTPayload
    } catch (error) {
      console.warn('Erreur décodage JWT:', error)
      return null
    }
  }

  /**
   * Vérifier si le token est expiré ou sur le point d'expirer
   */
  private checkTokenExpiry(): void {
    const authStore = useAuthStore()
    const token = authStore.token

    if (!token || !authStore.isLoggedIn) {
      this.stopWatching()
      return
    }

    const payload = this.decodeJWTPayload(token)
    if (!payload || !payload.exp) {
      console.warn('Token JWT invalide ou sans expiration')
      return
    }

    const now = Math.floor(Date.now() / 1000) // Unix timestamp en secondes
    const expiresAt = payload.exp
    const timeUntilExpiry = (expiresAt - now) * 1000 // En millisecondes

    console.debug(`⏰ Token expire dans ${Math.round(timeUntilExpiry / 1000 / 60)} minutes`)

    // Token déjà expiré
    if (timeUntilExpiry <= 0) {
      console.warn('🔒 Token JWT expiré détecté par le watcher')
      this.handleTokenExpired()
      return
    }

    // Token va expirer bientôt (optionnel: afficher un avertissement)
    if (timeUntilExpiry <= this.EXPIRY_WARNING_TIME) {
      console.warn('⚠️ Token JWT va expirer bientôt')
      // Optionnel: émettre un événement pour afficher une notification d'avertissement
      window.dispatchEvent(new CustomEvent('auth-token-warning', {
        detail: { 
          expiresInMinutes: Math.round(timeUntilExpiry / 1000 / 60),
          message: 'Votre session va expirer bientôt'
        }
      }))
    }
  }

  /**
   * Gérer l'expiration du token
   */
  private handleTokenExpired(): void {
    this.stopWatching()
    
    // Émettre l'événement d'expiration
    window.dispatchEvent(new CustomEvent('auth-token-expired', {
      detail: { 
        status: 401,
        message: 'Votre session a expiré. Veuillez vous reconnecter.',
        source: 'token-watcher'
      }
    }))
  }

  /**
   * Commencer la surveillance du token
   */
  startWatching(): void {
    if (this.checkInterval) {
      this.stopWatching()
    }

    console.log('🔍 Démarrage de la surveillance du token JWT')
    
    // Vérification immédiate
    this.checkTokenExpiry()
    
    // Vérifications périodiques
    this.checkInterval = setInterval(() => {
      this.checkTokenExpiry()
    }, this.CHECK_INTERVAL)
  }

  /**
   * Arrêter la surveillance du token
   */
  stopWatching(): void {
    if (this.checkInterval) {
      console.log('⏹️ Arrêt de la surveillance du token JWT')
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * Vérifier immédiatement le token
   */
  checkNow(): void {
    this.checkTokenExpiry()
  }

  /**
   * Obtenir des informations sur le token actuel
   */
  getTokenInfo(): { isValid: boolean; expiresAt?: Date; expiresInMinutes?: number } {
    const authStore = useAuthStore()
    const token = authStore.token

    if (!token) {
      return { isValid: false }
    }

    const payload = this.decodeJWTPayload(token)
    if (!payload || !payload.exp) {
      return { isValid: false }
    }

    const now = Math.floor(Date.now() / 1000)
    const expiresAt = new Date(payload.exp * 1000)
    const expiresInMinutes = Math.round((payload.exp - now) / 60)

    return {
      isValid: payload.exp > now,
      expiresAt,
      expiresInMinutes
    }
  }
}

// Instance singleton
export const tokenWatcher = new TokenWatcher()

// Hook Vue pour utiliser le token watcher
export function useTokenWatcher() {
  return {
    watcher: tokenWatcher,
    startWatching: () => tokenWatcher.startWatching(),
    stopWatching: () => tokenWatcher.stopWatching(),
    checkNow: () => tokenWatcher.checkNow(),
    getTokenInfo: () => tokenWatcher.getTokenInfo()
  }
}