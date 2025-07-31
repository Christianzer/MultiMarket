<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { Users, Package, ShoppingCart, Euro } from 'lucide-vue-next'

const authStore = useAuthStore()

// Mock data pour les statistiques
const stats = {
  totalUsers: 23,
  totalProducts: 340,
  todaySales: 45,
  dailyRevenue: 2850.50
}

const recentSales = [
  { id: '#001', time: '10:45', amount: 125.50, items: 8 },
  { id: '#002', time: '11:20', amount: 89.20, items: 5 },
  { id: '#003', time: '11:35', amount: 234.80, items: 12 },
]

const lowStockProducts = [
  { name: 'Riz Uncle Bens 1kg', stock: 5, min: 20 },
  { name: 'Lait Candia 1L', stock: 8, min: 15 },
  { name: 'Pain de mie Harry\'s', stock: 12, min: 25 },
]

// Formater le prix avec séparateurs de milliers
const formatPrice = (price: number) => {
  return `${price.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })} FCFA`
}
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Tableau de Bord Admin</h1>
      <p class="text-muted-foreground">
        Gestion de {{ authStore.supermarket?.name || 'votre supermarché' }}
      </p>
    </div>

    <!-- Statistiques principales -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Utilisateurs
          </CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.totalUsers }}</div>
          <p class="text-xs text-muted-foreground">
            Employés actifs
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Produits
          </CardTitle>
          <Package class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.totalProducts }}</div>
          <p class="text-xs text-muted-foreground">
            En stock
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Ventes Aujourd'hui
          </CardTitle>
          <ShoppingCart class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.todaySales }}</div>
          <p class="text-xs text-muted-foreground">
            Transactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Chiffre d'Affaires
          </CardTitle>
          <Euro class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ formatPrice(stats.dailyRevenue) }}</div>
          <p class="text-xs text-muted-foreground">
            Aujourd'hui
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Ventes récentes et stock faible -->
    <div class="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ventes Récentes</CardTitle>
          <CardDescription>
            Dernières transactions de la journée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-for="sale in recentSales" :key="sale.id" 
                 class="flex items-center justify-between">
              <div class="space-y-1">
                <p class="text-sm font-medium">{{ sale.id }}</p>
                <p class="text-xs text-muted-foreground">{{ sale.time }} - {{ sale.items }} articles</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold">{{ formatPrice(sale.amount) }}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Faible</CardTitle>
          <CardDescription>
            Produits nécessitant un réapprovisionnement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-for="product in lowStockProducts" :key="product.name" 
                 class="flex items-center justify-between">
              <div class="space-y-1">
                <p class="text-sm font-medium">{{ product.name }}</p>
                <p class="text-xs text-muted-foreground">Min: {{ product.min }}</p>
              </div>
              <Badge variant="destructive">
                {{ product.stock }} restant
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Actions rapides -->
    <Card>
      <CardHeader>
        <CardTitle>Actions Rapides</CardTitle>
        <CardDescription>
          Raccourcis vers les fonctionnalités principales
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-2 md:grid-cols-4">
          <router-link to="/dashboard/users" 
                      class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Gérer Utilisateurs
          </router-link>
          <router-link to="/dashboard/products"
                      class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            Gérer Produits
          </router-link>
          <router-link to="/dashboard/sales"
                      class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            Voir Ventes
          </router-link>
          <router-link to="/dashboard/products"
                      class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            Ajouter Produit
          </router-link>
        </div>
      </CardContent>
    </Card>
  </div>
</template>