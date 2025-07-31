<script setup lang="ts">
import { useRouter } from 'vue-router';
import { buildLogoUrl } from '@/config/api';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LogOut,
  User,
  Sun,
  MoonStar,
  Menu,
  Settings,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const store = useAppStore();
const authStore = useAuthStore();

const toggleMode = () => {
  store.toggleTheme();
};

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

const getUserInitials = (username: string) => {
  return username.charAt(0).toUpperCase();
};
</script>

<template>
  <nav class="flex items-center justify-end h-[64px] border-b-[1px] px-4 fixed z-40 top-0 bg-background/80 backdrop-blur-lg border-b border-border" :style="{ width: store.navWidth }">
    <Button
      variant="outline"
      class="p-[6px] w-8 h-8 transition-all duration-200 block lg:hidden mr-auto"
      :class="store.sidebarExpanded ? 'bg-transparent' : 'dark:bg-white'"
      @click="store.toggleSidebar()"
    >
      <Menu class="transition-all duration-500 text-black" />
    </Button>
    <div class="flex items-center">
      <Button variant="outline" class="border-0 p-[6px] w-8 h-8" @click="toggleMode">
        <Sun v-if="store.isDark" />
        <MoonStar v-else />
      </Button>
      <div class="border-x-[1px] border-gray-300 h-[24px] w-[1px] mx-2"></div>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="border-0 flex items-center max-w-[200px] w-full justify-start">
            <Avatar class="h-8 w-8">
              <AvatarImage :src="buildLogoUrl(authStore.supermarket?.logo || '') || '/favicon.ico'" v-if="authStore.supermarket?.logo" />
              <AvatarFallback 
                :style="{ backgroundColor: store.primaryColor, color: 'white' }"
                v-if="authStore.currentUser"
              >
                {{ getUserInitials(authStore.currentUser.username) }}
              </AvatarFallback>
            </Avatar>
            <span class="ml-2 hidden md:flex justify-start flex-col items-start" v-if="authStore.currentUser">
              <p class="mb-0 text-sm font-medium">{{ authStore.currentUser.username }}</p>
              <small class="text-xs text-muted-foreground font-light">
                {{ authStore.currentUser.role }} 
                <span v-if="authStore.supermarket">- {{ authStore.supermarket.name }}</span>
              </small>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56 relative mr-4">
          <DropdownMenuLabel v-if="authStore.currentUser">
            {{ authStore.currentUser.username }}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="router.push('/dashboard/user')">
            <User class="mr-2 h-4 w-4" />
            <span>Profil</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="router.push('/dashboard/settings')">
            <Settings class="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout" class="text-destructive focus:text-destructive">
            <LogOut class="mr-2 h-4 w-4" />
            <span>Se déconnecter</span>
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </nav>
</template>
