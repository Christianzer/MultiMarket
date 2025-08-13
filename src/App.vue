<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { ScrollArea, ScrollBar } from './components/ui/scroll-area';
import { UpdateNotification, UpdateManager } from './components/ui/update-notification';
import { Toast } from './components/ui/toast';
import { useToast } from '@/composables/useToast'
import { useTokenWatcher } from '@/services/tokenWatcher'

const router = useRouter()
const { startWatching, stopWatching } = useTokenWatcher()
const { error: showError } = useToast()

// Gestionnaire pour l'expiration du token JWT
const handleTokenExpired = async (event: CustomEvent) => {
  console.warn('🔒 Événement de token expiré reçu:', event.detail)
  
  const authStore = useAuthStore()
  
  // Effacer l'authentification si ce n'est pas déjà fait
  if (authStore.isLoggedIn) {
    // Arrêter la surveillance du token
    stopWatching()
    
    authStore.clearAuth()
    
    // Afficher un toast d'information
    showError(event.detail.message || 'Votre session a expiré. Veuillez vous reconnecter.', {
      duration: 5000,
    })
    
    // Rediriger vers la page de connexion
    try {
      await router.push('/login')
    } catch (error) {
      console.warn('Erreur de redirection:', error)
      // Fallback: forcer le rechargement
      window.location.href = '/login'
    }
  }
}

onMounted(async () => {
  const appStore = useAppStore();
  const authStore = useAuthStore();
  
  appStore.initTheme();
  await authStore.initAuth();
  
  // Démarrer la surveillance du token si l'utilisateur est connecté
  if (authStore.isLoggedIn) {
    startWatching()
  }
  
  // Écouter les événements d'expiration de token
  window.addEventListener('auth-token-expired', handleTokenExpired as EventListener)
});

onUnmounted(() => {
  // Nettoyer l'event listener et arrêter la surveillance
  window.removeEventListener('auth-token-expired', handleTokenExpired as EventListener)
  stopWatching()
})
</script>

<template>
  <ScrollArea class="h-screen">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <ScrollBar class="z-50" />
    
    <!-- Gestionnaire de mise à jour optimisé -->
    <UpdateManager />
    
    <!-- Toasts -->
    <Toast />
  </ScrollArea>
</template>
