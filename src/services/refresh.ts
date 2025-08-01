// Service centralisé pour l'actualisation des données

import { useProductsStore } from '@/stores/products'
import { useAuthStore } from '@/stores/auth'
import { performanceMonitor } from '@/utils/performance'

interface RefreshStrategy {
  name: string
  paths: string[]
  action: () => Promise<void>
  description: string
}

class RefreshService {
  private strategies: RefreshStrategy[] = []
  private isRefreshing = false

  constructor() {
    this.initializeStrategies()
  }

  private initializeStrategies() {
    this.strategies = [
      {
        name: 'products',
        paths: ['/products', '/dashboard/products'],
        action: async () => {
          const productsStore = useProductsStore()
          await productsStore.fetchProducts(true)
        },
        description: 'Actualisation des produits'
      },
      {
        name: 'users',
        paths: ['/users', '/dashboard/users'],
        action: async () => {
          // TODO: Implémenter quand le store users sera créé
          console.log('📋 Actualisation des utilisateurs')
          await this.simulateRefresh(800)
        },
        description: 'Actualisation des utilisateurs'
      },
      {
        name: 'sales',
        paths: ['/sales', '/ventes', '/dashboard/sales', '/dashboard/ventes'],
        action: async () => {
          // TODO: Implémenter quand le store sales sera créé
          console.log('💰 Actualisation des ventes')
          await this.simulateRefresh(600)
        },
        description: 'Actualisation des ventes'
      },
      {
        name: 'supermarkets',
        paths: ['/supermarkets', '/dashboard/supermarkets'],
        action: async () => {
          // TODO: Implémenter quand le store supermarkets sera créé
          console.log('🏪 Actualisation des supermarchés')
          await this.simulateRefresh(700)
        },
        description: 'Actualisation des supermarchés'
      },
      {
        name: 'profile',
        paths: ['/profile', '/dashboard/profile'],
        action: async () => {
          const authStore = useAuthStore()
          // Recharger les informations utilisateur
          console.log('👤 Actualisation du profil')
          await this.simulateRefresh(400)
        },
        description: 'Actualisation du profil'
      },
      {
        name: 'dashboard',
        paths: ['/dashboard', '/home', '/dashboard/home', '/dashboard/admin', '/dashboard/super-admin', '/dashboard/caissier'],
        action: async () => {
          // Actualiser les données principales du dashboard
          const productsStore = useProductsStore()
          await productsStore.fetchProducts(true)
          console.log('🏠 Actualisation du tableau de bord')
        },
        description: 'Actualisation du tableau de bord'
      }
    ]
  }

  private async simulateRefresh(delay: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  private findStrategy(currentPath: string): RefreshStrategy | null {
    return this.strategies.find(strategy => 
      strategy.paths.some(path => currentPath.includes(path))
    ) || null
  }

  async refreshCurrentPage(currentPath: string): Promise<{ success: boolean; message: string; duration?: number }> {
    if (this.isRefreshing) {
      return { success: false, message: 'Actualisation déjà en cours' }
    }

    const strategy = this.findStrategy(currentPath)
    
    if (!strategy) {
      return { success: false, message: 'Aucune stratégie d\'actualisation trouvée pour cette page' }
    }

    this.isRefreshing = true
    const startTime = performance.now()

    try {
      console.log(`🔄 ${strategy.description}...`)
      
      // Utiliser le monitoring de performance
      await performanceMonitor.measure(`refresh-${strategy.name}`, strategy.action)
      
      const duration = performance.now() - startTime
      const message = `✅ ${strategy.description} terminée en ${Math.round(duration)}ms`
      
      console.log(message)
      return { success: true, message, duration: Math.round(duration) }
      
    } catch (error: any) {
      const errorMessage = `❌ Erreur lors de ${strategy.description.toLowerCase()}: ${error.message}`
      console.error(errorMessage, error)
      return { success: false, message: errorMessage }
      
    } finally {
      this.isRefreshing = false
    }
  }

  // Actualiser plusieurs pages à la fois
  async refreshMultiple(paths: string[]): Promise<{ success: boolean; results: any[] }> {
    if (this.isRefreshing) {
      return { success: false, results: [] }
    }

    this.isRefreshing = true
    const results = []

    try {
      for (const path of paths) {
        const result = await this.refreshCurrentPage(path)
        results.push({ path, ...result })
      }

      return { success: true, results }
    } catch (error) {
      return { success: false, results }
    } finally {
      this.isRefreshing = false
    }
  }

  // Actualisation générale (toutes les données principales)
  async refreshAll(): Promise<{ success: boolean; message: string }> {
    if (this.isRefreshing) {
      return { success: false, message: 'Actualisation déjà en cours' }
    }

    this.isRefreshing = true
    const startTime = performance.now()

    try {
      console.log('🔄 Actualisation générale en cours...')
      
      const productsStore = useProductsStore()
      await productsStore.fetchProducts(true)
      
      // TODO: Ajouter d'autres stores quand ils seront créés
      // await usersStore.fetchUsers(true)
      // await salesStore.fetchSales(true)
      
      const duration = performance.now() - startTime
      const message = `✅ Actualisation générale terminée en ${Math.round(duration)}ms`
      
      console.log(message)
      return { success: true, message }
      
    } catch (error: any) {
      const errorMessage = `❌ Erreur lors de l'actualisation générale: ${error.message}`
      console.error(errorMessage, error)
      return { success: false, message: errorMessage }
      
    } finally {
      this.isRefreshing = false
    }
  }

  get refreshing(): boolean {
    return this.isRefreshing
  }

  // Obtenir les stratégies disponibles
  getStrategies(): Array<{ name: string; paths: string[]; description: string }> {
    return this.strategies.map(({ name, paths, description }) => ({ name, paths, description }))
  }

  // Obtenir la stratégie pour une page donnée
  getStrategyForPath(path: string): { name: string; description: string } | null {
    const strategy = this.findStrategy(path)
    return strategy ? { name: strategy.name, description: strategy.description } : null
  }
}

// Instance singleton
export const refreshService = new RefreshService()

// Hook Vue pour utiliser le service d'actualisation
export function useRefresh() {
  return {
    refresh: refreshService.refreshCurrentPage.bind(refreshService),
    refreshAll: refreshService.refreshAll.bind(refreshService),
    refreshMultiple: refreshService.refreshMultiple.bind(refreshService),
    isRefreshing: refreshService.refreshing,
    getStrategy: refreshService.getStrategyForPath.bind(refreshService),
    getStrategies: refreshService.getStrategies.bind(refreshService)
  }
}