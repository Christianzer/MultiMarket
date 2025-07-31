<script setup lang="ts">
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import router from '@/router';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeftToLine } from 'lucide-vue-next';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { getMenusForRole } from '@/config/menus';

const route = useRoute()
const store = useAppStore();
const authStore = useAuthStore();

const menus = computed(() => {
  const userRole = authStore.userRole || 'caissier';
  return getMenusForRole(userRole).map(group => ({
    key: group.name.toLowerCase().replace(/\s+/g, '_'),
    name: group.name,
    routes: group.items.map(item => ({
      title: item.title,
      path: item.path,
      icon: item.icon,
      active: item.path === route.path,
    })),
  }));
});

const handleNavigate = (path: string) => {
  router.push(path);
  if (window.innerWidth < 1025) {
    store.toggleSidebar();
  }
};

const toggleSidebar = () => {
  store.toggleSidebar();
};

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="sidebar transition-all duration-400 h-screen overflow-hidden bg-background border-r-[1px] fixed" :style="{ width:`${store.wrapperWidth}px`}">
    <div class="relative h-full flex flex-col justify-between">
      <div>
        <div class="h-[64px]">
          <div class="px-4 h-[64px] flex fixed z-10 items-center justify-between border-b-[1px]" :style="{ width: `${store.sidebarExpanded ? 280 : 64}px` }">
            <transition name="fade">
              <div v-show="store.sidebarExpanded" class="flex items-center">
                <img 
                  v-if="store.logoUrl !== '/favicon.ico'"
                  :src="store.logoUrl" 
                  :alt="store.supermarketName"
                  class="h-8 w-auto mr-3 object-contain"
                />
                <div v-else class="mr-3 flex items-center">
                  <Icon name="Boxes" />
                </div>
                <h2 class="text-xl font-semibold text-foreground">
                  {{ store.supermarketName }}
                </h2>
              </div>
            </transition>
            <Button
              variant="outline"
              class="p-[6px] w-8 h-8 transition-all duration-200"
              :class="store.sidebarExpanded ? 'bg-transparent' : 'dark:bg-white'"
              @click="toggleSidebar"
            >
              <ArrowLeftToLine class="transition-all duration-500" :class="!store.sidebarExpanded && 'rotate-180 text-black'" />
            </Button>
          </div>
        </div>
        <ScrollArea style="height: calc(100vh - 64px)">
          <!-- Menu principal unifié -->
          <div class="transition-all" :class="store.sidebarExpanded ? 'p-4' : 'p-2'">
            <ul class="space-y-1">
              <!-- Items des menus principaux -->
              <template v-for="menu in menus" :key="menu.key">
                <li v-for="child in menu.routes" :key="`${menu.key}-${child.path}`" class="flex items-center rounded-md">
                  <TooltipProvider :disable-hoverable-content="true">
                    <Tooltip :delay-duration="0">
                      <TooltipTrigger class="w-full">
                        <Toggle
                          class="w-full overflow-x-hidden justify-start duration-150"
                          :pressed="child.active"
                          @click="handleNavigate(child.path)"
                        >
                          <span class="flex items-center" :class="store.sidebarExpanded ? 'mr-4' : 'm-0'">
                            <Icon :name="child.icon" />
                          </span>
                          <transition name="fade" :duration="300">
                            <span v-show="store.sidebarExpand">{{ child.title }}</span>
                          </transition>
                        </Toggle>
                      </TooltipTrigger>
                      <template v-if="!store.sidebarExpanded">
                        <TooltipContent side="right">
                          <p class="text-sm">{{ child.title }}</p>
                        </TooltipContent>
                      </template>
                    </Tooltip>
                  </TooltipProvider>
                </li>
              </template>
              
              <!-- Séparateur -->
              <li class="py-2">
                <div class="border-t border-border"></div>
              </li>
              
              <!-- Déconnexion -->
              <li class="flex items-center rounded-md">
                <TooltipProvider :disable-hoverable-content="true">
                  <Tooltip :delay-duration="0">
                    <TooltipTrigger class="w-full">
                      <Toggle
                        class="w-full overflow-x-hidden justify-start duration-150"
                        @click="handleLogout"
                      >
                        <span class="flex items-center" :class="store.sidebarExpanded ? 'mr-4' : 'm-0'">
                          <Icon name="LogOut" />
                        </span>
                        <transition name="fade" :duration="300">
                          <span v-show="store.sidebarExpand">Déconnexion</span>
                        </transition>
                      </Toggle>
                    </TooltipTrigger>
                    <template v-if="!store.sidebarExpanded">
                      <TooltipContent side="right" class="bg-white">
                        <p class="text-sm">Déconnexion</p>
                      </TooltipContent>
                    </template>
                  </Tooltip>
                </TooltipProvider>
              </li>
            </ul>
          </div>
        </ScrollArea>
      </div>

      <div class="border-t-[1px] transition-all duration-400 py-4" :class="store.sidebarExpanded ? 'opacity-100' : 'opacity-0'">
        <p class="text-xs text-foreground/50 text-center">&copy; 2024 {{ store.supermarketName }}</p>
      </div>
    </div>
  </div>
</template>
