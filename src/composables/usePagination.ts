import { ref, computed, watch } from 'vue'

export interface PaginationOptions {
  initialPage?: number
  pageSize?: number
  total?: number
  maxVisiblePages?: number
}

export function usePagination(options: PaginationOptions = {}) {
  const {
    initialPage = 1,
    pageSize = 10,
    total = 0,
    maxVisiblePages = 5
  } = options

  const currentPage = ref(initialPage)
  const itemsPerPage = ref(pageSize)
  const totalItems = ref(total)

  const totalPages = computed(() => 
    Math.ceil(totalItems.value / itemsPerPage.value) || 1
  )

  const startIndex = computed(() => 
    (currentPage.value - 1) * itemsPerPage.value
  )

  const endIndex = computed(() => 
    Math.min(startIndex.value + itemsPerPage.value, totalItems.value)
  )

  const hasNextPage = computed(() => 
    currentPage.value < totalPages.value
  )

  const hasPrevPage = computed(() => 
    currentPage.value > 1
  )

  const isFirstPage = computed(() => 
    currentPage.value === 1
  )

  const isLastPage = computed(() => 
    currentPage.value === totalPages.value
  )

  // Information sur les éléments affichés
  const paginationInfo = computed(() => {
    if (totalItems.value === 0) {
      return 'Aucun élément'
    }
    
    const start = startIndex.value + 1
    const end = endIndex.value
    
    return `${start}-${end} sur ${totalItems.value} éléments`
  })

  // Pagination des données
  const paginateData = <T>(data: T[]): T[] => {
    const start = startIndex.value
    const end = start + itemsPerPage.value
    return data.slice(start, end)
  }

  // Navigation
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  const nextPage = () => {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }

  const prevPage = () => {
    if (hasPrevPage.value) {
      currentPage.value--
    }
  }

  const firstPage = () => {
    currentPage.value = 1
  }

  const lastPage = () => {
    currentPage.value = totalPages.value
  }

  // Réinitialiser à la page 1 quand le total change
  watch(totalItems, () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = 1
    }
  })

  // Métadonnées de pagination pour les API
  const paginationParams = computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage.value,
    offset: startIndex.value
  }))

  return {
    // État
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage,
    maxVisiblePages: ref(maxVisiblePages),
    
    // Informations
    paginationInfo,
    paginationParams,
    
    // Méthodes
    paginateData,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage
  }
}

export type UsePaginationReturn = ReturnType<typeof usePagination>