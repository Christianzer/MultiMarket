<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Store, Users, Package, TrendingUp, DollarSign, Calendar, BarChart3, Clock, Trophy } from 'lucide-vue-next'
import { api } from '@/services/api'
import type { AdminDashboardData } from '@/types/dashboard'
import { mockAdminDashboardData } from '@/services/mock-admin-data'

const dashboardData = ref<AdminDashboardData | null>(null)
const loading = ref(false)
const error = ref('')

const loadDashboardData = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // Utiliser les données mock pour le test
    // TODO: Remplacer par l'appel API réel
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simuler un délai
    dashboardData.value = mockAdminDashboardData
    
    // const response = await api.dashboard.getData()
    // dashboardData.value = response as unknown as AdminDashboardData
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

const formatHour = (hour: number): string => {
  return `${hour}h00`
}

// Statistiques calculées
const totalCashierSales = computed(() => {
  if (!dashboardData.value) return 0
  return dashboardData.value.cashiers_performance.reduce((total, cashier) => total + cashier.sales_count, 0)
})

const totalCashierRevenue = computed(() => {
  if (!dashboardData.value) return 0
  return dashboardData.value.cashiers_performance.reduce((total, cashier) => total + cashier.revenue, 0)
})

const bestCashier = computed(() => {
  if (!dashboardData.value || dashboardData.value.cashiers_performance.length === 0) return null
  return dashboardData.value.cashiers_performance.reduce((best, current) => 
    current.revenue > best.revenue ? current : best)
})

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête avec informations du supermarché -->
    <div v-if="dashboardData">
      <div class="flex items-center gap-3 mb-2">
        <Store class="h-8 w-8 text-primary" />
        <div>
          <h1 class="text-3xl font-bold">{{ dashboardData.supermarket.name }}</h1>
          <div class="flex items-center gap-2">
            <Badge variant="outline">{{ dashboardData.supermarket.code }}</Badge>
            <p class="text-muted-foreground">Tableau de bord Administrateur</p>
          </div>
        </div>
      </div>
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
            <CardTitle class="text-sm font-medium">Utilisateurs</CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ dashboardData.overview.total_users }}</div>
            <p class="text-xs text-muted-foreground">
              Total dans ce supermarché
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Produits</CardTitle>
            <Package class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ dashboardData.overview.total_products }}</div>
            <p class="text-xs text-muted-foreground">
              En stock actuellement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Ventes totales</CardTitle>
            <TrendingUp class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ totalCashierSales }}</div>
            <p class="text-xs text-muted-foreground">
              Par les caissiers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">CA Total</CardTitle>
            <DollarSign class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatCurrency(dashboardData.revenue.total) }}</div>
            <p class="text-xs text-muted-foreground">
              Chiffre d'affaires global
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Cartes de revenus -->
      <div class="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Revenus aujourd'hui</CardTitle>
            <Calendar class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-green-600">{{ formatCurrency(dashboardData.revenue.today) }}</div>
            <p class="text-xs text-muted-foreground">Ventes de la journée</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Revenus ce mois</CardTitle>
            <BarChart3 class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-blue-600">{{ formatCurrency(dashboardData.revenue.month) }}</div>
            <p class="text-xs text-muted-foreground">Cumul mensuel</p>
          </CardContent>
        </Card>
      </div>

      <!-- Performance des caissiers et meilleur caissier -->
      <div class="grid gap-6 md:grid-cols-3">
        <!-- Performance des caissiers -->
        <Card class="md:col-span-2">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Users class="h-5 w-5" />
              Performance des caissiers
            </CardTitle>
            <CardDescription>Classement par chiffre d'affaires</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Caissier</TableHead>
                  <TableHead class="text-right">Ventes</TableHead>
                  <TableHead class="text-right">Revenue</TableHead>
                  <TableHead class="text-right">Moyenne</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(cashier, index) in dashboardData.cashiers_performance" :key="cashier.username">
                  <TableCell class="font-medium">
                    <div class="flex items-center gap-2">
                      <Badge v-if="index === 0" variant="default" class="text-xs">
                        <Trophy class="h-3 w-3 mr-1" />
                        #1
                      </Badge>
                      <Badge v-else-if="index === 1" variant="secondary" class="text-xs">#2</Badge>
                      <Badge v-else variant="outline" class="text-xs">#{{ index + 1 }}</Badge>
                      {{ cashier.username }}
                    </div>
                  </TableCell>
                  <TableCell class="text-right">{{ cashier.sales_count }}</TableCell>
                  <TableCell class="text-right font-mono">{{ formatCurrency(cashier.revenue) }}</TableCell>
                  <TableCell class="text-right font-mono">
                    {{ formatCurrency(cashier.sales_count > 0 ? cashier.revenue / cashier.sales_count : 0) }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <!-- Meilleur caissier -->
        <Card v-if="bestCashier">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Trophy class="h-5 w-5 text-yellow-500" />
              Meilleur caissier
            </CardTitle>
            <CardDescription>Performance du mois</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-600">{{ bestCashier.username }}</div>
              <Badge variant="default" class="mt-2">Champion du mois</Badge>
            </div>
            
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Ventes:</span>
                <span class="font-medium">{{ bestCashier.sales_count }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Revenue:</span>
                <span class="font-medium">{{ formatCurrency(bestCashier.revenue) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted-foreground">Moyenne:</span>
                <span class="font-medium">
                  {{ formatCurrency(bestCashier.sales_count > 0 ? bestCashier.revenue / bestCashier.sales_count : 0) }}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Évolution sur 7 jours et activité aujourd'hui -->
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Évolution des 7 derniers jours -->
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
                  <TableHead class="text-right">Ventes</TableHead>
                  <TableHead class="text-right">Revenus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="day in dashboardData.last_7_days" :key="day.date">
                  <TableCell class="font-medium">{{ formatDate(day.date) }}</TableCell>
                  <TableCell class="text-right">{{ day.sales }}</TableCell>
                  <TableCell class="text-right font-mono">{{ formatCurrency(day.revenue) }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <!-- Activité d'aujourd'hui par heure -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Clock class="h-5 w-5" />
              Activité d'aujourd'hui
            </CardTitle>
            <CardDescription>Ventes par tranche horaire</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Heure</TableHead>
                  <TableHead class="text-right">Ventes</TableHead>
                  <TableHead class="text-right">Revenus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="hourly in dashboardData.today_hourly" :key="hourly.hour">
                  <TableCell class="font-medium">{{ formatHour(hourly.hour) }}</TableCell>
                  <TableCell class="text-right">{{ hourly.sales }}</TableCell>
                  <TableCell class="text-right font-mono">{{ formatCurrency(hourly.revenue) }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>