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
  // API spécifique pour l'application de caisse
  printReceipt: (htmlContent) => ipcRenderer.invoke("print-receipt", htmlContent),
  getPrinters: () => ipcRenderer.invoke("get-printers"),
  setPrinter: (printerName) => ipcRenderer.invoke("set-printer", printerName),
  openDevTools: () => ipcRenderer.invoke("open-dev-tools"),
  minimize: () => ipcRenderer.invoke("window-minimize"),
  maximize: () => ipcRenderer.invoke("window-maximize"),
  close: () => ipcRenderer.invoke("window-close")
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlbG9hZC5qcyIsInNvdXJjZXMiOlsicHJlbG9hZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjb250ZXh0QnJpZGdlLCBpcGNSZW5kZXJlciB9IGZyb20gJ2VsZWN0cm9uJ1xyXG5cclxuLy8gLS0tLS0tLS0tIEV4cG9zZSBzb21lIEFQSSB0byB0aGUgUmVuZGVyZXIgcHJvY2VzcyAtLS0tLS0tLS1cclxuY29udGV4dEJyaWRnZS5leHBvc2VJbk1haW5Xb3JsZCgnZWxlY3Ryb25BUEknLCB7XHJcbiAgb24oLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgaXBjUmVuZGVyZXIub24+KSB7XHJcbiAgICBjb25zdCBbY2hhbm5lbCwgbGlzdGVuZXJdID0gYXJnc1xyXG4gICAgcmV0dXJuIGlwY1JlbmRlcmVyLm9uKGNoYW5uZWwsIChldmVudCwgLi4uYXJncykgPT4gbGlzdGVuZXIoZXZlbnQsIC4uLmFyZ3MpKVxyXG4gIH0sXHJcbiAgb2ZmKC4uLmFyZ3M6IFBhcmFtZXRlcnM8dHlwZW9mIGlwY1JlbmRlcmVyLm9mZj4pIHtcclxuICAgIGNvbnN0IFtjaGFubmVsLCAuLi5vbWl0XSA9IGFyZ3NcclxuICAgIHJldHVybiBpcGNSZW5kZXJlci5vZmYoY2hhbm5lbCwgLi4ub21pdClcclxuICB9LFxyXG4gIHNlbmQoLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgaXBjUmVuZGVyZXIuc2VuZD4pIHtcclxuICAgIGNvbnN0IFtjaGFubmVsLCAuLi5vbWl0XSA9IGFyZ3NcclxuICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kKGNoYW5uZWwsIC4uLm9taXQpXHJcbiAgfSxcclxuICBpbnZva2UoLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgaXBjUmVuZGVyZXIuaW52b2tlPikge1xyXG4gICAgY29uc3QgW2NoYW5uZWwsIC4uLm9taXRdID0gYXJnc1xyXG4gICAgcmV0dXJuIGlwY1JlbmRlcmVyLmludm9rZShjaGFubmVsLCAuLi5vbWl0KVxyXG4gIH0sXHJcblxyXG4gIC8vIEFQSSBzcMOpY2lmaXF1ZSBwb3VyIGwnYXBwbGljYXRpb24gZGUgY2Fpc3NlXHJcbiAgcHJpbnRSZWNlaXB0OiAoaHRtbENvbnRlbnQ6IHN0cmluZykgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdwcmludC1yZWNlaXB0JywgaHRtbENvbnRlbnQpLFxyXG4gIGdldFByaW50ZXJzOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ2dldC1wcmludGVycycpLFxyXG4gIHNldFByaW50ZXI6IChwcmludGVyTmFtZTogc3RyaW5nKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3NldC1wcmludGVyJywgcHJpbnRlck5hbWUpLFxyXG4gIG9wZW5EZXZUb29sczogKCkgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdvcGVuLWRldi10b29scycpLFxyXG4gIG1pbmltaXplOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3dpbmRvdy1taW5pbWl6ZScpLFxyXG4gIG1heGltaXplOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3dpbmRvdy1tYXhpbWl6ZScpLFxyXG4gIGNsb3NlOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ3dpbmRvdy1jbG9zZScpLFxyXG59KVxyXG5cclxuLy8gLS0tLS0tLS0tIFByZWxvYWQgc2NyaXB0cyBsb2FkaW5nIC0tLS0tLS0tLVxyXG5mdW5jdGlvbiBkb21SZWFkeShjb25kaXRpb246IERvY3VtZW50UmVhZHlTdGF0ZVtdID0gWydjb21wbGV0ZScsICdpbnRlcmFjdGl2ZSddKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICBpZiAoY29uZGl0aW9uLmluY2x1ZGVzKGRvY3VtZW50LnJlYWR5U3RhdGUpKSB7XHJcbiAgICAgIHJlc29sdmUodHJ1ZSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5c3RhdGVjaGFuZ2UnLCAoKSA9PiB7XHJcbiAgICAgICAgaWYgKGNvbmRpdGlvbi5pbmNsdWRlcyhkb2N1bWVudC5yZWFkeVN0YXRlKSkge1xyXG4gICAgICAgICAgcmVzb2x2ZSh0cnVlKVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH1cclxuICB9KVxyXG59XHJcblxyXG5jb25zdCBzYWZlRE9NID0ge1xyXG4gIGFwcGVuZChwYXJlbnQ6IEhUTUxFbGVtZW50LCBjaGlsZDogSFRNTEVsZW1lbnQpIHtcclxuICAgIGlmICghQXJyYXkuZnJvbShwYXJlbnQuY2hpbGRyZW4pLmZpbmQoYyA9PiBjID09PSBjaGlsZCkpIHtcclxuICAgICAgcmV0dXJuIHBhcmVudC5hcHBlbmRDaGlsZChjaGlsZClcclxuICAgIH1cclxuICB9LFxyXG4gIHJlbW92ZShwYXJlbnQ6IEhUTUxFbGVtZW50LCBjaGlsZDogSFRNTEVsZW1lbnQpIHtcclxuICAgIGlmIChBcnJheS5mcm9tKHBhcmVudC5jaGlsZHJlbikuZmluZChjID0+IGMgPT09IGNoaWxkKSkge1xyXG4gICAgICByZXR1cm4gcGFyZW50LnJlbW92ZUNoaWxkKGNoaWxkKVxyXG4gICAgfVxyXG4gIH0sXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBodHRwczovL3RvYmlhc2FobGluLmNvbS9zcGlua2l0XHJcbiAqIGh0dHBzOi8vY29ubm9yYXRoZXJ0b24uY29tL2xvYWRlcnNcclxuICogaHR0cHM6Ly9wcm9qZWN0cy5sdWtlaGFhcy5tZS9jc3MtbG9hZGVyc1xyXG4gKiBodHRwczovL21hdGVqa3VzdGVjLmdpdGh1Yi5pby9TcGluVGhhdFNoaXRcclxuICovXHJcbmZ1bmN0aW9uIHVzZUxvYWRpbmcoKSB7XHJcbiAgY29uc3QgY2xhc3NOYW1lID0gYGxvYWRlcnMtY3NzX19zcXVhcmUtc3BpbmBcclxuICBjb25zdCBzdHlsZUNvbnRlbnQgPSBgXHJcbkBrZXlmcmFtZXMgc3F1YXJlLXNwaW4ge1xyXG4gIDI1JSB7IFxyXG4gICAgdHJhbnNmb3JtOiBwZXJzcGVjdGl2ZSgxMDBweCkgcm90YXRlWCgxODBkZWcpIHJvdGF0ZVkoMCk7IFxyXG4gIH1cclxuICA1MCUgeyBcclxuICAgIHRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTAwcHgpIHJvdGF0ZVgoMTgwZGVnKSByb3RhdGVZKDE4MGRlZyk7IFxyXG4gIH1cclxuICA3NSUgeyBcclxuICAgIHRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTAwcHgpIHJvdGF0ZVgoMCkgcm90YXRlWSgxODBkZWcpOyBcclxuICB9XHJcbiAgMTAwJSB7IFxyXG4gICAgdHJhbnNmb3JtOiBwZXJzcGVjdGl2ZSgxMDBweCkgcm90YXRlWCgwKSByb3RhdGVZKDApOyBcclxuICB9XHJcbn1cclxuLiR7Y2xhc3NOYW1lfSA+IGRpdiB7XHJcbiAgYW5pbWF0aW9uLWZpbGwtbW9kZTogYm90aDtcclxuICB3aWR0aDogNTBweDtcclxuICBoZWlnaHQ6IDUwcHg7XHJcbiAgYmFja2dyb3VuZDogI2ZmZjtcclxuICBhbmltYXRpb246IHNxdWFyZS1zcGluIDNzIDBzIGN1YmljLWJlemllcigwLjA5LCAwLjU3LCAwLjQ5LCAwLjkpIGluZmluaXRlO1xyXG59XHJcbi5hcHAtbG9hZGluZy13cmFwIHtcclxuICBwb3NpdGlvbjogZml4ZWQ7XHJcbiAgdG9wOiAwO1xyXG4gIGxlZnQ6IDA7XHJcbiAgd2lkdGg6IDEwMHZ3O1xyXG4gIGhlaWdodDogMTAwdmg7XHJcbiAgZGlzcGxheTogZmxleDtcclxuICBhbGlnbi1pdGVtczogY2VudGVyO1xyXG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xyXG4gIGJhY2tncm91bmQ6ICMyODJjMzQ7XHJcbiAgei1pbmRleDogOTtcclxufVxyXG4gICAgYFxyXG4gIGNvbnN0IG9TdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcclxuICBjb25zdCBvRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuXHJcbiAgb1N0eWxlLmlkID0gJ2FwcC1sb2FkaW5nLXN0eWxlJ1xyXG4gIG9TdHlsZS5pbm5lckhUTUwgPSBzdHlsZUNvbnRlbnRcclxuICBvRGl2LmNsYXNzTmFtZSA9ICdhcHAtbG9hZGluZy13cmFwJ1xyXG4gIG9EaXYuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCIke2NsYXNzTmFtZX1cIj48ZGl2PjwvZGl2PjwvZGl2PmBcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGFwcGVuZExvYWRpbmcoKSB7XHJcbiAgICAgIHNhZmVET00uYXBwZW5kKGRvY3VtZW50LmhlYWQsIG9TdHlsZSlcclxuICAgICAgc2FmZURPTS5hcHBlbmQoZG9jdW1lbnQuYm9keSwgb0RpdilcclxuICAgIH0sXHJcbiAgICByZW1vdmVMb2FkaW5nKCkge1xyXG4gICAgICBzYWZlRE9NLnJlbW92ZShkb2N1bWVudC5oZWFkLCBvU3R5bGUpXHJcbiAgICAgIHNhZmVET00ucmVtb3ZlKGRvY3VtZW50LmJvZHksIG9EaXYpXHJcbiAgICB9LFxyXG4gIH1cclxufVxyXG5cclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuY29uc3QgeyBhcHBlbmRMb2FkaW5nLCByZW1vdmVMb2FkaW5nIH0gPSB1c2VMb2FkaW5nKClcclxuZG9tUmVhZHkoKS50aGVuKGFwcGVuZExvYWRpbmcpXHJcblxyXG53aW5kb3cub25tZXNzYWdlID0gKGV2KSA9PiB7XHJcbiAgZXYuZGF0YS5wYXlsb2FkID09PSAncmVtb3ZlTG9hZGluZycgJiYgcmVtb3ZlTG9hZGluZygpXHJcbn1cclxuXHJcbnNldFRpbWVvdXQocmVtb3ZlTG9hZGluZywgNDk5OSkiXSwibmFtZXMiOlsiYXJncyJdLCJtYXBwaW5ncyI6IjtBQUdBLGNBQWMsa0JBQWtCLGVBQWU7QUFBQSxFQUM3QyxNQUFNLE1BQXlDO0FBQ3ZDLFVBQUEsQ0FBQyxTQUFTLFFBQVEsSUFBSTtBQUNyQixXQUFBLFlBQVksR0FBRyxTQUFTLENBQUMsVUFBVUEsVUFBUyxTQUFTLE9BQU8sR0FBR0EsS0FBSSxDQUFDO0FBQUEsRUFDN0U7QUFB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
