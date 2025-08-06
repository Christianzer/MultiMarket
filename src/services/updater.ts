// Service pour gérer les mises à jour automatiques de l'application
export interface UpdateInfo {
  version: string
  files: Array<{
    url: string
    sha512: string
    size: number
  }>
  path: string
  sha512: string
  releaseDate: string
}

export interface UpdateProgress {
  percent: number
  transferred: number
  total: number
  speed: number
}

export class UpdaterService {
  private static instance: UpdaterService
  private updateCallbacks: Set<(message: string, type: 'info' | 'error' | 'progress') => void> = new Set()
  private progressCallbacks: Set<(progress: UpdateProgress) => void> = new Set()

  private constructor() {
    this.setupElectronListeners()
  }

  public static getInstance(): UpdaterService {
    if (!UpdaterService.instance) {
      UpdaterService.instance = new UpdaterService()
    }
    return UpdaterService.instance
  }

  private setupElectronListeners() {
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Écouter les messages de l'auto-updater
      if (typeof window.electronAPI.onUpdaterMessage === 'function') {
        window.electronAPI.onUpdaterMessage((message: string) => {
          this.notifyCallbacks(message, 'info')
        })
      }

      // Écouter les erreurs de l'auto-updater
      if (typeof window.electronAPI.onUpdaterError === 'function') {
        window.electronAPI.onUpdaterError((error: string) => {
          this.notifyCallbacks(error, 'error')
        })
      }

      // Écouter le progrès de téléchargement
      if (typeof window.electronAPI.onUpdaterProgress === 'function') {
        window.electronAPI.onUpdaterProgress((progress: UpdateProgress) => {
          this.notifyProgressCallbacks(progress)
          const progressMessage = `Téléchargement en cours: ${progress.percent}% (${progress.transferred}MB / ${progress.total}MB)`
          this.notifyCallbacks(progressMessage, 'progress')
        })
      }
    }
  }

  public onUpdateMessage(callback: (message: string, type: 'info' | 'error' | 'progress') => void) {
    this.updateCallbacks.add(callback)
    return () => this.updateCallbacks.delete(callback)
  }

  public onUpdateProgress(callback: (progress: UpdateProgress) => void) {
    this.progressCallbacks.add(callback)
    return () => this.progressCallbacks.delete(callback)
  }

  private notifyCallbacks(message: string, type: 'info' | 'error' | 'progress') {
    this.updateCallbacks.forEach(callback => callback(message, type))
  }

  private notifyProgressCallbacks(progress: UpdateProgress) {
    this.progressCallbacks.forEach(callback => callback(progress))
  }

  public async checkForUpdates() {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return await window.electronAPI.checkForUpdates()
    }
    return { success: false, error: 'ElectronAPI non disponible' }
  }

  public async quitAndInstall() {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return await window.electronAPI.quitAndInstall()
    }
    return { success: false, error: 'ElectronAPI non disponible' }
  }

  public async getAppVersion() {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return await window.electronAPI.getAppVersion()
    }
    return 'Version inconnue'
  }

  public async restartApp() {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return await window.electronAPI.restartApp()
    }
    return { success: false, error: 'ElectronAPI non disponible' }
  }
}

export default UpdaterService.getInstance()