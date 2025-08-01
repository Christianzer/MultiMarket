<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-vue-next'
import { useElectron } from '@/services/electron'

interface UpdateProgress {
  percent: number
  transferred: number
  total: number
  speed: number
}

interface UpdateState {
  available: boolean
  downloading: boolean
  downloaded: boolean
  error: string | null
  progress: UpdateProgress | null
  version: string | null
  message: string | null
}

const { service, isElectron } = useElectron()

// État des mises à jour
const updateState = ref<UpdateState>({
  available: false,
  downloading: false,
  downloaded: false,
  error: null,
  progress: null,
  version: null,
  message: null
})

// États de l'interface
const showUpdateDialog = ref(false)
const showNotification = ref(false)
const lastCheckTime = ref<Date | null>(null)
const autoCheckEnabled = ref(true)

// Nettoyage des listeners
let messageUnsubscribe: (() => void) | null = null
let errorUnsubscribe: (() => void) | null = null  
let progressUnsubscribe: (() => void) | null = null

// Timer pour vérification automatique
let autoCheckTimer: NodeJS.Timeout | null = null

onMounted(() => {
  if (isElectron) {
    setupUpdateListeners()
    startAutoCheck()
    checkCurrentVersion()
  }
})

onUnmounted(() => {
  cleanup()
})

function setupUpdateListeners() {
  if (!service.available) return

  // Écouter les messages de mise à jour
  messageUnsubscribe = service.onUpdaterMessage((message: string) => {
    updateState.value.message = message
    
    if (message.includes('disponible')) {
      updateState.value.available = true
      showNotification.value = true
    } else if (message.includes('téléchargée')) {
      updateState.value.downloaded = true
      updateState.value.downloading = false
      showNotification.value = true
    } else if (message.includes('Vérification')) {
      // Vérification en cours
    }
  })

  // Écouter les erreurs
  errorUnsubscribe = service.onUpdaterError((error: string) => {
    updateState.value.error = error
    updateState.value.downloading = false
    console.error('Update error:', error)
  })

  // Écouter le progrès
  progressUnsubscribe = service.onUpdaterProgress((progress: UpdateProgress) => {
    updateState.value.progress = progress
    updateState.value.downloading = true
  })
}

function startAutoCheck() {
  if (!autoCheckEnabled.value || !service.available) return

  // Vérification immédiate après 30 secondes
  setTimeout(() => {
    checkForUpdates(false)
  }, 30000)

  // Puis toutes les 2 heures
  autoCheckTimer = setInterval(() => {
    checkForUpdates(false)
  }, 2 * 60 * 60 * 1000)
}

async function checkCurrentVersion() {
  if (!service.available) return
  
  try {
    const version = await service.getAppVersion()
    updateState.value.version = version
  } catch (error) {
    console.error('Erreur récupération version:', error)
  }
}

async function checkForUpdates(showProgress = true) {
  if (!service.available) return

  try {
    if (showProgress) {
      updateState.value.message = 'Vérification des mises à jour...'
    }
    
    const result = await service.checkForUpdates()
    lastCheckTime.value = new Date()
    
    if (result && result.success) {
      console.log('✅ Vérification mise à jour terminée')
    }
  } catch (error) {
    console.error('Erreur vérification mise à jour:', error)
    updateState.value.error = 'Impossible de vérifier les mises à jour'
  }
}

function showUpdateDetails() {
  showUpdateDialog.value = true
  showNotification.value = false
}

function dismissNotification() {
  showNotification.value = false
}

async function installUpdate() {
  if (!service.available || !updateState.value.downloaded) return
  
  try {
    await service.quitAndInstall()
  } catch (error) {
    console.error('Erreur installation:', error)
    updateState.value.error = 'Erreur lors de l\'installation'
  }
}

async function restartApp() {
  if (!service.available) return
  
  try {
    await service.restartApp()
  } catch (error) {
    console.error('Erreur redémarrage:', error)
  }
}

function toggleAutoCheck() {
  autoCheckEnabled.value = !autoCheckEnabled.value
  
  if (autoCheckEnabled.value) {
    startAutoCheck()
  } else {
    if (autoCheckTimer) {
      clearInterval(autoCheckTimer)
      autoCheckTimer = null
    }
  }
}

