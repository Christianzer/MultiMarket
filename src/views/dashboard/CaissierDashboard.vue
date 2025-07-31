<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { buildLogoUrl } from '@/config/api'
import { ShoppingCart, Euro, Clock, TrendingUp } from 'lucide-vue-next'

const authStore = useAuthStore()

// Mock data pour les statistiques du caissier
const stats = {
  todaySales: 12,
  todayRevenue: 456.80,
  averageTicket: 38.07,
  hoursWorked: 6.5
}

const recentTransactions = [
  { id: '#C001', time: '14:45', amount: 45.20, items: 6 },
  { id: '#C002', time: '14:30', amount: 89.50, items: 9 },
  { id: '#C003', time: '14:15', amount: 23.80, items: 3 },
  { id: '#C004', time: '14:00', amount: 67.30, items: 8 },
]
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Tableau de Bord Caissier</h1>
      <p class="text-muted-foreground">
        Bonjour {{ authStore.currentUser?.username }}, voici votre activité du jour
      </p>
    </div>

    <!-- Statistiques principales -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            Transactions réalisées
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
          <div class="text-2xl font-bold">{{ stats.todayRevenue.toFixed(2) }}€</div>
          <p class="text-xs text-muted-foreground">
            Total aujourd'hui
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Panier Moyen
          </CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.averageTicket.toFixed(2) }}€</div>
          <p class="text-xs text-muted-foreground">
            Par transaction
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Temps Travaillé
          </CardTitle>
          <Clock class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.hoursWorked }}h</div>
          <p class="text-xs text-muted-foreground">
            Aujourd'hui
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Transactions récentes -->
    <Card>
      <CardHeader>
        <CardTitle>Mes Transactions Récentes</CardTitle>
        <CardDescription>
          Dernières ventes que vous avez traitées
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div v-for="transaction in recentTransactions" :key="transaction.id" 
               class="flex items-center justify-between p-4 border rounded-lg">
            <div class="space-y-1">
              <p class="text-sm font-medium">{{ transaction.id }}</p>
              <p class="text-xs text-muted-foreground">
                {{ transaction.time }} - {{ transaction.items }} articles
              </p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold">{{ transaction.amount.toFixed(2) }}€</p>
              <Badge variant="outline">Terminée</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Action rapide -->
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>
          Commencer une nouvelle transaction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex gap-4">
          <router-link to="/dashboard/create-sale" 
                      class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 py-2 text-lg">
            <ShoppingCart class="mr-2 h-5 w-5" />
            Nouvelle Vente
          </router-link>
        </div>
      </CardContent>
    </Card>

    <!-- Informations magasin -->
    <Card v-if="authStore.supermarket">
      <CardHeader>
        <CardTitle>Informations Magasin</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex items-center space-x-4">
          <img 
            :src="buildLogoUrl(authStore.supermarket.logo)" 
            :alt="authStore.supermarket.name"
            class="h-12 w-12 object-contain rounded"
          />
          <div>
            <p class="font-medium">{{ authStore.supermarket.name }}</p>
            <p class="text-sm text-muted-foreground">{{ authStore.supermarket.code }}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>