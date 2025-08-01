import { toast, type ExternalToast } from 'vue-sonner'

export interface ToastOptions extends ExternalToast {
  duration?: number
}

export const useToast = () => {
  const success = (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: 4000,
      ...options,
    })
  }

  const error = (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: 5000,
      ...options,
    })
  }

  const warning = (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      duration: 4500,
      ...options,
    })
  }

  const info = (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      duration: 4000,
      ...options,
    })
  }

  const loading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      duration: Infinity,
      ...options,
    })
  }

  const promise = <T>(
    promise: Promise<T>,
    messages: {
      loading?: string
      success?: string | ((data: T) => string)
      error?: string | ((error: any) => string)
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, {
      loading: messages.loading || 'Chargement...',
      success: messages.success || 'Succès !',
      error: messages.error || 'Une erreur est survenue',
      ...options,
    })
  }

  const dismiss = (id?: string | number) => {
    if (id) {
      toast.dismiss(id)
    } else {
      toast.dismiss()
    }
  }

  return {
    success,
    error,
    warning, 
    info,
    loading,
    promise,
    dismiss,
    toast: toast.message,
  }
}