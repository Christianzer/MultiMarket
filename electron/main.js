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
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:"))
      shell.openExternal(url);
    return { action: "deny" };
  });
}
function setupAutoUpdater() {
  if (process.env.NODE_ENV === "production" && !process.env.VITE_DEV_SERVER_URL) {
    console.log("Setting up auto-updater for production...");
    autoUpdater.logger = console;
    autoUpdater.checkForUpdatesAndNotify = true;
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
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
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
      width: 300,
      // Largeur exacte pour imprimante POS 80mm
      height: 800,
      // Hauteur plus grande pour les longs reçus
      show: false,
      // En développement, mettre à true pour déboguer
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
      silent: true,
      // Impression silencieuse sans dialogue
      printBackground: true,
      // Inclure les arrière-plans
      color: false,
      // Impression en noir et blanc pour POS
      margins: {
        marginType: "custom",
        top: 0,
        // Pas de marge haute
        bottom: 0,
        // Pas de marge basse  
        left: 0,
        // Pas de marge gauche
        right: 0
        // Pas de marge droite
      },
      pageSize: {
        width: 79e3,
        // 79mm en microns (légèrement moins que 80mm pour éviter la coupure)
        height: 297e3
        // Hauteur variable automatique (A4 = 297mm, sera ajustée automatiquement)
      },
      scaleFactor: 100,
      // Échelle 100% pour taille réelle
      landscape: false,
      // Portrait pour reçu
      copies: 1,
      // Une seule copie
      pageRanges: {},
      // Toutes les pages
      duplexMode: "simplex",
      // Impression simple face
      collate: true,
      // Paramètres spécifiques POS
      headerFooter: false,
      // Pas d'en-tête/pied de page automatique
      shouldPrintBackgrounds: true,
      shouldPrintSelectionOnly: false
    };
    if (selectedPrinter) {
      printOptions.deviceName = selectedPrinter;
      console.log("Impression vers:", selectedPrinter);
    } else {
      console.log("Aucune imprimante POS sélectionnée, utilisation de l'imprimante par défaut");
    }
    const result = await printWindow.webContents.print(printOptions);
    console.log("Impression POS:", result ? "Réussie" : "Échouée ou Annulée");
    setTimeout(() => {
      if (!printWindow.isDestroyed()) {
        printWindow.close();
      }
    }, 2e3);
    return {
      success: true,
      printed: result,
      message: result ? "Reçu imprimé avec succès" : "Impression annulée ou échouée"
    };
  } catch (error) {
    console.error("Erreur lors de l'impression POS:", error);
    return {
      success: false,
      error: error.message,
      message: "Erreur d'impression - Vérifiez que l'imprimante POS est connectée"
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
let selectedPrinter = null;
ipcMain.handle("get-printers", async () => {
  try {
    if (win) {
      const printers = await win.webContents.getPrintersAsync();
      const posKeywords = ["pos", "thermal", "receipt", "tm", "epson", "star", "citizen", "bixolon", "zebra", "esc"];
      const printersWithType = printers.map((printer) => ({
        ...printer,
        isPOS: posKeywords.some(
          (keyword) => {
            var _a;
            return printer.name.toLowerCase().includes(keyword) || ((_a = printer.description) == null ? void 0 : _a.toLowerCase().includes(keyword));
          }
        )
      }));
      console.log("Imprimantes détectées:", printersWithType.length);
      printersWithType.forEach((p) => {
        console.log(`- ${p.name} ${p.isPOS ? "(POS)" : "(Standard)"}: ${p.description}`);
      });
      return {
        success: true,
        printers: printersWithType,
        selectedPrinter
      };
    }
    return { success: false, error: "Fenêtre non disponible" };
  } catch (error) {
    console.error("Erreur lors de la récupération des imprimantes:", error);
    return {
      success: false,
      error: error.message,
      printers: []
    };
  }
});
ipcMain.handle("set-printer", async (event, printerName) => {
  try {
    selectedPrinter = printerName;
    console.log("Imprimante POS sélectionnée:", printerName);
    return { success: true, printer: printerName };
  } catch (error) {
    console.error("Erreur lors de la sélection de l'imprimante:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("check-for-updates", async () => {
  try {
    if (process.env.NODE_ENV === "production" && !process.env.VITE_DEV_SERVER_URL) {
      console.log("Manual update check requested");
      const result = await autoUpdater.checkForUpdatesAndNotify();
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
