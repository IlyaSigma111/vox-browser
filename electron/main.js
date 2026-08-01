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

  installRequestFilters()

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

const TRACK_HOSTS = [
  'hubspot.com', 'pardot.com', 'salesloft.com', 'outreach.io', 'liveperson.com', 'genesys.com',
  'evergage.com', 'insightgrit.com', 'clarity.ms', 'adobe.com', 'demandbase.com', '6sense.com',
  'zoominfo.com', 'bombora.com', 'g2crowd.com', 'trustpilot.com', 'reviews.io', 'pricepirates.com',
  'appsflyer.com', 'adjust.com', 'kochava.com', 'singular.net', 'attribution-app.com',
]

const privacyState = { adblock: false, refstrip: false, dnt: false, imagelite: false, trackhide: false, cleanurl: false, webrtc: false, autodelete: false }
const UA_OVERRIDE = { value: '' }

function voxSessions() {
  const out = [session.defaultSession]
  try { out.push(session.fromPartition('persist:vox')) } catch {}
  return out
}

function installRequestFilters() {
  for (const ses of voxSessions()) {
    ses.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
      try {
        const u = new URL(details.url)
        const host = u.hostname.toLowerCase()
        const domain = host.split('.').slice(-2).join('.')
        if (privacyState.adblock && AD_HOSTS.includes(domain)) { callback({ cancel: true }); return }
        if (privacyState.trackhide && TRACK_HOSTS.includes(domain)) { callback({ cancel: true }); return }
        if (privacyState.imagelite && details.resourceType === 'image') {
          let refHost = ''
          try { refHost = details.referrer ? new URL(details.referrer).hostname.toLowerCase() : '' } catch {}
          if (refHost && refHost !== host) { callback({ cancel: true }); return }
        }
        if (privacyState.cleanurl && u.search) {
          const sp = u.searchParams
          let changed = false
          for (const p of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'yclid', 'mc_cid', 'mc_eid', 'ref']) {
            if (sp.has(p)) { sp.delete(p); changed = true }
          }
          if (changed) { u.search = sp.toString(); callback({ redirectURL: u.toString() }); return }
        }
      } catch {}
      callback({})
    })

    ses.webRequest.onBeforeSendHeaders({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
      const req = { ...details.requestHeaders }
      if (privacyState.refstrip && req['Referer']) delete req['Referer']
      if (privacyState.dnt) req['DNT'] = '1'
      callback({ requestHeaders: req })
    })

    ses.setPermissionRequestHandler((webContents, permission, callback) => {
      if (privacyState.webrtc && (permission === 'media' || permission === 'mediaKeySystem')) { callback(false); return }
      callback(true)
    })
    ses.setPermissionCheckHandler((wc, permission) => {
      if (privacyState.webrtc && (permission === 'media' || permission === 'mediaKeySystem')) return false
      return true
    })

    if (UA_OVERRIDE.value) ses.setUserAgent(UA_OVERRIDE.value)
  }
}

ipcMain.on('adblock:set', (_, on) => {
  privacyState.adblock = !!on
  installRequestFilters()
  console.log('[Vox] adblock', on ? 'ON' : 'OFF')
})

ipcMain.on('privacy:set', (_, cfg) => {
  if (cfg && typeof cfg === 'object') {
    for (const k of ['refstrip', 'dnt', 'imagelite', 'trackhide', 'cleanurl', 'webrtc', 'autodelete']) {
      if (typeof cfg[k] === 'boolean') privacyState[k] = cfg[k]
    }
    if (typeof cfg.ua === 'string') UA_OVERRIDE.value = cfg.ua || ''
    else if (cfg.ua === null) UA_OVERRIDE.value = ''
  }
  installRequestFilters()
})

ipcMain.handle('privacy:clearCache', async () => {
  for (const ses of voxSessions()) await ses.clearCache().catch(() => {})
  return true
})

ipcMain.handle('privacy:cookies', async () => {
  const all = []
  for (const ses of voxSessions()) {
    try {
      const list = await ses.cookies.get({})
      all.push(...list.map(c => ({ name: c.name, domain: c.domain, expires: c.expirationDate || 0 })))
    } catch {}
  }
  return all
})

ipcMain.handle('privacy:clearSite', async (_, origin) => {
  for (const ses of voxSessions()) await ses.clearStorageData({ origin }).catch(() => {})
  return true
})

ipcMain.on('privacy:ttl', (_, days) => {
  const d = Number(days)
  if (!(d > 0)) return
  const cutoff = Date.now() - d * 86400000
  for (const ses of voxSessions()) {
    ses.cookies.get({}).then(list => {
      for (const c of list) {
        if (c.expirationDate && c.expirationDate * 1000 < cutoff) {
          ses.cookies.remove(c.url, c.name).catch(() => {})
        }
      }
    }).catch(() => {})
  }
})

ipcMain.handle('privacy:clearAllCookies', async () => {
  for (const ses of voxSessions()) {
    const list = await ses.cookies.get({}).catch(() => [])
    for (const c of list) await ses.cookies.remove(c.url, c.name).catch(() => {})
  }
  return true
})

app.on('before-quit', async (e) => {
  if (!privacyState.autodelete) return
  e.preventDefault()
  try {
    for (const ses of voxSessions()) {
      const list = await ses.cookies.get({}).catch(() => [])
      for (const c of list) await ses.cookies.remove(c.url, c.name).catch(() => {})
    }
  } catch {}
  app.exit(0)
})

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

// ─── Clipboard ────────────────────────────────────
ipcMain.handle('clipboard:read', () => {
  try { return clipboard.readText() } catch { return '' }
})
ipcMain.handle('clipboard:write', (_, txt) => {
  try { clipboard.writeText(String(txt)) } catch {}
  return true
})
