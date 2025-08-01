<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'
import { User, Settings, Loader2, CheckCircle } from 'lucide-vue-next'
import { api } from '@/services/api'

const authStore = useAuthStore()

const loading = ref(false)
const success = ref(false)
const error = ref('')

// Form data pour la modification du profil
const profileForm = ref({
  username: '',
  password: '',
  confirmPassword: ''
})

const submitting = ref(false)

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'super_admin': return 'Super Admin'
    case 'admin': return 'Administrateur'
    case 'caissier': return 'Caissier'
    default: return role
  }
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'super_admin': return 'destructive'
    case 'admin': return 'default'
    case 'caissier': return 'secondary'
    default: return 'outline'
  }
}

const getUserInitials = (username: string) => {
  return username.charAt(0).toUpperCase()
}

const updateProfile = async () => {
  // Validation
  if (!profileForm.value.username.trim()) {
    error.value = 'Le nom d\'utilisateur est requis'
    return
  }

  if (profileForm.value.password && profileForm.value.password !== profileForm.value.confirmPassword) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }

  if (profileForm.value.password && profileForm.value.password.length < 6) {
    error.value = 'Le mot de passe doit contenir au moins 6 caractères'
    return
  }

  try {
    submitting.value = true
    error.value = ''
    
    // Préparer les données pour l'API
    const updateData: any = {
      username: profileForm.value.username
    }

    // Ajouter le mot de passe seulement s'il est fourni
    if (profileForm.value.password) {
      updateData.password = profileForm.value.password
    }

    if (!authStore.currentUser?.id) {
      error.value = 'Utilisateur non trouvé'
      return
    }

    await api.users.update(authStore.currentUser.id, updateData)
    
    // Mettre à jour l'utilisateur dans le store
    if (authStore.currentUser) {
      const updatedUser = {
        ...authStore.currentUser,
        username: profileForm.value.username
      }
      authStore.updateUser(updatedUser)
    }
    
    // Réinitialiser les champs de mot de passe
    profileForm.value.password = ''
    profileForm.value.confirmPassword = ''
    
    success.value = true
    setTimeout(() => { success.value = false }, 3000)
    
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la mise à jour du profil'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (authStore.currentUser) {
    profileForm.value.username = authStore.currentUser.username
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Mon Profil</h1>
        <p class="text-muted-foreground">
          Modifiez vos informations personnelles
        </p>
      </div>
    </div>

    <div class="grid gap-6 md:grid-cols-3">
      <!-- Informations actuelles -->
      <Card class="md:col-span-1">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <User class="h-5 w-5" />
            Informations actuelles
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center space-x-4">
            <Avatar class="h-16 w-16">
              <AvatarFallback class="bg-primary text-primary-foreground text-lg">
                {{ getUserInitials(authStore.currentUser?.username || '') }}
              </AvatarFallback>
            </Avatar>
            <div>
              <p class="text-lg font-semibold">{{ authStore.currentUser?.username }}</p>
              <Badge :variant="getRoleBadgeVariant(authStore.currentUser?.role || '')">
                {{ getRoleLabel(authStore.currentUser?.role || '') }}
              </Badge>
            </div>
          </div>
          
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">ID:</span>
              <span class="text-sm font-medium">{{ authStore.currentUser?.id }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Supermarché:</span>
              <span class="text-sm font-medium">
                <span v-if="authStore.currentUser?.supermarket">
                  {{ authStore.currentUser.supermarket.name }}
                </span>
                <span v-else>Système Global</span>
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Créé le:</span>
              <span class="text-sm font-medium">
                {{ authStore.currentUser?.createdAt ? new Date(authStore.currentUser.createdAt).toLocaleDateString() : 'N/A' }}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Formulaire de modification -->
      <Card class="md:col-span-2">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Settings class="h-5 w-5" />
            Modifier mes informations
          </CardTitle>
          <CardDescription>
            Vous pouvez modifier votre nom d'utilisateur et votre mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Message de succès -->
          <div v-if="success" class="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircle class="h-4 w-4" />
            <span>Profil mis à jour avec succès!</span>
          </div>

          <!-- Message d'erreur -->
          <div v-if="error" class="bg-destructive/15 text-destructive p-4 rounded-lg">
            {{ error }}
          </div>

          <form @submit.prevent="updateProfile" class="space-y-4">
            <div class="space-y-2">
              <Label for="username">Nom d'utilisateur</Label>
              <Input 
                id="username" 
                v-model="profileForm.username" 
                placeholder="Votre nom d'utilisateur"
                :disabled="submitting"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="password">Nouveau mot de passe (optionnel)</Label>
              <Input 
                id="password" 
                type="password" 
                v-model="profileForm.password" 
                placeholder="Laisser vide pour ne pas changer"
                :disabled="submitting"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="confirm-password">Confirmer le nouveau mot de passe</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                v-model="profileForm.confirmPassword" 
                placeholder="Confirmer le nouveau mot de passe"
                :disabled="submitting"
              />
            </div>

            <div class="flex justify-end">
              <Button type="submit" :disabled="submitting">
                <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
                Mettre à jour
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>