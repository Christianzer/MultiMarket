<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { ScrollArea, ScrollBar } from './components/ui/scroll-area';
import { UpdateNotification, UpdateManager } from './components/ui/update-notification';
import { Toast } from './components/ui/toast';

onMounted(async () => {
  const appStore = useAppStore();
  const authStore = useAuthStore();
  
  appStore.initTheme();
  await authStore.initAuth();
});
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
