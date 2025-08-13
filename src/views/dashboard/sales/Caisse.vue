<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Minus, Trash2, ShoppingCart, Search, Printer, Check, X, Package, Loader2 } from 'lucide-vue-next'
import { api } from '@/services/api'
import type { CartItem, Sale, ProductSearchResult } from '@/types/sale'
import '@/types/electron'
import { useAuthStore } from '@/stores/auth'
import { buildLogoUrl } from '@/config/api'
import { useToast } from '@/composables/useToast'

const authStore = useAuthStore()
const { error: showError, success: showSuccess, info: showInfo } = useToast()

// État de la recherche et des produits
const searchTerm = ref('')
const products = ref<ProductSearchResult[]>([])
const productsLoading = ref(false)
const productsError = ref('')

// État du panier
const cart = ref<CartItem[]>([])
const cartTotal = ref(0)

// États des modales
const showReceiptModal = ref(false)
const showSuccessModal = ref(false)
const lastSale = ref<Sale | null>(null)

// État de la vente
const saleLoading = ref(false)
const printLoading = ref(false)
const saleError = ref('')

// Gestion du montant client et de la monnaie
const clientAmount = ref('')
const showPaymentModal = ref(false)

// Charger tous les produits
const loadProducts = async () => {
  try {
    productsLoading.value = true
    productsError.value = ''

    const response = await api.products.getAll()

    // Vérifier que la réponse contient les données attendues
    if (response && response.data && Array.isArray(response.data)) {
      products.value = response.data as ProductSearchResult[]
    } else if (response && Array.isArray(response)) {
      // Si la réponse est directement un tableau
      products.value = response as unknown as ProductSearchResult[]
    } else {
      products.value = []
      console.warn('Format de données inattendu pour les produits')
    }
  } catch (err: any) {
    productsError.value = err.message || 'Erreur lors du chargement des produits'
  } finally {
    productsLoading.value = false
  }
}

// Filtrer les produits selon le terme de recherche
const filteredProducts = computed(() => {
  if (!searchTerm.value.trim()) {
    return products.value
  }

  const term = searchTerm.value.toLowerCase()
  return products.value.filter(product =>
    product.name.toLowerCase().includes(term) ||
    product.code.toLowerCase().includes(term)
  )
})

// Ajouter un produit au panier
const addToCart = (product: ProductSearchResult) => {
  const existingItem = cart.value.find(item => item.productId === product.id)

  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.value.push({
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      productImage: product.image,
      price: product.price,
      quantity: 1
    })
  }

  calculateTotal()
}

// Modifier la quantité d'un article
const updateQuantity = (productId: number, newQuantity: number) => {
  const item = cart.value.find(item => item.productId === productId)
  if (item && newQuantity > 0) {
    item.quantity = newQuantity
    calculateTotal()
  }
}

// Formater le prix avec séparateurs de milliers
const formatPrice = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return `${numPrice.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })} FCFA`
}

// Helper pour formater les prix dans les templates de reçu
const formatPriceForReceipt = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  return numPrice.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

// Calculer la monnaie
const calculateChange = computed(() => {
  const amount = parseFloat(clientAmount.value) || 0
  const change = amount - cartTotal.value
  return change >= 0 ? change : 0
})

// Vérifier si le montant est suffisant
const isAmountSufficient = computed(() => {
  const amount = parseFloat(clientAmount.value) || 0
  return amount >= cartTotal.value
})

// Ouvrir le modal de paiement
const openPaymentModal = () => {
  if (cart.value.length === 0) return
  clientAmount.value = ''
  showPaymentModal.value = true
}

// Fermer le modal de paiement
const closePaymentModal = () => {
  showPaymentModal.value = false
  clientAmount.value = ''
}

// Supprimer un article du panier
const removeFromCart = (productId: number) => {
  const index = cart.value.findIndex(item => item.productId === productId)
  if (index > -1) {
    cart.value.splice(index, 1)
    calculateTotal()
  }
}

// Vider le panier
const clearCart = () => {
  cart.value = []
  cartTotal.value = 0
}

