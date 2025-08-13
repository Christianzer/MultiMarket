<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { VirtualProductList } from '@/components/ui/virtual-list'
import { Plus, Edit, Trash2, Eye, Loader2, Package, Search, Grid, List, Upload, X, RefreshCw, Minus } from 'lucide-vue-next'
import { api } from '@/services/api'
import type { Product, CreateProductRequest, UpdateProductRequest, CreateProductWithImageRequest, UpdateProductWithImageRequest } from '@/types/product'
import { validateImageFile, createImagePreview, revokeImagePreview } from '@/utils/formData'
import { useAuthStore } from '@/stores/auth'
import { buildLogoUrl } from '@/config/api'
import type { Restock } from '@/types/restock'

const authStore = useAuthStore()

// Variables réactives locales pour remplacer le store
const products = ref<Product[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const viewMode = ref<'table' | 'virtual'>('table')

// Fonction debounce simple
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: number
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Modal states
const showCreateModal = ref(false)
const showBulkCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsModal = ref(false)
const showDeleteModal = ref(false)
const selectedProduct = ref<Product | null>(null)

// Form data
const createForm = ref<CreateProductRequest>({
  code: '',
  name: '',
  price: ''
})

const createFormWithImage = ref<CreateProductWithImageRequest>({
  code: '',
  name: '',
  price: '',
  image: undefined
})

const editForm = ref<UpdateProductRequest>({})

const editFormWithImage = ref<UpdateProductWithImageRequest>({
  image: undefined
})

const submitting = ref(false)
const imagePreviewUrl = ref<string | null>(null)
const editImagePreviewUrl = ref<string | null>(null)
const imageError = ref<string>('')
const fileInput = ref<HTMLInputElement | null>(null)
const editFileInput = ref<HTMLInputElement | null>(null)
const historyLoading = ref(false)

// Bulk create state - Excel-like table
interface BulkProduct {
  code: string
  name: string
  price: string
  stock?: string
  note?: string
  imageData?: string
  imageFile?: File | null
  imagePreview?: string
}

const bulkProducts = ref<BulkProduct[]>([...Array(5)].map(() => ({
  code: '',
  name: '',
  price: '',
  stock: '',
  note: '',
  imageData: '',
  imageFile: null,
  imagePreview: ''
})))
const bulkSubmitting = ref(false)
const bulkError = ref('')

const loadProducts = async (force = false) => {
  try {
    loading.value = true
    error.value = ''

    const response = await api.products.getAll()

    if (response && response.data && Array.isArray(response.data)) {
      products.value = response.data as Product[]
    } else if (response && Array.isArray(response)) {
      products.value = response as unknown as Product[]
    } else {
      products.value = []
      error.value = 'Format de données inattendu'
    }

    filterProducts()
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement des produits'
    console.error('Erreur lors du chargement des produits:', err)
  } finally {
    loading.value = false
  }
}

// Filtrer les produits selon le rôle et le supermarché
const baseFilteredProducts = ref<Product[]>([])

const filterProducts = () => {
  if (authStore.userRole === 'super_admin') {
    baseFilteredProducts.value = products.value
  } else if (authStore.userRole === 'admin' || authStore.userRole === 'caissier') {
    baseFilteredProducts.value = authStore.supermarket
      ? products.value.filter(product => product.supermarket.id.toString() === authStore.supermarket.id.toString())
      : []
  } else {
    baseFilteredProducts.value = []
  }
}

// Débounce de la recherche pour éviter trop de calculs
const debouncedSearch = debounce((query: string) => {
  debouncedSearchQuery.value = query
}, 300)

// Watcher pour déclencher le débounce
watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
}, { immediate: true })

// Filtrage avec recherche optimisé
const filteredProducts = computed(() => {
  if (!debouncedSearchQuery.value.trim()) {
    return baseFilteredProducts.value
  }

  const query = debouncedSearchQuery.value.toLowerCase().trim()
  return baseFilteredProducts.value.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.code.toLowerCase().includes(query) ||
    (authStore.userRole === 'super_admin' && product.supermarket.name.toLowerCase().includes(query))
  )
})

