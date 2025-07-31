// Types pour l'API Electron
export interface PrinterInfo {
  name: string
  description?: string
  status: number
  isDefault: boolean
  isPOS?: boolean
}

export interface PrinterListResponse {
  success: boolean
  printers: PrinterInfo[]
  selectedPrinter: string | null
  error?: string
}

export interface PrintResponse {
  success: boolean
  printed?: boolean
  message: string
  error?: string
}

export interface UpdateProgress {
  percent: number
  transferred: number
  total: number
  speed: number
}

export interface UpdaterResponse {
  success: boolean
  result?: any
  error?: string
}

export interface ElectronAPI {
  printReceipt: (htmlContent: string) => Promise<PrintResponse>
  getPrinters: () => Promise<PrinterListResponse>
  setPrinter: (printerName: string) => Promise<{ success: boolean; printer?: string; error?: string }>
  openDevTools: () => void
  minimize: () => void
  maximize: () => void
  close: () => void
  // Auto-updater functions
  checkForUpdates: () => Promise<UpdaterResponse>
  quitAndInstall: () => Promise<UpdaterResponse>
  getAppVersion: () => Promise<string>
  restartApp: () => void
  // Auto-updater event listeners
  onUpdaterMessage: (callback: (message: string) => void) => void
  onUpdaterError: (callback: (error: string) => void) => void
  onUpdaterProgress: (callback: (progress: UpdateProgress) => void) => void
}

// Extension de Window pour inclure l'API Electron
declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}