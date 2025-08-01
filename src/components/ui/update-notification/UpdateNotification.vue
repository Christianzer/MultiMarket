<template>
  <div
    v-if="isVisible"
    class="fixed top-4 right-4 z-50 max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out"
    :class="{
      'border-blue-500 dark:border-blue-400': notificationType === 'info',
      'border-red-500 dark:border-red-400': notificationType === 'error',
      'border-yellow-500 dark:border-yellow-400': notificationType === 'progress'
    }"
  >
    <div class="flex items-start space-x-3">
      <!-- Icône -->
      <div class="flex-shrink-0">
        <div
          class="w-6 h-6 rounded-full flex items-center justify-center"
          :class="{
            'bg-blue-100 dark:bg-blue-900': notificationType === 'info',
            'bg-red-100 dark:bg-red-900': notificationType === 'error',
            'bg-yellow-100 dark:bg-yellow-900': notificationType === 'progress'
          }"
        >
          <Icon
            v-if="notificationType === 'info'"
            name="download"
            class="w-4 h-4 text-blue-600 dark:text-blue-400"
          />
          <Icon
            v-else-if="notificationType === 'error'"
            name="alert-circle"
            class="w-4 h-4 text-red-600 dark:text-red-400"
          />
          <Icon
            v-else
            name="loader"
            class="w-4 h-4 text-yellow-600 dark:text-yellow-400 animate-spin"
          />
        </div>
      </div>

      <!-- Contenu -->
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
          Mise à jour de l'application
        </div>
        <div class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {{ message }}
        </div>
        
        <!-- Barre de progression pour le téléchargement -->
        <div
          v-if="notificationType === 'progress' && progress"
          class="mt-3"
        >
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>{{ progress.percent }}%</span>
            <span>{{ progress.speed }} KB/s</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${progress.percent}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Bouton de fermeture -->
      <button
        v-if="notificationType !== 'progress'"
        @click="close"
        class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <Icon name="x" class="w-4 h-4" />
      </button>
    </div>

    <!-- Actions -->
    <div
      v-if="notificationType === 'info' && showActions"
      class="mt-4 flex space-x-2"
    >
      <button
        @click="checkForUpdates"
        class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Vérifier maintenant
      </button>
      <button
        @click="close"
        class="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        Plus tard
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import UpdaterService from '@/services/updater'
import type { UpdateProgress } from '@/services/updater'

interface Props {
  autoClose?: boolean
  autoCloseDelay?: number
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoClose: true,
  autoCloseDelay: 5000,
  showActions: false
})

const isVisible = ref(false)
const message = ref('')
const notificationType = ref<'info' | 'error' | 'progress'>('info')
const progress = ref<UpdateProgress | null>(null)

let autoCloseTimer: number | null = null
let unsubscribeUpdate: (() => void) | null = null
let unsubscribeProgress: (() => void) | null = null

const show = (msg: string, type: 'info' | 'error' | 'progress') => {
  message.value = msg
  notificationType.value = type
  isVisible.value = true

  // Auto-fermeture pour les messages d'information et d'erreur
  if (props.autoClose && type !== 'progress') {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer)
    }
    autoCloseTimer = window.setTimeout(() => {
      close()
    }, props.autoCloseDelay)
  }
}

const close = () => {
  isVisible.value = false
  progress.value = null
  if (autoCloseTimer) {
    window.clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
}

const checkForUpdates = async () => {
  const result = await UpdaterService.checkForUpdates()
  if (!result.success) {
    show(`Erreur lors de la vérification: ${result.error}`, 'error')
  }
}

onMounted(() => {
  // S'abonner aux messages de mise à jour
  unsubscribeUpdate = UpdaterService.onUpdateMessage((msg, type) => {
    show(msg, type)
  })

  // S'abonner au progrès de téléchargement
  unsubscribeProgress = UpdaterService.onUpdateProgress((progressData) => {
    progress.value = progressData
  })
})

onUnmounted(() => {
  if (unsubscribeUpdate) {
    unsubscribeUpdate()
  }
  if (unsubscribeProgress) {
    unsubscribeProgress()
  }
  if (autoCloseTimer) {
    window.clearTimeout(autoCloseTimer)
  }
})

// Exposer les méthodes pour utilisation externe
defineExpose({
  show,
  close
})
</script>