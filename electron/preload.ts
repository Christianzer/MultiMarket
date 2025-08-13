import { contextBridge, ipcRenderer } from 'electron'

// Liste des canaux autorisés pour la sécurité
const ALLOWED_CHANNELS = {
  // IPC Channels
  invoke: [
    'print-receipt',
    'open-dev-tools',
    'window-minimize',
    'window-maximize', 
    'window-close',
    'check-for-updates',
    'quit-and-install',
    'get-app-version',
    'restart-app'
  ],
  on: [
    'main-process-message',
    'updater-message',
    'updater-error',
    'updater-progress'
  ],
  send: []
}

// Validation sécurisée des canaux
function validateChannel(channel: string, type: 'invoke' | 'on' | 'send'): boolean {
  return ALLOWED_CHANNELS[type].includes(channel)
}

// API sécurisée avec validation et limitation de taux
class SecureElectronAPI {
  private rateLimiter = new Map<string, { count: number; resetTime: number }>()
  private readonly RATE_LIMIT = 10 // 10 appels par seconde maximum
  private readonly RATE_WINDOW = 1000 // 1 seconde

  private checkRateLimit(channel: string): boolean {
    const now = Date.now()
    const limit = this.rateLimiter.get(channel)

    if (!limit || now > limit.resetTime) {
      this.rateLimiter.set(channel, { count: 1, resetTime: now + this.RATE_WINDOW })
      return true
    }

    if (limit.count >= this.RATE_LIMIT) {
      console.warn(`Rate limit exceeded for channel: ${channel}`)
      return false
    }

    limit.count++
    return true
  }

  // IPC Communication sécurisé
  on(channel: string, listener: (event: any, ...args: any[]) => void) {
    if (!validateChannel(channel, 'on')) {
      console.error(`Unauthorized channel: ${channel}`)
      return
    }
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  }

  off(channel: string, ...args: any[]) {
    if (!validateChannel(channel, 'on')) {
      console.error(`Unauthorized channel: ${channel}`)
      return
    }
    return ipcRenderer.off(channel, ...args)
  }

  send(channel: string, ...args: any[]) {
    if (!validateChannel(channel, 'send')) {
      console.error(`Unauthorized channel: ${channel}`)
      return
    }
    if (!this.checkRateLimit(channel)) return
    return ipcRenderer.send(channel, ...args)
  }

  async invoke(channel: string, ...args: any[]) {
    if (!validateChannel(channel, 'invoke')) {
      console.error(`Unauthorized channel: ${channel}`)
      throw new Error(`Unauthorized channel: ${channel}`)
    }
    if (!this.checkRateLimit(channel)) {
      throw new Error(`Rate limit exceeded for: ${channel}`)
    }

    const startTime = performance.now()
    try {
      const result = await ipcRenderer.invoke(channel, ...args)
      const duration = performance.now() - startTime
      
      // Log des opérations lentes
      if (duration > 1000) {
        console.warn(`Slow IPC operation: ${channel} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      console.error(`IPC Error on ${channel}:`, error)
      throw error
    }
  }

  // API spécifique avec validation des paramètres
  printReceipt(htmlContent: string) {
    if (typeof htmlContent !== 'string' || htmlContent.length === 0) {
      throw new Error('Invalid HTML content for printing')
    }
    if (htmlContent.length > 1024 * 1024) { // Limite 1MB
      throw new Error('HTML content too large for printing')
    }
    return this.invoke('print-receipt', htmlContent)
  }

  openDevTools() {
    // Seulement en développement
    if (process.env.NODE_ENV !== 'development') {
      console.warn('DevTools disabled in production')
      return Promise.resolve()
    }
    return this.invoke('open-dev-tools')
  }

  minimize() {
    return this.invoke('window-minimize')
  }

  maximize() {
    return this.invoke('window-maximize')
  }

  close() {
    return this.invoke('window-close')
  }

  checkForUpdates() {
    return this.invoke('check-for-updates')
  }

  quitAndInstall() {
    return this.invoke('quit-and-install')
  }

  getAppVersion() {
    return this.invoke('get-app-version')
  }

  restartApp() {
    return this.invoke('restart-app')
  }

  // Event listeners avec nettoyage automatique
  onUpdaterMessage(callback: (message: string) => void) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function')
    }
    const listener = (_, message) => {
      if (typeof message === 'string') {
        callback(message)
      }
    }
    this.on('updater-message', listener)
    
    // Retourner une fonction de nettoyage
    return () => {
      this.off('updater-message', listener)
    }
  }

  onUpdaterError(callback: (error: string) => void) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function')
    }
    const listener = (_, error) => {
      if (typeof error === 'string') {
        callback(error)
      }
    }
    this.on('updater-error', listener)
    
    // Retourner une fonction de nettoyage
    return () => {
      this.off('updater-error', listener)
    }
  }

  onUpdaterProgress(callback: (progress: any) => void) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function')
    }
    const listener = (_, progress) => {
      if (progress && typeof progress === 'object') {
        callback(progress)
      }
    }
    this.on('updater-progress', listener)
    
    // Retourner une fonction de nettoyage
    return () => {
      this.off('updater-progress', listener)
    }
  }

  // Méthodes utilitaires
  getSecurityInfo() {
    return {
      allowedChannels: ALLOWED_CHANNELS,
      rateLimits: Object.fromEntries(this.rateLimiter),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false // À modifier selon votre configuration
    }
  }
}

// --------- Expose the secure API to the Renderer process ---------
const secureAPI = new SecureElectronAPI()
contextBridge.exposeInMainWorld('electronAPI', secureAPI)

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(c => c === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(c => c === child)) {
      return parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { 
    transform: perspective(100px) rotateX(180deg) rotateY(0); 
  }
  50% { 
    transform: perspective(100px) rotateX(180deg) rotateY(180deg); 
  }
  75% { 
    transform: perspective(100px) rotateX(0) rotateY(180deg); 
  }
  100% { 
    transform: perspective(100px) rotateX(0) rotateY(0); 
  }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)