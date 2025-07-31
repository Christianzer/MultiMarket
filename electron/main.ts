import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

// Configure auto-updater
autoUpdater.checkForUpdatesAndNotify()

// Auto-updater event listeners
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...')
})

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info)
})

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available:', info)
})

autoUpdater.on('error', (err) => {
  console.log('Error in auto-updater:', err)
})

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = `Download speed: ${progressObj.bytesPerSecond}`
  log_message += ` - Downloaded ${progressObj.percent}%`
  log_message += ` (${progressObj.transferred}/${progressObj.total})`
  console.log(log_message)
})

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info)
  autoUpdater.quitAndInstall()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  
  // Check for updates after the app is ready
  if (!process.env.VITE_DEV_SERVER_URL) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify()
    }, 5000) // Check for updates 5 seconds after startup
  }
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// --------- IPC Handlers for Printing and Window Controls ---------

// Gestionnaire pour l'impression de reçus POS
ipcMain.handle('print-receipt', async (event, htmlContent: string) => {
  try {
    // Créer une fenêtre cachée pour l'impression POS
    const printWindow = new BrowserWindow({
      width: 300, // Largeur exacte pour imprimante POS 80mm
      height: 800, // Hauteur plus grande pour les longs reçus
      show: false, // En développement, mettre à true pour déboguer
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    // Charger le contenu HTML
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

    // Attendre que le contenu soit complètement chargé et rendu
    await new Promise(resolve => {
      printWindow.webContents.once('did-finish-load', () => {
        // Attendre un peu plus pour s'assurer que le CSS est appliqué
        setTimeout(resolve, 500)
      })
    })

    // Options d'impression optimisées pour imprimantes POS
    const printOptions: any = {
      silent: true, // Impression silencieuse sans dialogue
      printBackground: true, // Inclure les arrière-plans
      color: false, // Impression en noir et blanc pour POS
      margins: {
        marginType: 'custom' as const,
        top: 0,    // Pas de marge haute
        bottom: 0, // Pas de marge basse  
        left: 0,   // Pas de marge gauche
        right: 0   // Pas de marge droite
      },
      pageSize: {
        width: 79000,  // 79mm en microns (légèrement moins que 80mm pour éviter la coupure)
        height: 297000 // Hauteur variable automatique (A4 = 297mm, sera ajustée automatiquement)
      },
      scaleFactor: 100, // Échelle 100% pour taille réelle
      landscape: false, // Portrait pour reçu
      copies: 1,        // Une seule copie
      pageRanges: {},   // Toutes les pages
      duplexMode: 'simplex', // Impression simple face
      collate: true,
      // Paramètres spécifiques POS
      headerFooter: false, // Pas d'en-tête/pied de page automatique
      shouldPrintBackgrounds: true,
      shouldPrintSelectionOnly: false
    }

    // Utiliser l'imprimante sélectionnée si disponible
    if (selectedPrinter) {
      printOptions.deviceName = selectedPrinter
      console.log('Impression vers:', selectedPrinter)
    } else {
      console.log('Aucune imprimante POS sélectionnée, utilisation de l\'imprimante par défaut')
    }

    // Imprimer avec gestion d'erreur améliorée
    const result = await printWindow.webContents.print(printOptions)
    
    // Log pour déboguer en développement
    console.log('Impression POS:', result ? 'Réussie' : 'Échouée ou Annulée')
    
    // Fermer la fenêtre d'impression après un délai
    setTimeout(() => {
      if (!printWindow.isDestroyed()) {
        printWindow.close()
      }
    }, 2000) // Délai plus long pour s'assurer que l'impression est terminée
    
    return { 
      success: true, 
      printed: result,
      message: result ? 'Reçu imprimé avec succès' : 'Impression annulée ou échouée'
    }
  } catch (error) {
    console.error('Erreur lors de l\'impression POS:', error)
    return { 
      success: false, 
      error: (error as Error).message,
      message: 'Erreur d\'impression - Vérifiez que l\'imprimante POS est connectée'
    }
  }
})

// Gestionnaire pour ouvrir les DevTools
ipcMain.handle('open-dev-tools', () => {
  if (win) {
    win.webContents.openDevTools()
  }
})

// Gestionnaires pour les contrôles de fenêtre
ipcMain.handle('window-minimize', () => {
  if (win) {
    win.minimize()
  }
})

ipcMain.handle('window-maximize', () => {
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  }
})

ipcMain.handle('window-close', () => {
  if (win) {
    win.close()
  }
})

// Variables pour gérer l'imprimante POS sélectionnée
let selectedPrinter: string | null = null

// Gestionnaire pour lister les imprimantes disponibles
ipcMain.handle('get-printers', async () => {
  try {
    if (win) {
      const printers = await win.webContents.getPrintersAsync()
      
      // Filtrer et identifier les imprimantes POS probables
      const posKeywords = ['pos', 'thermal', 'receipt', 'tm', 'epson', 'star', 'citizen', 'bixolon', 'zebra', 'esc']
      
      const printersWithType = printers.map(printer => ({
        ...printer,
        isPOS: posKeywords.some(keyword => 
          printer.name.toLowerCase().includes(keyword) || 
          printer.description?.toLowerCase().includes(keyword)
        )
      }))
      
      console.log('Imprimantes détectées:', printersWithType.length)
      printersWithType.forEach(p => {
        console.log(`- ${p.name} ${p.isPOS ? '(POS)' : '(Standard)'}: ${p.description}`)
      })
      
      return {
        success: true,
        printers: printersWithType,
        selectedPrinter
      }
    }
    return { success: false, error: 'Fenêtre non disponible' }
  } catch (error) {
    console.error('Erreur lors de la récupération des imprimantes:', error)
    return { 
      success: false, 
      error: (error as Error).message,
      printers: []
    }
  }
})

// Gestionnaire pour définir l'imprimante POS à utiliser
ipcMain.handle('set-printer', async (event, printerName: string) => {
  try {
    selectedPrinter = printerName
    console.log('Imprimante POS sélectionnée:', printerName)
    return { success: true, printer: printerName }
  } catch (error) {
    console.error('Erreur lors de la sélection de l\'imprimante:', error)
    return { success: false, error: (error as Error).message }
  }
})

// IPC handlers for auto-updater
ipcMain.handle('check-for-updates', async () => {
  try {
    await autoUpdater.checkForUpdatesAndNotify()
    return { success: true }
  } catch (error) {
    console.error('Error checking for updates:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('quit-and-install', () => {
  autoUpdater.quitAndInstall()
})