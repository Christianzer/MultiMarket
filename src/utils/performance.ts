// Utilitaires de monitoring des performances

interface PerformanceMetrics {
  name: string
  startTime: number
  endTime?: number
  duration?: number
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private enabled: boolean = import.meta.env.DEV

  // Démarrer la mesure d'une opération
  start(name: string): void {
    if (!this.enabled) return
    
    this.metrics.set(name, {
      name,
      startTime: performance.now()
    })
  }

  // Terminer la mesure d'une opération
  end(name: string): number | undefined {
    if (!this.enabled) return
    
    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`Aucune métrique trouvée pour: ${name}`)
      return
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    metric.endTime = endTime
    metric.duration = duration

    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    return duration
  }

  // Mesurer une fonction async
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name)
    try {
      const result = await fn()
      this.end(name)
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }

  // Obtenir toutes les métriques
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined)
  }

  // Nettoyer les métriques
  clear(): void {
    this.metrics.clear()
  }

  // Activer/désactiver le monitoring
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}

// Instance globale
export const performanceMonitor = new PerformanceMonitor()

// Hook pour mesurer les opérations dans les composants Vue
export function usePerformanceMonitor() {
  return {
    measure: performanceMonitor.measure.bind(performanceMonitor),
    start: performanceMonitor.start.bind(performanceMonitor),
    end: performanceMonitor.end.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    clear: performanceMonitor.clear.bind(performanceMonitor)
  }
}

// Surveiller les métriques de performance natives
export function initWebVitals() {
  if (typeof window === 'undefined') return

  try {
    // Utiliser les APIs natives de performance
    const reportMetric = (name: string, value: number, unit = 'ms') => {
      console.log(`📊 ${name}: ${value.toFixed(2)}${unit}`)
    }

    // Observer les métriques de peinture
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            reportMetric(entry.name, entry.startTime)
          })
        })
        paintObserver.observe({ entryTypes: ['paint'] })

        // Observer les métriques de navigation
        const navObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.entryType === 'navigation') {
              reportMetric('DOM Content Loaded', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart)
              reportMetric('Load Complete', entry.loadEventEnd - entry.loadEventStart)
              reportMetric('DNS Lookup', entry.domainLookupEnd - entry.domainLookupStart)
            }
          })
        })
        navObserver.observe({ entryTypes: ['navigation'] })

      } catch (error) {
        console.warn('Performance Observer not fully supported:', error)
      }
    }

    // Métriques de mémoire si disponibles
    if ((performance as any).memory) {
      const memory = (performance as any).memory
      reportMetric('JS Heap Used', memory.usedJSHeapSize / 1024 / 1024, 'MB')
      reportMetric('JS Heap Total', memory.totalJSHeapSize / 1024 / 1024, 'MB')
      reportMetric('JS Heap Limit', memory.jsHeapSizeLimit / 1024 / 1024, 'MB')
    }

    console.info('✅ Performance monitoring initialized with native APIs')
    
  } catch (error) {
    console.warn('Performance monitoring initialization failed:', error)
  }
}

// Mesurer le temps de chargement des routes
export function measureRouteLoad(routeName: string) {
  const startTime = performance.now()
  
  return () => {
    const duration = performance.now() - startTime
    console.log(`🛣️ Route ${routeName}: ${duration.toFixed(2)}ms`)
  }
}

// Debounced performance logger pour les fonctions appelées fréquemment
export function createPerformanceLogger(name: string, delay = 1000) {
  let timeoutId: number | null = null
  let measurements: number[] = []

  return () => {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      measurements.push(duration)

      if (timeoutId) clearTimeout(timeoutId)
      
      timeoutId = window.setTimeout(() => {
        const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length
        const max = Math.max(...measurements)
        const min = Math.min(...measurements)
        
        console.log(`📈 ${name} (${measurements.length} calls): avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms`)
        measurements = []
      }, delay)
    }
  }
}