// Handle image file selection
const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      imageError.value = validation.error || 'Fichier invalide'
      return
    }

    imageError.value = ''
    createFormWithImage.value.image = file

    // Clean previous preview
    if (imagePreviewUrl.value) {
      revokeImagePreview(imagePreviewUrl.value)
    }

    // Create new preview
    imagePreviewUrl.value = createImagePreview(file)
  }
}

const handleEditImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      imageError.value = validation.error || 'Fichier invalide'
      return
    }

    imageError.value = ''
    editFormWithImage.value.image = file

    // Clean previous preview
    if (editImagePreviewUrl.value) {
      revokeImagePreview(editImagePreviewUrl.value)
    }

    // Create new preview
    editImagePreviewUrl.value = createImagePreview(file)
  }
}

const clearImagePreview = () => {
  if (imagePreviewUrl.value) {
    revokeImagePreview(imagePreviewUrl.value)
    imagePreviewUrl.value = null
  }
  createFormWithImage.value.image = undefined
  imageError.value = ''
}

const clearEditImagePreview = () => {
  if (editImagePreviewUrl.value) {
    revokeImagePreview(editImagePreviewUrl.value)
    editImagePreviewUrl.value = null
  }
  editFormWithImage.value.image = undefined
  imageError.value = ''
}

// Methods to trigger file inputs
const triggerFileInput = () => {
  fileInput.value?.click()
}

const triggerEditFileInput = () => {
  editFileInput.value?.click()
}

const openCreateModal = () => {
  createForm.value = {
    code: '',
    name: '',
    price: ''
  }
  createFormWithImage.value = {
    code: '',
    name: '',
    price: '',
    image: undefined
  }
  clearImagePreview()
  showCreateModal.value = true
}

const openBulkCreateModal = () => {
  // Reset to 5 empty rows
  bulkProducts.value = [...Array(5)].map(() => ({
    code: '',
    name: '',
    price: '',
    stock: '',
    note: '',
    imageData: '',
    imageFile: null,
    imagePreview: ''
  }))
  bulkError.value = ''
  showBulkCreateModal.value = true
}

const addBulkRows = (count: number = 2) => {
  for (let i = 0; i < count; i++) {
    bulkProducts.value.push({
      code: '',
      name: '',
      price: '',
      stock: '',
      note: '',
      imageData: '',
      imageFile: null,
      imagePreview: ''
    })
  }
}

const clearBulkTable = () => {
  bulkProducts.value.forEach(product => {
    product.code = ''
    product.name = ''
    product.price = ''
    product.stock = ''
    product.note = ''
    product.imageData = ''
    product.imageFile = null
    if (product.imagePreview) {
      URL.revokeObjectURL(product.imagePreview)
      product.imagePreview = ''
    }
  })
  bulkError.value = ''
}

// Handle bulk image file selection
const handleBulkImageSelect = async (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const product = bulkProducts.value[index]
  
  // Validate file
  const validation = validateImageFile(file)
  if (!validation.isValid) {
    bulkError.value = `Ligne ${index + 1}: ${validation.error || 'Fichier image invalide'}`
    return
  }

  try {
    // Convert to base64
    const base64Data = await fileToBase64(file)
    
    // Clean previous preview
    if (product.imagePreview) {
      URL.revokeObjectURL(product.imagePreview)
    }

    // Update product data
    product.imageFile = file
    product.imageData = base64Data
    product.imagePreview = URL.createObjectURL(file)
    
    bulkError.value = ''
  } catch (error) {
    bulkError.value = `Ligne ${index + 1}: Erreur lors de la conversion de l'image`
  }
}

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject('Erreur de conversion')
      }
    }
    reader.onerror = () => reject('Erreur de lecture du fichier')
    reader.readAsDataURL(file)
  })
}

// Remove bulk image
const removeBulkImage = (index: number) => {
  const product = bulkProducts.value[index]
  if (product.imagePreview) {
    URL.revokeObjectURL(product.imagePreview)
  }
  product.imageFile = null
  product.imageData = ''
  product.imagePreview = ''
}

