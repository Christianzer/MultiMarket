<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Store, Users, Package, TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-vue-next'
import { api } from '@/services/api'
import type { SuperAdminDashboardData } from '@/types/dashboard'

const dashboardData = ref<SuperAdminDashboardData | null>(null)
const loading = ref(false)
const error = ref('')

const loadDashboardData = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const response = await api.dashboard.getData()
    dashboardData.value = response as SuperAdminDashboardData
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement des données'
  } finally {
    loading.value = false
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'CFA',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short'
  }).format(new Date(dateString))
}

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div>
      <h1 class="text-3xl font-bold">Tableau de bord Super Admin</h1>
      <p class="text-muted-foreground">Vue d'ensemble de tous les supermarchés</p>
    </div>


    <!-- État de chargement -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="text-center">
        <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p class="text-muted-foreground">Chargement des données...</p>
      </div>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="error" class="bg-destructive/10 border border-destructive text-destructive text-sm p-4 rounded-md">
      {{ error }}
    </div>

    <!-- Contenu du dashboard -->
    <div v-else-if="dashboardData" class="space-y-6">
      <!-- Cartes de statistiques principales -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Supermarchés</CardTitle>
            <Store class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ dashboardData.overview.total_supermarkets }}</div>
            <p class="text-xs text-muted-foreground">
              {{ dashboardData.overview.active_supermarkets }} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ dashboardData.overview.total_users }}</div>
            <p class="text-xs text-muted-foreground">
              Tous rôles confondus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Produits</CardTitle>
            <Package class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ dashboardData.overview.total_products }}</div>
            <p class="text-xs text-muted-foreground">
              Dans tous les supermarchés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Chiffre d'affaires total</CardTitle>
            <DollarSign class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatCurrency(dashboardData.revenue.total) }}</div>
            <p class="text-xs text-muted-foreground">
              Toutes périodes confondues
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Cartes de revenus -->
      <div class="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Revenus aujourd'hui</CardTitle>
            <TrendingUp class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-green-600">{{ formatCurrency(dashboardData.revenue.today) }}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Revenus ce mois</CardTitle>
            <Calendar class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-blue-600">{{ formatCurrency(dashboardData.revenue.month) }}</div>
          </CardContent>
        </Card>
      </div>

      <!-- Tableau des meilleurs supermarchés et utilisateurs par rôle -->
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Top Supermarchés -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Store class="h-5 w-5" />
              Top Supermarchés
            </CardTitle>
            <CardDescription>Classement par chiffre d'affaires</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead class="text-right">CA</TableHead>
                  <TableHead class="text-right">Ventes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="supermarket in dashboardData.top_supermarkets" :key="supermarket.code">
                  <TableCell class="font-medium">{{ supermarket.name }}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{{ supermarket.code }}</Badge>
                  </TableCell>
                  <TableCell class="text-right font-mono">{{ formatCurrency(supermarket.revenue) }}</TableCell>
                  <TableCell class="text-right">{{ supermarket.sales_count }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <!-- Utilisateurs par rôle -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Users class="h-5 w-5" />
              Utilisateurs par rôle
            </CardTitle>
            <CardDescription>Répartition des utilisateurs</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div v-for="userRole in dashboardData.users_by_role" :key="userRole.role" 
                   class="flex items-center justify-between p-3 border rounded-md">
                <div class="flex items-center gap-3">
                  <Badge :variant="userRole.role === 'super_admin' ? 'default' : 
                                  userRole.role === 'admin' ? 'secondary' : 'outline'">
                    {{ userRole.role === 'super_admin' ? 'Super Admin' : 
                       userRole.role === 'admin' ? 'Admin' : 'Caissier' }}
                  </Badge>
                </div>
                <div class="text-2xl font-bold">{{ userRole.count }}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Graphique des 7 derniers jours -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <BarChart3 class="h-5 w-5" />
            Évolution des 7 derniers jours
          </CardTitle>
          <CardDescription>Revenus et ventes quotidiennes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead class="text-right">Revenus</TableHead>
                <TableHead class="text-right">Ventes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="day in dashboardData.last_7_days" :key="day.date">
                <TableCell class="font-medium">{{ formatDate(day.date) }}</TableCell>
                <TableCell class="text-right font-mono">{{ formatCurrency(day.revenue) }}</TableCell>
                <TableCell class="text-right">{{ day.sales }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- Actions rapides -->
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>Raccourcis vers les fonctionnalités principales</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-2 md:grid-cols-2">
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