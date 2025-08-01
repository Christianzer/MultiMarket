import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  on(...args) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
  // API spécifique pour l'application
  printReceipt: (htmlContent) => ipcRenderer.invoke("print-receipt", htmlContent),
  openDevTools: () => ipcRenderer.invoke("open-dev-tools"),
  minimize: () => ipcRenderer.invoke("window-minimize"),
  maximize: () => ipcRenderer.invoke("window-maximize"),
  close: () => ipcRenderer.invoke("window-close"),
  // API pour l'auto-updater
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  quitAndInstall: () => ipcRenderer.invoke("quit-and-install"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  restartApp: () => ipcRenderer.invoke("restart-app"),
  // Event listeners pour l'auto-updater
  onUpdaterMessage: (callback) => {
    ipcRenderer.on("updater-message", (_, message) => callback(message));
  },
  onUpdaterError: (callback) => {
    ipcRenderer.on("updater-error", (_, error) => callback(error));
  },
  onUpdaterProgress: (callback) => {
    ipcRenderer.on("updater-progress", (_, progress) => callback(progress));
  }
});
function domReady(condition = ["complete", "interactive"]) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}
const safeDOM = {
  append(parent, child) {
    if (!Array.from(parent.children).find((c) => c === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent, child) {
    if (Array.from(parent.children).find((c) => c === child)) {
      return parent.removeChild(child);
    }
  }
};
function useLoading() {
  const className = `loaders-css__square-spin`;
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
    `;
  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");
  oStyle.id = "app-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.className = "app-loading-wrap";
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`;
  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    }
  };
}
const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);
window.onmessage = (ev) => {
  ev.data.payload === "removeLoading" && removeLoading();
};
setTimeout(removeLoading, 4999);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlbG9hZC5qcyIsInNvdXJjZXMiOlsicHJlbG9hZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjb250ZXh0QnJpZGdlLCBpcGNSZW5kZXJlciB9IGZyb20gJ2VsZWN0cm9uJ1xyXG5cclxuLy8gLS0tLS0tLS0tIEV4cG9zZSBzb21lIEFQSSB0byB0aGUgUmVuZGVyZXIgcHJvY2VzcyAtLS0tLS0tLS1cclxuY29udGV4dEJyaWRnZS5leHBvc2VJbk1haW5Xb3JsZCgnZWxlY3Ryb25BUEknLCB7XHJcbiAgb24oLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgaXBjUmVuZGVyZXIub24+KSB7XHJcbiAgICBjb25zdCBbY2hhbm5lbCwgbGlzdGVuZXJdID0gYXJnc1xyXG4gICAgcmV0dXJuIGlwY1JlbmRlcmVyLm9uKGNoYW5uZWwsIChldmVudCwgLi4uYXJncykgPT4gbGlzdGVuZXIoZXZlbnQsIC4uLmFyZ3MpKVxyXG4gIH0sXHJcbiAgb2ZmKC4uLmFyZ3M6IFBhcmFtZXRlcnM8dHlwZW9mIGlwY1JlbmRlcmVyLm9mZj4pIHtcclxuICAgIGNvbnN0IFtjaGFubmVsLCAuLi5vbWl0XSA9IGFyZ3NcclxuICAgIHJldHVybiBpcGNSZW5kZXJlci5vZmYoY2hhbm5lbCwgLi4ub21pdClcclxuICB9LFxyXG4gIHNlbmQoLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgaXBjUmVuZGVyZXIuc2VuZD4pIHtcclxuICAgIGNvbnN0IFtjaGFubmVsLCAuLi5vbWl0XSA9IGFyZ3NcclxuICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kKGNoYW5uZWwsIC4uLm9taXQpXHJcbiAgfSxcclxuICBpbnZva2UoLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgaXBjUmVuZGVyZXIuaW52b2tlPikge1xyXG4gICAgY29uc3QgW2NoYW5uZWwsIC4uLm9taXRdID0gYXJnc1xyXG4gICAgcmV0dXJuIGlwY1JlbmRlcmVyLmludm9rZShjaGFubmVsLCAuLi5vbWl0KVxyXG4gIH0sXHJcblxyXG4gIC8vIEFQSSBzcMOpY2lmaXF1ZSBwb3VyIGwnYXBwbGljYXRpb25cclxuICBwcmludFJlY2VpcHQ6IChodG1sQ29udGVudDogc3RyaW5nKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3ByaW50LXJlY2VpcHQnLCBodG1sQ29udGVudCksXHJcbiAgb3BlbkRldlRvb2xzOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ29wZW4tZGV2LXRvb2xzJyksXHJcbiAgbWluaW1pemU6ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnd2luZG93LW1pbmltaXplJyksXHJcbiAgbWF4aW1pemU6ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnd2luZG93LW1heGltaXplJyksXHJcbiAgY2xvc2U6ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnd2luZG93LWNsb3NlJyksXHJcbiAgXHJcbiAgLy8gQVBJIHBvdXIgbCdhdXRvLXVwZGF0ZXJcclxuICBjaGVja0ZvclVwZGF0ZXM6ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnY2hlY2stZm9yLXVwZGF0ZXMnKSxcclxuICBxdWl0QW5kSW5zdGFsbDogKCkgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdxdWl0LWFuZC1pbnN0YWxsJyksXHJcbiAgZ2V0QXBwVmVyc2lvbjogKCkgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdnZXQtYXBwLXZlcnNpb24nKSxcclxuICByZXN0YXJ0QXBwOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3Jlc3RhcnQtYXBwJyksXHJcbiAgXHJcbiAgLy8gRXZlbnQgbGlzdGVuZXJzIHBvdXIgbCdhdXRvLXVwZGF0ZXJcclxuICBvblVwZGF0ZXJNZXNzYWdlOiAoY2FsbGJhY2s6IChtZXNzYWdlOiBzdHJpbmcpID0+IHZvaWQpID0+IHtcclxuICAgIGlwY1JlbmRlcmVyLm9uKCd1cGRhdGVyLW1lc3NhZ2UnLCAoXywgbWVzc2FnZSkgPT4gY2FsbGJhY2sobWVzc2FnZSkpXHJcbiAgfSxcclxuICBvblVwZGF0ZXJFcnJvcjogKGNhbGxiYWNrOiAoZXJyb3I6IHN0cmluZykgPT4gdm9pZCkgPT4ge1xyXG4gICAgaXBjUmVuZGVyZXIub24oJ3VwZGF0ZXItZXJyb3InLCAoXywgZXJyb3IpID0+IGNhbGxiYWNrKGVycm9yKSlcclxuICB9LFxyXG4gIG9uVXBkYXRlclByb2dyZXNzOiAoY2FsbGJhY2s6IChwcm9ncmVzczogYW55KSA9PiB2b2lkKSA9PiB7XHJcbiAgICBpcGNSZW5kZXJlci5vbigndXBkYXRlci1wcm9ncmVzcycsIChfLCBwcm9ncmVzcykgPT4gY2FsbGJhY2socHJvZ3Jlc3MpKVxyXG4gIH0sXHJcbn0pXHJcblxyXG4vLyAtLS0tLS0tLS0gUHJlbG9hZCBzY3JpcHRzIGxvYWRpbmcgLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIGRvbVJlYWR5KGNvbmRpdGlvbjogRG9jdW1lbnRSZWFkeVN0YXRlW10gPSBbJ2NvbXBsZXRlJywgJ2ludGVyYWN0aXZlJ10pIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgIGlmIChjb25kaXRpb24uaW5jbHVkZXMoZG9jdW1lbnQucmVhZHlTdGF0ZSkpIHtcclxuICAgICAgcmVzb2x2ZSh0cnVlKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsICgpID0+IHtcclxuICAgICAgICBpZiAoY29uZGl0aW9uLmluY2x1ZGVzKGRvY3VtZW50LnJlYWR5U3RhdGUpKSB7XHJcbiAgICAgICAgICByZXNvbHZlKHRydWUpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gIH0pXHJcbn1cclxuXHJcbmNvbnN0IHNhZmVET00gPSB7XHJcbiAgYXBwZW5kKHBhcmVudDogSFRNTEVsZW1lbnQsIGNoaWxkOiBIVE1MRWxlbWVudCkge1xyXG4gICAgaWYgKCFBcnJheS5mcm9tKHBhcmVudC5jaGlsZHJlbikuZmluZChjID0+IGMgPT09IGNoaWxkKSkge1xyXG4gICAgICByZXR1cm4gcGFyZW50LmFwcGVuZENoaWxkKGNoaWxkKVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgcmVtb3ZlKHBhcmVudDogSFRNTEVsZW1lbnQsIGNoaWxkOiBIVE1MRWxlbWVudCkge1xyXG4gICAgaWYgKEFycmF5LmZyb20ocGFyZW50LmNoaWxkcmVuKS5maW5kKGMgPT4gYyA9PT0gY2hpbGQpKSB7XHJcbiAgICAgIHJldHVybiBwYXJlbnQucmVtb3ZlQ2hpbGQoY2hpbGQpXHJcbiAgICB9XHJcbiAgfSxcclxufVxyXG5cclxuLyoqXHJcbiAqIGh0dHBzOi8vdG9iaWFzYWhsaW4uY29tL3NwaW5raXRcclxuICogaHR0cHM6Ly9jb25ub3JhdGhlcnRvbi5jb20vbG9hZGVyc1xyXG4gKiBodHRwczovL3Byb2plY3RzLmx1a2VoYWFzLm1lL2Nzcy1sb2FkZXJzXHJcbiAqIGh0dHBzOi8vbWF0ZWprdXN0ZWMuZ2l0aHViLmlvL1NwaW5UaGF0U2hpdFxyXG4gKi9cclxuZnVuY3Rpb24gdXNlTG9hZGluZygpIHtcclxuICBjb25zdCBjbGFzc05hbWUgPSBgbG9hZGVycy1jc3NfX3NxdWFyZS1zcGluYFxyXG4gIGNvbnN0IHN0eWxlQ29udGVudCA9IGBcclxuQGtleWZyYW1lcyBzcXVhcmUtc3BpbiB7XHJcbiAgMjUlIHsgXHJcbiAgICB0cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEwMHB4KSByb3RhdGVYKDE4MGRlZykgcm90YXRlWSgwKTsgXHJcbiAgfVxyXG4gIDUwJSB7IFxyXG4gICAgdHJhbnNmb3JtOiBwZXJzcGVjdGl2ZSgxMDBweCkgcm90YXRlWCgxODBkZWcpIHJvdGF0ZVkoMTgwZGVnKTsgXHJcbiAgfVxyXG4gIDc1JSB7IFxyXG4gICAgdHJhbnNmb3JtOiBwZXJzcGVjdGl2ZSgxMDBweCkgcm90YXRlWCgwKSByb3RhdGVZKDE4MGRlZyk7IFxyXG4gIH1cclxuICAxMDAlIHsgXHJcbiAgICB0cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEwMHB4KSByb3RhdGVYKDApIHJvdGF0ZVkoMCk7IFxyXG4gIH1cclxufVxyXG4uJHtjbGFzc05hbWV9ID4gZGl2IHtcclxuICBhbmltYXRpb24tZmlsbC1tb2RlOiBib3RoO1xyXG4gIHdpZHRoOiA1MHB4O1xyXG4gIGhlaWdodDogNTBweDtcclxuICBiYWNrZ3JvdW5kOiAjZmZmO1xyXG4gIGFuaW1hdGlvbjogc3F1YXJlLXNwaW4gM3MgMHMgY3ViaWMtYmV6aWVyKDAuMDksIDAuNTcsIDAuNDksIDAuOSkgaW5maW5pdGU7XHJcbn1cclxuLmFwcC1sb2FkaW5nLXdyYXAge1xyXG4gIHBvc2l0aW9uOiBmaXhlZDtcclxuICB0b3A6IDA7XHJcbiAgbGVmdDogMDtcclxuICB3aWR0aDogMTAwdnc7XHJcbiAgaGVpZ2h0OiAxMDB2aDtcclxuICBkaXNwbGF5OiBmbGV4O1xyXG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XHJcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XHJcbiAgYmFja2dyb3VuZDogIzI4MmMzNDtcclxuICB6LWluZGV4OiA5O1xyXG59XHJcbiAgICBgXHJcbiAgY29uc3Qgb1N0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxyXG4gIGNvbnN0IG9EaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG5cclxuICBvU3R5bGUuaWQgPSAnYXBwLWxvYWRpbmctc3R5bGUnXHJcbiAgb1N0eWxlLmlubmVySFRNTCA9IHN0eWxlQ29udGVudFxyXG4gIG9EaXYuY2xhc3NOYW1lID0gJ2FwcC1sb2FkaW5nLXdyYXAnXHJcbiAgb0Rpdi5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cIiR7Y2xhc3NOYW1lfVwiPjxkaXY+PC9kaXY+PC9kaXY+YFxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgYXBwZW5kTG9hZGluZygpIHtcclxuICAgICAgc2FmZURPTS5hcHBlbmQoZG9jdW1lbnQuaGVhZCwgb1N0eWxlKVxyXG4gICAgICBzYWZlRE9NLmFwcGVuZChkb2N1bWVudC5ib2R5LCBvRGl2KVxyXG4gICAgfSxcclxuICAgIHJlbW92ZUxvYWRpbmcoKSB7XHJcbiAgICAgIHNhZmVET00ucmVtb3ZlKGRvY3VtZW50LmhlYWQsIG9TdHlsZSlcclxuICAgICAgc2FmZURPTS5yZW1vdmUoZG9jdW1lbnQuYm9keSwgb0RpdilcclxuICAgIH0sXHJcbiAgfVxyXG59XHJcblxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5jb25zdCB7IGFwcGVuZExvYWRpbmcsIHJlbW92ZUxvYWRpbmcgfSA9IHVzZUxvYWRpbmcoKVxyXG5kb21SZWFkeSgpLnRoZW4oYXBwZW5kTG9hZGluZylcclxuXHJcbndpbmRvdy5vbm1lc3NhZ2UgPSAoZXYpID0+IHtcclxuICBldi5kYXRhLnBheWxvYWQgPT09ICdyZW1vdmVMb2FkaW5nJyAmJiByZW1vdmVMb2FkaW5nKClcclxufVxyXG5cclxuc2V0VGltZW91dChyZW1vdmVMb2FkaW5nLCA0OTk5KSJdLCJuYW1lcyI6WyJhcmdzIl0sIm1hcHBpbmdzIjoiO0FBR0EsY0FBYyxrQkFBa0IsZUFBZTtBQUFBLEVBQzdDLE1BQU0sTUFBeUM7QUFDdkMsVUFBQSxDQUFDLFNBQVMsUUFBUSxJQUFJO0FBQ3JCLFdBQUEsWUFBWSxHQUFHLFNBQVMsQ0FBQyxVQUFVQSxVQUFTLFNBQVMsT0FBTyxHQUFHQSxLQUFJLENBQUM7QUFBQSxFQUM3RTtBQUFBLEVBQ0EsT0FBTyxNQUEwQztBQUMvQyxVQUFNLENBQUMsU0FBUyxHQUFHLElBQUksSUFBSTtBQUMzQixXQUFPLFlBQVksSUFBSSxTQUFTLEdBQUcsSUFBSTtBQUFBLEVBQ3pDO0FBQUEsRUFDQSxRQUFRLE1BQTJDO0FBQ2pELFVBQU0sQ0FBQyxTQUFTLEdBQUcsSUFBSSxJQUFJO0FBQzNCLFdBQU8sWUFBWSxLQUFLLFNBQVMsR0FBRyxJQUFJO0FBQUEsRUFDMUM7QUFBQSxFQUNBLFVBQVUsTUFBNkM7QUFDckQsVUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJLElBQUk7QUFDM0IsV0FB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
