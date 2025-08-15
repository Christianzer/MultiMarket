<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-vue-next'

interface PaginationProps {
  currentPage: number
  totalPages: number
  showFirstLast?: boolean
  showPrevNext?: boolean
  maxVisiblePages?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<PaginationProps>(), {
  showFirstLast: true,
  showPrevNext: true,
  maxVisiblePages: 5,
  disabled: false
})

const emit = defineEmits<{
  pageChange: [page: number]
}>()

const visiblePages = computed(() => {
  const pages: (number | 'ellipsis')[] = []
  const { currentPage, totalPages, maxVisiblePages } = props
  
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
  }

  const halfVisible = Math.floor(maxVisiblePages / 2)
  let start = Math.max(1, currentPage - halfVisible)
  let end = Math.min(totalPages, currentPage + halfVisible)

  if (currentPage <= halfVisible) {
    end = maxVisiblePages
  } else if (currentPage + halfVisible >= totalPages) {
    start = totalPages - maxVisiblePages + 1
  }

  if (start > 1) {
    pages.push(1)
    if (start > 2) {
      pages.push('ellipsis')
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push('ellipsis')
    }
    pages.push(totalPages)
  }

  return pages
})

const canGoPrev = computed(() => props.currentPage > 1)
const canGoNext = computed(() => props.currentPage < props.totalPages)

const goToPage = (page: number) => {
  if (!props.disabled && page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('pageChange', page)
  }
}

const goToFirst = () => goToPage(1)
const goToLast = () => goToPage(props.totalPages)
const goToPrev = () => goToPage(props.currentPage - 1)
const goToNext = () => goToPage(props.currentPage + 1)
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center gap-1">
    <!-- First page -->
    <Button
      v-if="showFirstLast"
      variant="outline"
      size="sm"
      class="w-10 h-10 p-0"
      :disabled="!canGoPrev || disabled"
      @click="goToFirst"
    >
      <ChevronsLeft class="h-4 w-4" />
    </Button>

    <!-- Previous page -->
    <Button
      v-if="showPrevNext"
      variant="outline"
      size="sm"
      class="w-10 h-10 p-0"
      :disabled="!canGoPrev || disabled"
      @click="goToPrev"
    >
      <ChevronLeft class="h-4 w-4" />
    </Button>

    <!-- Page numbers -->
    <template v-for="(page, index) in visiblePages" :key="index">
      <Button
        v-if="page === 'ellipsis'"
        variant="ghost"
        size="sm"
        class="w-10 h-10 p-0"
        disabled
      >
        <MoreHorizontal class="h-4 w-4" />
      </Button>
      <Button
        v-else
        :variant="page === currentPage ? 'default' : 'outline'"
        size="sm"
        class="w-10 h-10"
        :disabled="disabled"
        @click="goToPage(page)"
      >
        {{ page }}
      </Button>
    </template>

    <!-- Next page -->
    <Button
      v-if="showPrevNext"
      variant="outline"
      size="sm"
      class="w-10 h-10 p-0"
      :disabled="!canGoNext || disabled"
      @click="goToNext"
    >
      <ChevronRight class="h-4 w-4" />
    </Button>

    <!-- Last page -->
    <Button
      v-if="showFirstLast"
      variant="outline"
      size="sm"
      class="w-10 h-10 p-0"
      :disabled="!canGoNext || disabled"
      @click="goToLast"
    >
      <ChevronsRight class="h-4 w-4" />
    </Button>
  </div>
</template>