// Calculer le total
const calculateTotal = () => {
  cartTotal.value = cart.value.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.quantity)
  }, 0)
}

// Valider et envoyer la vente
const processSale = async () => {
  if (cart.value.length === 0 || !isAmountSufficient.value) return

  try {
    saleLoading.value = true
    saleError.value = ''

    const saleData: Sale = {
      total: cartTotal.value.toFixed(2),
      clientAmount: parseFloat(clientAmount.value),
      change: calculateChange.value,
      items: cart.value.map(item => ({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity
      }))
    }

    await api.sales.create(saleData)

    // Sauvegarder pour le reçu
    lastSale.value = saleData

    // Afficher le succès
    showSuccessModal.value = true

    // Vider le panier après succès
    clearCart()

    // Réinitialiser le paiement
    clientAmount.value = ''
    showPaymentModal.value = false

  } catch (err: any) {
    saleError.value = err.message || 'Erreur lors de la vente'
  } finally {
    saleLoading.value = false
  }
}

// Imprimer le reçu avec Electron ou fallback
const printReceipt = async () => {
  if (!lastSale.value) {
    showError('Aucune vente à imprimer')
    return
  }

  printLoading.value = true
  
  try {
    // Vérifier si on est dans Electron
    if (window.electronAPI && window.electronAPI.printReceipt) {
      // Utiliser l'API Electron pour l'impression
      console.log('🖨️ Démarrage impression via Electron...')
      const receiptContent = generateReceiptHTML(lastSale.value)
      
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
      const receiptContent = generateReceiptHTML(lastSale.value)
      const printWindow = window.open('', '_blank')

      if (printWindow) {
        printWindow.document.write(receiptContent)
        printWindow.document.close()
        printWindow.print()
        printWindow.close()
        showSuccess('Fenêtre d\'impression ouverte')
      } else {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'impression')
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'impression:', error)
    showError(error.message || 'Erreur lors de l\'impression du reçu')
  } finally {
    printLoading.value = false
  }
}

