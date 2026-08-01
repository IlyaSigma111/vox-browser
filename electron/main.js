const { app, BrowserWindow, ipcMain, shell, session, dialog, clipboard } = require('electron')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')

let mainWindow = null
let pipWindow = null
let dlItems = new Map()
const DATA_DIR = path.join(app.getPath('userData'), 'vox-data')
const EXT_DIR = path.join(app.getPath('userData'), 'extensions')
const SHOTS_DIR = path.join(app.getPath('userData'), 'vox-shots')
const EXE_PATH = process.execPath

// Spoof user agent so Google doesn't block sign-in
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

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
  // Spoof user agent globally (Google blocks Electron's default UA)
  session.defaultSession.setUserAgent(CHROME_UA)

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

  // Downloads
  session.defaultSession.on('will-download', (event, item) => {
    const info = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      filename: item.getFilename(),
      url: item.getURL(),
      totalBytes: item.getTotalBytes(),
      receivedBytes: 0,
      state: 'progressing',
      startTime: Date.now(),
      savePath: item.getSavePath() || '',
    }
    dlItems.set(info.id, item)
    if (mainWindow) mainWindow.webContents.send('download:start', info)

    item.on('updated', (event, state) => {
      info.receivedBytes = item.getReceivedBytes()
      info.state = state
      if (mainWindow) mainWindow.webContents.send('download:progress', { id: info.id, receivedBytes: info.receivedBytes, state })
    })
    item.once('done', (event, state) => {
      info.state = state
      info.receivedBytes = item.getReceivedBytes()
      info.savePath = item.getSavePath()
      dlItems.delete(info.id)
      if (mainWindow) mainWindow.webContents.send('download:done', { id: info.id, state, receivedBytes: info.receivedBytes, savePath: info.savePath })
    })
  })

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
// (registered inside app.whenReady below)

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

// ─── Window / fullscreen ──────────────────────────
ipcMain.on('win:fullscreen', () => {
  if (!mainWindow) return
  if (mainWindow.isFullScreen()) mainWindow.setFullScreen(false)
  else mainWindow.setFullScreen(true)
})

// ─── Downloads control ────────────────────────────
ipcMain.on('download:cancel', (_, id) => {
  const item = dlItems.get(id)
  if (item) item.cancel()
})
ipcMain.on('download:pause', (_, id) => {
  const item = dlItems.get(id)
  if (item && !item.isPaused()) item.pause()
})
ipcMain.on('download:resume', (_, id) => {
  const item = dlItems.get(id)
  if (item && item.isPaused()) item.resume()
})

// ─── Shell helpers ────────────────────────────────
ipcMain.handle('shell:openPath', async (_, p) => {
  const r = await shell.openPath(p)
  return r || null
})
ipcMain.handle('shell:showInFolder', async (_, p) => {
  shell.showItemInFolder(p)
})

// ─── Extensions ───────────────────────────────────
ipcMain.handle('ext:openFolder', () => {
  ensureDir(EXT_DIR)
  shell.openPath(EXT_DIR)
})

// ─── Screenshots ──────────────────────────────────
ipcMain.handle('shot:save', async (_, buffer, name) => {
  ensureDir(SHOTS_DIR)
  const file = path.join(SHOTS_DIR, name)
  fs.writeFileSync(file, Buffer.from(buffer))
  return file
})
ipcMain.handle('shot:copy', async (_, buffer) => {
  clipboard.writeImage(require('electron').nativeImage.createFromBuffer(Buffer.from(buffer)))
})

// ─── Page PiP ─────────────────────────────────────
ipcMain.handle('pip:open', async (_, url, title) => {
  if (pipWindow && !pipWindow.isDestroyed()) pipWindow.close()
  pipWindow = new BrowserWindow({
    width: 480,
    height: 320,
    minWidth: 240,
    minHeight: 160,
    frame: false,
    alwaysOnTop: true,
    backgroundColor: '#1a1b26',
    title: title || 'Vox PiP',
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })
  pipWindow.setAlwaysOnTop(true, 'screen-saver')
  pipWindow.setTitle(title || 'Vox PiP')
  if (url) pipWindow.loadURL(url)
  pipWindow.on('closed', () => { pipWindow = null })
  return true
})
ipcMain.on('pip:close', () => {
  if (pipWindow && !pipWindow.isDestroyed()) pipWindow.close()
})

// ─── Ad Blocker ───────────────────────────────────
const AD_HOSTS = [
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'google-analytics.com',
  'googletagmanager.com', 'facebook.com', 'facebook.net', 'twitter.com', 'x.com', 't.co',
  'adnxs.com', 'adsrvr.org', 'taboola.com', 'outbrain.com', 'criteo.com', 'rubiconproject.com',
  'moatads.com', 'advertising.com', 'yieldmo.com', 'pubmatic.com', 'openx.net', 'amazon-adsystem.com',
  'scorecardresearch.com', 'quantserve.com', 'sharethrough.com', 'teads.tv', 'spotxchange.com',
  'adroll.com', 'bing.com', 'adform.net', 'casalemedia.com', 'sovrn.com', 'media.net',
  'analytics.yahoo.com', 'flurry.com', 'branch.io', 'segment.com', 'mixpanel.com', 'hotjar.com',
  'fullstory.com', 'crazyegg.com', 'newrelic.com', 'amplitude.com', 'intercom.io', 'drift.com',
  'optimizely.com', 'vwo.com', 'mouseflow.com', 'smartadserver.com', 'undertone.com',
]

let adblockActive = false
let adblockListener = null

function applyAdblock(on) {
  if (on && !adblockListener) {
    adblockListener = (details, callback) => {
      try {
        const h = new URL(details.url).hostname.toLowerCase()
        const parts = h.split('.')
        const domain = parts.slice(-2).join('.')
        if (AD_HOSTS.includes(domain)) { callback({ cancel: true }); return }
      } catch {}
      callback({})
    }
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, adblockListener)
    adblockActive = true
    console.log('[Vox] adblock ON')
  } else if (!on && adblockListener) {
    try { session.defaultSession.webRequest.onBeforeRequest(null) } catch {}
    adblockListener = null
    adblockActive = false
    console.log('[Vox] adblock OFF')
  }
}

ipcMain.on('adblock:set', (_, on) => applyAdblock(!!on))

// ─── Backup ───────────────────────────────────────
ipcMain.handle('data:saveBackup', async (_, name, content) => {
  const r = await dialog.showSaveDialog(mainWindow, {
    defaultPath: path.join(app.getPath('downloads'), name),
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (r.canceled || !r.filePath) return null
  fs.writeFileSync(r.filePath, content, 'utf-8')
  return r.filePath
})

ipcMain.handle('data:loadBackup', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  })
  if (r.canceled || !r.filePaths[0]) return null
  return fs.readFileSync(r.filePaths[0], 'utf-8')
})