const openEditModal = (product: Product) => {
  selectedProduct.value = product
  editForm.value = {
    code: product.code,
    name: product.name,
    price: product.price
  }
  editFormWithImage.value = {
    code: product.code,
    name: product.name,
    price: product.price,
    image: undefined
  }
  clearEditImagePreview()
  showEditModal.value = true
}

const openDetailsModal = (product: Product) => {
  selectedProduct.value = product
  showDetailsModal.value = true
}

const openDeleteModal = (product: Product) => {
  selectedProduct.value = product
  showDeleteModal.value = true
}

const createProduct = async () => {
  try {
    submitting.value = true
    error.value = ''

    const productData = {
      ...createForm.value,
      price: createForm.value.price.toString()
    }

    const response = await api.products.create(productData)

    if (createFormWithImage.value.image && response && response.data) {
      try {
        await api.products.uploadImage((response.data as Product).id, createFormWithImage.value.image)
        // Recharger les produits pour avoir l'image mise à jour
      } catch (imageErr) {
        console.warn('Produit créé mais erreur lors de l\'upload de l\'image:', imageErr)
      }
    }

    showCreateModal.value = false
    clearImagePreview()
    await loadProducts()
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la création du produit'
    console.error('Erreur lors de la création du produit:', err)
  } finally {
    submitting.value = false
  }
}

const updateProduct = async () => {
  if (!selectedProduct.value) return

  try {
    submitting.value = true
    error.value = ''

    const productData = {
      ...editForm.value,
      ...(editForm.value.price && { price: editForm.value.price.toString() })
    }

    const response = await api.products.update(selectedProduct.value.id, productData)

    // Si une image est fournie, l'uploader séparément
    if (editFormWithImage.value.image) {
      try {
        await api.products.uploadImage(selectedProduct.value.id, editFormWithImage.value.image)
      } catch (imageErr) {
        console.warn('Produit modifié mais erreur lors de l\'upload de l\'image:', imageErr)
      }
    }

    showEditModal.value = false
    clearEditImagePreview()
    await loadProducts()
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la modification du produit'
    console.error('Erreur lors de la modification du produit:', err)
  } finally {
    submitting.value = false
  }
}

const deleteProduct = async () => {
  if (!selectedProduct.value) return

  try {
    submitting.value = true
    error.value = ''

    await api.products.delete(selectedProduct.value.id)

    showDeleteModal.value = false
    await loadProducts()
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la suppression du produit'
    console.error('Erreur lors de la suppression du produit:', err)
  } finally {
    submitting.value = false
  }
}

const formatPrice = (price: string) => {
  return `${parseFloat(price).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })} FCFA`
}

const getProductInitial = (name: string) => {
  return name.charAt(0).toUpperCase()
}

const bulkCreateProducts = async () => {
  try {
    bulkSubmitting.value = true
    bulkError.value = ''

    // Filter only products with at least code, name and price filled
    const validProducts = []
    let emptyRowCount = 0
    
    for (let i = 0; i < bulkProducts.value.length; i++) {
      const product = bulkProducts.value[i]
      
      // Check if row is completely empty
      if (!product.code.trim() && !product.name.trim() && !product.price.trim() && 
          !product.stock?.trim() && !product.note?.trim() && !product.imageData?.trim() && !product.imageFile) {
        emptyRowCount++
        continue
      }
      
      // Check if required fields are filled
      if (!product.code.trim() || !product.name.trim() || !product.price.trim()) {
        bulkError.value = `Ligne ${i + 1}: Code, nom et prix sont obligatoires`
        return
      }

      const productToCreate: any = {
        code: product.code.trim(),
        name: product.name.trim(),
        price: product.price.trim()
      }

      if (product.stock && product.stock.trim()) {
        productToCreate.stock = parseInt(product.stock.trim()) || 0
      }
      if (product.note && product.note.trim()) {
        productToCreate.note = product.note.trim()
      }
      if (product.imageData && product.imageData.trim()) {
        productToCreate.imageData = product.imageData.trim()
      }

      validProducts.push(productToCreate)
    }

    if (validProducts.length === 0) {
      bulkError.value = 'Aucun produit valide à créer. Remplissez au moins une ligne avec code, nom et prix.'
      return
    }

    const bulkData = { products: validProducts }
    console.log(JSON.stringify(bulkData))

    //const response = await api.products.bulkCreate(bulkData)

    //showBulkCreateModal.value = false
    //await loadProducts()
  } catch (err: any) {
    bulkError.value = err.message || 'Erreur lors de la création en lot des produits'
    console.error('Erreur lors de la création en lot:', err)
  } finally {
    bulkSubmitting.value = false
  }
}

