// Utilitaires de sécurité et performance pour Electron

// Configuration de sécurité recommandée
export const SECURITY_CONFIG = {
  // CSP (Content Security Policy) pour Electron
  contentSecurityPolicy: `
    default-src 'self' 'unsafe-inline' 'unsafe-eval';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://api.github.com ws://localhost:* wss://localhost:*;
    media-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim(),

  // Permissions autorisées
  permissions: {
    camera: false,
    microphone: false,
    geolocation: false,
    notifications: true,
    midi: false,
    push: false,
    bluetooth: false,
    usb: false
  }
}

// Validation des URL pour les liens externes
export function validateExternalUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    
    // Protocoles autorisés
    const allowedProtocols = ['https:', 'mailto:']
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return false
    }
    
    // Domaines bloqués (exemple)
    const blockedDomains = ['malicious-site.com', 'suspicious-domain.net']
    if (blockedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

// Sanitisation des données pour l'impression
export function sanitizeHtmlForPrint(html: string): string {
  // Supprimer les scripts et les éléments dangereux
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Supprimer les event handlers
    .replace(/javascript:/gi, '') // Supprimer les liens javascript
}

// Vérification de l'intégrité des fichiers (optionnel)
export async function verifyFileIntegrity(
  filePath: string, 
  expectedHash?: string
): Promise<boolean> {
  if (!expectedHash) return true
  
  try {
    // En production, vous pourriez vouloir vérifier l'intégrité des fichiers critiques
    // Ici c'est un exemple simplifié
    const response = await fetch(filePath)
    const content = await response.text()
    
    // Calculer un hash simple (en production, utilisez crypto.subtle)
    const hash = btoa(content).slice(0, 32)
    
    return hash === expectedHash
  } catch {
    return false
  }
}

// Monitoring de sécurité
class SecurityMonitor {
  private violations: Array<{ type: string; details: string; timestamp: Date }> = []
  private maxViolations = 100

  logViolation(type: string, details: string) {
    this.violations.push({
      type,
      details,
      timestamp: new Date()
    })

    // Garder seulement les dernières violations
    if (this.violations.length > this.maxViolations) {
      this.violations = this.violations.slice(-this.maxViolations)
    }

    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🔒 Security violation [${type}]:`, details)
    }
  }

  getViolations() {
    return [...this.violations]
  }

  clearViolations() {
    this.violations = []
  }

  getStats() {
    const byType = this.violations.reduce((acc, violation) => {
      acc[violation.type] = (acc[violation.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: this.violations.length,
      byType,
      lastViolation: this.violations[this.violations.length - 1]?.timestamp
    }
  }
}

export const securityMonitor = new SecurityMonitor()

// Fonction pour configurer la sécurité dans le renderer process
export function setupRendererSecurity() {
  // Désactiver le menu contextuel en production
  if (process.env.NODE_ENV === 'production') {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })

    // Désactiver certains raccourcis clavier en production
    document.addEventListener('keydown', (e) => {
      // Désactiver F12, Ctrl+Shift+I, etc.
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.shiftKey && e.key === 'K')
      ) {
        e.preventDefault()
        securityMonitor.logViolation('keyboard', `Blocked devtools shortcut: ${e.key}`)
      }
    })
  }

  // Observer les mutations DOM suspectes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Vérifier l'ajout de scripts inline
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            if (element.tagName === 'SCRIPT' && element.textContent) {
              securityMonitor.logViolation('dom', 'Inline script detected')
            }
          }
        })
      }
    })
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  // Nettoyer lors du unload
  window.addEventListener('beforeunload', () => {
    observer.disconnect()
  })
}

// Performance monitoring pour Electron
export class ElectronPerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private memoryTimer: NodeJS.Timeout | null = null

  startMonitoring() {
    // Surveiller l'utilisation mémoire
    this.memoryTimer = setInterval(() => {
      if (performance.memory) {
        const memory = (performance as any).memory
        this.recordMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024)
        this.recordMetric('memory_total', memory.totalJSHeapSize / 1024 / 1024)
        
        // Alerter si utilisation mémoire excessive
        if (memory.usedJSHeapSize > 200 * 1024 * 1024) { // 200MB
          console.warn('⚠️ Utilisation mémoire élevée:', 
            Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB')
        }
      }
    }, 30000) // Toutes les 30 secondes

    // Observer les performances de rendu
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric(entry.name, entry.startTime)
        })
      })
      
      try {
        paintObserver.observe({ entryTypes: ['paint', 'measure'] })
      } catch (error) {
        console.warn('Performance observer not supported:', error)
      }
    }
  }

  stopMonitoring() {
    if (this.memoryTimer) {
      clearInterval(this.memoryTimer)
      this.memoryTimer = null
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Garder seulement les 100 dernières valeurs
    if (values.length > 100) {
      values.shift()
    }
  }

  getMetrics() {
    const result: Record<string, any> = {}
    
    this.metrics.forEach((values, name) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const max = Math.max(...values)
      const min = Math.min(...values)
      
      result[name] = {
        current: values[values.length - 1],
        average: avg,
        max,
        min,
        samples: values.length
      }
    })
    
    return result
  }

  clearMetrics() {
    this.metrics.clear()
  }
}

export const performanceMonitor = new ElectronPerformanceMonitor()

// Hook pour utiliser la sécurité dans les composants Vue
export function useElectronSecurity() {
  return {
    validateUrl: validateExternalUrl,
    sanitizeHtml: sanitizeHtmlForPrint,
    securityMonitor,
    performanceMonitor
  }
}