// Android bridge shim — Vox React UI running inside a native WebView.
// `window.AndroidVox` is injected by Kotlin (MainActivity.addJavascriptInterface).
// This file installs `window.onyx` (same API as Electron's preload), a fake
// `<webview>` object so ALL of WebContent's event/injection logic is reused
// untouched, and a native-event dispatcher.

import { useStore } from '../store'

export const isAndroid = !!(window as any).AndroidVox

type Listener = (e: any) => void

class FakeWv {
  isFake = true
  id: string
  url: string
  title = ''
  favicon = ''
  loading = false
  private listeners: Record<string, Listener[]> = {}

  constructor(id: string, url: string) {
    this.id = id
    this.url = url
    fakeMap.set(id, this)
  }

  addEventListener(ev: string, fn: Listener) {
    ;(this.listeners[ev] = this.listeners[ev] || []).push(fn)
  }
  removeEventListener(ev: string, fn: Listener) {
    const a = this.listeners[ev]
    if (a) this.listeners[ev] = a.filter(f => f !== fn)
  }
  dispatch(ev: string, e: any = {}) {
    const a = this.listeners[ev] || []
    for (const fn of a) { try { fn(e) } catch {} }
  }

  executeJavaScript(js: string): Promise<any> {
    return new Promise<any>(res => {
      let out = 'null'
      try { out = (window as any).AndroidVox.evaluate(this.id, js) || 'null' } catch {}
      try { res(JSON.parse(out)) } catch { res(String(out)) }
    })
  }
  loadURL(u: string): Promise<void> {
    this.url = u
    try { (window as any).AndroidVox.navigate(this.id, u) } catch {}
    return Promise.resolve()
  }
  reload() { try { (window as any).AndroidVox.reload(this.id) } catch {} }
  goBack() { try { (window as any).AndroidVox.goBack(this.id) } catch {} }
  goForward() { try { (window as any).AndroidVox.goForward(this.id) } catch {} }
  canGoBack() { return false }
  canGoForward() { return false }
  setZoomFactor(z: number) { try { (window as any).AndroidVox.setZoom(this.id, z) } catch {} }
  setAudioMuted(m: boolean) { try { (window as any).AndroidVox.setAudioMuted(this.id, m) } catch {} }
  getTitle() { return this.title }
  getURL() { return this.url }
  getWebContentsId() { return this.id }
  focus() {}
}

export const fakeMap = new Map<string, FakeWv>()

export function getFakeWv(id: string, url: string): FakeWv {
  let w = fakeMap.get(id)
  if (!w) w = new FakeWv(id, url)
  else if (url && url !== w.url) w.url = url
  return w
}

// ─── Native → JS event dispatcher (called by Kotlin via evaluateJavascript) ───
export function dispatchNative(ev: string, data: any) {
  if (ev === 'nav-request') {
    const st = useStore.getState()
    const t = st.tabs.find(x => x.id === st.activeId)
    const text = (data && data.text) || ''
    if (text === 'about:blank' || text === '') {
      st.navigateTo(st.activeId, 'about:blank')
      return
    }
    st.navigateTo(st.activeId, text)
    return
  }
  if (ev === 'new-tab') {
    useStore.getState().addTab()
    return
  }
  if (ev === 'close-tab') {
    useStore.getState().closeTab(useStore.getState().activeId)
    return
  }
  if (ev === 'toast') {
    useStore.getState().pushToast(String((data && data.text) || ''))
    return
  }
  const id = data && data.id
  if (!id) return
  const wv = fakeMap.get(id)
  if (!wv) return
  if (ev === 'did-start-loading') wv.loading = true
  if (ev === 'did-stop-loading') wv.loading = false
  if (ev === 'page-title-updated' && data.title) wv.title = data.title
  if (ev === 'page-favicon-updated' && data.favicons?.length) wv.favicon = data.favicons[0]
  if (ev === 'did-navigate' && data.url) { wv.url = data.url; wv.loading = false }
  if (ev === 'did-navigate-in-page' && data.url) { wv.url = data.url; wv.loading = false }
  wv.dispatch(ev, data)
}

function bridge(): any {
  return (window as any).AndroidVox || {}
}

