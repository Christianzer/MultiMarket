<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PaginationContent } from '@/components/ui/pagination'
import { Plus, Package, History, Loader2, Trash2, RefreshCw, Search } from 'lucide-vue-next'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { Product } from '@/types/product'
import type { RestockFormItem, BulkRestockRequest, Restock } from '@/types/restock'
import { buildLogoUrl } from '@/config/api'

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
const quickInputMode = ref(false)
const quickInputText = ref('')

const showBulkRestockModal = ref(false)
const showDeleteModal = ref(false)
const restockToDelete = ref<Restock | null>(null)
const deleting = ref(false)
const searchQuery = ref('')
const debouncedSearchQuery = ref('')

// Pagination state
const pagination = ref({
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 0
})
const itemsPerPageOptions = [5, 10, 20, 50]

// Auto-complétion Command
const openCommandIndex = ref<number | null>(null)

// Fonction debounce simple
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: number
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

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
    if (openCommandIndex.value === index) {
      openCommandIndex.value = null
    } else if (openCommandIndex.value && openCommandIndex.value > index) {
      openCommandIndex.value--
    }
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
  quickInputMode.value = false
  quickInputText.value = ''
  openCommandIndex.value = null
  error.value = ''
  showBulkRestockModal.value = true
}

const toggleQuickInputMode = () => {
  quickInputMode.value = !quickInputMode.value
  if (quickInputMode.value) {
    // Convertir les items existants en texte rapide
    quickInputText.value = restockItems.value
      .filter(item => item.productId && item.quantity)
      .map(item => {
        const product = filteredProducts.value.find(p => p.id.toString() === item.productId)
        return `${product?.code || item.productId}:${item.quantity}`
      })
      .join('\n')
  } else {
    // Convertir le texte rapide en items
    parseQuickInput()
  }
}

const parseQuickInput = () => {
  if (!quickInputText.value.trim()) {
    restockItems.value = [{ productId: '', quantity: '' }]
    return
  }

  const lines = quickInputText.value.split('\n').filter(line => line.trim())
  const newItems: typeof restockItems.value = []

  for (const line of lines) {
    const match = line.trim().match(/^(.+?):(\d+)$/)
    if (match) {
      const [, codeOrName, quantity] = match
      const product = filteredProducts.value.find(p =>
        p.code.toLowerCase() === codeOrName.toLowerCase() ||
        p.name.toLowerCase().includes(codeOrName.toLowerCase())
      )
      if (product) {
        newItems.push({
          productId: product.id.toString(),
          quantity: quantity
        })
      }
    }
  }

  restockItems.value = newItems.length > 0 ? newItems : [{ productId: '', quantity: '' }]
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

// Débounce de la recherche pour éviter trop de calculs
const debouncedSearch = debounce((query: string) => {
  debouncedSearchQuery.value = query
}, 300)

// Watcher pour déclencher le débounce
watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
}, { immediate: true })

// Filtrage de l'historique avec recherche
const filteredRestockHistory = computed(() => {
  if (!debouncedSearchQuery.value.trim()) {
    return restockHistory.value
  }

  const query = debouncedSearchQuery.value.toLowerCase().trim()
  return restockHistory.value.filter(restock =>
    restock.product.name.toLowerCase().includes(query) ||
    restock.product.code.toLowerCase().includes(query) ||
    (restock.note && restock.note.toLowerCase().includes(query)) ||
    restock.user.username.toLowerCase().includes(query)
  )
})

// Historique paginé pour l'affichage
const paginatedRestockHistory = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.itemsPerPage
  const end = start + pagination.value.itemsPerPage
  return filteredRestockHistory.value.slice(start, end)
})

// Mettre à jour la pagination quand l'historique filtré change
watch(filteredRestockHistory, (newFiltered) => {
  const totalItems = newFiltered.length
  pagination.value.totalItems = totalItems
  pagination.value.totalPages = Math.ceil(totalItems / pagination.value.itemsPerPage)
  
  // Réajuster la page courante si nécessaire
  if (pagination.value.currentPage > pagination.value.totalPages && pagination.value.totalPages > 0) {
    pagination.value.currentPage = 1
  }
}, { immediate: true })

// Informations de pagination
const paginationInfo = computed(() => {
  if (pagination.value.totalItems === 0) {
    return 'Aucun restockage'
  }
  
  const start = (pagination.value.currentPage - 1) * pagination.value.itemsPerPage + 1
  const end = Math.min(pagination.value.currentPage * pagination.value.itemsPerPage, pagination.value.totalItems)
  
  return `${start}-${end} sur ${pagination.value.totalItems} restockages`
})

// Fonctions de pagination
const setPage = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.currentPage = page
  }
}

const setItemsPerPage = (itemsPerPage: number) => {
  pagination.value.itemsPerPage = itemsPerPage
  pagination.value.currentPage = 1 // Retour à la première page
  
  // Recalculer la pagination
  const totalItems = filteredRestockHistory.value.length
  pagination.value.totalItems = totalItems
  pagination.value.totalPages = Math.ceil(totalItems / pagination.value.itemsPerPage)
}

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

// Fonctions pour Command
const selectProductFromCommand = (product: any, index: number) => {
  restockItems.value[index].productId = product.id.toString()
  openCommandIndex.value = null

  // Focus sur la quantité
  nextTick(() => {
    const quantityInput = document.querySelector(`[data-quantity-index="${index}"]`) as HTMLInputElement
    if (quantityInput) {
      quantityInput.focus()
    }
  })
}

