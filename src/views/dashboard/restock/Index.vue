<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Minus, Package, History, Loader2, Trash2, RefreshCw, Search } from 'lucide-vue-next'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { Product } from '@/types/product'
import type { RestockFormItem, BulkRestockRequest, Restock } from '@/types/restock'

const authStore = useAuthStore()

const products = ref<Product[]>([])
const restockHistory = ref<Restock[]>([])
const loading = ref(false)
const historyLoading = ref(false)
const submitting = ref(false)
const error = ref('')

// État du formulaire de restockage
const restockItems = ref<RestockFormItem[]>([
  { productId: '', quantity: '' }
])
const globalNote = ref('')

const showBulkRestockModal = ref(false)
const showDeleteModal = ref(false)
const restockToDelete = ref<Restock | null>(null)
const deleting = ref(false)
const searchQuery = ref('')

// Produits filtrés pour le supermarché de l'admin
const filteredProducts = computed(() => {
  if (authStore.userRole === 'admin' && authStore.supermarket) {
    return products.value.filter(product => 
      product.supermarket.id === authStore.supermarket?.id
    )
  }
  return []
})

const loadProducts = async () => {
  try {
    loading.value = true
    const response = await api.products.getAll()
    products.value = (response.data || response) as Product[]
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement des produits'
  } finally {
    loading.value = false
  }
}

const loadRestockHistory = async () => {
  try {
    historyLoading.value = true
    const response = await api.restock.getAll()
    const data = (response.data || response) as Restock[]
    restockHistory.value = data || []
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement de l\'historique'
  } finally {
    historyLoading.value = false
  }
}

const addRestockItem = () => {
  restockItems.value.push({ productId: '', quantity: '' })
}

const removeRestockItem = (index: number) => {
  if (restockItems.value.length > 1) {
    restockItems.value.splice(index, 1)
  }
}

const getProductName = (productId: string) => {
  const product = filteredProducts.value.find(p => p.id.toString() === productId)
  return product ? `${product.name} (${product.code})` : 'Produit inconnu'
}

const validateRestockItems = (): boolean => {
  for (const item of restockItems.value) {
    if (!item.productId || !item.quantity || parseInt(item.quantity) <= 0) {
      return false
    }
  }
  
  // Vérifier qu'il n'y a pas de doublons de produits
  const productIds = restockItems.value.map(item => item.productId)
  const uniqueProductIds = new Set(productIds)
  return uniqueProductIds.size === productIds.length
}

const performBulkRestock = async () => {
  if (!validateRestockItems()) {
    error.value = 'Veuillez remplir tous les champs correctement et éviter les doublons'
    return
  }

  try {
    submitting.value = true
    error.value = ''

    const bulkData: BulkRestockRequest = {
      items: restockItems.value.map(item => ({
        productId: parseInt(item.productId),
        quantity: parseInt(item.quantity)
      })),
      note: globalNote.value || ''
    }

    await api.restock.bulkRestock(bulkData)
    
    // Réinitialiser le formulaire
    restockItems.value = [{ productId: '', quantity: '' }]
    globalNote.value = ''
    showBulkRestockModal.value = false
    
    // Recharger l'historique
    await loadRestockHistory()
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du restockage'
  } finally {
    submitting.value = false
  }
}

