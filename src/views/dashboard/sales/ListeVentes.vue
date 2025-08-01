<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, Loader2, TrendingUp, Calendar, Users, Store } from 'lucide-vue-next'
import { api } from '@/services/api'
import type { SalesListResponse, SaleRecord } from '@/types/sale'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// État des données
const salesData = ref<SalesListResponse | null>(null)
const loading = ref(false)
const error = ref('')

// Modal de détails
const showDetailsModal = ref(false)
const selectedSale = ref<SaleRecord | null>(null)

// Charger les ventes
const loadSales = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const response = await api.sales.getList()
    salesData.value = (response as SalesListResponse) || null
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement des ventes'
  } finally {
    loading.value = false
  }
}

// Ouvrir le modal de détails
const openDetailsModal = (sale: SaleRecord) => {
  selectedSale.value = sale
  showDetailsModal.value = true
}

// Formater la date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Formater le prix
const formatPrice = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return `${numPrice.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })} FCFA`
}

// Obtenir le variant du badge selon le rôle
const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'super_admin': return 'destructive'
    case 'admin': return 'default'
    case 'caissier': return 'secondary'
    default: return 'outline'
  }
}

// Obtenir le label du rôle
const getRoleLabel = (role: string) => {
  switch (role) {
    case 'super_admin': return 'Super Admin'
    case 'admin': return 'Admin'
    case 'caissier': return 'Caissier'
    default: return role
  }
}

onMounted(() => {
  loadSales()
})
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Liste des Ventes</h1>
        <p class="text-muted-foreground">
          Historique des ventes - {{ salesData?.user_info?.supermarket || 'Chargement...' }}
        </p>
      </div>
    </div>

    <!-- Statistiques -->
    <div class="grid gap-4 md:grid-cols-3" v-if="salesData">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center space-x-2">
            <Calendar class="h-4 w-4" />
            <span>Ventes du jour</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ formatPrice(salesData.stats.today_total) }}</div>
          <p class="text-xs text-muted-foreground">{{ salesData.stats.view_type }}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center space-x-2">
            <TrendingUp class="h-4 w-4" />
            <span>Ventes du mois</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ formatPrice(salesData.stats.month_total) }}</div>
          <p class="text-xs text-muted-foreground">Cumul mensuel</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center space-x-2">
            <Store class="h-4 w-4" />
            <span>Total ventes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ salesData.pagination.total }}</div>
          <p class="text-xs text-muted-foreground">Transactions enregistrées</p>
        </CardContent>
      </Card>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <Loader2 class="h-8 w-8 animate-spin" />
      <span class="ml-2">Chargement des ventes...</span>
    </div>

    <!-- Error message -->
    <div v-if="error" class="bg-destructive/15 text-destructive p-4 rounded-lg">
      {{ error }}
    </div>

    <!-- Tableau des ventes -->
    <Card v-if="!loading && !error && salesData">
      <CardHeader>
        <CardTitle>Historique des ventes</CardTitle>
        <CardDescription>
          Page {{ salesData.pagination.page }} sur {{ salesData.pagination.pages }} 
          ({{ salesData.pagination.total }} ventes au total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Caissier</TableHead>
              <TableHead v-if="authStore.userRole === 'admin'">Supermarché</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead>Total</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="sale in salesData.sales" :key="sale.id" class="hover:bg-muted/50">
              <TableCell>
                <Badge variant="outline">#{{ sale.id }}</Badge>
              </TableCell>
              <TableCell>
                <div class="text-sm">{{ formatDate(sale.date) }}</div>
              </TableCell>
              <TableCell>
                <div class="flex items-center space-x-2">
                  <div class="text-sm">
                    <div class="font-medium">{{ sale.user.username }}</div>
                    <Badge :variant="getRoleBadgeVariant(sale.user.role)" class="text-xs">
                      {{ getRoleLabel(sale.user.role) }}
                    </Badge>
                  </div>
                </div>
              </TableCell>
              <TableCell v-if="authStore.userRole === 'admin'">
                <div class="text-sm">
                  <div class="font-medium">{{ sale.supermarket.name }}</div>
                  <div class="text-muted-foreground">{{ sale.supermarket.code }}</div>
                </div>
              </TableCell>
              <TableCell>
                <div class="text-sm">
                  <div class="font-medium">{{ sale.items.length }} article(s)</div>
                  <div class="text-muted-foreground">
                    {{ sale.items.reduce((sum, item) => sum + item.quantity, 0) }} unité(s)
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span class="font-semibold text-primary">{{ formatPrice(sale.total) }}</span>
              </TableCell>
              <TableCell class="text-right">
                <Button variant="ghost" size="sm" @click="openDetailsModal(sale)">
                  <Eye class="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow v-if="salesData.sales.length === 0">
              <TableCell :colspan="authStore.userRole === 'admin' ? 7 : 6" class="text-center text-muted-foreground py-8">
                Aucune vente enregistrée
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Modal de détails -->
    <Dialog v-model:open="showDetailsModal">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Détails de la vente #{{ selectedSale?.id }}</DialogTitle>
          <DialogDescription>
            Informations complètes de la transaction
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-6 py-4" v-if="selectedSale">
          <!-- Informations générales -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <div class="text-sm font-medium text-muted-foreground">Date et heure</div>
              <div class="text-sm">{{ formatDate(selectedSale.date) }}</div>
            </div>
            <div class="space-y-2">
              <div class="text-sm font-medium text-muted-foreground">Total</div>
              <div class="text-lg font-bold text-primary">{{ formatPrice(selectedSale.total) }}</div>
            </div>
            <div class="space-y-2">
              <div class="text-sm font-medium text-muted-foreground">Caissier</div>
              <div class="text-sm">
                <div>{{ selectedSale.user.username }}</div>
                <Badge :variant="getRoleBadgeVariant(selectedSale.user.role)" class="text-xs">
                  {{ getRoleLabel(selectedSale.user.role) }}
                </Badge>
              </div>
            </div>
            <div class="space-y-2">
              <div class="text-sm font-medium text-muted-foreground">Supermarché</div>
              <div class="text-sm">
                <div>{{ selectedSale.supermarket.name }}</div>
                <div class="text-muted-foreground">{{ selectedSale.supermarket.code }}</div>
              </div>
            </div>
          </div>

          <!-- Articles vendus -->
          <div>
            <div class="text-sm font-medium text-muted-foreground mb-3">Articles vendus</div>
            <div class="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Prix unitaire</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead class="text-right">Sous-total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="item in selectedSale.items" :key="item.productId">
                    <TableCell class="font-medium">{{ item.productName }}</TableCell>
                    <TableCell>{{ formatPrice(item.price) }}</TableCell>
                    <TableCell>{{ item.quantity }}</TableCell>
                    <TableCell class="text-right font-medium">
                      {{ formatPrice(parseFloat(item.price) * item.quantity) }}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button @click="showDetailsModal = false">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>