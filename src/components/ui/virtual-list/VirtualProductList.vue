<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Eye, Package } from 'lucide-vue-next'
import type { Product } from '@/types/product'
import { useAuthStore } from '@/stores/auth'
import { buildLogoUrl } from '@/config/api'
interface Props {
  products: Product[]
  loading?: boolean
}

interface Emits {
  edit: [product: Product]
  delete: [product: Product]
  details: [product: Product]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

const authStore = useAuthStore()

// Référence pour le conteneur de scroll
const parentRef = ref<HTMLElement>()

// Configuration du virtualiseur
const virtualizer = useVirtualizer(
  computed(() => ({
    count: props.products.length,
    getScrollElement: () => parentRef.value,
    estimateSize: () => 180, // Hauteur estimée d'une carte produit
    overscan: 5 // Nombre d'éléments à rendre en plus pour un scroll fluide
  }))
)

const formatPrice = (price: string) => {
  return `${parseFloat(price).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })} FCFA`
}

const getProductInitial = (name: string) => {
  return name.charAt(0).toUpperCase()
}
</script>

<template>
  <div
    ref="parentRef"
    class="h-[600px] overflow-auto"
    style="contain: strict;"
  >
    <div
      :style="{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }"
    >
      <div
        v-for="item in virtualizer.getVirtualItems()"
        :key="item.key"
        v-memo="[products[item.index]?.name, products[item.index]?.price, products[item.index]?.stock]"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${item.size}px`,
          transform: `translateY(${item.start}px)`,
        }"
      >
        <div class="p-2 h-full">
          <Card class="h-full">
            <CardHeader class="pb-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center"
                  >
                    <img
                      v-if="products[item.index].image"
                      class="w-full h-full object-cover"
                      :src="buildLogoUrl(products[item.index].image)"
                      :alt="products[item.index].name"
                    />
                    <span v-else>
    {{ getProductInitial(products[item.index].name) }}
  </span>
                  </div>
                  <div>
                    <CardTitle class="text-sm">{{ products[item.index].name }}</CardTitle>
                    <CardDescription class="text-xs">
                      Code: {{ products[item.index].code }}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" class="text-xs">
                  <Package class="w-3 h-3 mr-1" />
                  Stock: {{ products[item.index].stock }}
                </Badge>
              </div>
            </CardHeader>
            <CardContent class="pt-0">
              <div class="flex items-center justify-between mb-3">
                <div class="text-lg font-semibold" :style="{ color: authStore.primaryColor }">
                  {{ formatPrice(products[item.index].price) }}
                </div>
                <Badge v-if="authStore.userRole === 'super_admin'" variant="outline" class="text-xs">
                  {{ products[item.index].supermarket.name }}
                </Badge>
              </div>

              <div class="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  @click="emit('details', products[item.index])"
                  class="flex-1"
                >
                  <Eye class="w-3 h-3 mr-1" />
                  Détails
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  @click="emit('edit', products[item.index])"
                  class="flex-1"
                >
                  <Edit class="w-3 h-3 mr-1" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  @click="emit('delete', products[item.index])"
                  class="flex-1"
                >
                  <Trash2 class="w-3 h-3 mr-1" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loading" class="flex items-center justify-center h-full">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p class="text-sm text-muted-foreground">Chargement des produits...</p>
      </div>
    </div>

    <!-- État vide -->
    <div v-else-if="products.length === 0" class="flex items-center justify-center h-full">
      <div class="text-center">
        <Package class="w-12 h-12 text-muted-foreground mx-auto mb-2" />
        <p class="text-sm text-muted-foreground">Aucun produit trouvé</p>
      </div>
    </div>
  </div>
</template>