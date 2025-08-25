<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, Loader2, TrendingUp, Calendar, Users, Store, Printer } from 'lucide-vue-next'
import { api } from '@/services/api'
import type { SalesListResponse, SaleRecord } from '@/types/sale'
import { useAuthStore } from '@/stores/auth'
import '@/types/electron'
import { useToast } from '@/composables/useToast'

const authStore = useAuthStore()
const { error: showError, success: showSuccess, info: showInfo } = useToast()

// État des données
const salesData = ref<SalesListResponse | null>(null)
const loading = ref(false)
const error = ref('')

// Modal de détails
const showDetailsModal = ref(false)
const selectedSale = ref<SaleRecord | null>(null)

// État de l'impression
const printLoading = ref(false)

// Charger les ventes
const loadSales = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const response = await api.sales.getList()
    
    // Vérifier que la réponse contient les données attendues
    if (response && response.data) {
      salesData.value = response.data as SalesListResponse
    } else if (response && typeof response === 'object' && 'sales' in response) {
      // Si la réponse est directement les données
      salesData.value = response as unknown as SalesListResponse
    } else {
      salesData.value = null
      console.warn('Format de données inattendu pour les ventes')
    }
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

// Helper pour formater les prix dans les templates de reçu
const formatPriceForReceipt = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

