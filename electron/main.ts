import { app, BrowserWindow, shell, ipcMain } from 'electron'
import pkg from 'electron-updater'
const { autoUpdater } = pkg
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
// │ ├─┬ electron
// │ │ ├── main.ts
// │ │ └── preload.ts
// │
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.APP_ROOT, 'build', 'icon.ico'),
    autoHideMenuBar: true,
    show: false, // Ne pas afficher immédiatement pour éviter le flash
    backgroundColor: '#ffffff', // Couleur de fond par défaut
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false, // Sécurité
      allowRunningInsecureContent: false, // Sécurité
      experimentalFeatures: false, // Sécurité
      nodeIntegrationInWorker: false, // Sécurité
      nodeIntegrationInSubFrames: false, // Sécurité
      safeDialogs: true, // Sécurité
      sandbox: false, // Peut être activé pour plus de sécurité si besoin
      webSecurity: true, // Sécurité
      spellcheck: false, // Performance - désactiver si pas nécessaire
      backgroundThrottling: false, // Performance - garder les animations fluides
    },
  })

  // Optimisation du chargement et affichage progressif
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
    // Afficher la fenêtre seulement quand le contenu est chargé (évite le flash)
    win?.show()

    // Focus sur la fenêtre
    if (win && !win.isDestroyed()) {
      win.focus()
    }
  })

  // Gérer les erreurs de chargement
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  // Optimisation de la mémoire - limiter le cache
  win.webContents.session.setSpellCheckerEnabled(false)

  // FIXED: Remove deprecated setPreloads call
  // The empty array was not doing anything useful anyway
  // If you need to clear preloads, you can remove specific ones or use clearPreloads() if available

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // N'ouvrir DevTools qu'en développement
    if (process.env.NODE_ENV === 'development') {
      win.webContents.openDevTools()
    }
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Optimisation de la mémoire
  win.on('minimize', () => {
    // Optionnel: réduire l'utilisation mémoire quand minimisé
    // win?.webContents.executeJavaScript('window.gc && window.gc()')
  })

  // Gestion de la fermeture pour libérer les ressources
  win.on('closed', () => {
    win = null
  })

  // Performance: désactiver certaines fonctionnalités pas nécessaires
  win.webContents.on('dom-ready', () => {
    // Désactiver le zoom avec Ctrl+molette
    win?.webContents.setZoomFactor(1)
    win?.webContents.setVisualZoomLevelLimits(1, 1)
  })
}

// Configure auto-updater with proper error handling
function setupAutoUpdater() {
  // Only enable auto-updater in production builds
  if (process.env.NODE_ENV === 'production' && !process.env.VITE_DEV_SERVER_URL) {
    console.log('Setting up auto-updater for production...')

    // Configure auto-updater settings
    autoUpdater.logger = console
    autoUpdater.autoDownload = false

    // Auto-updater event listeners with proper error handling
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...')
      // Notify renderer process
      win?.webContents.send('updater-message', 'Vérification des mises à jour...')
    })

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info)
      win?.webContents.send('updater-message', 'Une mise à jour est disponible, veuillez mettre à jour l\'application et redémarrer')
    })

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available:', info)
      win?.webContents.send('updater-message', 'Aucune mise à jour disponible')
    })

    autoUpdater.on('error', (err) => {
      console.log('Error in auto-updater:', err)
      // Don't crash the app on updater errors, just log them
      win?.webContents.send('updater-error', `Erreur de mise à jour: ${err.message}`)
    })

    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = `Vitesse: ${Math.round(progressObj.bytesPerSecond / 1024)} KB/s`
      log_message += ` - Téléchargé ${Math.round(progressObj.percent)}%`
      log_message += ` (${Math.round(progressObj.transferred / 1024 / 1024)} MB / ${Math.round(progressObj.total / 1024 / 1024)} MB)`
      console.log(log_message)

      // Notify renderer process of download progress
      win?.webContents.send('updater-progress', {
        percent: Math.round(progressObj.percent),
        transferred: Math.round(progressObj.transferred / 1024 / 1024),
        total: Math.round(progressObj.total / 1024 / 1024),
        speed: Math.round(progressObj.bytesPerSecond / 1024)
      })
    })

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info)
      win?.webContents.send('updater-message', 'Mise à jour téléchargée. L\'application va redémarrer automatiquement dans quelques secondes...')

      // Give user a few seconds to see the message before restarting
      setTimeout(() => {
        autoUpdater.quitAndInstall()
      }, 5000)
    })

    // Check for updates with error handling
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => {
        console.log('Auto-updater check failed:', err.message)
        win?.webContents.send('updater-error', `Impossible de vérifier les mises à jour: ${err.message}`)
      })
    }, 5000) // Wait 5 seconds after app start

  } else {
    console.log('Auto-updater disabled in development mode')
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  // Setup auto-updater with proper error handling
  setupAutoUpdater()
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

// Gestionnaire pour l'impression de reçus avec dialogue Windows
ipcMain.handle('print-receipt', async (event, htmlContent: string) => {
  try {
    // Créer une fenêtre pour l'impression
    const printWindow = new BrowserWindow({
      width: 800, // Largeur standard
      height: 600, // Hauteur standard
      show: false, // Masquer la fenêtre pendant le chargement
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

    // Options d'impression avec dialogue Windows
    const printOptions: any = {
      silent: false, // Ouvrir le dialogue d'impression Windows
      printBackground: true, // Inclure les arrière-plans
      color: true, // Permettre l'impression couleur
      margins: {
        marginType: 'default' as const // Marges par défaut
      },
      landscape: false, // Portrait par défaut
      copies: 1, // Une seule copie par défaut
      headerFooter: false, // Pas d'en-tête/pied de page automatique
      shouldPrintBackgrounds: true,
      shouldPrintSelectionOnly: false
    }

    // Lancer l'impression avec le dialogue Windows
    console.log('Ouverture du dialogue d\'impression Windows...')
    const result = await printWindow.webContents.print(printOptions)

    // Log pour déboguer
    console.log('Impression:', result ? 'Réussie' : 'Annulée par l\'utilisateur')

    // Fermer la fenêtre d'impression après un délai
    setTimeout(() => {
      if (!printWindow.isDestroyed()) {
        printWindow.close()
      }
    }, 1000)

    return {
      success: true,
      printed: result,
      message: result ? 'Document imprimé avec succès' : 'Impression annulée par l\'utilisateur'
    }
  } catch (error) {
    console.error('Erreur lors de l\'impression:', error)
    return {
      success: false,
      error: (error as Error).message,
      message: 'Erreur d\'impression - Vérifiez que votre imprimante est connectée'
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

// Note: Les gestionnaires d'imprimantes POS spécifiques ont été supprimés
// car nous utilisons maintenant le dialogue d'impression Windows standard

// IPC handlers for auto-updater
ipcMain.handle('check-for-updates', async () => {
  try {
    if (process.env.NODE_ENV === 'production' && !process.env.VITE_DEV_SERVER_URL) {
      console.log('Manual update check requested')
      const result = await autoUpdater.checkForUpdates()
      return { success: true, result }
    } else {
      return { success: false, error: 'Auto-updater is disabled in development mode' }
    }
  } catch (error) {
    console.error('Error checking for updates:', error)
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('quit-and-install', () => {
  try {
    console.log('Quit and install requested')
    autoUpdater.quitAndInstall()
    return { success: true }
  } catch (error) {
    console.error('Error during quit and install:', error)
    return { success: false, error: (error as Error).message }
  }
})

// Additional IPC handlers for updater info
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('restart-app', () => {
  app.relaunch()
  app.exit()
})