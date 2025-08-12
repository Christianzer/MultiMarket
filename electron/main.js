import { app as l, BrowserWindow as c, ipcMain as s, shell as g } from "electron";
import w from "electron-updater";
import { createRequire as b } from "node:module";
import { fileURLToPath as E } from "node:url";
import r from "node:path";
const { autoUpdater: t } = w;
b(import.meta.url);
const u = r.dirname(E(import.meta.url));
process.env.APP_ROOT = r.join(u, "..");
const d = process.env.VITE_DEV_SERVER_URL, V = r.join(process.env.APP_ROOT, "electron"), p = r.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = d ? r.join(process.env.APP_ROOT, "public") : p;
let e;
function m() {
  e = new c({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: r.join(process.env.APP_ROOT, "build", "icon.ico"),
    autoHideMenuBar: !0,
    show: !1,
    // Ne pas afficher immédiatement pour éviter le flash
    backgroundColor: "#ffffff",
    // Couleur de fond par défaut
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: r.join(u, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      enableRemoteModule: !1,
      // Sécurité
      allowRunningInsecureContent: !1,
      // Sécurité
      experimentalFeatures: !1,
      // Sécurité
      nodeIntegrationInWorker: !1,
      // Sécurité
      nodeIntegrationInSubFrames: !1,
      // Sécurité
      safeDialogs: !0,
      // Sécurité
      sandbox: !1,
      // Peut être activé pour plus de sécurité si besoin
      webSecurity: !0,
      // Sécurité
      spellcheck: !1,
      // Performance - désactiver si pas nécessaire
      backgroundThrottling: !1
      // Performance - garder les animations fluides
    }
  }), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString()), e == null || e.show(), e && !e.isDestroyed() && e.focus();
  }), e.webContents.on("did-fail-load", (o, a, n) => {
    console.error("Failed to load:", a, n);
  }), e.webContents.session.setSpellCheckerEnabled(!1), d ? (e.loadURL(d), process.env.NODE_ENV === "development" && e.webContents.openDevTools()) : e.loadFile(r.join(p, "index.html")), e.webContents.setWindowOpenHandler(({ url: o }) => (o.startsWith("https:") && g.openExternal(o), { action: "deny" })), e.on("minimize", () => {
  }), e.on("closed", () => {
    e = null;
  }), e.webContents.on("dom-ready", () => {
    e == null || e.webContents.setZoomFactor(1), e == null || e.webContents.setVisualZoomLevelLimits(1, 1);
  });
}
function v() {
  process.env.NODE_ENV === "production" && !process.env.VITE_DEV_SERVER_URL ? (console.log("Setting up auto-updater for production..."), t.logger = console, t.autoDownload = !1, t.on("checking-for-update", () => {
    console.log("Checking for update..."), e == null || e.webContents.send("updater-message", "Vérification des mises à jour...");
  }), t.on("update-available", (o) => {
    console.log("Update available:", o), e == null || e.webContents.send("updater-message", "Une mise à jour est disponible, veuillez mettre à jour l'application et redémarrer");
  }), t.on("update-not-available", (o) => {
    console.log("Update not available:", o), e == null || e.webContents.send("updater-message", "Aucune mise à jour disponible");
  }), t.on("error", (o) => {
    console.log("Error in auto-updater:", o), e == null || e.webContents.send("updater-error", `Erreur de mise à jour: ${o.message}`);
  }), t.on("download-progress", (o) => {
    let a = `Vitesse: ${Math.round(o.bytesPerSecond / 1024)} KB/s`;
    a += ` - Téléchargé ${Math.round(o.percent)}%`, a += ` (${Math.round(o.transferred / 1024 / 1024)} MB / ${Math.round(o.total / 1024 / 1024)} MB)`, console.log(a), e == null || e.webContents.send("updater-progress", {
      percent: Math.round(o.percent),
      transferred: Math.round(o.transferred / 1024 / 1024),
      total: Math.round(o.total / 1024 / 1024),
      speed: Math.round(o.bytesPerSecond / 1024)
    });
  }), t.on("update-downloaded", (o) => {
    console.log("Update downloaded:", o), e == null || e.webContents.send("updater-message", "Mise à jour téléchargée. L'application va redémarrer automatiquement dans quelques secondes..."), setTimeout(() => {
      t.quitAndInstall();
    }, 5e3);
  }), setTimeout(() => {
    t.checkForUpdates().catch((o) => {
      console.log("Auto-updater check failed:", o.message), e == null || e.webContents.send("updater-error", `Impossible de vérifier les mises à jour: ${o.message}`);
    });
  }, 5e3)) : console.log("Auto-updater disabled in development mode");
}
l.whenReady().then(() => {
  m(), v();
});
l.on("window-all-closed", () => {
  process.platform !== "darwin" && l.quit();
});
l.on("activate", () => {
  c.getAllWindows().length === 0 && m();
});
s.handle("print-receipt", async (o, a) => {
  try {
    const n = new c({
      width: 800,
      // Largeur standard
      height: 600,
      // Hauteur standard
      show: !1,
      // Masquer la fenêtre pendant le chargement
      webPreferences: {
        nodeIntegration: !1,
        contextIsolation: !0
      }
    });
    await n.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(a)}`), await new Promise((h) => {
      n.webContents.once("did-finish-load", () => {
        setTimeout(h, 500);
      });
    });
    const f = {
      silent: !1,
      // Ouvrir le dialogue d'impression Windows
      printBackground: !0,
      // Inclure les arrière-plans
      color: !0,
      // Permettre l'impression couleur
      margins: {
        marginType: "default"
        // Marges par défaut
      },
      landscape: !1,
      // Portrait par défaut
      copies: 1,
      // Une seule copie par défaut
      headerFooter: !1,
      // Pas d'en-tête/pied de page automatique
      shouldPrintBackgrounds: !0,
      shouldPrintSelectionOnly: !1
    };
    console.log("Ouverture du dialogue d'impression Windows...");
    const i = await n.webContents.print(f);
    return console.log("Impression:", i ? "Réussie" : "Annulée par l'utilisateur"), setTimeout(() => {
      n.isDestroyed() || n.close();
    }, 1e3), {
      success: !0,
      printed: i,
      message: i ? "Document imprimé avec succès" : "Impression annulée par l'utilisateur"
    };
  } catch (n) {
    return console.error("Erreur lors de l'impression:", n), {
      success: !1,
      error: n.message,
      message: "Erreur d'impression - Vérifiez que votre imprimante est connectée"
    };
  }
});
s.handle("open-dev-tools", () => {
  e && e.webContents.openDevTools();
});
s.handle("window-minimize", () => {
  e && e.minimize();
});
s.handle("window-maximize", () => {
  e && (e.isMaximized() ? e.unmaximize() : e.maximize());
});
s.handle("window-close", () => {
  e && e.close();
});
s.handle("check-for-updates", async () => {
  try {
    return process.env.NODE_ENV === "production" && !process.env.VITE_DEV_SERVER_URL ? (console.log("Manual update check requested"), { success: !0, result: await t.checkForUpdates() }) : { success: !1, error: "Auto-updater is disabled in development mode" };
  } catch (o) {
    return console.error("Error checking for updates:", o), { success: !1, error: o.message };
  }
});
s.handle("quit-and-install", () => {
  try {
    return console.log("Quit and install requested"), t.quitAndInstall(), { success: !0 };
  } catch (o) {
    return console.error("Error during quit and install:", o), { success: !1, error: o.message };
  }
});
s.handle("get-app-version", () => l.getVersion());
s.handle("restart-app", () => {
  l.relaunch(), l.exit();
});
export {
  V as MAIN_DIST,
  p as RENDERER_DIST,
  d as VITE_DEV_SERVER_URL
};