const actualiser = async () => {
  try {
    historyLoading.value = true
    loading.value = true

    const response = await api.products.getAll()

    if (response && response.data && Array.isArray(response.data)) {
      products.value = response.data as Product[]
    } else if (response && Array.isArray(response)) {
      products.value = response as unknown as Product[]
    } else {
      products.value = []
      error.value = 'Format de données inattendu'
    }

    filterProducts()
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement des produits'
    console.error('Erreur lors du chargement des produits:', err)
  } finally {
    historyLoading.value = false
    loading.value = false
  }
}

onMounted(async () => {
  await loadProducts()
  filterProducts()
})
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Produits</h1>
        <p class="text-muted-foreground">
          <span v-if="authStore.userRole === 'super_admin'">
            Gérer tous les produits du système
          </span>
          <span v-else>
            Gérer les produits de {{ authStore.supermarket?.name }}
          </span>
        </p>
      </div>
      <div class="flex space-x-2">
        <Button @click="openCreateModal">
          <Plus class="mr-2 h-4 w-4" />
          Ajouter Produit
        </Button>
        <Button variant="outline" @click="openBulkCreateModal">
          <Upload class="mr-2 h-4 w-4" />
          Création en Lot
        </Button>
      </div>
    </div>

    <!-- Statistiques -->
    <div class="grid gap-4 md:grid-cols-3" v-if="!loading">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Total Produits</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ filteredProducts.length }}</div>
          <p class="text-xs text-muted-foreground">Enregistrés</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Prix Moyen</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ filteredProducts.length > 0
            ? Math.min(...filteredProducts.map(p => parseFloat(p.price))).toLocaleString('fr-FR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })
            : '0'
            }} FCFA

          </div>
          <p class="text-xs text-muted-foreground">Par produit</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Prix Max</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ filteredProducts.length > 0
            ? Math.max(...filteredProducts.map(p => parseFloat(p.price))).toLocaleString('fr-FR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })
            : '0'
            }} FCFA

          </div>
          <p class="text-xs text-muted-foreground">Par produit</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Valeur Totale</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{  filteredProducts.reduce(
            (sum, p) => sum + (parseFloat(p.price) * parseFloat(p.stock)),
            0
          ).toLocaleString('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }) }} FCFA
          </div>
          <p class="text-xs text-muted-foreground">Inventaire</p>
        </CardContent>
      </Card>
    </div>

    <!-- Barre de recherche -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Liste des Produits</CardTitle>
            <CardDescription>Rechercher et gérer vos produits</CardDescription>
          </div>
          <div class="flex items-center space-x-4">
            <!-- Bascule de vue -->
            <div class="flex border rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                :class="{ 'bg-muted': viewMode === 'table' }"
                @click="viewMode = 'table'"
              >
                <List class="h-4 w-4 mr-1" />
                Table
              </Button>
              <Button
                variant="ghost"
                size="sm"
                :class="{ 'bg-muted': viewMode === 'virtual' }"
                @click="viewMode = 'virtual'"
              >
                <Grid class="h-4 w-4 mr-1" />
                Cartes
              </Button>
            </div>
            <!-- Recherche -->
            <div class="flex items-center gap-3">
              <div class="relative w-64">
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  v-model="searchQuery"
                  placeholder="Rechercher par nom, code..."
                  class="pl-10"
                />
              </div>
              <Button variant="outline" size="sm" @click="actualiser" :disabled="historyLoading">
                <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': historyLoading }" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent class="p-0">

        <div v-if="loading" class="flex items-center justify-center py-8">
          <Loader2 class="h-8 w-8 animate-spin" />
          <span class="ml-2">Chargement de du produit ...</span>
        </div>

        <div v-else>
          <!-- Vue Table -->
          <div v-if="viewMode === 'table'">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead v-if="authStore.userRole === 'super_admin'">Supermarché</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead>Depart</TableHead>
                  <TableHead>Vendu</TableHead>
                  <TableHead>Restant</TableHead>
                  <TableHead class="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="product in filteredProducts"
                  :key="product.id"
                  v-memo="[product.name, product.code, product.price, product.stock]"
                  class="hover:bg-muted/50"
                >
                  <TableCell>
                    <div class="flex items-center space-x-3">
                      <div v-if="product.image" class="h-8 w-8 rounded overflow-hidden">
                        <img :src="buildLogoUrl(product.image) || '/favicon.ico'"  :alt="product.name" class="h-full w-full object-cover" />
                      </div>
                      <div v-else class="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                        <Package class="h-4 w-4 text-primary" />
                      </div>
                      <div class="font-medium">{{ product.name }}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{{ product.code }}</Badge>
                  </TableCell>
                  <TableCell>
                    <span class="font-semibold text-primary">{{ formatPrice(product.price) }}</span>
                  </TableCell>
                  <TableCell v-if="authStore.userRole === 'super_admin'">
                    <div class="text-sm">
                      <div class="font-medium">{{ product.supermarket.name }}</div>
                      <div class="text-muted-foreground">{{ product.supermarket.code }}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="text-sm text-muted-foreground">
                      {{ new Date(product.createdAt).toLocaleDateString() }}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="font-medium text-info">{{ (product as any).stock || 0 }}</div>
                  </TableCell>
                  <TableCell>
                    <div class="font-medium text-info">{{ (product as any).vendu || 0 }}</div>
                  </TableCell>
                  <TableCell>
                    <div class="font-medium text-destructive">{{ (product as any).restant || 0 }}</div>
                  </TableCell>
                  <TableCell class="text-center">
                    <div class="flex justify-center space-x-1">
                      <Button variant="ghost" size="sm" @click="openDetailsModal(product)">
                        <Eye class="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" @click="openEditModal(product)">
                        <Edit class="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" class="text-destructive hover:text-destructive" @click="openDeleteModal(product)">
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow v-if="filteredProducts.length === 0">
                  <TableCell :colspan="authStore.userRole === 'super_admin' ? 9 : 8" class="text-center text-muted-foreground py-8">
                    Aucun produit trouvé
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Vue Liste Virtuelle -->
          <div v-else-if="viewMode === 'virtual'" class="p-4">
            <VirtualProductList
              :products="filteredProducts"
              :loading="loading"
              @edit="openEditModal"
              @delete="openDeleteModal"
              @details="openDetailsModal"
            />
          </div>
        </div>

      </CardContent>
    </Card>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <Loader2 class="h-8 w-8 animate-spin" />
      <span class="ml-2">Chargement...</span>
    </div>

    <!-- Error message -->
    <div v-if="error" class="bg-destructive/15 text-destructive p-4 rounded-lg">
      {{ error }}
    </div>

    <!-- Create Modal -->
    <Dialog v-model:open="showCreateModal">
      <DialogContent class="sm:max-w-md" :disableOutsideClick="true">
        <DialogHeader>
          <DialogTitle>Créer un Produit</DialogTitle>
          <DialogDescription>
            Ajouter un nouveau produit au catalogue
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="create-code">Code produit</Label>
            <Input id="create-code" v-model="createForm.code" placeholder="CAR006" />
          </div>

          <div class="space-y-2">
            <Label for="create-name">Nom du produit</Label>
            <Input id="create-name" v-model="createForm.name" placeholder="Chocolat Milka" />
          </div>

          <div class="space-y-2">
            <Label for="create-price">Prix (FCFA)</Label>
            <Input id="create-price" v-model="createForm.price" placeholder="2300" type="text" inputmode="numeric" pattern="[0-9]*" />
          </div>

          <!-- Image upload -->
          <div class="space-y-2">
            <Label>Image du produit (optionnel)</Label>

            <!-- Upload area -->
            <div v-if="!imagePreviewUrl" class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center relative cursor-pointer" @click="triggerFileInput">
              <Upload class="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <div class="space-y-1">
                <p class="text-sm font-medium">Cliquez pour sélectionner une image</p>
                <p class="text-xs text-muted-foreground">JPEG, PNG, WebP - Max 5MB</p>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                @change="handleImageSelect"
                class="hidden"
              />
            </div>

            <!-- Image preview -->
            <div v-else class="relative">
              <img
                :src="imagePreviewUrl"
                alt="Aperçu"
                class="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                @click="clearImagePreview"
                class="absolute top-2 right-2"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>

            <!-- Error message -->
            <p v-if="imageError" class="text-sm text-destructive">{{ imageError }}</p>
          </div>
        </div>

        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showCreateModal = false" :disabled="submitting">
            Annuler
          </Button>
          <Button @click="createProduct" :disabled="submitting">
            <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Modal -->
    <Dialog v-model:open="showEditModal">
      <DialogContent class="sm:max-w-md" :disableOutsideClick="true">
        <DialogHeader>
          <DialogTitle>Modifier le Produit</DialogTitle>
          <DialogDescription>
            Modifier les informations du produit
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4" v-if="selectedProduct">
          <div class="space-y-2">
            <Label for="edit-code">Code produit</Label>
            <Input id="edit-code" v-model="editForm.code" />
          </div>

          <div class="space-y-2">
            <Label for="edit-name">Nom du produit</Label>
            <Input id="edit-name" v-model="editForm.name" />
          </div>

          <div class="space-y-2">
            <Label for="edit-price">Prix (FCFA)</Label>
            <Input id="edit-price" v-model="editForm.price" type="text" inputmode="numeric" pattern="[0-9]*" />
          </div>


          <!-- Current image display -->
          <div v-if="selectedProduct.image && !editImagePreviewUrl" class="space-y-2">
            <Label>Image actuelle</Label>
            <div class="relative">
              <img
                :src="selectedProduct.image"
                alt="Image actuelle"
                class="w-full h-32 object-cover rounded-lg border"
              />
            </div>
          </div>

          <!-- Image upload -->
          <div class="space-y-2">
            <Label>{{ selectedProduct.image ? 'Changer l\'image' : 'Ajouter une image' }} (optionnel)</Label>

            <!-- Upload area -->
            <div v-if="!editImagePreviewUrl" class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center relative cursor-pointer" @click="triggerEditFileInput">
              <Upload class="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <div class="space-y-1">
                <p class="text-sm font-medium">Cliquez pour sélectionner une nouvelle image</p>
                <p class="text-xs text-muted-foreground">JPEG, PNG, WebP - Max 5MB</p>
              </div>
              <input
                ref="editFileInput"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                @change="handleEditImageSelect"
                class="hidden"
              />
            </div>

            <!-- New image preview -->
            <div v-else class="relative">
              <img
                :src="editImagePreviewUrl"
                alt="Nouveau aperçu"
                class="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                @click="clearEditImagePreview"
                class="absolute top-2 right-2"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>

            <!-- Error message -->
            <p v-if="imageError" class="text-sm text-destructive">{{ imageError }}</p>
          </div>
        </div>

        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showEditModal = false" :disabled="submitting">
            Annuler
          </Button>
          <Button @click="updateProduct" :disabled="submitting">
            <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
            Modifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Details Modal -->
    <Dialog v-model:open="showDetailsModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Détails du Produit</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4" v-if="selectedProduct">
          <div class="flex items-center space-x-4">
            <div v-if="selectedProduct.image" class="h-16 w-16 rounded-lg overflow-hidden">
              <img :src="selectedProduct.image" :alt="selectedProduct.name" class="h-full w-full object-cover" />
            </div>
            <div v-else class="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package class="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 class="text-lg font-semibold">{{ selectedProduct.name }}</h3>
              <Badge variant="outline">{{ selectedProduct.code }}</Badge>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">ID:</span>
              <span class="text-sm font-medium">{{ selectedProduct.id }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Prix:</span>
              <span class="text-sm font-medium">{{ formatPrice(selectedProduct.price) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Supermarché:</span>
              <span class="text-sm font-medium">
                {{ selectedProduct.supermarket.name }} ({{ selectedProduct.supermarket.code }})
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Créé le:</span>
              <span class="text-sm font-medium">{{ new Date(selectedProduct.createdAt).toLocaleDateString() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Modifié le:</span>
              <span class="text-sm font-medium">{{ new Date(selectedProduct.updatedAt).toLocaleDateString() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Quantité depart :</span>
              <span class="text-sm font-medium">{{ (selectedProduct as any).stock || 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Quantité vendu :</span>
              <span class="text-sm font-medium">{{ (selectedProduct as any).vendu || 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Quantité restant :</span>
              <span class="text-sm font-medium">{{ (selectedProduct as any).restant || 0 }}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button @click="showDetailsModal = false">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Bulk Create Modal - Excel Style -->
    <Dialog v-model:open="showBulkCreateModal">
      <DialogContent class="max-w-5xl max-h-[90vh] overflow-y-auto" :disableOutsideClick="true">
        <DialogHeader>
          <DialogTitle>Création de Produits en Lot - Mode Tableur</DialogTitle>
          <DialogDescription>
            Saisissez vos produits dans le tableau ci-dessous. Seules les lignes avec code, nom et prix seront créées.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          <!-- Toolbar -->
          <div class="flex justify-between items-center px-1">
            <div class="flex items-center space-x-2">
              <Button variant="outline" size="sm" @click="addBulkRows(2)">
                <Plus class="h-4 w-4 mr-1" />
                +2 lignes
              </Button>
              <Button variant="outline" size="sm" @click="clearBulkTable">
                <X class="h-4 w-4 mr-1" />
                Vider
              </Button>
            </div>
            <div class="text-sm text-muted-foreground">
              {{ bulkProducts.filter(p => p.code.trim() || p.name.trim() || p.price.trim()).length }} / {{ bulkProducts.length }} lignes remplies
            </div>
          </div>

          <!-- Excel-like Table -->
          <div class="flex-1 overflow-hidden border rounded-lg bg-white">
            <div class="overflow-auto max-h-96">
              <table class="w-full text-sm">
                <thead class="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr class="border-b">
                    <th class="w-8 px-2 py-3 text-center font-medium text-muted-foreground">#</th>
                    <th class="px-3 py-3 text-left font-medium border-l min-w-[120px]">
                      <div class="flex items-center">
                        Code*
                        <span class="text-xs text-destructive ml-1">*</span>
                      </div>
                    </th>
                    <th class="px-3 py-3 text-left font-medium border-l min-w-[200px]">
                      <div class="flex items-center">
                        Nom du produit*
                        <span class="text-xs text-destructive ml-1">*</span>
                      </div>
                    </th>
                    <th class="px-3 py-3 text-left font-medium border-l min-w-[100px]">
                      <div class="flex items-center">
                        Prix (FCFA)*
                        <span class="text-xs text-destructive ml-1">*</span>
                      </div>
                    </th>
                    <th class="px-3 py-3 text-left font-medium border-l min-w-[80px]">
                      Stock
                    </th>
                    <th class="px-3 py-3 text-left font-medium border-l min-w-[150px]">
                      Note
                    </th>
                    <th class="px-3 py-3 text-left font-medium border-l min-w-[150px]">
                      Image
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(product, index) in bulkProducts" 
                    :key="index"
                    class="border-b hover:bg-muted/30 group"
                  >
                    <td class="px-2 py-2 text-center text-muted-foreground font-mono text-xs">
                      {{ index + 1 }}
                    </td>
                    <td class="px-1 py-2 border-l">
                      <input 
                        v-model="product.code" 
                        type="text"
                        placeholder="CODE001" 
                        class="w-full px-2 py-1 border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-primary rounded text-sm"
                        :class="{ 'ring-1 ring-destructive bg-destructive/5': !product.code.trim() && bulkError && (product.name.trim() || product.price.trim()) }"
                      />
                    </td>
                    <td class="px-1 py-2 border-l">
                      <input 
                        v-model="product.name" 
                        type="text"
                        placeholder="Nom du produit" 
                        class="w-full px-2 py-1 border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-primary rounded text-sm"
                        :class="{ 'ring-1 ring-destructive bg-destructive/5': !product.name.trim() && bulkError && (product.code.trim() || product.price.trim()) }"
                      />
                    </td>
                    <td class="px-1 py-2 border-l">
                      <input 
                        v-model="product.price" 
                        type="text" 
                        inputmode="numeric" 
                        pattern="[0-9]*"
                        placeholder="1500" 
                        class="w-full px-2 py-1 border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-primary rounded text-sm"
                        :class="{ 'ring-1 ring-destructive bg-destructive/5': !product.price.trim() && bulkError && (product.code.trim() || product.name.trim()) }"
                      />
                    </td>
                    <td class="px-1 py-2 border-l">
                      <input 
                        v-model="product.stock" 
                        type="text" 
                        inputmode="numeric" 
                        pattern="[0-9]*"
                        placeholder="50" 
                        class="w-full px-2 py-1 border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-primary rounded text-sm"
                      />
                    </td>
                    <td class="px-1 py-2 border-l">
                      <input 
                        v-model="product.note" 
                        type="text"
                        placeholder="Note optionnelle" 
                        class="w-full px-2 py-1 border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-primary rounded text-sm"
                      />
                    </td>
                    <td class="px-1 py-2 border-l">
                      <div class="flex flex-col space-y-1">
                        <!-- Image preview or upload button -->
                        <div v-if="product.imagePreview" class="relative">
                          <img 
                            :src="product.imagePreview" 
                            alt="Preview" 
                            class="w-12 h-12 object-cover rounded border cursor-pointer"
                            @click="removeBulkImage(index)"
                            title="Cliquer pour supprimer"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            @click="removeBulkImage(index)"
                            class="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full"
                          >
                            <X class="h-3 w-3" />
                          </Button>
                        </div>
                        <div v-else>
                          <input 
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            @change="handleBulkImageSelect($event, index)"
                            class="hidden"
                            :id="`bulk-image-${index}`"
                          />
                          <label 
                            :for="`bulk-image-${index}`"
                            class="cursor-pointer inline-flex items-center justify-center px-2 py-1 text-xs border rounded hover:bg-muted/50"
                          >
                            <Upload class="h-3 w-3 mr-1" />
                            Image
                          </label>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Error message -->
          <div v-if="bulkError" class="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg">
            <div class="flex items-start space-x-2">
              <X class="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div class="text-sm">{{ bulkError }}</div>
            </div>
          </div>

          <!-- Instructions -->
          <div class="bg-muted/50 p-3 rounded-lg">
            <div class="text-sm text-muted-foreground">
              <strong>Instructions :</strong>
              <ul class="list-disc list-inside mt-1 space-y-1">
                <li>Les colonnes Code*, Nom* et Prix* sont obligatoires</li>
                <li>Cliquez sur "+2 lignes" pour ajouter plus de lignes si nécessaire</li>
                <li>Les lignes vides seront ignorées automatiquement</li>
                <li>Le stock sera défini à 0 si non renseigné</li>
                <li>L'image est optionnelle (cliquez sur "Image" pour sélectionner un fichier)</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter class="gap-2 mt-4">
          <Button variant="outline" @click="showBulkCreateModal = false" :disabled="bulkSubmitting">
            Annuler
          </Button>
          <Button @click="bulkCreateProducts" :disabled="bulkSubmitting">
            <Loader2 v-if="bulkSubmitting" class="w-4 h-4 mr-2 animate-spin" />
            Créer les produits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Modal -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer le Produit</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>

        <div class="py-4" v-if="selectedProduct">
          <div class="flex items-center space-x-3 p-3 bg-muted rounded-lg">
            <div class="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
              <Package class="h-5 w-5 text-primary" />
            </div>
            <div>
              <p class="font-medium">{{ selectedProduct.name }}</p>
              <p class="text-sm text-muted-foreground">{{ selectedProduct.code }} - {{ formatPrice(selectedProduct.price) }}</p>
            </div>
          </div>
        </div>

        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showDeleteModal = false" :disabled="submitting">
            Annuler
          </Button>
          <Button variant="destructive" @click="deleteProduct" :disabled="submitting">
            <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>