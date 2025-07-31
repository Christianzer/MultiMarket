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

export interface ElectronAPI {
  printReceipt: (htmlContent: string) => Promise<PrintResponse>
  getPrinters: () => Promise<PrinterListResponse>
  setPrinter: (printerName: string) => Promise<{ success: boolean; printer?: string; error?: string }>
  openDevTools: () => void
  minimize: () => void
  maximize: () => void
  close: () => void
}

// Extension de Window pour inclure l'API Electron
declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}