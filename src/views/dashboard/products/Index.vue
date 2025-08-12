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
import { Plus, Edit, Trash2, Eye, Loader2, Package, Search, Grid, List, Upload, X } from 'lucide-vue-next'
import { api } from '@/services/api'
import type { Product, CreateProductRequest, UpdateProductRequest, CreateProductWithImageRequest, UpdateProductWithImageRequest } from '@/types/product'
import { validateImageFile, createImagePreview, revokeImagePreview } from '@/utils/formData'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'

const authStore = useAuthStore()
const productsStore = useProductsStore()

const products = computed(() => productsStore.products)
const loading = computed(() => productsStore.loading)
const error = computed(() => productsStore.error)
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
  stock: undefined,
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

const loadProducts = async (force = false) => {
  try {
    await productsStore.fetchProducts(force)
    filterProducts()
  } catch (err: any) {
    console.error('Erreur lors du chargement des produits:', err)
  }
}

// Filtrer les produits selon le rôle et le supermarché
const baseFilteredProducts = ref<Product[]>([])

const filterProducts = () => {
  if (authStore.userRole === 'super_admin') {
    baseFilteredProducts.value = products.value
  } else if (authStore.userRole === 'admin' || authStore.userRole === 'caissier') {
    baseFilteredProducts.value = authStore.supermarket
      ? productsStore.productsBySupermarket(authStore.supermarket.id.toString())
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
    stock: undefined,
    image: undefined
  }
  clearImagePreview()
  showCreateModal.value = true
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
    stock: product.stock,
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

    // Use image upload if image is provided, otherwise use regular API
    if (createFormWithImage.value.image) {
      // Sync form data
      createFormWithImage.value.code = createForm.value.code
      createFormWithImage.value.name = createForm.value.name
      createFormWithImage.value.price = createForm.value.price.toString()

      await productsStore.createProductWithImage(createFormWithImage.value)
    } else {
      // Regular creation without image
      const productData = {
        ...createForm.value,
        price: createForm.value.price.toString()
      }

      await productsStore.createProduct(productData)
    }

    await loadProducts()
    showCreateModal.value = false
    clearImagePreview()
  } catch (err: any) {
    console.error('Erreur lors de la création du produit:', err)
  } finally {
    submitting.value = false
  }
}

const updateProduct = async () => {
  if (!selectedProduct.value) return

  try {
    submitting.value = true

    // Use image upload if image is provided, otherwise use regular API
    if (editFormWithImage.value.image) {
      // Sync form data
      editFormWithImage.value.code = editForm.value.code
      editFormWithImage.value.name = editForm.value.name
      editFormWithImage.value.price = editForm.value.price?.toString()

      await productsStore.updateProductWithImage(selectedProduct.value.id, editFormWithImage.value)
    } else {
      // Regular update without image
      const productData = {
        ...editForm.value,
        ...(editForm.value.price && { price: editForm.value.price.toString() })
      }

      await productsStore.updateProduct(selectedProduct.value.id.toString(), productData)
    }

    filterProducts()
    showEditModal.value = false
    clearEditImagePreview()
  } catch (err: any) {
    console.error('Erreur lors de la modification du produit:', err)
  } finally {
    submitting.value = false
  }
}

const deleteProduct = async () => {
  if (!selectedProduct.value) return

  try {
    submitting.value = true
    await productsStore.deleteProduct(selectedProduct.value.id)
    filterProducts()
    showDeleteModal.value = false
  } catch (err: any) {
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
      <Button @click="openCreateModal">
        <Plus class="mr-2 h-4 w-4" />
        Ajouter Produit
      </Button>
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
              ? (filteredProducts.reduce((sum, p) => sum + parseFloat(p.price), 0) / filteredProducts.length).toLocaleString('fr-FR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })
              : '0' }} FCFA
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
            {{ filteredProducts.reduce((sum, p) => sum + parseFloat(p.price), 0).toLocaleString('fr-FR', {
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
            <div class="relative w-64">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                v-model="searchQuery"
                placeholder="Rechercher par nom, code..."
                class="pl-10"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent class="p-0">
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
                      <img :src="product.image" :alt="product.name" class="h-full w-full object-cover" />
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
            <div v-if="!imagePreviewUrl" class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload class="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <div class="space-y-1">
                <p class="text-sm font-medium">Cliquez pour sélectionner une image</p>
                <p class="text-xs text-muted-foreground">JPEG, PNG, WebP - Max 5MB</p>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                @change="handleImageSelect"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
            <div v-if="!editImagePreviewUrl" class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload class="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <div class="space-y-1">
                <p class="text-sm font-medium">Cliquez pour sélectionner une nouvelle image</p>
                <p class="text-xs text-muted-foreground">JPEG, PNG, WebP - Max 5MB</p>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                @change="handleEditImageSelect"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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