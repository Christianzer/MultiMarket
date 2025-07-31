<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { Store, Users, ShoppingCart, TrendingUp } from 'lucide-vue-next'

const authStore = useAuthStore()

// Mock data pour les statistiques
const stats = {
  totalSupermarkets: 12,
  totalUsers: 156,
  totalSales: 2450,
  monthlyGrowth: 15.2
}

const recentSupermarkets = [
  { name: 'Carrefour Abidjan', status: 'Actif', users: 25 },
  { name: 'Casino Express', status: 'Actif', users: 18 },
  { name: 'Spar Cocody', status: 'Inactif', users: 12 },
]
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Tableau de Bord Super Admin</h1>
      <p class="text-muted-foreground">
        Vue d'ensemble de tous les supermarchés et utilisateurs
      </p>
    </div>

    <!-- Statistiques principales -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Total SuperMarchés
          </CardTitle>
          <Store class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.totalSupermarkets }}</div>
          <p class="text-xs text-muted-foreground">
            Supermarchés enregistrés
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Total Utilisateurs
          </CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.totalUsers }}</div>
          <p class="text-xs text-muted-foreground">
            Utilisateurs actifs
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Ventes Totales
          </CardTitle>
          <ShoppingCart class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.totalSales }}</div>
          <p class="text-xs text-muted-foreground">
            Ce mois
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">
            Croissance
          </CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">+{{ stats.monthlyGrowth }}%</div>
          <p class="text-xs text-muted-foreground">
            Par rapport au mois dernier
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- SuperMarchés récents -->
    <div class="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>SuperMarchés Récents</CardTitle>
          <CardDescription>
            Derniers supermarchés ajoutés au système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-for="supermarket in recentSupermarkets" :key="supermarket.name" 
                 class="flex items-center justify-between">
              <div class="space-y-1">
                <p class="text-sm font-medium">{{ supermarket.name }}</p>
                <p class="text-xs text-muted-foreground">{{ supermarket.users }} utilisateurs</p>
              </div>
              <Badge :variant="supermarket.status === 'Actif' ? 'default' : 'secondary'">
                {{ supermarket.status }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>
            Raccourcis vers les fonctionnalités principales
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-2">
            <router-link to="/dashboard/supermarkets" 
                        class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              Gérer les SuperMarchés
            </router-link>
            <router-link to="/dashboard/users"
                        class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              Gérer les Utilisateurs
            </router-link>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>