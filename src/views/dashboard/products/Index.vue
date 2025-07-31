<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Eye, Loader2, Package, Search } from 'lucide-vue-next'
import { api } from '@/services/api'
import type { Product, CreateProductRequest, UpdateProductRequest } from '@/types/product'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const products = ref<Product[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')

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

const editForm = ref<UpdateProductRequest>({})
const submitting = ref(false)

const loadProducts = async () => {
  try {
    loading.value = true
    const response = await api.products.getAll()
    products.value = response.data || response
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement des produits'
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
    baseFilteredProducts.value = products.value.filter(product => 
      product.supermarket.id === authStore.supermarket?.id
    )
  } else {
    baseFilteredProducts.value = []
  }
}

// Filtrage avec recherche
const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) {
    return baseFilteredProducts.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return baseFilteredProducts.value.filter(product => 
    product.name.toLowerCase().includes(query) ||
    product.code.toLowerCase().includes(query) ||
    (authStore.userRole === 'super_admin' && product.supermarket.name.toLowerCase().includes(query))
  )
})

const openCreateModal = () => {
  createForm.value = {
    code: '',
    name: '',
    price: ''
  }
  showCreateModal.value = true
}

const openEditModal = (product: Product) => {
  selectedProduct.value = product
  editForm.value = {
    code: product.code,
    name: product.name,
    price: product.price
  }
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
    
    // S'assurer que le prix est envoyé comme string
    const productData = {
      ...createForm.value,
      price: createForm.value.price.toString()
    }
    
    await api.products.create(productData)
    await loadProducts()
    filterProducts()
    showCreateModal.value = false
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la création'
  } finally {
    submitting.value = false
  }
}

const updateProduct = async () => {
  if (!selectedProduct.value) return
  
  try {
    submitting.value = true
    
    // S'assurer que le prix est envoyé comme string
    const productData = {
      ...editForm.value,
      ...(editForm.value.price && { price: editForm.value.price.toString() })
    }
    
    await api.products.update(selectedProduct.value.id, productData)
    await loadProducts()
    filterProducts()
    showEditModal.value = false
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la modification'
  } finally {
    submitting.value = false
  }
}

const deleteProduct = async () => {
  if (!selectedProduct.value) return
  
  try {
    submitting.value = true
    await api.products.delete(selectedProduct.value.id)
    await loadProducts()
    filterProducts()
    showDeleteModal.value = false
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la suppression'
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
          <div class="relative w-64">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              v-model="searchQuery"
              placeholder="Rechercher par nom, code..."
              class="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent class="p-0">
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
          <TableRow v-for="product in filteredProducts" :key="product.id" class="hover:bg-muted/50">
            <TableCell>
              <div class="flex items-center space-x-3">
                <div class="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
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
                <div class="font-medium text-info">{{ product.stock }}</div>
            </TableCell>
            <TableCell>
              <div class="font-medium text-info">{{ product.vendu }}</div>
            </TableCell>
            <TableCell>
              <div class="font-medium text-secondary">{{ product.restant }}</div>
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
            <TableCell :colspan="authStore.userRole === 'super_admin' ? 6 : 5" class="text-center text-muted-foreground py-8">
              Aucun produit trouvé
            </TableCell>
          </TableRow>
        </TableBody>
        </Table>
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
            <div class="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
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
              <span class="text-sm font-medium">{{ selectedProduct.stock }}</span>
            </div>
             <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Quantité vendu :</span>
              <span class="text-sm font-medium">{{ selectedProduct.vendu }}</span>
            </div>
             <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Quantité restant :</span>
              <span class="text-sm font-medium">{{ selectedProduct.restant }}</span>
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