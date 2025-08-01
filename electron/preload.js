import { contextBridge as u, ipcRenderer as i } from "electron";
const c = {
  // IPC Channels
  invoke: [
    "print-receipt",
    "open-dev-tools",
    "window-minimize",
    "window-maximize",
    "window-close",
    "check-for-updates",
    "quit-and-install",
    "get-app-version",
    "restart-app"
  ],
  on: [
    "main-process-message",
    "updater-message",
    "updater-error",
    "updater-progress"
  ],
  send: []
};
function s(o, e) {
  return c[e].includes(o);
}
class f {
  constructor() {
    this.rateLimiter = /* @__PURE__ */ new Map(), this.RATE_LIMIT = 10, this.RATE_WINDOW = 1e3;
  }
  // 1 seconde
  checkRateLimit(e) {
    const r = Date.now(), t = this.rateLimiter.get(e);
    return !t || r > t.resetTime ? (this.rateLimiter.set(e, { count: 1, resetTime: r + this.RATE_WINDOW }), !0) : t.count >= this.RATE_LIMIT ? (console.warn(`Rate limit exceeded for channel: ${e}`), !1) : (t.count++, !0);
  }
  // IPC Communication sécurisé
  on(e, r) {
    if (!s(e, "on")) {
      console.error(`Unauthorized channel: ${e}`);
      return;
    }
    return i.on(e, (t, ...n) => r(t, ...n));
  }
  off(e, ...r) {
    if (!s(e, "on")) {
      console.error(`Unauthorized channel: ${e}`);
      return;
    }
    return i.off(e, ...r);
  }
  send(e, ...r) {
    if (!s(e, "send")) {
      console.error(`Unauthorized channel: ${e}`);
      return;
    }
    if (this.checkRateLimit(e))
      return i.send(e, ...r);
  }
  async invoke(e, ...r) {
    if (!s(e, "invoke"))
      throw console.error(`Unauthorized channel: ${e}`), new Error(`Unauthorized channel: ${e}`);
    if (!this.checkRateLimit(e))
      throw new Error(`Rate limit exceeded for: ${e}`);
    const t = performance.now();
    try {
      const n = await i.invoke(e, ...r), d = performance.now() - t;
      return d > 1e3 && console.warn(`Slow IPC operation: ${e} took ${d.toFixed(2)}ms`), n;
    } catch (n) {
      throw console.error(`IPC Error on ${e}:`, n), n;
    }
  }
  // API spécifique avec validation des paramètres
  printReceipt(e) {
    if (typeof e != "string" || e.length === 0)
      throw new Error("Invalid HTML content for printing");
    if (e.length > 1024 * 1024)
      throw new Error("HTML content too large for printing");
    return this.invoke("print-receipt", e);
  }
  openDevTools() {
    return process.env.NODE_ENV !== "development" ? (console.warn("DevTools disabled in production"), Promise.resolve()) : this.invoke("open-dev-tools");
  }
  minimize() {
    return this.invoke("window-minimize");
  }
  maximize() {
    return this.invoke("window-maximize");
  }
  close() {
    return this.invoke("window-close");
  }
  checkForUpdates() {
    return this.invoke("check-for-updates");
  }
  quitAndInstall() {
    return this.invoke("quit-and-install");
  }
  getAppVersion() {
    return this.invoke("get-app-version");
  }
  restartApp() {
    return this.invoke("restart-app");
  }
  // Event listeners avec nettoyage automatique
  onUpdaterMessage(e) {
    if (typeof e != "function")
      throw new Error("Callback must be a function");
    this.on("updater-message", (r, t) => {
      typeof t == "string" && e(t);
    });
  }
  onUpdaterError(e) {
    if (typeof e != "function")
      throw new Error("Callback must be a function");
    this.on("updater-error", (r, t) => {
      typeof t == "string" && e(t);
    });
  }
  onUpdaterProgress(e) {
    if (typeof e != "function")
      throw new Error("Callback must be a function");
    this.on("updater-progress", (r, t) => {
      t && typeof t == "object" && e(t);
    });
  }
  // Méthodes utilitaires
  getSecurityInfo() {
    return {
      allowedChannels: c,
      rateLimits: Object.fromEntries(this.rateLimiter),
      nodeIntegration: !1,
      contextIsolation: !0,
      sandbox: !1
      // À modifier selon votre configuration
    };
  }
}
const m = new f();
u.exposeInMainWorld("electronAPI", m);
function l(o = ["complete", "interactive"]) {
  return new Promise((e) => {
    o.includes(document.readyState) ? e(!0) : document.addEventListener("readystatechange", () => {
      o.includes(document.readyState) && e(!0);
    });
  });
}
const a = {
  append(o, e) {
    if (!Array.from(o.children).find((r) => r === e))
      return o.appendChild(e);
  },
  remove(o, e) {
    if (Array.from(o.children).find((r) => r === e))
      return o.removeChild(e);
  }
};
function h() {
  const o = "loaders-css__square-spin", e = `
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
.${o} > div {
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
    `, r = document.createElement("style"), t = document.createElement("div");
  return r.id = "app-loading-style", r.innerHTML = e, t.className = "app-loading-wrap", t.innerHTML = `<div class="${o}"><div></div></div>`, {
    appendLoading() {
      a.append(document.head, r), a.append(document.body, t);
    },
    removeLoading() {
      a.remove(document.head, r), a.remove(document.body, t);
    }
  };
}
const { appendLoading: w, removeLoading: p } = h();
l().then(w);
window.onmessage = (o) => {
  o.data.payload === "removeLoading" && p();
};
setTimeout(p, 4999);