function cleanup() {
  // Nettoyer les listeners
  if (messageUnsubscribe) messageUnsubscribe()
  if (errorUnsubscribe) errorUnsubscribe()
  if (progressUnsubscribe) progressUnsubscribe()
  
  // Nettoyer les timers
  if (autoCheckTimer) {
    clearInterval(autoCheckTimer)
    autoCheckTimer = null
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatSpeed(bytesPerSecond: number): string {
  return formatBytes(bytesPerSecond) + '/s'
}
</script>

<template>
  <div v-if="isElectron">
    <!-- Notification flottante -->
    <div 
      v-if="showNotification"
      class="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2"
    >
      <Card class="w-80 border-l-4" :class="{
        'border-l-blue-500': updateState.available && !updateState.downloaded,
        'border-l-green-500': updateState.downloaded,
        'border-l-red-500': updateState.error
      }">
        <CardHeader class="pb-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <Download v-if="updateState.available && !updateState.downloaded" class="h-4 w-4 text-blue-500" />
              <CheckCircle v-else-if="updateState.downloaded" class="h-4 w-4 text-green-500" />
              <AlertCircle v-else-if="updateState.error" class="h-4 w-4 text-red-500" />
              <CardTitle class="text-sm">
                <span v-if="updateState.available && !updateState.downloaded">Mise à jour disponible</span>
                <span v-else-if="updateState.downloaded">Mise à jour prête</span>
                <span v-else-if="updateState.error">Erreur de mise à jour</span>
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" @click="dismissNotification">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent class="pt-0">
          <CardDescription class="text-xs mb-2">
            {{ updateState.message || updateState.error }}
          </CardDescription>
          
          <!-- Progrès de téléchargement -->
          <div v-if="updateState.downloading && updateState.progress" class="space-y-2 mb-3">
            <Progress :value="updateState.progress.percent" class="h-2" />
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>{{ updateState.progress.percent }}%</span>
              <span>{{ formatSpeed(updateState.progress.speed) }}</span>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <Button 
              v-if="updateState.downloaded" 
              size="sm" 
              @click="installUpdate"
              class="flex-1"
            >
              Installer
            </Button>
            <Button 
              v-else-if="updateState.available" 
              size="sm" 
              variant="outline"
              @click="showUpdateDetails"
              class="flex-1"
            >
              Détails
            </Button>
            <Button 
              v-if="updateState.error" 
              size="sm" 
              variant="outline"
              @click="checkForUpdates(true)"
              class="flex-1"
            >
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Dialog détaillé -->
    <Dialog v-model:open="showUpdateDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center space-x-2">
            <Download class="h-5 w-5" />
            <span>Mise à jour disponible</span>
          </DialogTitle>
          <DialogDescription>
            Une nouvelle version de MultiMarket est disponible
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium">Version actuelle:</span>
              <div class="text-muted-foreground">{{ updateState.version || 'Inconnue' }}</div>
            </div>
            <div>
              <span class="font-medium">Vérification automatique:</span>
              <div class="flex items-center space-x-2 mt-1">
                <Badge :variant="autoCheckEnabled ? 'default' : 'secondary'">
                  {{ autoCheckEnabled ? 'Activée' : 'Désactivée' }}
                </Badge>
              </div>
            </div>
          </div>
          
          <div v-if="lastCheckTime" class="text-xs text-muted-foreground">
            Dernière vérification: {{ lastCheckTime.toLocaleString() }}
          </div>
          
          <div v-if="updateState.downloading && updateState.progress" class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Téléchargement en cours...</span>
              <span>{{ updateState.progress.percent }}%</span>
            </div>
            <Progress :value="updateState.progress.percent" />
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>{{ formatBytes(updateState.progress.transferred * 1024 * 1024) }} / {{ formatBytes(updateState.progress.total * 1024 * 1024) }}</span>
              <span>{{ formatSpeed(updateState.progress.speed * 1024) }}</span>
            </div>
          </div>
          
          <div v-if="updateState.error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center space-x-2 text-red-800">
              <AlertCircle class="h-4 w-4" />
              <span class="font-medium">Erreur</span>
            </div>
            <div class="text-red-700 text-sm mt-1">{{ updateState.error }}</div>
          </div>
        </div>
        
        <DialogFooter class="flex-col space-y-2 sm:flex-row sm:space-y-0">
          <Button variant="outline" @click="toggleAutoCheck" size="sm">
            {{ autoCheckEnabled ? 'Désactiver' : 'Activer' }} auto-vérification
          </Button>
          <div class="flex space-x-2">
            <Button variant="outline" @click="checkForUpdates(true)">
              <RefreshCw class="h-4 w-4 mr-1" />
              Vérifier
            </Button>
            <Button v-if="updateState.downloaded" @click="installUpdate">
              Installer maintenant
            </Button>
            <Button v-else-if="updateState.error" @click="restartApp">
              Redémarrer l'application
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>