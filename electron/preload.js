const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')

const webviewPreload = path.join(__dirname, 'webview-preload.js')

contextBridge.exposeInMainWorld('onyx', {
  minimize: () => ipcRenderer.send('win:minimize'),
  maximize: () => ipcRenderer.send('win:maximize'),
  close: () => ipcRenderer.send('win:close'),
  readData: (f, fb) => ipcRenderer.invoke('data:read', f, fb),
  writeData: (f, d) => ipcRenderer.invoke('data:write', f, d),
  openDir: () => ipcRenderer.invoke('dialog:dir'),
  openExternal: (u) => ipcRenderer.invoke('shell:external', u),
  getWebviewPreload: () => webviewPreload,
  setDefaultBrowser: () => ipcRenderer.invoke('browser:setDefault'),
  openDefaultApps: () => ipcRenderer.invoke('browser:openDefaultApps'),
  getBrowserPath: () => ipcRenderer.invoke('browser:getPath'),
})