const getSelectedProductDisplay = (index: number) => {
  const item = restockItems.value[index]
  if (!item.productId) return 'Sélectionner un produit'

  const product = filteredProducts.value.find(p => p.id.toString() === item.productId)
  return product ? `${product.name} (${product.code})` : 'Produit inconnu'
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
                <CardDescription>{{ paginationInfo }}</CardDescription>
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

            <div v-else>
              <Table>
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
                  <TableRow v-for="restock in paginatedRestockHistory" :key="restock.id" class="hover:bg-muted/50">
                  <TableCell>
                    <div class="flex items-center space-x-3">
                      <div v-if="restock.product.image" class="h-8 w-8 rounded overflow-hidden">
                        <img :src="buildLogoUrl(restock.product.image) ?? '/favicon.ico'" :alt="restock.product.name" class="h-full w-full object-cover" />
                      </div>
                      <div v-else class="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
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
                <TableRow v-if="paginatedRestockHistory.length === 0">
                  <TableCell colspan="6" class="text-center text-muted-foreground py-8">
                    Aucun restockage trouvé
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <!-- Pagination et contrôles -->
            <div class="border-t p-4">
              <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <!-- Sélecteur nombre d'éléments par page -->
                <div class="flex items-center space-x-2">
                  <span class="text-sm text-muted-foreground">Éléments par page:</span>
                  <Select :model-value="pagination.itemsPerPage.toString()" @update:model-value="(value) => setItemsPerPage(parseInt(value))">
                    <SelectTrigger class="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in itemsPerPageOptions" :key="option" :value="option.toString()">
                        {{ option }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <!-- Composant de pagination -->
                <PaginationContent
                  :current-page="pagination.currentPage"
                  :total-pages="pagination.totalPages"
                  :disabled="historyLoading"
                  @page-change="setPage"
                />

                <!-- Information de pagination -->
                <div class="text-sm text-muted-foreground">
                  {{ paginationInfo }}
                </div>
              </div>
            </div>
            </div>
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
      <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto" :disableOutsideClick="true">
        <DialogHeader>
          <DialogTitle>Restockage en Masse</DialogTitle>
          <DialogDescription>
            Ajouter du stock à plusieurs produits en une seule opération
          </DialogDescription>
          <div class="flex justify-end mt-2">
            <Button
              variant="ghost"
              size="sm"
              @click="toggleQuickInputMode"
              class="text-xs"
            >
              {{ quickInputMode ? 'Mode Normal' : 'Saisie Rapide' }}
            </Button>
          </div>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- Mode saisie rapide -->
          <div v-if="quickInputMode" class="space-y-4">
            <div class="space-y-2">
              <Label>Saisie Rapide</Label>
              <div class="text-sm text-muted-foreground mb-2">
                Format: <code>CODE:QUANTITE</code> (une ligne par produit)
                <br>
                Exemple: <code>COCA500:24</code> ou <code>Coca Cola:12</code>
              </div>
              <Textarea
                v-model="quickInputText"
                placeholder="COCA500:24&#10;PEPSI330:36&#10;EAU1L:48"
                rows="8"
                class="font-mono text-sm"
                @blur="parseQuickInput"
              />
            </div>
          </div>

          <!-- Mode normal -->
          <div v-else>
            <div v-for="(item, index) in restockItems" :key="index" class="border rounded-lg p-4 space-y-4 mt-1">
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
                  <Popover :open="openCommandIndex === index" @update:open="(open) => openCommandIndex = open ? index : null">
                    <PopoverTrigger as-child>
                      <Button
                        variant="outline"
                        role="combobox"
                        class="w-full justify-between"
                        :class="{ 'text-muted-foreground': !item.productId }"
                      >
                        {{ getSelectedProductDisplay(index) }}
                        <Search class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-full p-0" side="bottom" align="start">
                      <Command>
                        <CommandInput placeholder="Rechercher un produit..." />
                        <CommandList>
                          <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
                          <CommandItem
                            v-for="product in filteredProducts.filter((p, idx) =>
                            !restockItems.some((item, itemIdx) => 
                              itemIdx !== index && item.productId === p.id.toString()
                            )
                          )"
                            :key="product.id"
                            :value="`${product.name} ${product.code}`"
                            @select="selectProductFromCommand(product, index)"
                            class="cursor-pointer"
                          >
                            <div class="flex items-center space-x-3">
                              <div v-if="product.image" class="h-8 w-8 rounded overflow-hidden">
                                <img :src="buildLogoUrl(product.image)" :alt="product.name" class="h-full w-full object-cover" />
                              </div>
                              <div v-else class="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                <Package class="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div class="font-medium">{{ product.name }}</div>
                                <div class="text-sm text-muted-foreground">{{ product.code }}</div>
                              </div>
                            </div>
                          </CommandItem>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div class="space-y-2">
                  <Label>Quantité</Label>
                  <Input
                    v-model="item.quantity"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="50"
                    :data-quantity-index="index"
                  />
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              @click="addRestockItem"
              class="w-full mt-1"
              :disabled="restockItems.length >= filteredProducts.length"
            >
              <Plus class="mr-2 h-4 w-4" />
              Ajouter un produit
            </Button>
          </div>

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