// Générer le HTML du reçu pour une vente historique
const generateReceiptHTML = (sale: SaleRecord) => {
  const currentDate = new Date(sale.date).toLocaleDateString('fr-FR')
  const currentTime = new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0)

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reçu de Caisse - Vente #${sale.id}</title>
        <meta charset="utf-8">
        <style>
          /* Styles optimisés pour imprimantes POS thermiques */
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body { 
            font-family: 'Courier New', 'DejaVu Sans Mono', monospace; 
            font-size: 12px;
            width: 79mm; /* Largeur exacte pour imprimante POS 80mm */
            margin: 0;
            padding: 4mm;
            line-height: 1.1;
            background: white;
            color: black;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .receipt {
            width: 100%;
            padding: 0;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 3mm;
            border-bottom: 1px solid #000;
            padding-bottom: 2mm;
          }
          
          .supermarket-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 1mm;
            text-transform: uppercase;
          }
          
          .supermarket-code {
            font-size: 10px;
            margin-bottom: 1mm;
          }
          
          .separator {
            font-size: 10px;
            text-align: center;
            margin: 1mm 0;
            letter-spacing: 0.5px;
          }
          
          .transaction-info {
            margin-bottom: 3mm;
            font-size: 10px;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 0.5mm 0;
          }
          
          .items-section {
            margin-bottom: 3mm;
          }
          
          .item {
            margin-bottom: 2mm;
            page-break-inside: avoid;
          }
          
          .item-name {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 0.5mm;
            word-wrap: break-word;
          }
          
          .item-calc {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
          }
          
          .totals-section {
            border-top: 1px solid #000;
            padding-top: 2mm;
            margin-top: 2mm;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 0.5mm 0;
          }
          
          .total-main {
            font-weight: bold;
            font-size: 12px;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 1mm 0;
            margin: 1mm 0;
          }
          
          .footer {
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 2mm;
            margin-top: 3mm;
            font-size: 9px;
          }
          
          /* Styles spécifiques pour impression POS */
          @media print {
            @page {
              size: 79mm auto; /* Largeur fixe, hauteur automatique */
              margin: 0;
            }
            
            body {
              width: 79mm;
              padding: 2mm;
              font-size: 11px;
            }
            
            .receipt {
              border: none;
              box-shadow: none;
            }
            
            /* Éviter les coupures dans les éléments importants */
            .item,
            .total-row {
              page-break-inside: avoid;
            }
            
            /* Forcer l'impression des arrière-plans et bordures */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          
          /* Styles pour le texte en gras sur imprimantes thermiques */
          .bold {
            font-weight: bold;
            text-shadow: 0.5px 0 0 currentColor; /* Simule un texte plus épais */
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <!-- En-tête du supermarché -->
          <div class="header">
            <div class="supermarket-name">${sale.supermarket.name}</div>
            <div class="supermarket-code">Code: ${sale.supermarket.code}</div>
            <div class="separator">============================</div>
          </div>

          <!-- Informations de transaction -->
          <div class="transaction-info">
            <div class="info-row">
              <span>Vente #:</span>
              <span>${sale.id}</span>
            </div>
            <div class="info-row">
              <span>Date:</span>
              <span>${currentDate}</span>
            </div>
            <div class="info-row">
              <span>Heure:</span>
              <span>${currentTime}</span>
            </div>
            <div class="info-row">
              <span>Caissier:</span>
              <span>${sale.user.username}</span>
            </div>
            <div class="separator">============================</div>
          </div>

          <!-- Liste des articles -->
          <div class="items-section">
            ${sale.items.map(item => `
              <div class="item">
                <div class="item-name">${item.productName}</div>
                <div class="item-calc">
                  <span>${item.quantity} x ${formatPriceForReceipt(item.price)} FCFA</span>
                  <span>${formatPriceForReceipt(parseFloat(item.price) * item.quantity)} FCFA</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Séparateur -->
          <div class="separator">============================</div>

          <!-- Total -->
          <div class="totals-section">
            <div class="total-row total-main">
              <span>TOTAL:</span>
              <span>${formatPriceForReceipt(sale.total)} FCFA</span>
            </div>
            <div class="info-row" style="margin-top: 8px;">
              <span>Nb articles:</span>
              <span>${totalItems}</span>
            </div>
          </div>

          <!-- Pied de page -->
          <div class="footer">
            <div>Merci de votre visite !</div>
            <div>À bientôt chez ${sale.supermarket.name}</div>
            <div class="separator">============================</div>
          </div>
        </div>
      </body>
    </html>
  `
}

// Imprimer le reçu d'une vente historique
const printSaleReceipt = async (sale: SaleRecord) => {
  printLoading.value = true
  
  try {
    // Vérifier si on est dans Electron
    if (window.electronAPI && window.electronAPI.printReceipt) {
      // Utiliser l'API Electron pour l'impression
      console.log('🖨️ Démarrage impression via Electron...')
      const receiptContent = generateReceiptHTML(sale)
      
      const result = await window.electronAPI.printReceipt(receiptContent)
      
      if (result.success) {
        if (result.printed) {
          showSuccess('Reçu imprimé avec succès ! 🖨️')
        } else {
          showInfo('Impression annulée par l\'utilisateur')
        }
      } else {
        throw new Error(result.message || 'Erreur d\'impression inconnue')
      }
    } else {
      // Fallback pour le navigateur web
      console.log('🖨️ Impression via navigateur (fallback)...')
      const receiptContent = generateReceiptHTML(sale)
      
      // Créer un iframe caché pour l'impression
      const printFrame = document.createElement('iframe')
      printFrame.style.position = 'absolute'
      printFrame.style.top = '-1000px'
      printFrame.style.left = '-1000px'
      printFrame.style.width = '1px'
      printFrame.style.height = '1px'
      printFrame.style.border = 'none'
      
      document.body.appendChild(printFrame)
      
      try {
        const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document
        if (frameDoc) {
          frameDoc.open()
          frameDoc.write(receiptContent)
          frameDoc.close()
          
          // Attendre que le contenu soit chargé puis imprimer
          printFrame.onload = () => {
            try {
              printFrame.contentWindow?.print()
              showSuccess('Impression lancée')
              
              // Nettoyer après un délai
              setTimeout(() => {
                document.body.removeChild(printFrame)
              }, 1000)
            } catch (printError) {
              console.error('Erreur lors de l\'impression:', printError)
              showError('Erreur lors du lancement de l\'impression')
              document.body.removeChild(printFrame)
            }
          }
        } else {
          throw new Error('Impossible d\'accéder au document de l\'iframe')
        }
      } catch (iframeError) {
        console.error('Erreur iframe:', iframeError)
        document.body.removeChild(printFrame)
        
        // Dernier recours: créer un blob et l'ouvrir
        try {
          const blob = new Blob([receiptContent], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          const printWindow = window.open(url, '_blank', 'width=800,height=600')
          
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print()
              printWindow.close()
              URL.revokeObjectURL(url)
            }
            showSuccess('Fenêtre d\'impression ouverte')
          } else {
            throw new Error('Popup bloquée par le navigateur')
          }
        } catch (blobError) {
          console.error('Erreur blob:', blobError)
          throw new Error('Impossible d\'imprimer: Veuillez autoriser les popups ou utiliser l\'application Electron')
        }
      }
    }
  } catch (error: any) {
    console.error('Erreur lors de l\'impression:', error)
    showError(error.message || 'Erreur lors de l\'impression du reçu')
  } finally {
    printLoading.value = false
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
                <div class="flex items-center justify-end space-x-2">
                  <Button variant="ghost" size="sm" @click="printSaleReceipt(sale)" :disabled="printLoading">
                    <Loader2 v-if="printLoading" class="h-4 w-4 animate-spin" />
                    <Printer v-else class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" @click="openDetailsModal(sale)">
                    <Eye class="h-4 w-4" />
                  </Button>
                </div>
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
        
        <DialogFooter class="gap-2">
          <Button variant="outline" @click="printSaleReceipt(selectedSale!)" v-if="selectedSale" :disabled="printLoading">
            <Loader2 v-if="printLoading" class="h-4 w-4 mr-2 animate-spin" />
            <Printer v-else class="h-4 w-4 mr-2" />
            {{ printLoading ? 'Impression...' : 'Imprimer reçu' }}
          </Button>
          <Button @click="showDetailsModal = false">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>