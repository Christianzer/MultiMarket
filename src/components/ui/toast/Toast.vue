<template>
  <Toaster
    :theme="theme"
    :position="position"
    :expand="expand"
    :rich-colors="richColors"
    :close-button="closeButton"
    :duration="duration"
    :gap="gap"
    :offset="offset"
    :toast-with-same-id="toastWithSameId"
    :class="cn('sonner-toaster', className)"
  />
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'
import { Toaster } from 'vue-sonner'
import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'

interface ToastProps {
  theme?: 'light' | 'dark' | 'system'
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  expand?: boolean
  richColors?: boolean
  closeButton?: boolean
  duration?: number
  gap?: number
  offset?: string | number
  toastWithSameId?: boolean
  className?: string
}

const props = withDefaults(defineProps<ToastProps>(), {
  theme: 'system',
  position: 'bottom-right',
  expand: false,
  richColors: true,
  closeButton: false,
  duration: 4000,
  gap: 14,
  offset: 32,
  toastWithSameId: true,
  className: ''
})

const appStore = useAppStore()

const theme = computed(() => {
  if (props.theme === 'system') {
    return appStore.theme === 'dark' ? 'dark' : 'light'
  }
  return props.theme
})

const { 
  position, 
  expand, 
  richColors, 
  closeButton, 
  duration, 
  gap, 
  offset, 
  toastWithSameId, 
  className 
} = toRefs(props)
</script>

<style>
/* Styles personnalisés pour les toasts compatibles avec votre thème */
:root {
  --sonner-normal-bg: hsl(var(--background));
  --sonner-normal-border: hsl(var(--border));
  --sonner-normal-text: hsl(var(--foreground));
  
  --sonner-success-bg: hsl(var(--background));
  --sonner-success-border: hsl(142.1 76.2% 36.3%);
  --sonner-success-text: hsl(142.1 76.2% 36.3%);
  
  --sonner-error-bg: hsl(var(--background));
  --sonner-error-border: hsl(var(--destructive));
  --sonner-error-text: hsl(var(--destructive));
  
  --sonner-warning-bg: hsl(var(--background));
  --sonner-warning-border: hsl(47.9 95.8% 53.1%);
  --sonner-warning-text: hsl(47.9 95.8% 53.1%);
  
  --sonner-info-bg: hsl(var(--background));
  --sonner-info-border: hsl(var(--primary));
  --sonner-info-text: hsl(var(--primary));
}

.dark {
  --sonner-normal-bg: hsl(var(--background));
  --sonner-normal-border: hsl(var(--border));
  --sonner-normal-text: hsl(var(--foreground));
  
  --sonner-success-bg: hsl(var(--background));
  --sonner-success-border: hsl(142.1 70.6% 45.3%);
  --sonner-success-text: hsl(142.1 70.6% 45.3%);
  
  --sonner-error-bg: hsl(var(--background));
  --sonner-error-border: hsl(var(--destructive));
  --sonner-error-text: hsl(var(--destructive));
  
  --sonner-warning-bg: hsl(var(--background));
  --sonner-warning-border: hsl(47.9 95.8% 53.1%);
  --sonner-warning-text: hsl(47.9 95.8% 53.1%);
  
  --sonner-info-bg: hsl(var(--background));
  --sonner-info-border: hsl(var(--primary));
  --sonner-info-text: hsl(var(--primary));
}

[data-sonner-toaster] {
  --width: 356px;
  --border-radius: calc(var(--radius) - 2px);
}

[data-sonner-toast] {
  --y: translateY(0);
  --lift-amount: calc(var(--lift) * var(--gap));
  --window-width: 100vw;
  --width: var(--width);
  --window-height: 100vh;
  --front-z-index: 1000;
  --normal-bg: var(--sonner-normal-bg);
  --normal-border: var(--sonner-normal-border);
  --normal-text: var(--sonner-normal-text);
  --success-bg: var(--sonner-success-bg);
  --success-border: var(--sonner-success-border);
  --success-text: var(--sonner-success-text);
  --info-bg: var(--sonner-info-bg);
  --info-border: var(--sonner-info-border);
  --info-text: var(--sonner-info-text);
  --warning-bg: var(--sonner-warning-bg);
  --warning-border: var(--sonner-warning-border);
  --warning-text: var(--sonner-warning-text);
  --error-bg: var(--sonner-error-bg);
  --error-border: var(--sonner-error-border);
  --error-text: var(--sonner-error-text);
  --border-radius: var(--border-radius);
  --boxShadow: 0 4px 12px rgb(0 0 0 / 0.15);
  --lift: 0;
  --gap: 14px;
  
  border: 1px solid var(--normal-border);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
}

[data-sonner-toast][data-styled=true] {
  padding: 16px;
  border-radius: var(--border-radius);
  box-shadow: var(--boxShadow);
  width: var(--width);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

[data-sonner-toast]:focus-visible {
  box-shadow: var(--boxShadow), 0px 0px 0px 2px hsl(var(--ring));
}

[data-sonner-toast][data-y-position=top] {
  top: var(--offset);
  border-bottom-left-radius: var(--border-radius);
  border-bottom-right-radius: var(--border-radius);
}

[data-sonner-toast][data-y-position=bottom] {
  bottom: var(--offset);
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
}

[data-sonner-toast] [data-icon] {
  display: flex;
  height: 16px;
  width: 16px;
  position: relative;
  justify-content: flex-start;
  align-items: center;
  flex-shrink: 0;
  margin-left: 0;
  margin-right: 4px;
}

[data-sonner-toast][data-type=success] [data-icon],
[data-sonner-toast][data-type=success] [data-content] {
  color: var(--success-text);
}

[data-sonner-toast][data-type=info] [data-icon],
[data-sonner-toast][data-type=info] [data-content] {
  color: var(--info-text);
}

[data-sonner-toast][data-type=warning] [data-icon],
[data-sonner-toast][data-type=warning] [data-content] {
  color: var(--warning-text);
}

[data-sonner-toast][data-type=error] [data-icon],
[data-sonner-toast][data-type=error] [data-content] {
  color: var(--error-text);
}

[data-sonner-toast][data-type=success] {
  border-color: var(--success-border);
}

[data-sonner-toast][data-type=info] {
  border-color: var(--info-border);
}

[data-sonner-toast][data-type=warning] {
  border-color: var(--warning-border);
}

[data-sonner-toast][data-type=error] {
  border-color: var(--error-border);
}
</style>