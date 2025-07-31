<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth'
import { Plus, Edit, Trash2, Eye, User, Loader2 } from 'lucide-vue-next'
import { api } from '@/services/api'
import type { User as UserType, CreateUserRequest, UpdateUserRequest, UserRole } from '@/types/user'
import type { Supermarket } from '@/types/supermarket'

const authStore = useAuthStore()

const users = ref<UserType[]>([])
const supermarkets = ref<Supermarket[]>([])
const loading = ref(false)
const error = ref('')

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsModal = ref(false)
const showDeleteModal = ref(false)
const selectedUser = ref<UserType | null>(null)

// Form data
const createForm = ref<CreateUserRequest>({  
  username: '',
  password: '',
  role: 'caissier'
})
const selectedSupermarketId = ref<string | undefined>()

const editForm = ref<UpdateUserRequest>({})
const editSelectedSupermarketId = ref<string | undefined>()
const submitting = ref(false)

// Fonction pour obtenir les rôles disponibles selon le rôle de l'utilisateur connecté
const getAvailableRoles = (): { value: UserRole; label: string }[] => {
  if (authStore.userRole === 'super_admin') {
    return [
      { value: 'super_admin', label: 'Super Admin' },
      { value: 'admin', label: 'Administrateur' },
      { value: 'caissier', label: 'Caissier' }
    ]
  } else if (authStore.userRole === 'admin') {
    return [
      { value: 'caissier', label: 'Caissier' }
    ]
  }
  return []
}

const loadUsers = async () => {
  try {
    loading.value = true
    const response = await api.users.getAll()
    users.value = (response.data as any[]) || []
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement des utilisateurs'
  } finally {
    loading.value = false
  }
}

const loadSupermarkets = async () => {
  try {
    const response = await api.supermarkets.getAll()
    supermarkets.value = (response.data as any[]) || []
  } catch (err: any) {
    console.error('Erreur lors du chargement des supermarchés:', err)
  }
}

// Filtrer les utilisateurs selon le rôle
const filteredUsers = ref<UserType[]>([])

const filterUsers = () => {
  if (authStore.userRole === 'super_admin') {
    filteredUsers.value = users.value
  } else if (authStore.userRole === 'admin') {
    filteredUsers.value = users.value.filter(user => 
      user.supermarket?.id === authStore.supermarket?.id
    )
  } else {
    filteredUsers.value = []
  }
}

const openCreateModal = () => {
  createForm.value = {
    username: '',
    password: '',
    role: 'caissier'
  }
  // Pour les admins, définir automatiquement leur supermarché
  if (authStore.userRole === 'admin' && authStore.supermarket) {
    selectedSupermarketId.value = authStore.supermarket.id.toString()
  } else {
    selectedSupermarketId.value = undefined
  }
  showCreateModal.value = true
}

const openEditModal = (user: UserType) => {
  selectedUser.value = user
  editForm.value = {
    username: user.username,
    password: '',
    role: user.role
  }
  editSelectedSupermarketId.value = user.supermarket?.id?.toString()
  showEditModal.value = true
}

const openDetailsModal = (user: UserType) => {
  selectedUser.value = user
  showDetailsModal.value = true
}

const openDeleteModal = (user: UserType) => {
  selectedUser.value = user
  showDeleteModal.value = true
}

const createUser = async () => {
  try {
    submitting.value = true
    
    // Préparer les données avec le bon format pour l'API
    const userData = {
      username: createForm.value.username,
      password: createForm.value.password,
      role: createForm.value.role,
      ...(selectedSupermarketId.value && {
        supermarket: `/api/supermarkets/${selectedSupermarketId.value}`
      })
    }
    
    await api.users.create(userData)
    await loadUsers()
    filterUsers()
    showCreateModal.value = false
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la création'
  } finally {
    submitting.value = false
  }
}

const updateUser = async () => {
  if (!selectedUser.value) return
  
  try {
    submitting.value = true
    
    // Préparer les données avec le bon format pour l'API
    const userData: any = {
      ...(editForm.value.username && { username: editForm.value.username }),
      ...(editForm.value.password && { password: editForm.value.password }),
      ...(editForm.value.role && { role: editForm.value.role }),
      ...(editSelectedSupermarketId.value && {
        supermarket: `/api/supermarkets/${editSelectedSupermarketId.value}`
      })
    }
    
    await api.users.update(selectedUser.value.id, userData)
    await loadUsers()
    filterUsers()
    showEditModal.value = false
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la modification'
  } finally {
    submitting.value = false
  }
}

