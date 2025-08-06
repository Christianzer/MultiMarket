import { app, BrowserWindow, ipcMain, shell } from "electron";
import pkg from "electron-updater";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const { autoUpdater } = pkg;
createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const MAIN_DIST = path.join(process.env.APP_ROOT, "electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.APP_ROOT, "build", "icon.ico"),
    autoHideMenuBar: true,
    show: false,
    // Ne pas afficher immédiatement pour éviter le flash
    backgroundColor: "#ffffff",
    // Couleur de fond par défaut
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      // Sécurité
      allowRunningInsecureContent: false,
      // Sécurité
      experimentalFeatures: false,
      // Sécurité
      nodeIntegrationInWorker: false,
      // Sécurité
      nodeIntegrationInSubFrames: false,
      // Sécurité
      safeDialogs: true,
      // Sécurité
      sandbox: false,
      // Peut être activé pour plus de sécurité si besoin
      webSecurity: true,
      // Sécurité
      spellcheck: false,
      // Performance - désactiver si pas nécessaire
      backgroundThrottling: false
      // Performance - garder les animations fluides
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
    win == null ? void 0 : win.show();
    if (win && !win.isDestroyed()) {
      win.focus();
    }
  });
  win.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
  });
  win.webContents.session.setSpellCheckerEnabled(false);
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    if (process.env.NODE_ENV === "development") {
      win.webContents.openDevTools();
    }
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:"))
      shell.openExternal(url);
    return { action: "deny" };
  });
  win.on("minimize", () => {
  });
  win.on("closed", () => {
    win = null;
  });
  win.webContents.on("dom-ready", () => {
    win == null ? void 0 : win.webContents.setZoomFactor(1);
    win == null ? void 0 : win.webContents.setVisualZoomLevelLimits(1, 1);
  });
}
function setupAutoUpdater() {
  if (process.env.NODE_ENV === "production" && !process.env.VITE_DEV_SERVER_URL) {
    console.log("Setting up auto-updater for production...");
    autoUpdater.logger = console;
    autoUpdater.autoDownload = false;
    autoUpdater.on("checking-for-update", () => {
      console.log("Checking for update...");
      win == null ? void 0 : win.webContents.send("updater-message", "Vérification des mises à jour...");
    });
    autoUpdater.on("update-available", (info) => {
      console.log("Update available:", info);
      win == null ? void 0 : win.webContents.send("updater-message", "Une mise à jour est disponible, veuillez mettre à jour l'application et redémarrer");
    });
    autoUpdater.on("update-not-available", (info) => {
      console.log("Update not available:", info);
      win == null ? void 0 : win.webContents.send("updater-message", "Aucune mise à jour disponible");
    });
    autoUpdater.on("error", (err) => {
      console.log("Error in auto-updater:", err);
      win == null ? void 0 : win.webContents.send("updater-error", `Erreur de mise à jour: ${err.message}`);
    });
    autoUpdater.on("download-progress", (progressObj) => {
      let log_message = `Vitesse: ${Math.round(progressObj.bytesPerSecond / 1024)} KB/s`;
      log_message += ` - Téléchargé ${Math.round(progressObj.percent)}%`;
      log_message += ` (${Math.round(progressObj.transferred / 1024 / 1024)} MB / ${Math.round(progressObj.total / 1024 / 1024)} MB)`;
      console.log(log_message);
      win == null ? void 0 : win.webContents.send("updater-progress", {
        percent: Math.round(progressObj.percent),
        transferred: Math.round(progressObj.transferred / 1024 / 1024),
        total: Math.round(progressObj.total / 1024 / 1024),
        speed: Math.round(progressObj.bytesPerSecond / 1024)
      });
    });
    autoUpdater.on("update-downloaded", (info) => {
      console.log("Update downloaded:", info);
      win == null ? void 0 : win.webContents.send("updater-message", "Mise à jour téléchargée. L'application va redémarrer automatiquement dans quelques secondes...");
      setTimeout(() => {
        autoUpdater.quitAndInstall();
      }, 5e3);
    });
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.log("Auto-updater check failed:", err.message);
        win == null ? void 0 : win.webContents.send("updater-error", `Impossible de vérifier les mises à jour: ${err.message}`);
      });
    }, 5e3);
  } else {
    console.log("Auto-updater disabled in development mode");
  }
}
app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.handle("print-receipt", async (event, htmlContent) => {
  try {
    const printWindow = new BrowserWindow({
      width: 800,
      // Largeur standard
      height: 600,
      // Hauteur standard
      show: false,
      // Masquer la fenêtre pendant le chargement
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    await new Promise((resolve) => {
      printWindow.webContents.once("did-finish-load", () => {
        setTimeout(resolve, 500);
      });
    });
    const printOptions = {
      silent: false,
      // Ouvrir le dialogue d'impression Windows
      printBackground: true,
      // Inclure les arrière-plans
      color: true,
      // Permettre l'impression couleur
      margins: {
        marginType: "default"
        // Marges par défaut
      },
      landscape: false,
      // Portrait par défaut
      copies: 1,
      // Une seule copie par défaut
      headerFooter: false,
      // Pas d'en-tête/pied de page automatique
      shouldPrintBackgrounds: true,
      shouldPrintSelectionOnly: false
    };
    console.log("Ouverture du dialogue d'impression Windows...");
    const result = await printWindow.webContents.print(printOptions);
    console.log("Impression:", result ? "Réussie" : "Annulée par l'utilisateur");
    setTimeout(() => {
      if (!printWindow.isDestroyed()) {
        printWindow.close();
      }
    }, 1e3);
    return {
      success: true,
      printed: result,
      message: result ? "Document imprimé avec succès" : "Impression annulée par l'utilisateur"
    };
  } catch (error) {
    console.error("Erreur lors de l'impression:", error);
    return {
      success: false,
      error: error.message,
      message: "Erreur d'impression - Vérifiez que votre imprimante est connectée"
    };
  }
});
ipcMain.handle("open-dev-tools", () => {
  if (win) {
    win.webContents.openDevTools();
  }
});
ipcMain.handle("window-minimize", () => {
  if (win) {
    win.minimize();
  }
});
ipcMain.handle("window-maximize", () => {
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});
ipcMain.handle("window-close", () => {
  if (win) {
    win.close();
  }
});
ipcMain.handle("check-for-updates", async () => {
  try {
    if (process.env.NODE_ENV === "production" && !process.env.VITE_DEV_SERVER_URL) {
      console.log("Manual update check requested");
      const result = await autoUpdater.checkForUpdates();
      return { success: true, result };
    } else {
      return { success: false, error: "Auto-updater is disabled in development mode" };
    }
  } catch (error) {
    console.error("Error checking for updates:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("quit-and-install", () => {
  try {
    console.log("Quit and install requested");
    autoUpdater.quitAndInstall();
    return { success: true };
  } catch (error) {
    console.error("Error during quit and install:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});
ipcMain.handle("restart-app", () => {
  app.relaunch();
  app.exit();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
//# sourceMappingURL=main.js.map
