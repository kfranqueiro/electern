const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronApi", {
  downloadArchive: (url, filename) => ipcRenderer.invoke("download-archive", url, filename),
  viewArchive: (filename) => ipcRenderer.send("view-archive", filename),
  existsSync: (path) => ipcRenderer.sendSync("exists-sync", path),
  getUserDataPath: () => ipcRenderer.sendSync("get-user-data-path"),
  getWindowSize: () => ipcRenderer.invoke("get-window-size"),
  on: (event, callback) => ipcRenderer.on(event, callback),
  readFile: (path, options) => ipcRenderer.invoke("read-file", path, options),
  readFileSync: (path, options) => ipcRenderer.sendSync("read-file-sync", path, options),
  resolve: (...paths) => ipcRenderer.sendSync("resolve", ...paths),
  sanitizeHtml: (html, allowImages) => ipcRenderer.sendSync("sanitize-html", html, allowImages),
  setMenuEnabled: (enabled) => ipcRenderer.send("menu-enable", enabled),
  unlinkSync: (path) => ipcRenderer.sendSync("unlink-sync", path),
  writeFile: (path, data) => ipcRenderer.invoke("write-file", path, data),
  writeFileSync: (path, data) => ipcRenderer.sendSync("write-file-sync", path, data),
});