const openBulkRestockModal = () => {
  restockItems.value = [{ productId: '', quantity: '' }]
  globalNote.value = ''
  error.value = ''
  showBulkRestockModal.value = true
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTotalRestockQuantity = () => {
  return restockHistory.value.reduce((total, restock) => total + restock.quantity, 0)
}

const getUniqueProductsCount = () => {
  const uniqueProducts = new Set(restockHistory.value.map(restock => restock.product.id))
  return uniqueProducts.size
}

// Filtrage de l'historique avec recherche
const filteredRestockHistory = computed(() => {
  if (!searchQuery.value.trim()) {
    return restockHistory.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return restockHistory.value.filter(restock => 
    restock.product.name.toLowerCase().includes(query) ||
    restock.product.code.toLowerCase().includes(query) ||
    restock.note.toLowerCase().includes(query) ||
    restock.user.username.toLowerCase().includes(query)
  )
})

const openDeleteModal = (restock: Restock) => {
  restockToDelete.value = restock
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!restockToDelete.value) return

  try {
    deleting.value = true
    await api.restock.delete(restockToDelete.value.id)
    await loadRestockHistory()
    showDeleteModal.value = false
    restockToDelete.value = null
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la suppression'
  } finally {
    deleting.value = false
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  restockToDelete.value = null
}

onMounted(async () => {
  await Promise.all([loadProducts(), loadRestockHistory()])
})
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Restockage</h1>
        <p class="text-muted-foreground">
          Gérer les restockages de {{ authStore.supermarket?.name }}
        </p>
      </div>
      <Button @click="openBulkRestockModal" :disabled="filteredProducts.length === 0">
        <Package class="mr-2 h-4 w-4" />
        Nouveau Restockage
      </Button>
    </div>

    <!-- Statistiques -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Total Restockages</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ restockHistory.length }}</div>
          <p class="text-xs text-muted-foreground">Opérations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Quantité Totale</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ getTotalRestockQuantity() }}</div>
          <p class="text-xs text-muted-foreground">Unités restockées</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Produits Concernés</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ getUniqueProductsCount() }}</div>
          <p class="text-xs text-muted-foreground">Produits différents</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Produits Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ filteredProducts.length }}</div>
          <p class="text-xs text-muted-foreground">Dans votre magasin</p>
        </CardContent>
      </Card>
    </div>

    <!-- Contenu principal avec onglets -->
    <Tabs default-value="history" class="space-y-4">
      <TabsList>
        <TabsTrigger value="history">
          <History class="mr-2 h-4 w-4" />
          Historique
        </TabsTrigger>
      </TabsList>

      <!-- Onglet Historique -->
      <TabsContent value="history" class="space-y-4">
        <Card>
          <CardHeader>
            <div class="flex justify-between items-center">
              <div>
                <CardTitle>Historique des Restockages</CardTitle>
                <CardDescription>
                  Liste de tous les restockages effectués dans votre supermarché
                </CardDescription>
              </div>
              <div class="flex items-center gap-3">
                <div class="relative w-64">
                  <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    v-model="searchQuery"
                    placeholder="Rechercher produit, code, note..."
                    class="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm" @click="loadRestockHistory" :disabled="historyLoading">
                  <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': historyLoading }" />
                  Actualiser
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="historyLoading" class="flex items-center justify-center py-8">
              <Loader2 class="h-8 w-8 animate-spin" />
              <span class="ml-2">Chargement de l'historique...</span>
            </div>
            
            <div v-else-if="filteredRestockHistory.length === 0" class="text-center py-8 text-muted-foreground">
              <Package class="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>{{ searchQuery ? 'Aucun restockage trouvé' : 'Aucun restockage effectué' }}</p>
            </div>

            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="restock in filteredRestockHistory" :key="restock.id" class="hover:bg-muted/50">
                  <TableCell>
                    <div class="flex items-center space-x-3">
                      <div class="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                        <Package class="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div class="font-medium">{{ restock.product.name }}</div>
                        <div class="text-sm text-muted-foreground">{{ restock.product.code }}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" class="font-semibold">
                      +{{ restock.quantity }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span class="text-sm" :class="restock.note ? '' : 'text-muted-foreground italic'">
                      {{ restock.note || 'Aucune note' }}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div class="text-sm">{{ formatDate(restock.createdAt) }}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{{ restock.user.username }}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      @click="openDeleteModal(restock)"
                      class="text-destructive hover:text-destructive"
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <!-- Error message -->
    <div v-if="error" class="bg-destructive/15 text-destructive p-4 rounded-lg">
      {{ error }}
    </div>

    <!-- Modal de restockage en masse -->
    <Dialog v-model:open="showBulkRestockModal">
      <DialogContent class="sm:max-w-2xl max-h-[80vh] overflow-y-auto" :disableOutsideClick="true">
        <DialogHeader>
          <DialogTitle>Restockage en Masse</DialogTitle>
          <DialogDescription>
            Ajouter du stock à plusieurs produits en une seule opération
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <div v-for="(item, index) in restockItems" :key="index" class="border rounded-lg p-4 space-y-4">
            <div class="flex justify-between items-center">
              <h4 class="font-medium">Produit {{ index + 1 }}</h4>
              <Button 
                v-if="restockItems.length > 1" 
                variant="ghost" 
                size="sm" 
                @click="removeRestockItem(index)"
                class="text-destructive hover:text-destructive"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Produit</Label>
                <Select v-model="item.productId">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      v-for="product in filteredProducts" 
                      :key="product.id" 
                      :value="product.id.toString()"
                      :disabled="restockItems.some((i, idx) => idx !== index && i.productId === product.id.toString())"
                    >
                      {{ product.name }} ({{ product.code }})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div class="space-y-2">
                <Label>Quantité</Label>
                <Input 
                  v-model="item.quantity" 
                  type="text" 
                  inputmode="numeric" 
                  pattern="[0-9]*"
                  placeholder="50" 
                />
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            @click="addRestockItem" 
            class="w-full"
            :disabled="restockItems.length >= filteredProducts.length"
          >
            <Plus class="mr-2 h-4 w-4" />
            Ajouter un produit
          </Button>
          
          <!-- Note globale -->
          <div class="space-y-2 pt-4 border-t">
            <Label>Note pour tous les produits (optionnelle)</Label>
            <Textarea 
              v-model="globalNote" 
              placeholder="Livraison fournisseur, réassort urgent, etc."
              rows="3"
            />
          </div>
        </div>
        
        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showBulkRestockModal = false" :disabled="submitting">
            Annuler
          </Button>
          <Button @click="performBulkRestock" :disabled="submitting || !validateRestockItems()">
            <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
            <Package v-else class="w-4 h-4 mr-2" />
            Effectuer le Restockage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal de confirmation de suppression -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce restockage ?
          </DialogDescription>
        </DialogHeader>
        
        <div v-if="restockToDelete" class="py-4">
          <div class="bg-muted/50 rounded-lg p-4">
            <div class="flex items-center space-x-3">
              <div class="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                <Package class="h-5 w-5 text-primary" />
              </div>
              <div>
                <div class="font-medium">{{ restockToDelete.product.name }}</div>
                <div class="text-sm text-muted-foreground">{{ restockToDelete.product.code }}</div>
                <div class="text-sm">
                  <Badge variant="secondary" class="font-semibold">
                    +{{ restockToDelete.quantity }}
                  </Badge>
                </div>
              </div>
            </div>
            <div v-if="restockToDelete.note" class="mt-2 text-sm text-muted-foreground">
              Note: {{ restockToDelete.note }}
            </div>
          </div>
        </div>
        
        <DialogFooter class="gap-2">
          <Button variant="outline" @click="cancelDelete" :disabled="deleting">
            Annuler
          </Button>
          <Button variant="destructive" @click="confirmDelete" :disabled="deleting">
            <Loader2 v-if="deleting" class="w-4 h-4 mr-2 animate-spin" />
            <Trash2 v-else class="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>