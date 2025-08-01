export interface UpdateProgress {
  percent: number
  transferred: number
  total: number
  speed: number
}

export interface ElectronAPI {
  on: (channel: string, listener: (...args: any[]) => void) => void
  off: (channel: string, listener: (...args: any[]) => void) => void
  send: (channel: string, ...args: any[]) => void
  invoke: (channel: string, ...args: any[]) => Promise<any>
  
  // Auto-updater methods
  checkForUpdates: () => Promise<{ success: boolean; error?: string; result?: any }>
  quitAndInstall: () => Promise<{ success: boolean; error?: string }>
  getAppVersion: () => Promise<string>
  restartApp: () => Promise<{ success: boolean; error?: string }>
  
  // Auto-updater event listeners
  onUpdaterMessage: (callback: (message: string) => void) => void
  onUpdaterError: (callback: (error: string) => void) => void
  onUpdaterProgress: (callback: (progress: UpdateProgress) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}