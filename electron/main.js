const { app, BrowserWindow, ipcMain, shell, session, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')

let mainWindow = null
const DATA_DIR = path.join(app.getPath('userData'), 'vox-data')
const EXT_DIR = path.join(app.getPath('userData'), 'extensions')
const EXE_PATH = process.execPath

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readJson(filename, fallback) {
  ensureDir(DATA_DIR)
  const p = path.join(DATA_DIR, filename)
  if (!fs.existsSync(p)) return fallback
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) } catch { return fallback }
}

function writeJson(filename, data) {
  ensureDir(DATA_DIR)
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf-8')
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 600,
    minHeight: 400,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1a1b26',
    title: 'Vox',
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      sandbox: false,
    },
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    mainWindow.loadURL(devUrl)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }



  mainWindow.webContents.on('did-fail-load', (_, code, desc) => {
    console.error('[Vox] load failed:', code, desc)
  })

  mainWindow.webContents.on('crashed', () => {
    console.error('[Vox] renderer crashed!')
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

function loadExtensions() {
  ensureDir(EXT_DIR)
  const dirs = fs.readdirSync(EXT_DIR).filter(d => {
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(EXT_DIR, d, 'manifest.json'), 'utf-8'))
      return manifest.manifest_version === 2 || manifest.manifest_version === 3
    } catch { return false }
  })
  for (const dir of dirs) {
    try {
      session.defaultSession.loadExtension(path.join(EXT_DIR, dir))
      console.log(`[Vox] loaded extension: ${dir}`)
    } catch (e) {
      console.error(`[Vox] failed to load extension ${dir}:`, e.message)
    }
  }
}

process.on('uncaughtException', (err) => {
  console.error('[Vox] uncaught:', err)
})

process.on('unhandledRejection', (err) => {
  console.error('[Vox] unhandled:', err)
})

app.whenReady().then(() => {
  createWindow()

  // Permissive CSP for web content
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders }

    // Remove restrictive CSP from responses (allows extensions + web content)
    delete headers['content-security-policy']
    delete headers['content-security-policy-report-only']

    // Add permissive CSP for the renderer
    if (details.url.includes('localhost') || details.url.startsWith('file://')) {
      headers['Content-Security-Policy'] = [
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob: chrome-extension:; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: chrome-extension:; media-src * data: blob:; style-src * 'unsafe-inline'; font-src * data:;"
      ]
    }

    callback({ responseHeaders: headers })
  })

  // Grant webview permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    // Allow all permissions for webviews
    callback(true)
  })

  session.defaultSession.setPermissionCheckHandler(() => true)

  // Load extensions from userData/extensions/
  loadExtensions()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('win:minimize', () => mainWindow?.minimize())
ipcMain.on('win:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('win:close', () => mainWindow?.close())

ipcMain.handle('data:read', (_, filename, fallback) => readJson(filename, fallback))
ipcMain.handle('data:write', (_, filename, data) => writeJson(filename, data))

ipcMain.handle('dialog:dir', async () => {
  const r = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] })
  return r.filePaths[0] || null
})

ipcMain.handle('shell:external', (_, url) => shell.openExternal(url))

ipcMain.handle('ext:install', async (_, crxUrl) => {
  // For unpacked extensions, user places them in userData/extensions/<name>/
  // This handler opens the extensions directory
  shell.openPath(EXT_DIR)
})

ipcMain.handle('ext:list', () => {
  ensureDir(EXT_DIR)
  return fs.readdirSync(EXT_DIR).filter(d => {
    try {
      const m = JSON.parse(fs.readFileSync(path.join(EXT_DIR, d, 'manifest.json'), 'utf-8'))
      return m.manifest_version === 2 || m.manifest_version === 3
    } catch { return false }
  })
})

// ─── Downloads ────────────────────────────────────
session.defaultSession.on('will-download', (event, item) => {
  const info = {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    filename: item.getFilename(),
    url: item.getURL(),
    totalBytes: item.getTotalBytes(),
    receivedBytes: 0,
    state: 'progressing',
    startTime: Date.now(),
  }
  if (mainWindow) mainWindow.webContents.send('download:start', info)

  item.on('updated', (event, state) => {
    if (state === 'progressing' && !item.isPaused()) {
      info.receivedBytes = item.getReceivedBytes()
      if (mainWindow) mainWindow.webContents.send('download:progress', { id: info.id, receivedBytes: info.receivedBytes })
    }
  })
  item.once('done', (event, state) => {
    info.state = state
    info.receivedBytes = item.getReceivedBytes()
    if (mainWindow) mainWindow.webContents.send('download:done', { id: info.id, state, receivedBytes: info.receivedBytes })
  })
})

// ─── Default browser ──────────────────────────────
ipcMain.handle('browser:setDefault', async () => {
  try {
    // Register http/https protocols to point to Vox
    app.setAsDefaultProtocolClient('http', EXE_PATH, ['%1'])
    app.setAsDefaultProtocolClient('https', EXE_PATH, ['%1'])
    app.setAsDefaultProtocolClient('vox', EXE_PATH, ['%1'])

    // Also try to set via Windows registry (requires admin, best-effort)
    const cmd = `reg add "HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice" /v ProgId /t REG_SZ /d "VoxHTTP" /f`
    exec(cmd, () => {})

    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('browser:openDefaultApps', async () => {
  shell.openExternal('ms-settings:defaultapps')
})

ipcMain.handle('browser:getPath', () => {
  return EXE_PATH
})
