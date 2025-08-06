// Service optimisé pour les communications Electron
interface ElectronAPI {
  // IPC Communication
  on: (channel: string, listener: (event: any, ...args: any[]) => void) => void
  off: (channel: string, ...args: any[]) => void
  send: (channel: string, ...args: any[]) => void
  invoke: (channel: string, ...args: any[]) => Promise<any>

  // Application Controls
  printReceipt: (htmlContent: string) => Promise<any>
  openDevTools: () => Promise<void>
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>

  // Auto-updater
  checkForUpdates: () => Promise<any>
  quitAndInstall: () => Promise<any>
  getAppVersion: () => Promise<string>
  restartApp: () => Promise<void>

  // Event listeners
  onUpdaterMessage: (callback: (message: string) => void) => void
  onUpdaterError: (callback: (error: string) => void) => void
  onUpdaterProgress: (callback: (progress: any) => void) => void
}

class ElectronService {
  private api: ElectronAPI | null = null
  private isElectron: boolean = false
  private performanceMetrics: Map<string, number> = new Map()

  constructor() {
    this.initialize()
  }

  private initialize() {
    // Vérifier si nous sommes dans Electron
    this.isElectron = this.checkElectronEnvironment()
    
    if (this.isElectron) {
      this.api = (window as any).electronAPI
      this.setupPerformanceMonitoring()
    }
  }

  private checkElectronEnvironment(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      window.process &&
      window.process.type === 'renderer'
    ) || !!(
      typeof window !== 'undefined' &&
      (window as any).electronAPI
    )
  }

  private setupPerformanceMonitoring() {
    // Surveiller l'utilisation mémoire
    if (this.isElectron && performance.memory) {
      setInterval(() => {
        const memory = (performance as any).memory
        this.performanceMetrics.set('usedJSHeapSize', memory.usedJSHeapSize)
        this.performanceMetrics.set('totalJSHeapSize', memory.totalJSHeapSize)
        this.performanceMetrics.set('jsHeapSizeLimit', memory.jsHeapSizeLimit)
        
        // Log si utilisation mémoire excessive (>100MB)
        if (memory.usedJSHeapSize > 100 * 1024 * 1024) {
          console.warn('⚠️ Utilisation mémoire élevée:', 
            Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB')
        }
      }, 30000) // Vérification toutes les 30 secondes
    }
  }

  // Getters
  get available(): boolean {
    return this.isElectron && this.api !== null
  }

  get memoryUsage(): { used: number; total: number; limit: number } | null {
    if (!this.available || !performance.memory) return null
    
    const memory = (performance as any).memory
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
    }
  }

  // Application Controls optimisés avec cache et debounce
  private debounceMap = new Map<string, NodeJS.Timeout>()

  private debounce<T extends (...args: any[]) => any>(
    key: string, 
    fn: T, 
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      if (this.debounceMap.has(key)) {
        clearTimeout(this.debounceMap.get(key)!)
      }
      
      const timeout = setTimeout(() => {
        fn(...args)
        this.debounceMap.delete(key)
      }, delay)
      
      this.debounceMap.set(key, timeout)
    }
  }

  // API Methods avec gestion d'erreur
  async printReceipt(htmlContent: string): Promise<any> {
    if (!this.available || !this.api!.printReceipt) {
      throw new Error('Electron API non disponible')
    }
    
    try {
      const startTime = performance.now()
      const result = await this.api!.printReceipt(htmlContent)
      const duration = performance.now() - startTime
      
      console.log(`🖨️ Impression terminée en ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      console.error('Erreur impression:', error)
      throw error
    }
  }

  // Window Controls avec debounce
  minimize = this.debounce('minimize', async () => {
    if (this.available && this.api!.minimize) {
      await this.api!.minimize()
    }
  }, 100)

  maximize = this.debounce('maximize', async () => {
    if (this.available && this.api!.maximize) {
      await this.api!.maximize()
    }
  }, 100)

  close = this.debounce('close', async () => {
    if (this.available && this.api!.close) {
      await this.api!.close()
    }
  }, 100)

  // Auto-updater avec cache
  private updateInfo: any = null
  private lastUpdateCheck: number = 0
  private readonly UPDATE_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

  async checkForUpdates(force = false): Promise<any> {
    if (!this.available || !this.api!.checkForUpdates) return null
    
    const now = Date.now()
    if (!force && this.updateInfo && (now - this.lastUpdateCheck) < this.UPDATE_CHECK_INTERVAL) {
      return this.updateInfo
    }
    
    try {
      this.updateInfo = await this.api!.checkForUpdates()
      this.lastUpdateCheck = now
      return this.updateInfo
    } catch (error) {
      console.error('Erreur vérification mise à jour:', error)
      return null
    }
  }

  async getAppVersion(): Promise<string | null> {
    if (!this.available || !this.api!.getAppVersion) return null
    
    try {
      return await this.api!.getAppVersion()
    } catch (error) {
      console.error('Erreur récupération version:', error)
      return null
    }
  }

  async quitAndInstall(): Promise<void> {
    if (this.available && this.api!.quitAndInstall) {
      await this.api!.quitAndInstall()
    }
  }

  async restartApp(): Promise<void> {
    if (this.available && this.api!.restartApp) {
      await this.api!.restartApp()
    }
  }

  // Event Listeners avec nettoyage automatique
  private listeners: Map<string, Function[]> = new Map()

  onUpdaterMessage(callback: (message: string) => void): () => void {
    if (!this.available || !this.api!.onUpdaterMessage) return () => {}
    
    this.api!.onUpdaterMessage(callback)
    this.addListener('updater-message', callback)
    
    return () => this.removeListener('updater-message', callback)
  }

  onUpdaterError(callback: (error: string) => void): () => void {
    if (!this.available || !this.api!.onUpdaterError) return () => {}
    
    this.api!.onUpdaterError(callback)
    this.addListener('updater-error', callback)
    
    return () => this.removeListener('updater-error', callback)
  }

  onUpdaterProgress(callback: (progress: any) => void): () => void {
    if (!this.available || !this.api!.onUpdaterProgress) return () => {}
    
    this.api!.onUpdaterProgress(callback)
    this.addListener('updater-progress', callback)
    
    return () => this.removeListener('updater-progress', callback)
  }

  private addListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  private removeListener(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  // Nettoyage des ressources
  cleanup() {
    // Nettoyer les timeouts de debounce
    this.debounceMap.forEach(timeout => clearTimeout(timeout))
    this.debounceMap.clear()
    
    // Nettoyer les listeners
    this.listeners.clear()
    
    console.log('🧹 ElectronService nettoyé')
  }

  // Utilitaires de développement
  openDevTools() {
    if (this.available && this.api!.openDevTools && process.env.NODE_ENV === 'development') {
      this.api!.openDevTools()
    }
  }

  // Diagnostic
  getDiagnosticInfo() {
    return {
      isElectron: this.isElectron,
      apiAvailable: this.available,
      memoryUsage: this.memoryUsage,
      lastUpdateCheck: new Date(this.lastUpdateCheck).toISOString(),
      activeListeners: Array.from(this.listeners.keys()),
      debounceOperations: Array.from(this.debounceMap.keys())
    }
  }
}

// Instance singleton
export const electronService = new ElectronService()

// Hook Vue pour utiliser le service Electron
export function useElectron() {
  return {
    service: electronService,
    isElectron: electronService.available,
    memoryUsage: electronService.memoryUsage,
    getDiagnostic: () => electronService.getDiagnosticInfo()
  }
}