// ─── Install window.onyx ──────────────────────────────────────────────────────
export function installOnyx() {
  if (!isAndroid) return
  ;(window as any).voxNativeMessage = dispatchNative
  if ((window as any).onyx) return
  const B = bridge()

  const onyx = {
    isAndroid: true,
    minimize: () => {},
    maximize: () => {},
    close: () => { try { B.quit() } catch {} },

    readData: (f: string, fb: any) => new Promise<any>(res => {
      let raw = ''
      try { raw = B.readData(f) || '' } catch {}
      if (!raw) { res(fb ?? null); return }
      try { res(JSON.parse(raw)) } catch { res(fb ?? raw) }
    }),

    writeData: (f: string, d: any) => new Promise<void>(res => {
      try { B.writeData(f, JSON.stringify(d ?? null)) } catch {}
      res()
    }),

    openDir: () => Promise.resolve(null),
    openExternal: (u: string) => Promise.resolve(B.openExternal(u)),
    openPath: () => Promise.resolve(),
    showInFolder: () => Promise.resolve(),
    getWebviewPreload: () => '',
    setDefaultBrowser: () => Promise.resolve({ success: true }),
    openDefaultApps: () => Promise.resolve(),
    getBrowserPath: () => Promise.resolve(''),
    toggleFullscreen: () => {},
    listExtensions: () => Promise.resolve([]),
    openExtensionsFolder: () => Promise.resolve(),
    cancelDownload: () => {},
    pauseDownload: () => {},
    resumeDownload: () => {},
    saveShot: (buf: ArrayBuffer, name: string) => {
      try {
        const b64 = arrayBufToB64(buf)
        B.saveShot(b64, name)
      } catch {}
      return Promise.resolve('')
    },
    copyImage: (buf: ArrayBuffer) => {
      try { B.copyImage(arrayBufToB64(buf)) } catch {}
      return Promise.resolve()
    },
    pipOpen: () => Promise.resolve(),
    setAdblock: (enabled: boolean) => { try { B.setAdblock(enabled) } catch {} },
    setPrivacy: (cfg: any) => { try { B.setPrivacy(JSON.stringify(cfg)) } catch {} },
    setCookieTtl: () => {},
    saveBackup: () => Promise.resolve(''),
    loadBackup: () => Promise.resolve(null),
    clearCache: () => new Promise<void>(res => { try { B.clearCache() } catch {}; res() }),
    getCookies: () => new Promise<any>(res => {
      let raw = ''
      try { raw = B.getCookies() || '[]' } catch {}
      try { res(JSON.parse(raw)) } catch { res([]) }
    }),
    clearSiteData: (origin: string) => new Promise<void>(res => { try { B.clearSiteData(origin) } catch {}; res() }),
    clearAllCookies: () => new Promise<void>(res => { try { B.clearAllCookies() } catch {}; res() }),
    readClipboard: () => { try { return B.readClipboard() || '' } catch { return '' } },
    writeClipboard: (s: string) => { try { B.writeClipboard(s) } catch {} },
    onDownloadStart: (cb: (i: any) => void) => { (window as any).voxDlStart = cb },
    onDownloadProgress: (cb: (d: any) => void) => { (window as any).voxDlProgress = cb },
    onDownloadDone: (cb: (d: any) => void) => { (window as any).voxDlDone = cb },
  }

  ;(window as any).onyx = onyx
}

function arrayBufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)))
  }
  return btoa(bin)
}

declare global {
  interface Window {
    AndroidVox?: {
      readData: (f: string) => string
      writeData: (f: string, d: string) => void
      createTab: (id: string, url: string) => void
      destroyTab: (id: string) => void
      setActiveTab: (id: string) => void
      navigate: (id: string, url: string) => void
      reload: (id: string) => void
      goBack: (id: string) => void
      goForward: (id: string) => void
      setZoom: (id: string, z: number) => void
      setAudioMuted: (id: string, m: boolean) => void
      setInjections: (id: string, js: string) => void
      setAdblock: (enabled: boolean) => void
      setPrivacy: (cfg: string) => void
      setThemeBg: (color: string) => void
      evaluate: (id: string, js: string) => string
      openExternal: (u: string) => void
      setMainRect: (x: number, y: number, w: number, h: number) => void
      quit: () => void
      saveShot: (b64: string, name: string) => void
      copyImage: (b64: string) => void
      readClipboard: () => string
      writeClipboard: (s: string) => void
      getCookies: () => string
      clearSiteData: (origin: string) => void
      clearAllCookies: () => void
      clearCache: () => void
    }
    voxNativeMessage: (ev: string, data: any) => void
  }
}

installOnyx()
