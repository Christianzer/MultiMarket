import type { CreateProductWithImageRequest, UpdateProductWithImageRequest } from '@/types/product'

/**
 * Crée un objet FormData pour la création d'un produit avec image
 */
export function createProductFormData(productData: CreateProductWithImageRequest): FormData {
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
  
  return formData
}

/**
 * Crée un objet FormData pour la mise à jour d'un produit avec image
 */
export function updateProductFormData(productData: UpdateProductWithImageRequest): FormData {
  const formData = new FormData()
  
  if (productData.code) {
    formData.append('code', productData.code)
  }
  
  if (productData.name) {
    formData.append('name', productData.name)
  }
  
  if (productData.price) {
    formData.append('price', productData.price)
  }
  
  if (productData.stock !== undefined) {
    formData.append('stock', productData.stock.toString())
  }
  
  if (productData.image) {
    formData.append('image', productData.image)
  }
  
  return formData
}

/**
 * Valide si un fichier est une image valide
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Taille maximale: 5MB
  const maxSize = 5 * 1024 * 1024
  
  // Types MIME acceptés
  const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'La taille de l\'image ne doit pas dépasser 5MB'
    }
  }
  
  if (!acceptedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Seuls les formats JPEG, PNG et WebP sont acceptés'
    }
  }
  
  return { isValid: true }
}

/**
 * Crée une URL de prévisualisation pour un fichier image
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Libère une URL de prévisualisation créée avec createImagePreview
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url)
}