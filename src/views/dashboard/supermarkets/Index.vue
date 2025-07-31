<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { buildLogoUrl } from '@/config/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Eye, Loader2, Upload } from 'lucide-vue-next'
import { api } from '@/services/api'
import type { Supermarket, CreateSupermarketRequest, UpdateSupermarketRequest } from '@/types/supermarket'

const supermarkets = ref<Supermarket[]>([])
const loading = ref(false)
const error = ref('')

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsModal = ref(false)
const showDeleteModal = ref(false)
const selectedSupermarket = ref<Supermarket | null>(null)

// Form data
const createForm = ref<CreateSupermarketRequest>({
  name: '',
  code: '',
  address: '',
  phone: '',
  primaryColor: '#228B22',
  secondaryColor: '#FFD700'
})

const editForm = ref<UpdateSupermarketRequest>({
  name: '',
  address: '',
  phone: '',
  primaryColor: '#228B22',
  secondaryColor: '#FFD700'
})

const logoFile = ref<File | null>(null)
const logoPreview = ref<string | null>(null)
const submitting = ref(false)

const loadSupermarkets = async () => {
  try {
    loading.value = true
    const response = await api.supermarkets.getAll()
    console.log('Supermarkets loaded:', response)
    supermarkets.value = response
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement des supermarchés'
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  createForm.value = {
    name: '',
    code: '',
    address: '',
    phone: '',
    primaryColor: '#228B22',
    secondaryColor: '#FFD700'
  }
  logoFile.value = null
  logoPreview.value = null
  showCreateModal.value = true
}

const openEditModal = (supermarket: Supermarket) => {
  selectedSupermarket.value = supermarket
  editForm.value = {
    name: supermarket.name,
    address: supermarket.address,
    phone: supermarket.phone,
    primaryColor: supermarket.primaryColor,
    secondaryColor: supermarket.secondaryColor
  }
  logoFile.value = null
  logoPreview.value = null
  showEditModal.value = true
}

const openDetailsModal = (supermarket: Supermarket) => {
  selectedSupermarket.value = supermarket
  showDetailsModal.value = true
}

const openDeleteModal = (supermarket: Supermarket) => {
  selectedSupermarket.value = supermarket
  showDeleteModal.value = true
}

const handleLogoUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    logoFile.value = file
    // Créer une prévisualisation
    const reader = new FileReader()
    reader.onload = (e) => {
      logoPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const createSupermarket = async () => {
  try {
    submitting.value = true
    const response = await api.supermarkets.create(createForm.value)

    console.log('Supermarket created:', response)
    
    // Upload logo if provided
    if (logoFile.value && response.id) {
      console.log("Fichier logo :", logoFile.value)
      await api.supermarkets.uploadLogo(response.id, logoFile.value)
    }
    
    await loadSupermarkets()
    showCreateModal.value = false
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la création'
  } finally {
    submitting.value = false
  }
}

const updateSupermarket = async () => {
  if (!selectedSupermarket.value) return
  
  try {
    submitting.value = true
    await api.supermarkets.update(selectedSupermarket.value.id, editForm.value)
    
    // Upload logo if provided
    if (logoFile.value) {
      await api.supermarkets.uploadLogo(selectedSupermarket.value.id, logoFile.value)
    }
    
    await loadSupermarkets()
    showEditModal.value = false
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la modification'
  } finally {
    submitting.value = false
  }
}

const deleteSupermarket = async () => {
  if (!selectedSupermarket.value) return
  
  try {
    submitting.value = true
    await api.supermarkets.delete(selectedSupermarket.value.id)
    await loadSupermarkets()
    showDeleteModal.value = false
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la suppression'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadSupermarkets()
})
</script>

<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">SuperMarchés</h1>
        <p class="text-muted-foreground">
          Gérer tous les supermarchés du système
        </p>
      </div>
      <Button @click="openCreateModal">
        <Plus class="mr-2 h-4 w-4" />
        Ajouter SuperMarché
      </Button>
    </div>

    

    <!-- Statistiques -->
    <div class="grid gap-4 md:grid-cols-3" v-if="!loading">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Total SuperMarchés</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ supermarkets.length }}</div>
          <p class="text-xs text-muted-foreground">Enregistrés dans le système</p>
        </CardContent>
      </Card>
    </div>

    <!-- Liste des supermarchés -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="supermarket in supermarkets" :key="supermarket.id" class="hover:shadow-lg transition-shadow">
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <img 
                :src="buildLogoUrl(supermarket.logo)" 
                :alt="supermarket.name"
                class="h-12 w-12 object-contain rounded-lg border bg-gray-50"
              />
              <div>
                <CardTitle class="text-lg">{{ supermarket.name }}</CardTitle>
                <CardDescription>{{ supermarket.code }}</CardDescription>
              </div>
            </div>
            <Badge :variant="supermarket.status === 'Actif' ? 'default' : 'secondary'">
              {{ supermarket.status }}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent class="space-y-4">
          <!-- Informations -->
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Adresse:</span>
              <span class="font-medium">{{ supermarket.address }}</span>
            </div>
          </div>

          <!-- Couleurs de marque -->
          <div class="flex items-center space-x-2">
            <span class="text-sm text-muted-foreground">Couleurs:</span>
            <div 
              class="w-4 h-4 rounded-full border" 
              :style="{ backgroundColor: supermarket.primaryColor }"
            ></div>
            <div 
              class="w-4 h-4 rounded-full border" 
              :style="{ backgroundColor: supermarket.secondaryColor }"
            ></div>
          </div>

          <!-- Actions -->
          <div class="flex space-x-2 pt-2">
            <Button variant="outline" size="sm" @click="openDetailsModal(supermarket)">
              <Eye class="mr-1 h-3 w-3" />
              Voir
            </Button>
            <Button variant="outline" size="sm" @click="openEditModal(supermarket)">
              <Edit class="mr-1 h-3 w-3" />
              Modifier
            </Button>
            <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" @click="openDeleteModal(supermarket)">
              <Trash2 class="mr-1 h-3 w-3" />
              Supprimer
            </Button>
          </div>
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
      <DialogContent class="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col" :disableOutsideClick="true">
        <DialogHeader>
          <DialogTitle>Créer un SuperMarché</DialogTitle>
          <DialogDescription>
            Ajouter un nouveau supermarché au système
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4 px-1 overflow-y-auto flex-1">
          <div class="space-y-2">
            <Label for="create-name">Nom</Label>
            <Input id="create-name" v-model="createForm.name" placeholder="Casino Marcory" />
          </div>
          
          <div class="space-y-2">
            <Label for="create-code">Code</Label>
            <Input id="create-code" v-model="createForm.code" placeholder="CAS_MAR" />
          </div>
          
          <div class="space-y-2">
            <Label for="create-address">Adresse</Label>
            <Textarea id="create-address" v-model="createForm.address" placeholder="Rue du Commerce, Marcory" />
          </div>
          
          <div class="space-y-2">
            <Label for="create-phone">Téléphone</Label>
            <Input id="create-phone" v-model="createForm.phone" placeholder="+225 27 20 15 25 35" />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="create-primary">Couleur Primaire</Label>
              <Input id="create-primary" type="color" v-model="createForm.primaryColor" />
            </div>
            <div class="space-y-2">
              <Label for="create-secondary">Couleur Secondaire</Label>
              <Input id="create-secondary" type="color" v-model="createForm.secondaryColor" />
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="create-logo">Logo</Label>
            <Input id="create-logo" type="file" accept="image/*" @change="handleLogoUpload" />
            <div v-if="logoPreview" class="mt-2">
              <img :src="logoPreview" alt="Prévisualisation" class="h-16 w-16 object-contain rounded-lg border bg-gray-50" />
            </div>
          </div>
        </div>
        
        <DialogFooter class="flex-shrink-0 gap-2 pt-4">
          <Button variant="outline" @click="showCreateModal = false" :disabled="submitting">
            Annuler
          </Button>
          <Button @click="createSupermarket" :disabled="submitting">
            <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Modal -->
    <Dialog v-model:open="showEditModal">
      <DialogContent class="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col" :disableOutsideClick="true">
        <DialogHeader>
          <DialogTitle>Modifier le SuperMarché</DialogTitle>
          <DialogDescription>
            Modifier les informations du supermarché
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4 px-1 overflow-y-auto flex-1" v-if="selectedSupermarket">
          <div class="space-y-2">
            <Label for="edit-name">Nom</Label>
            <Input id="edit-name" v-model="editForm.name" />
          </div>
          
          <div class="space-y-2">
            <Label for="edit-address">Adresse</Label>
            <Textarea id="edit-address" v-model="editForm.address" />
          </div>
          
          <div class="space-y-2">
            <Label for="edit-phone">Téléphone</Label>
            <Input id="edit-phone" v-model="editForm.phone" />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="edit-primary">Couleur Primaire</Label>
              <Input id="edit-primary" type="color" v-model="editForm.primaryColor" />
            </div>
            <div class="space-y-2">
              <Label for="edit-secondary">Couleur Secondaire</Label>
              <Input id="edit-secondary" type="color" v-model="editForm.secondaryColor" />
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="edit-logo">Nouveau Logo (optionnel)</Label>
            <Input id="edit-logo" type="file" accept="image/*" @change="handleLogoUpload" />
            <div class="flex items-center space-x-4 mt-2">
              <div v-if="selectedSupermarket.logo" class="text-center">
                <p class="text-xs text-muted-foreground mb-1">Logo actuel</p>
                <img :src="buildLogoUrl(selectedSupermarket.logo)" :alt="selectedSupermarket.name" class="h-16 w-16 object-contain rounded-lg border bg-gray-50" />
              </div>
              <div v-if="logoPreview" class="text-center">
                <p class="text-xs text-muted-foreground mb-1">Nouveau logo</p>
                <img :src="logoPreview" alt="Prévisualisation" class="h-16 w-16 object-contain rounded-lg border bg-gray-50" />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter class="flex-shrink-0 gap-2 pt-4">
          <Button variant="outline" @click="showEditModal = false" :disabled="submitting">
            Annuler
          </Button>
          <Button @click="updateSupermarket" :disabled="submitting">
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
          <DialogTitle>Détails du SuperMarché</DialogTitle>
        </DialogHeader>
        
        <div class="space-y-4 py-4" v-if="selectedSupermarket">
          <div class="flex items-center space-x-4">
            <img 
              :src="buildLogoUrl(selectedSupermarket.logo)" 
              :alt="selectedSupermarket.name"
              class="h-16 w-16 object-contain rounded-lg border bg-gray-50"
          
            />
            <div>
              <h3 class="text-lg font-semibold">{{ selectedSupermarket.name }}</h3>
              <p class="text-sm text-muted-foreground">{{ selectedSupermarket.code }}</p>
              <Badge :variant="selectedSupermarket.active ? 'default' : 'secondary'">
                {{ selectedSupermarket.active ? 'Actif' : 'Inactif' }}
              </Badge>
            </div>
          </div>
          
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Adresse:</span>
              <span class="text-sm font-medium">{{ selectedSupermarket.address }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Téléphone:</span>
              <span class="text-sm font-medium">{{ selectedSupermarket.phone }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Créé le:</span>
              <span class="text-sm font-medium">{{ new Date(selectedSupermarket.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <span class="text-sm text-muted-foreground">Couleurs:</span>
            <div 
              class="w-6 h-6 rounded-full border" 
              :style="{ backgroundColor: selectedSupermarket.primaryColor }"
            ></div>
            <div 
              class="w-6 h-6 rounded-full border" 
              :style="{ backgroundColor: selectedSupermarket.secondaryColor }"
            ></div>
          </div>
        </div>
        
        <DialogFooter class="pt-4">
          <Button @click="showDetailsModal = false">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Modal -->
    <Dialog v-model:open="showDeleteModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer le SuperMarché</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer ce supermarché ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        
        <div class="py-4" v-if="selectedSupermarket">
          <div class="flex items-center space-x-3 p-3 bg-muted rounded-lg">
            <img 
              :src="buildLogoUrl(selectedSupermarket.logo)" 
              :alt="selectedSupermarket.name"
              class="h-10 w-10 object-contain rounded bg-gray-50"
            />
            <div>
              <p class="font-medium">{{ selectedSupermarket.name }}</p>
              <p class="text-sm text-muted-foreground">{{ selectedSupermarket.code }}</p>
            </div>
          </div>
        </div>
        
        <DialogFooter class="gap-2 pt-4">
          <Button variant="outline" @click="showDeleteModal = false" :disabled="submitting">
            Annuler
          </Button>
          <Button variant="destructive" @click="deleteSupermarket" :disabled="submitting">
            <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>