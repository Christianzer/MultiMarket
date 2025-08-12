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
}

export const useProductsStore = defineStore('products', {
  state: (): ProductsState => ({
    products: [],
    loading: false,
    error: '',
    lastFetch: null,
    cacheExpiry: 5 * 60 * 1000 // 5 minutes
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

    // Créer un produit avec image
    async createProductWithImage(productData: CreateProductWithImageRequest) {
      try {
        this.loading = true
        
        const formData = new FormData()
        formData.append('code', productData.code)
        formData.append('name', productData.name)
        formData.append('price', productData.price)
        if (productData.stock !== undefined) {
          formData.append('stock', productData.stock.toString())
        }
        if (productData.image) {
          formData.append('image', productData.image)
        }
        
        const newProduct = await api.products.createWithImage(formData)
        
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

    // Mettre à jour un produit avec image
    async updateProductWithImage(id: number, productData: UpdateProductWithImageRequest) {
      try {
        this.loading = true
        
        const formData = new FormData()
        if (productData.code) formData.append('code', productData.code)
        if (productData.name) formData.append('name', productData.name)
        if (productData.price) formData.append('price', productData.price)
        if (productData.stock !== undefined) {
          formData.append('stock', productData.stock.toString())
        }
        if (productData.image) {
          formData.append('image', productData.image)
        }
        
        const updatedProduct = await api.products.updateWithImage(id, formData)
        
        // Mettre à jour le produit dans le cache
        const index = this.products.findIndex(p => p.id === id)
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
    }
  }
})