// Générer le HTML du reçu avec le même style que le modal
const generateReceiptHTML = (sale: Sale) => {
  const currentDate = new Date().toLocaleDateString('fr-FR')
  const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0)

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reçu de Caisse</title>
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
          
          .payment-section {
            border-top: 1px dashed #000;
            padding-top: 2mm;
            margin-top: 2mm;
            font-size: 10px;
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
            .total-row,
            .payment-section {
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
            <div class="supermarket-name">${authStore.supermarket?.name || 'SUPERMARCHÉ'}</div>
            ${authStore.supermarket?.code ? `<div class="supermarket-code">Code: ${authStore.supermarket.code}</div>` : ''}
            <div class="separator">============================</div>
          </div>

          <!-- Informations de transaction -->
          <div class="transaction-info">
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
              <span>${authStore.user?.username || ''}</span>
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

          <!-- Total et paiement -->
          <div class="totals-section">
            <div class="total-row total-main">
              <span>TOTAL:</span>
              <span>${formatPriceForReceipt(sale.total)} FCFA</span>
            </div>
            ${sale.clientAmount ? `
              <div class="payment-section">
                <div class="total-row">
                  <span>Reçu:</span>
                  <span>${formatPriceForReceipt(sale.clientAmount)} FCFA</span>
                </div>
                <div class="total-row" style="font-weight: bold;">
                  <span>Monnaie:</span>
                  <span>${formatPriceForReceipt(sale.change || 0)} FCFA</span>
                </div>
              </div>
            ` : ''}
            <div class="info-row" style="margin-top: 8px;">
              <span>Nb articles:</span>
              <span>${totalItems}</span>
            </div>
          </div>

          <!-- Pied de page -->
          <div class="footer">
            <div>Merci de votre visite !</div>
            <div>À bientôt chez ${authStore.supermarket?.name || 'nous'}</div>
            <div class="separator">============================</div>
          </div>
        </div>
      </body>
    </html>
  `
}

// Focus sur le champ de recherche au chargement
const searchInput = ref<HTMLInputElement>()

// Initialisation
onMounted(async () => {
  await loadProducts()
  nextTick(() => {
    if (searchInput.value) {
      searchInput.value.focus()
    }
  })
})
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Caisse</h1>
        <p class="text-muted-foreground">
          Point de vente - {{ authStore.supermarket?.name }}
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <Badge variant="outline" class="text-lg px-3 py-1">
          Total: {{ formatPrice(cartTotal) }}
        </Badge>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Zone de recherche et panier -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Liste des produits -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center space-x-2">
              <Search class="h-5 w-5" />
              <span>Produits disponibles</span>
            </CardTitle>
            <CardDescription>
              Recherchez et ajoutez des produits au panier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <!-- Barre de recherche -->
            <div class="mb-4">
              <Input
                ref="searchInput"
                v-model="searchTerm"
                placeholder="Rechercher par nom ou code..."
                class="text-lg"
              />
            </div>

            <!-- Loading state -->
            <div v-if="productsLoading" class="flex items-center justify-center py-8">
              <Loader2 class="h-6 w-6 animate-spin mr-2" />
              <span>Chargement des produits...</span>
            </div>

            <!-- Error state -->
            <div v-if="productsError" class="text-sm text-destructive mb-4">
              {{ productsError }}
            </div>

            <!-- Tableau des produits dans un container scrollable -->
            <div v-if="!productsLoading && !productsError" class="border rounded-lg" style="max-height: 200px; overflow-y: auto;">
              <Table>
                <TableHeader class="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead class="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="product in filteredProducts" :key="product.id" class="hover:bg-muted/50">
                    <TableCell>
                      <div class="flex items-center space-x-3">
                        <div v-if="product.image" class="h-8 w-8 rounded overflow-hidden">
                          <img :src="buildLogoUrl(product.image) || '/favicon.ico'"  :alt="product.name" class="h-full w-full object-cover" />
                        </div>
                        <div v-else class="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                          <Package class="h-4 w-4 text-primary" />
                        </div>
                        <div class="font-medium">{{ product.code }}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="font-medium">{{ product.name }}</div>
                    </TableCell>
                    <TableCell>
                      <span class="font-semibold text-primary">{{ formatPrice(product.price) }}</span>
                    </TableCell>
                    <TableCell class="text-right">
                      <Button
                        size="sm"
                        @click="addToCart(product)"
                        class="bg-green-600 hover:bg-green-700"
                      >
                        <Plus class="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow v-if="filteredProducts.length === 0">
                    <TableCell colspan="4" class="text-center text-muted-foreground py-8">
                      {{ searchTerm ? 'Aucun produit trouvé pour cette recherche' : 'Aucun produit disponible' }}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <!-- Panier -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle class="flex items-center space-x-2">
                <ShoppingCart class="h-5 w-5" />
                <span>Panier ({{ cart.length }} articles)</span>
              </CardTitle>
              <Button variant="outline" size="sm" @click="clearCart" :disabled="cart.length === 0">
                <Trash2 class="h-4 w-4 mr-1" />
                Vider
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="cart.length === 0" class="text-center text-muted-foreground py-8">
              Aucun article dans le panier
            </div>

            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in cart" :key="item.productId">
                  <TableCell>
                    <div>
                      <div v-if="item.productImage" class="h-8 w-8 rounded overflow-hidden">
                        <img :src="buildLogoUrl(item.productImage) || '/favicon.ico'"  :alt="item.productName" class="h-full w-full object-cover" />
                      </div>
                      <div v-else class="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                        <Package class="h-4 w-4 text-primary" />
                      </div>
                      <div class="font-medium">{{ item.productName }}</div>
                      <div class="text-sm text-muted-foreground">{{ item.productCode }}</div>
                    </div>
                  </TableCell>
                  <TableCell>{{ formatPrice(item.price) }}</TableCell>
                  <TableCell>
                    <div class="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        @click="updateQuantity(item.productId, item.quantity - 1)"
                        :disabled="item.quantity <= 1"
                      >
                        <Minus class="h-3 w-3" />
                      </Button>
                      <span class="w-8 text-center">{{ item.quantity }}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        @click="updateQuantity(item.productId, item.quantity + 1)"
                      >
                        <Plus class="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell class="font-medium">
                    {{ formatPrice(parseFloat(item.price) * item.quantity) }}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="text-destructive"
                      @click="removeFromCart(item.productId)"
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <!-- Zone de validation -->
      <div class="space-y-6">
        <!-- Résumé -->
        <Card>
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex justify-between text-lg">
              <span>Articles:</span>
              <span>{{ cart.length }}</span>
            </div>
            <div class="flex justify-between text-lg">
              <span>Quantité totale:</span>
              <span>{{ cart.reduce((sum, item) => sum + item.quantity, 0) }}</span>
            </div>
            <div class="border-t pt-2">
              <div class="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span>{{ formatPrice(cartTotal) }}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Actions -->
        <Card>
          <CardContent class="pt-6 space-y-3">
            <Button
              class="w-full"
              size="lg"
              @click="openPaymentModal"
              :disabled="cart.length === 0"
            >
              <Check class="h-4 w-4 mr-2" />
              Finaliser la vente
            </Button>

            <Button
              variant="outline"
              class="w-full"
              @click="showReceiptModal = true"
              :disabled="!lastSale"
            >
              <Printer class="h-4 w-4 mr-2" />
              Imprimer dernier reçu
            </Button>

            <div v-if="saleError" class="text-sm text-destructive text-center">
              {{ saleError }}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Modal de succès -->
    <Dialog v-model:open="showSuccessModal">
      <DialogContent class="sm:max-w-md max-h-[80vh] flex flex-col" :disableOutsideClick="true">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle class="flex items-center justify-center space-x-2 text-green-600">
            <Check class="h-6 w-6" />
            <span>Vente Validée</span>
          </DialogTitle>
          <DialogDescription class="text-center">
            Reçu de caisse - Transaction réussie
          </DialogDescription>
        </DialogHeader>

        <div class="py-4 overflow-y-auto flex-1" v-if="lastSale">
          <!-- Reçu style supermarché -->
          <div class="bg-white border-2 border-dashed border-muted-foreground/30 p-4 rounded-lg font-mono text-sm space-y-3">

            <!-- En-tête du supermarché -->
            <div class="text-center border-b border-dashed border-muted-foreground/30 pb-3">
              <div class="font-bold text-base">{{ authStore.supermarket?.name || 'SUPERMARCHÉ' }}</div>
              <div class="text-xs text-muted-foreground">
                {{ authStore.supermarket?.code ? `Code: ${authStore.supermarket.code}` : '' }}
              </div>
              <div class="text-xs text-muted-foreground mt-1">============================</div>
            </div>

            <!-- Informations de transaction -->
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span>Date:</span>
                <span>{{ new Date().toLocaleDateString('fr-FR') }}</span>
              </div>
              <div class="flex justify-between">
                <span>Heure:</span>
                <span>{{ new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Caissier:</span>
                <span>{{ authStore.user?.username }}</span>
              </div>
              <div class="text-muted-foreground">============================</div>
            </div>

            <!-- Liste des articles -->
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <div v-for="item in lastSale.items" :key="item.productId" class="space-y-1">
                <div class="font-medium text-xs">{{ item.productName }}</div>
                <div class="flex justify-between text-xs">
                  <span>{{ item.quantity }} x {{ formatPriceForReceipt(item.price) }} FCFA</span>
                  <span class="font-medium">{{ formatPriceForReceipt(parseFloat(item.price) * item.quantity) }} FCFA</span>
                </div>
              </div>
            </div>

            <!-- Séparateur -->
            <div class="text-xs text-muted-foreground">============================</div>

            <!-- Total et paiement -->
            <div class="space-y-1">
              <div class="flex justify-between text-sm font-bold">
                <span>TOTAL:</span>
                <span>{{ formatPriceForReceipt(lastSale.total) }} FCFA</span>
              </div>
              <div v-if="lastSale.clientAmount" class="space-y-1 text-xs border-t border-dashed border-muted-foreground/30 pt-2">
                <div class="flex justify-between">
                  <span>Reçu:</span>
                  <span>{{ formatPriceForReceipt(lastSale.clientAmount) }} FCFA</span>
                </div>
                <div class="flex justify-between font-medium">
                  <span>Monnaie:</span>
                  <span>{{ formatPriceForReceipt(lastSale.change || 0) }} FCFA</span>
                </div>
              </div>
              <div class="flex justify-between text-xs mt-2">
                <span>Nb articles:</span>
                <span>{{ lastSale.items.reduce((sum, item) => sum + item.quantity, 0) }}</span>
              </div>
            </div>

            <!-- Pied de page -->
            <div class="text-center text-xs text-muted-foreground border-t border-dashed border-muted-foreground/30 pt-3">
              <div>Merci de votre visite !</div>
              <div>À bientôt chez {{ authStore.supermarket?.name || 'nous' }}</div>
              <div class="mt-1">============================</div>
            </div>
          </div>
        </div>

        <DialogFooter class="gap-2 flex-shrink-0 border-t bg-background">
          <Button variant="outline" @click="printReceipt" v-if="lastSale" :disabled="printLoading">
            <Loader2 v-if="printLoading" class="h-4 w-4 mr-2 animate-spin" />
            <Printer v-else class="h-4 w-4 mr-2" />
            {{ printLoading ? 'Impression...' : 'Imprimer reçu' }}
          </Button>
          <Button @click="showSuccessModal = false">
            Nouvelle Vente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal d'impression -->
    <Dialog v-model:open="showReceiptModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Impression du reçu</DialogTitle>
          <DialogDescription>
            Imprimer le reçu de la dernière vente
          </DialogDescription>
        </DialogHeader>

        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showReceiptModal = false" :disabled="printLoading">
            Annuler
          </Button>
          <Button @click="printReceipt(); showReceiptModal = false" :disabled="printLoading">
            <Loader2 v-if="printLoading" class="h-4 w-4 mr-2 animate-spin" />
            <Printer v-else class="h-4 w-4 mr-2" />
            {{ printLoading ? 'Impression...' : 'Imprimer' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Modal de paiement -->
    <Dialog v-model:open="showPaymentModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paiement</DialogTitle>
          <DialogDescription>
            Saisir le montant reçu du client
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-6 py-4">
          <!-- Récapitulatif de la vente -->
          <div class="bg-muted/50 rounded-lg p-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-muted-foreground">Total à payer :</span>
              <span class="text-lg font-bold">{{ formatPrice(cartTotal) }}</span>
            </div>
            <div class="flex justify-between items-center text-sm text-muted-foreground">
              <span>{{ cart.length }} article(s)</span>
            </div>
          </div>

          <!-- Saisie du montant client -->
          <div class="space-y-2">
            <Label for="client-amount">Montant reçu du client</Label>
            <Input
              id="client-amount"
              v-model="clientAmount"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              class="text-lg text-center font-mono"
              :class="{ 'border-destructive': clientAmount && !isAmountSufficient }"
            />
            <div v-if="clientAmount && !isAmountSufficient" class="text-sm text-destructive">
              Le montant est insuffisant
            </div>
          </div>

          <!-- Calcul de la monnaie -->
          <div v-if="clientAmount && isAmountSufficient" class="bg-primary/10 rounded-lg p-4">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium">Monnaie à rendre :</span>
              <span class="text-lg font-bold text-primary">{{ formatPrice(calculateChange) }}</span>
            </div>
          </div>
        </div>

        <DialogFooter class="gap-2">
          <Button variant="outline" @click="closePaymentModal" :disabled="saleLoading">
            Annuler
          </Button>
          <Button
            @click="processSale"
            :disabled="!isAmountSufficient || saleLoading"
          >
            <Loader2 v-if="saleLoading" class="w-4 h-4 mr-2 animate-spin" />
            <Check v-else class="w-4 h-4 mr-2" />
            {{ saleLoading ? 'Traitement...' : 'Confirmer la vente' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>