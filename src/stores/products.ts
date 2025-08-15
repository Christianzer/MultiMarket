import { defineStore } from 'pinia'
import { api } from '@/services/api'
import type { Product, CreateProductRequest, UpdateProductRequest, CreateProductWithImageRequest, UpdateProductWithImageRequest } from '@/types/product'
import { performanceMonitor } from '@/utils/performance'

interface ProductsState {
  products: Product[]
  loading: boolean
  error: string
  lastFetch: Date | null
  cacheExpiry: number // Durée du cache en millisecondes
  pagination: {
    currentPage: number
    itemsPerPage: number
    totalItems: number
    totalPages: number
  }
}

export const useProductsStore = defineStore('products', {
  state: (): ProductsState => ({
    products: [],
    loading: false,
    error: '',
    lastFetch: null,
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
    pagination: {
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 0
    }
  }),

  getters: {
    // Vérifier si le cache est encore valide
    isCacheValid: (state) => {
      if (!state.lastFetch) return false
      return Date.now() - state.lastFetch.getTime() < state.cacheExpiry
    },

    // Produits par supermarché (pour les admins/caissiers)
    productsBySupermarket: (state) => (supermarketId: string) => {
      return state.products.filter(product => product.supermarket.id.toString() === supermarketId)
    },

    // Recherche dans les produits
    searchProducts: (state) => (query: string) => {
      if (!query.trim()) return state.products
      
      const searchTerm = query.toLowerCase().trim()
      return state.products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.code.toLowerCase().includes(searchTerm) ||
        product.supermarket.name.toLowerCase().includes(searchTerm)
      )
    },

    // Produits paginés
    paginatedProducts: (state) => {
      const start = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage
      const end = start + state.pagination.itemsPerPage
      return state.products.slice(start, end)
    },

    // Informations de pagination
    paginationInfo: (state) => {
      if (state.pagination.totalItems === 0) {
        return 'Aucun produit'
      }
      
      const start = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage + 1
      const end = Math.min(state.pagination.currentPage * state.pagination.itemsPerPage, state.pagination.totalItems)
      
      return `${start}-${end} sur ${state.pagination.totalItems} produits`
    }
  },

  actions: {
    // Charger les produits avec cache
    async fetchProducts(force = false) {
      // Si le cache est valide et qu'on ne force pas le rechargement
      if (!force && this.isCacheValid && this.products.length > 0) {
        return this.products
      }

      return await performanceMonitor.measure('products-fetch', async () => {
        try {
          this.loading = true
          this.error = ''
          
          const response = await api.products.getAll()
          
          if (response && response.data && Array.isArray(response.data)) {
            this.products = response.data as Product[]
          } else if (response && Array.isArray(response)) {
            this.products = response as unknown as Product[]
          } else {
            this.products = []
            this.error = 'Format de données inattendu'
          }
          
          this.lastFetch = new Date()
          this.updatePagination()
          return this.products
        } catch (err: any) {
          this.error = err.message || 'Erreur lors du chargement des produits'
          throw err
        } finally {
          this.loading = false
        }
      })
    },

    // Créer un produit et mettre à jour le cache
    async createProduct(productData: CreateProductRequest) {
      try {
        this.loading = true
        const newProduct = await api.products.create(productData)
        
        // Ajouter le nouveau produit au cache
        if (newProduct && newProduct.data) {
          this.products.push(newProduct.data as Product)
        }
        
        return newProduct
      } catch (err: any) {
        this.error = err.message || 'Erreur lors de la création'
        throw err
      } finally {
        this.loading = false
      }
    },


    // Mettre à jour un produit et le cache
    async updateProduct(id: string, productData: UpdateProductRequest) {
      try {
        this.loading = true
        const updatedProduct = await api.products.update(parseInt(id), productData)
        
        // Mettre à jour le produit dans le cache
        const index = this.products.findIndex(p => p.id.toString() === id)
        if (index !== -1 && updatedProduct && updatedProduct.data) {
          this.products[index] = updatedProduct.data as Product
        }
        
        return updatedProduct
      } catch (err: any) {
        this.error = err.message || 'Erreur lors de la mise à jour'
        throw err
      } finally {
        this.loading = false
      }
    },


    // Supprimer un produit et mettre à jour le cache
    async deleteProduct(id: string) {
      try {
        this.loading = true
        await api.products.delete(parseInt(id))
        
        // Supprimer le produit du cache
        this.products = this.products.filter(p => p.id.toString() !== id)
      } catch (err: any) {
        this.error = err.message || 'Erreur lors de la suppression'
        throw err
      } finally {
        this.loading = false
      }
    },

    // Invalider le cache
    invalidateCache() {
      this.lastFetch = null
      this.products = []
    },

    // Nettoyer les erreurs
    clearError() {
      this.error = ''
    },

    // Mettre à jour la pagination
    updatePagination() {
      this.pagination.totalItems = this.products.length
      this.pagination.totalPages = Math.ceil(this.products.length / this.pagination.itemsPerPage)
      
      // Réajuster la page courante si nécessaire
      if (this.pagination.currentPage > this.pagination.totalPages && this.pagination.totalPages > 0) {
        this.pagination.currentPage = this.pagination.totalPages
      }
    },

    // Changer de page
    setPage(page: number) {
      if (page >= 1 && page <= this.pagination.totalPages) {
        this.pagination.currentPage = page
      }
    },

    // Changer le nombre d'éléments par page
    setItemsPerPage(itemsPerPage: number) {
      this.pagination.itemsPerPage = itemsPerPage
      this.pagination.currentPage = 1 // Retour à la première page
      this.updatePagination()
    },

    // Naviguer dans la pagination
    nextPage() {
      if (this.pagination.currentPage < this.pagination.totalPages) {
        this.pagination.currentPage++
      }
    },

    prevPage() {
      if (this.pagination.currentPage > 1) {
        this.pagination.currentPage--
      }
    },

    firstPage() {
      this.pagination.currentPage = 1
    },

    lastPage() {
      this.pagination.currentPage = this.pagination.totalPages
    }
  }
})