const deleteUser = async () => {
  if (!selectedUser.value) return
  
  try {
    submitting.value = true
    await api.users.delete(selectedUser.value.id)
    
    // Fermer le modal immédiatement après la suppression réussie
    showDeleteModal.value = false
    selectedUser.value = null
    
    // Recharger et filtrer les données
    await loadUsers()
    filterUsers()
    
    // Effacer les erreurs précédentes
    error.value = ''
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la suppression'
  } finally {
    submitting.value = false
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

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'super_admin': return 'Super Admin'
    case 'admin': return 'Administrateur'
    case 'caissier': return 'Caissier'
    default: return role
  }
}

const getUserInitials = (username: string) => {
  return username.charAt(0).toUpperCase()
}

onMounted(async () => {
  await Promise.all([loadUsers(), loadSupermarkets()])
  filterUsers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Utilisateurs</h1>
        <p class="text-muted-foreground">
          <span v-if="authStore.userRole === 'super_admin'">
            Gérer tous les utilisateurs du système
          </span>
          <span v-else>
            Gérer les utilisateurs de {{ authStore.supermarket?.name }}
          </span>
        </p>
      </div>
      <Button @click="openCreateModal">
        <Plus class="mr-2 h-4 w-4" />
        Ajouter Utilisateur
      </Button>
    </div>

    <!-- Liste des utilisateurs -->
    <div class="grid gap-4">
      <Card v-for="user in filteredUsers" :key="user.id" class="hover:shadow-md transition-shadow">
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <!-- Informations utilisateur -->
            <div class="flex items-center space-x-4">
              <Avatar class="h-12 w-12">
                <AvatarFallback class="bg-primary text-primary-foreground">
                  {{ getUserInitials(user.username) }}
                </AvatarFallback>
              </Avatar>
              
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <h3 class="text-lg font-semibold">{{ user.username }}</h3>
                  <Badge :variant="getRoleBadgeVariant(user.role)">
                    {{ getRoleLabel(user.role) }}
                  </Badge>
                </div>
                
                
                <div class="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span v-if="user.supermarket">
                    {{ user.supermarket.name }} ({{ user.supermarket.code }})
                  </span>
                  <span v-else>Système Global</span>
                  <span>•</span>
                  <span>Créé le: {{ new Date(user.createdAt).toLocaleDateString() }}</span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex space-x-2">
              <Button variant="outline" size="sm" @click="openDetailsModal(user)">
                <Eye class="mr-1 h-3 w-3" />
                Voir
              </Button>
              <Button variant="outline" size="sm" @click="openEditModal(user)">
                <Edit class="mr-1 h-3 w-3" />
                Modifier
              </Button>
              <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" @click="openDeleteModal(user)">
                <Trash2 class="mr-1 h-3 w-3" />
                Supprimer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Statistiques -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Total Utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ filteredUsers.length }}</div>
          <p class="text-xs text-muted-foreground">
            <span v-if="authStore.userRole === 'super_admin'">Dans le système</span>
            <span v-else>Dans votre magasin</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Utilisateurs Actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ filteredUsers.length }}
          </div>
          <p class="text-xs text-muted-foreground">Actifs</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Administrateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ filteredUsers.filter(u => u.role === 'admin').length }}
          </div>
          <p class="text-xs text-muted-foreground">Rôle administrateur</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Caissiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ filteredUsers.filter(u => u.role === 'caissier').length }}
          </div>
          <p class="text-xs text-muted-foreground">Rôle caissier</p>
        </CardContent>
      </Card>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <Loader2 class="h-8 w-8 animate-spin" />
      <span class="ml-2">Chargement...</span>
    </div>

    <!-- Error message -->
    <div v-if="error" class="bg-destructive/15 text-destructive p-4 rounded-lg">
      {{ error }}
    </div>

    <!-- Create Modal -->
    <Dialog v-model:open="showCreateModal">
      <DialogContent class="sm:max-w-md" :disableOutsideClick="true">
        <DialogHeader>
          <DialogTitle>Créer un Utilisateur</DialogTitle>
          <DialogDescription>
            Ajouter un nouvel utilisateur au système
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="create-username">Nom d'utilisateur</Label>
            <Input id="create-username" v-model="createForm.username" placeholder="paul_carrefour" />
          </div>
          
          <div class="space-y-2">
            <Label for="create-password">Mot de passe</Label>
            <Input id="create-password" type="password" v-model="createForm.password" placeholder="caisse456" />
          </div>
          
          <div class="space-y-2">
            <Label for="create-role">Rôle</Label>
            <Select v-model="createForm.role">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="role in getAvailableRoles()" :key="role.value" :value="role.value">
                  {{ role.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2" v-if="createForm.role !== 'super_admin' && authStore.userRole === 'super_admin'">
            <Label for="create-supermarket">Supermarché</Label>
            <Select v-model="selectedSupermarketId">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un supermarché" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="supermarket in supermarkets" :key="supermarket.id" :value="supermarket.id.toString()">
                  {{ supermarket.name }} ({{ supermarket.code }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <!-- Affichage du supermarché pour les admins (non modifiable) -->
          <div class="space-y-2" v-if="authStore.userRole === 'admin' && authStore.supermarket">
            <Label>Supermarché</Label>
            <div class="p-2 bg-muted rounded-md text-sm">
              {{ authStore.supermarket.name }} ({{ authStore.supermarket.code }})
            </div>
          </div>
        </div>
        
        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showCreateModal = false" :disabled="submitting">
            Annuler
          </Button>
          <Button @click="createUser" :disabled="submitting">
            <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Modal -->
    <Dialog v-model:open="showEditModal">
      <DialogContent class="sm:max-w-md" :disableOutsideClick="true">
        <DialogHeader>
          <DialogTitle>Modifier l'Utilisateur</DialogTitle>
          <DialogDescription>
            Modifier les informations de l'utilisateur
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4" v-if="selectedUser">
          <div class="space-y-2">
            <Label for="edit-username">Nom d'utilisateur</Label>
            <Input id="edit-username" v-model="editForm.username" />
          </div>
          
          <div class="space-y-2">
            <Label for="edit-password">Nouveau mot de passe (optionnel)</Label>
            <Input id="edit-password" type="password" v-model="editForm.password" placeholder="Laisser vide pour ne pas changer" />
          </div>
          
          <div class="space-y-2">
            <Label for="edit-role">Rôle</Label>
            <Select v-model="editForm.role">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="role in getAvailableRoles()" :key="role.value" :value="role.value">
                  {{ role.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2" v-if="editForm.role !== 'super_admin' && authStore.userRole === 'super_admin'">
            <Label for="edit-supermarket">Supermarché</Label>
            <Select v-model="editSelectedSupermarketId">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un supermarché" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="supermarket in supermarkets" :key="supermarket.id" :value="supermarket.id.toString()">
                  {{ supermarket.name }} ({{ supermarket.code }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <!-- Affichage du supermarché pour les admins (non modifiable) -->
          <div class="space-y-2" v-if="authStore.userRole === 'admin' && selectedUser && selectedUser.supermarket">
            <Label>Supermarché</Label>
            <div class="p-2 bg-muted rounded-md text-sm">
              {{ selectedUser.supermarket.name }} ({{ selectedUser.supermarket.code }})
            </div>
          </div>
        </div>
        
        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showEditModal = false" :disabled="submitting">
            Annuler
          </Button>
          <Button @click="updateUser" :disabled="submitting">
            <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
            Modifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Details Modal -->
    <Dialog v-model:open="showDetailsModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Détails de l'Utilisateur</DialogTitle>
        </DialogHeader>
        
        <div class="space-y-4 py-4" v-if="selectedUser">
          <div class="flex items-center space-x-4">
            <Avatar class="h-16 w-16">
              <AvatarFallback class="bg-primary text-primary-foreground text-lg">
                {{ getUserInitials(selectedUser.username) }}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 class="text-lg font-semibold">{{ selectedUser.username }}</h3>
              <Badge :variant="getRoleBadgeVariant(selectedUser.role)">
                {{ getRoleLabel(selectedUser.role) }}
              </Badge>
            </div>
          </div>
          
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">ID:</span>
              <span class="text-sm font-medium">{{ selectedUser.id }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Supermarché:</span>
              <span class="text-sm font-medium">
                <span v-if="selectedUser.supermarket">
                  {{ selectedUser.supermarket.name }} ({{ selectedUser.supermarket.code }})
                </span>
                <span v-else>Système Global</span>
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Créé le:</span>
              <span class="text-sm font-medium">{{ new Date(selectedUser.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button @click="showDetailsModal = false">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Modal -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer l'Utilisateur</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        
        <div class="py-4" v-if="selectedUser">
          <div class="flex items-center space-x-3 p-3 bg-muted rounded-lg">
            <Avatar class="h-10 w-10">
              <AvatarFallback class="bg-primary text-primary-foreground">
                {{ getUserInitials(selectedUser.username) }}
              </AvatarFallback>
            </Avatar>
            <div>
              <p class="font-medium">{{ selectedUser.username }}</p>
              <p class="text-sm text-muted-foreground">{{ getRoleLabel(selectedUser.role) }}</p>
            </div>
          </div>
        </div>
        
        <DialogFooter class="gap-2">
          <Button variant="outline" @click="showDeleteModal = false" :disabled="submitting">
            Annuler
          </Button>
          <Button variant="destructive" @click="deleteUser" :disabled="submitting">
            <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>