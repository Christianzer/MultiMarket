import { api, apiService } from './api'
import { useToast } from '@/composables/useToast'
import type { ApiResponse } from '@/config/api'

const { success, error, promise } = useToast()

// Wrapper pour les opérations API avec toasts automatiques
export const apiWithToast = {
  // Authentification
  auth: {
    login: async (credentials: any) => {
      return promise(
        api.auth.login(credentials),
        {
          loading: 'Connexion en cours...',
          success: 'Connexion réussie !',
          error: 'Échec de la connexion'
        }
      )
    },
    
    logout: async () => {
      return promise(
        api.auth.logout(),
        {
          loading: 'Déconnexion...',
          success: 'Déconnexion réussie',
          error: 'Erreur lors de la déconnexion'
        }
      )
    }
  },

  // Utilisateurs
  users: {
    create: async (user: any) => {
      return promise(
        api.users.create(user),
        {
          loading: 'Création de l\'utilisateur...',
          success: 'Utilisateur créé avec succès !',
          error: 'Erreur lors de la création de l\'utilisateur'
        }
      )
    },

    update: async (id: number, user: any) => {
      return promise(
        api.users.update(id, user),
        {
          loading: 'Mise à jour de l\'utilisateur...',
          success: 'Utilisateur mis à jour avec succès !',
          error: 'Erreur lors de la mise à jour'
        }
      )
    },

    delete: async (id: number) => {
      return promise(
        api.users.delete(id),
        {
          loading: 'Suppression de l\'utilisateur...',
          success: 'Utilisateur supprimé avec succès !',
          error: 'Erreur lors de la suppression'
        }
      )
    }
  },

  // Supermarchés
  supermarkets: {
    create: async (supermarket: any) => {
      return promise(
        api.supermarkets.create(supermarket),
        {
          loading: 'Création du supermarché...',
          success: 'Supermarché créé avec succès !',
          error: 'Erreur lors de la création du supermarché'
        }
      )
    },

    update: async (id: number, supermarket: any) => {
      return promise(
        api.supermarkets.update(id, supermarket),
        {
          loading: 'Mise à jour du supermarché...',
          success: 'Supermarché mis à jour avec succès !',
          error: 'Erreur lors de la mise à jour'
        }
      )
    },

    delete: async (id: number) => {
      return promise(
        api.supermarkets.delete(id),
        {
          loading: 'Suppression du supermarché...',
          success: 'Supermarché supprimé avec succès !',
          error: 'Erreur lors de la suppression'
        }
      )
    },

    uploadLogo: async (id: number, logoFile: File) => {
      return promise(
        api.supermarkets.uploadLogo(id, logoFile),
        {
          loading: 'Téléchargement du logo...',
          success: 'Logo téléchargé avec succès !',
          error: 'Erreur lors du téléchargement du logo'
        }
      )
    }
  },

  // Produits
  products: {
    create: async (product: any) => {
      return promise(
        api.products.create(product),
        {
          loading: 'Création du produit...',
          success: 'Produit créé avec succès !',
          error: 'Erreur lors de la création du produit'
        }
      )
    },

    update: async (id: number, product: any) => {
      return promise(
        api.products.update(id, product),
        {
          loading: 'Mise à jour du produit...',
          success: 'Produit mis à jour avec succès !',
          error: 'Erreur lors de la mise à jour'
        }
      )
    },

    delete: async (id: number) => {
      return promise(
        api.products.delete(id),
        {
          loading: 'Suppression du produit...',
          success: 'Produit supprimé avec succès !',
          error: 'Erreur lors de la suppression'
        }
      )
    }
  },

  // Ventes
  sales: {
    create: async (sale: any) => {
      return promise(
        api.sales.create(sale),
        {
          loading: 'Enregistrement de la vente...',
          success: 'Vente enregistrée avec succès !',
          error: 'Erreur lors de l\'enregistrement de la vente'
        }
      )
    },

    update: async (id: number, sale: any) => {
      return promise(
        api.sales.update(id, sale),
        {
          loading: 'Mise à jour de la vente...',
          success: 'Vente mise à jour avec succès !',
          error: 'Erreur lors de la mise à jour'
        }
      )
    },

    delete: async (id: number) => {
      return promise(
        api.sales.delete(id),
        {
          loading: 'Suppression de la vente...',
          success: 'Vente supprimée avec succès !',
          error: 'Erreur lors de la suppression'
        }
      )
    }
  },

  // Restockage
  restock: {
    bulkRestock: async (data: any) => {
      return promise(
        api.restock.bulkRestock(data),
        {
          loading: 'Restockage en cours...',
          success: 'Restockage effectué avec succès !',
          error: 'Erreur lors du restockage'
        }
      )
    },

    delete: async (id: number) => {
      return promise(
        api.restock.delete(id),
        {
          loading: 'Suppression du restockage...',
          success: 'Restockage supprimé avec succès !',
          error: 'Erreur lors de la suppression'
        }
      )
    }
  }
}

// Export des fonctions de toast pour usage direct
export { useToast } from '@/composables/useToast'

// Fonctions utilitaires pour les toasts manuels
export const toastUtils = {
  success: (message: string) => success(message),
  error: (message: string) => error(message),
  
  // Toast pour les actions silencieuses avec succès
  silentSuccess: (message: string) => success(message, { duration: 2000 }),
  
  // Toast pour les erreurs critiques
  criticalError: (message: string) => error(message, { duration: 6000 }),
  
  // Toast pour les avertissements
  warning: (message: string) => {
    const { warning } = useToast()
    return warning(message)
  },
  
  // Toast d'information
  info: (message: string) => {
    const { info } = useToast()
    return info(message)
  }
}