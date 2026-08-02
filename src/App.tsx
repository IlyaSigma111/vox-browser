import React, { useState, useEffect, useRef } from 'react'
import { useStore, THEMES } from './store'
import { setLang } from './lang'
import BrowserToolbar from './components/BrowserToolbar'
import TabBar from './components/TabBar'
import StatusBar from './components/StatusBar'
import WebContent from './components/WebContent'
import Sidebar from './components/Sidebar'
import ZenSidebar from './components/ZenSidebar'
import CommandPalette from './components/CommandPalette'
import DynamicIsland from './components/DynamicIsland'
import HintOverlay from './components/HintOverlay'
import ShortcutOverlay from './components/ShortcutOverlay'
import FindBar from './components/FindBar'
import NewTabPage from './components/NewTabPage'
import TabExpose from './components/TabExpose'
import GrepOverlay from './components/GrepOverlay'
import SessionGraph from './components/SessionGraph'
import Onboarding from './components/Onboarding'
import SettingsPage from './components/SettingsPage'
import StorePage from './components/StorePage'
import StartModePicker from './components/StartModePicker'
import { FIREFOX_DARK, FIREFOX_LIGHT, modeSettings, type UiMode } from './modes'
import { LATEST_FEATURE_VERSION } from './features'
import { Icon } from './components/icons'
import { isAndroid } from './android/shim'
import './App.css'

function WorkspaceBar() {
  const tabs = useStore(s => s.tabs)
  const activeWorkspace = useStore(s => s.activeWorkspace)
  const workspaces = useStore(s => s.workspaces)
  const switchWorkspace = useStore(s => s.switchWorkspace)
  const [ctxMenu, setCtxMenu] = useState<{id: number, x: number, y: number} | null>(null)

  useEffect(() => {
    if (!ctxMenu) return
    const h = () => setCtxMenu(null)
    window.addEventListener('click', h)
    window.addEventListener('contextmenu', h)
    return () => { window.removeEventListener('click', h); window.removeEventListener('contextmenu', h) }
  }, [ctxMenu])

  return (
    <div className="workspace-bar">
      <div className="workspace-bar-inner">
        {workspaces.map(ws => (
          <button
            key={ws.id}
            className={`ws-btn${ws.id === activeWorkspace ? ' active' : ''}`}
            style={ws.id === activeWorkspace ? { background: ws.color, color: '#fff', boxShadow: `0 0 12px ${ws.color}60` } : undefined}
            onClick={() => switchWorkspace(ws.id)}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (workspaces.length <= 1) return
              setCtxMenu({ id: ws.id, x: e.clientX, y: e.clientY })
            }}
          >
            {ws.name}
            <span className="ws-count">{tabs.filter(t => t.workspace === ws.id).length}</span>
          </button>
        ))}
        <button className="ws-btn add" onClick={() => useStore.getState().addWorkspace()}>+</button>
      </div>
      {ctxMenu && (
        <div className="ws-ctx-menu" style={{ left: ctxMenu.x, top: ctxMenu.y }}>
          <button onClick={() => {
            const name = prompt('Rename workspace:', workspaces.find(w => w.id === ctxMenu.id)?.name)
            if (name !== null) useStore.getState().renameWorkspace(ctxMenu.id, name)
            setCtxMenu(null)
          }}>Rename</button>
          <button className="danger" onClick={() => {
            if (confirm('Delete this workspace and all its tabs?')) useStore.getState().removeWorkspace(ctxMenu.id)
            setCtxMenu(null)
          }}>Delete</button>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const tabs = useStore(s => s.tabs)
  const activeId = useStore(s => s.activeId)
  const activeWorkspace = useStore(s => s.activeWorkspace)
  const addTab = useStore(s => s.addTab)
  const closeTab = useStore(s => s.closeTab)
  const activate = useStore(s => s.activate)
  const setVimMode = useStore(s => s.setVimMode)
  const setPalette = useStore(s => s.setPalette)
  const vimEnabled = useStore(s => s.settings.vimEnabled)
  const settings = useStore(s => s.settings)
  const switchWorkspace = useStore(s => s.switchWorkspace)
  const setShowShortcuts = useStore(s => s.setShowShortcuts)
  const showShortcuts = useStore(s => s.showShortcuts)
  const showTabSearch = useStore(s => s.showTabSearch)
  const auroraColor = useStore(s => s.auroraColor)
  const [showFind, setShowFind] = useState(false)
  const [showWarmup, setShowWarmup] = useState(false)
  const [picked, setPicked] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  // Android: keep native webview overlay aligned with `.main` and pass theme bg
  useEffect(() => {
    if (!isAndroid) return
    const report = () => {
      const el = mainRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      try {
        ;(window as any).AndroidVox?.setMainRect?.(Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height))
      } catch {}
    }
    report()
    const ro = new ResizeObserver(() => report())
    if (mainRef.current) ro.observe(mainRef.current)
    const iv = setInterval(report, 600)
    return () => { ro.disconnect(); clearInterval(iv) }
  }, [settings.sidebarPosition, settings.sidebarWidth, settings.zenMode, settings.workspacePosition, settings.showStatusBar, settings.statusBarPosition, settings.showTabBar, settings.tabBarPosition])

  useEffect(() => {
    if (!isAndroid) return
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
    if (bg) {
      try { (window as any).AndroidVox?.setThemeBg?.(bg) } catch {}
    }
  }, [settings.theme, settings.customColors, auroraColor])

  const wsTabs = tabs.filter(t => t.workspace === activeWorkspace)

  // Toasts render + auto-dismiss is handled in store.pushToast
  const toasts = useStore(s => s.toasts)

  // Adblock wiring
  useEffect(() => {
    window.onyx?.setAdblock?.(settings.adblock)
  }, [settings.adblock])

  // Privacy wiring (referer strip, DNT, light images, tracker hide, clean URLs, WebRTC, UA)
  useEffect(() => {
    window.onyx?.setPrivacy?.({
      ua: settings.userAgent || null,
      refstrip: settings.refstrip,
      dnt: settings.dnt,
      imagelite: settings.imagelite,
      trackhide: settings.trackhide,
      cleanurl: settings.cleanurl,
      webrtc: settings.webrtc,
      autodelete: settings.autodelete,
    })
  }, [settings.userAgent, settings.refstrip, settings.dnt, settings.imagelite, settings.trackhide, settings.cleanurl, settings.webrtc, settings.autodelete])

  // Cookie TTL cleanup once on startup
  useEffect(() => {
    if (settings.cookieTtl && settings.cookieTtl > 0) window.onyx?.setCookieTtl?.(settings.cookieTtl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cookie-kill: sweep all cookies whenever the flag is on
  useEffect(() => {
    if (!settings.cookiekill) return
    window.onyx?.clearAllCookies?.().then(() => {
      useStore.getState().pushToast('Все куки удалены')
    }).catch(() => {})
  }, [settings.cookiekill])

  // Auto night / theme: dim the chrome when the flag is on and it's night time
  useEffect(() => {
    const apply = () => {
      const h = new Date().getHours()
      let night = false
      if (settings.nightauto) {
        const start = settings.nightAutoStart ?? 22
        const end = settings.nightAutoEnd ?? 7
        night = start <= end ? h >= start && h < end : h >= start || h < end
      } else if (settings.themeauto) {
        night = h < 6 || h >= 18
      }
      document.body.classList.toggle('vox-night', night)
    }
    apply()
    const iv = setInterval(apply, 60000)
    return () => clearInterval(iv)
  }, [settings.nightauto, settings.themeauto, settings.nightAutoStart, settings.nightAutoEnd])

  // UI chrome flags → body classes
  useEffect(() => {
    const map: Array<[string, boolean]> = [
      ['vox-amoled', settings.amoled],
      ['vox-roundui', settings.roundui],
      ['vox-density', settings.density],
      ['vox-glowui', settings.glowui],
      ['vox-tabgrad', settings.tabgrad],
      ['vox-ntpgrad', settings.ntpgrad],
      ['vox-docklift', settings.docklift],
      ['vox-cursorglow', settings.cursorglow],
      ['vox-gaming', settings.uiMode === 'gaming'],
      ['vox-debloat', settings.uiMode === 'debloat'],
    ]
    for (const [cls, on] of map) document.body.classList.toggle(cls, !!on)
    return () => { for (const [cls] of map) document.body.classList.remove(cls) }
  }, [settings.amoled, settings.roundui, settings.density, settings.glowui, settings.tabgrad, settings.ntpgrad, settings.docklift, settings.cursorglow, settings.uiMode])

  // Cursor glow — track the pointer so the light follows the mouse
  useEffect(() => {
    if (!settings.cursorglow) return
    const root = document.documentElement
    const h = (e: MouseEvent) => {
      root.style.setProperty('--cx', e.clientX + 'px')
      root.style.setProperty('--cy', e.clientY + 'px')
    }
    window.addEventListener('mousemove', h, { passive: true })
    return () => window.removeEventListener('mousemove', h)
  }, [settings.cursorglow])

  // Watch-timer toast (installs a "time tracker" on the active page once per session)
  useEffect(() => {
    if (!settings.watch) return
    const st = useStore.getState()
    const wv = st.webviews.get(st.activeId)
    if (wv) {
      wv.executeJavaScript(
        `(function(){var d=document;if(d.querySelector('[data-vox-watch]'))return;var div=d.createElement('div');div.setAttribute('data-vox-watch','1');div.style.cssText='position:fixed;bottom:44px;right:14px;z-index:2147483000;background:#111c;color:#fff;font:12px/1 monospace;padding:6px 10px;border-radius:8px;pointer-events:none;box-shadow:0 4px 14px rgba(0,0,0,.4)';var t0=Date.now();div.textContent='⏱ 0:00';d.body.appendChild(div);setInterval(function(){var s=Math.floor((Date.now()-t0)/1000);div.textContent='⏱ '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0')},1000)})()`,
      ).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.watch, settings.watch && activeId])

  // Nightly warmup: quietly nudge once per feature batch
  useEffect(() => {
    if (!settings.onboarded) return
    if (settings.featureVersion < LATEST_FEATURE_VERSION) {
      const t = setTimeout(() => setShowWarmup(true), 2200)
      return () => clearTimeout(t)
    }
  }, [settings.onboarded, settings.featureVersion])

  // Sync language from settings on mount
  useEffect(() => {
    setLang(settings.language)
  }, [])

  // Android body class
  useEffect(() => {
    if (!isAndroid) return
    document.body.classList.add('vox-android')
    return () => document.body.classList.remove('vox-android')
  }, [])

  // Download listeners
  useEffect(() => {
    const addDownload = useStore.getState().addDownload
    const updateDownload = useStore.getState().updateDownload
    window.onyx?.onDownloadStart?.((info: any) => addDownload(info))
    window.onyx?.onDownloadProgress?.((data: any) => updateDownload(data.id, { receivedBytes: data.receivedBytes, state: data.state || 'progressing' }))
    window.onyx?.onDownloadDone?.((data: any) => updateDownload(data.id, { state: data.state, receivedBytes: data.receivedBytes, savePath: data.savePath || undefined }))
  }, [])

  // Theme + layout CSS vars
  useEffect(() => {
    const colors = THEMES[settings.theme] || THEMES['tokyo-night']
    let c = settings.theme === 'custom' ? settings.customColors : colors
    if (settings.uiMode === 'debloat') {
      const bgHex = (c.bg ?? '#1a1b26').replace('#', '')
      const lum = 0.2126 * (parseInt(bgHex.slice(0, 2), 16) / 255) + 0.7152 * (parseInt(bgHex.slice(2, 4), 16) / 255) + 0.0722 * (parseInt(bgHex.slice(4, 6), 16) / 255)
      c = lum > 0.55 ? FIREFOX_LIGHT : FIREFOX_DARK
    }
    const auroraRgb = settings.aurora && auroraColor ? auroraColor.split(',').map(n => Math.max(0, Math.min(255, Number(n.trim()) || 0)) / 255) : null
    const auroraLum = auroraRgb ? 0.2126 * auroraRgb[0] + 0.7152 * auroraRgb[1] + 0.0722 * auroraRgb[2] : 1
    const accent = settings.aurora && auroraRgb && auroraLum < 0.55 ? `rgb(${auroraColor})` : c.accent
    const root = document.documentElement
    root.style.setProperty('--bg', c.bg)
    root.style.setProperty('--bg-dim', c.bgDim)
    root.style.setProperty('--bg-light', c.bgLight)
    root.style.setProperty('--fg', c.fg)
    root.style.setProperty('--fg-dim', c.fgDim)
    root.style.setProperty('--border', c.border)
    root.style.setProperty('--accent', accent)
    root.style.setProperty('--green', c.green)
    root.style.setProperty('--red', c.red)
    root.style.setProperty('--orange', c.orange)
    root.style.setProperty('--cyan', c.cyan)
    root.style.setProperty('--purple', c.purple)
    root.style.setProperty('--font', settings.fontFamily)
    root.style.setProperty('--font-size', settings.fontSize + 'px')
    root.style.setProperty('--tab-h', settings.tabBarHeight + 'px')
    root.style.setProperty('--status-h', settings.statusBarHeight + 'px')
    root.style.setProperty('--titlebar-h', settings.titlebarHeight + 'px')
    root.style.setProperty('--radius', settings.borderRadius + 'px')
    root.style.setProperty('--speed', settings.transitionSpeed + 'ms')
    root.style.setProperty('--tab-opacity', String(settings.tabOpacity))
    root.style.setProperty('--tab-shape', settings.tabShape)
    root.style.setProperty('--sidebar-w', settings.sidebarWidth + 'px')
    if (settings.ntpBgColor) {
      root.style.setProperty('--ntp-bg', settings.ntpBgColor)
    }
    const bgHex = (c.bg ?? '#1a1b26').replace('#', '')
    const bgR = parseInt(bgHex.slice(0, 2), 16) / 255
    const bgG = parseInt(bgHex.slice(2, 4), 16) / 255
    const bgB = parseInt(bgHex.slice(4, 6), 16) / 255
    const lum = 0.2126 * bgR + 0.7152 * bgG + 0.0722 * bgB
    document.body.classList.toggle('vox-light', lum > 0.55)
  }, [settings, auroraColor])

  // Confirm-close guard
  useEffect(() => {
    if (!settings.confirmClose) return
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [settings.confirmClose])

  // Global keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const s = useStore.getState()
      const meta = e.ctrlKey || e.metaKey
      const wv = s.webviews.get(s.activeId)

      const nav = (n: 'back' | 'forward' | 'reload') => {
        if (!wv) return
        if (n === 'back' && wv.canGoBack?.()) wv.goBack()
        if (n === 'forward' && wv.canGoForward?.()) wv.goForward()
        if (n === 'reload') wv.reload()
      }

      const shot = async (mode: 'save' | 'copy') => {
        const st = useStore.getState()
        const w = st.webviews.get(st.activeId)
        if (!w?.capturePage) return
        try {
          const img = await w.capturePage()
          const png = img.toPNG()
          if (mode === 'copy') { window.onyx?.copyImage?.(png); return }
          const d = new Date()
          const pad = (n: number) => String(n).padStart(2, '0')
          const name = `vox-shot-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.png`
          window.onyx?.saveShot?.(png, name)
        } catch {}
      }

      // Navigation
      if (e.key === 'F5') { e.preventDefault(); nav('reload') }
      if (meta && !e.shiftKey && e.key === 'r') { e.preventDefault(); nav('reload') }
      if (e.altKey && !meta && e.key === 'ArrowLeft') { e.preventDefault(); nav('back') }
      if (e.altKey && !meta && e.key === 'ArrowRight') { e.preventDefault(); nav('forward') }

      // Command palette (works outside vim mode too)
      if (e.altKey && !meta && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        const st = useStore.getState()
        st.setPalette(!st.showPalette)
        return
      }

      // Tabs
      if (meta && !e.shiftKey && e.key === 't') { e.preventDefault(); addTab() }
      if (meta && e.shiftKey && e.key === 'T') { e.preventDefault(); useStore.getState().reopenTab() }
      if (meta && e.shiftKey && e.key === 'N') { e.preventDefault(); addTab(undefined, undefined, true) }
      if (meta && !e.shiftKey && e.key === 'w') { e.preventDefault(); closeTab(s.activeId) }
      if (meta && e.key === 'Tab') {
        e.preventDefault()
        const wTabs = s.tabs.filter(t => t.workspace === s.activeWorkspace)
        const i = wTabs.findIndex(t => t.id === s.activeId)
        if (e.shiftKey) { if (i > 0) activate(wTabs[i - 1].id) }
        else { if (i < wTabs.length - 1) activate(wTabs[i + 1].id) }
      }
      if (meta && e.altKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault()
        const wsId = parseInt(e.key)
        const st = useStore.getState()
        if (st.workspaces.find(w => w.id === wsId)) {
          useStore.getState().moveTabToWorkspace(st.activeId, wsId)
        }
      }
      if (meta && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        useStore.getState().setTabSearch(!s.showTabSearch)
      }
      if (meta && e.shiftKey && e.key === 'G') {
        e.preventDefault()
        useStore.getState().setSessionGraph(!s.showSessionGraph)
      }
      if (meta && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        const st = useStore.getState()
        const t = st.tabs.find(x => x.id === st.activeId)
        if (t && t.url && t.url !== 'about:blank') {
          window.onyx?.pipOpen?.(t.url, t.title || 'Vox PiP')
        }
      }
      if (meta && e.shiftKey && e.key === 'O') {
        e.preventDefault()
        useStore.getState().openStore()
      }
      if (meta && e.shiftKey && e.key === 'J') {
        e.preventDefault()
        const st = useStore.getState()
        if (st.settings.duplicate) st.duplicateTab(st.activeId)
      }
      if (meta && e.shiftKey && e.key === 'Y') {
        e.preventDefault()
        const st = useStore.getState()
        if (st.settings.copyurl) {
          const t = st.tabs.find(x => x.id === st.activeId)
          if (t) st.copyText(t.url)
        }
      }
      if (meta && e.shiftKey && e.key === 'U') {
        e.preventDefault()
        const st = useStore.getState()
        if (st.settings.yanktitle) {
          const t = st.tabs.find(x => x.id === st.activeId)
          if (t) st.copyText(t.title || t.url)
        }
      }
      if (meta && e.shiftKey && e.key === 'K') {
        e.preventDefault()
        const st = useStore.getState()
        if (st.settings.copyalltabs) {
          const wsT = st.tabs.filter(x => x.workspace === st.activeWorkspace && x.url && x.url !== 'about:blank')
          st.copyText(wsT.map(x => x.url).join('\n'))
        }
      }
      if (meta && e.shiftKey && e.key === 'V') {
        e.preventDefault()
        const st = useStore.getState()
        if (st.settings.clipboard && navigator.clipboard?.readText) {
          navigator.clipboard.readText().then((txt: string) => {
            txt = (txt || '').trim()
            if (/^https?:\/\//i.test(txt)) st.navigateTo(st.activeId, txt)
            else if (/^[\w-]+(\.[\w-]+)+/.test(txt)) st.navigateTo(st.activeId, txt)
          }).catch(() => {})
        }
      }

      // Page actions
      if (meta && !e.shiftKey && e.key === 'd') {
        e.preventDefault()
        const st = useStore.getState()
        const t = st.tabs.find(x => x.id === st.activeId)
        if (t) st.toggleBookmark(t.url, t.title || t.url, t.favicon)
      }
      if (meta && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        const st = useStore.getState()
        const t = st.tabs.find(x => x.id === st.activeId)
        if (st.settings.readlist && t) st.addToReadList(t.url, t.title || t.url)
      }
      if (meta && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        s.setSettings({ darkReader: !s.settings.darkReader })
      }
      if (meta && e.shiftKey && e.key === 'S') { e.preventDefault(); shot('save') }
      if (meta && e.shiftKey && e.key === 'C') { e.preventDefault(); shot('copy') }
      if (meta && e.key === 'f') { e.preventDefault(); setShowFind(prev => !prev) }
      if (meta && !e.shiftKey && e.key === 'l') { e.preventDefault(); useStore.getState().triggerUrlBar() }
      if (meta && !e.shiftKey && e.key === 'h') { e.preventDefault(); useStore.getState().setSidebar('history') }
      if (meta && !e.shiftKey && e.key === 'e') { e.preventDefault(); useStore.getState().setSidebar('downloads') }
      if (meta && !e.shiftKey && e.key === 'b') { e.preventDefault(); useStore.getState().setSidebar('bookmarks') }
      if (meta && !e.shiftKey && e.key === ',') { e.preventDefault(); useStore.getState().openSettings() }
      if (meta && !e.shiftKey && e.key === '\\') { e.preventDefault(); s.setSettings({ zenMode: !s.settings.zenMode }) }

      // Zoom
      if (meta && (e.key === '=' || e.key === '+')) { e.preventDefault(); useStore.getState().setZoom(s.activeId, (s.tabs.find(t => t.id === s.activeId)?.zoom || 1) + 0.1) }
      if (meta && e.key === '-') { e.preventDefault(); useStore.getState().setZoom(s.activeId, (s.tabs.find(t => t.id === s.activeId)?.zoom || 1) - 0.1) }
      if (meta && e.key === '0') { e.preventDefault(); useStore.getState().setZoom(s.activeId, 1) }

      if (e.key === '?' && !meta) {
        const el = e.target as HTMLElement
        const inp = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
        if (!inp) { e.preventDefault(); setShowShortcuts(!showShortcuts) }
      }
      if (e.altKey && /^[1-9]$/.test(e.key) && !meta) {
        e.preventDefault()
        const wsId = parseInt(e.key)
        const st = useStore.getState()
        if (st.workspaces.find(w => w.id === wsId)) switchWorkspace(wsId)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [addTab, closeTab, activate, switchWorkspace, setShowShortcuts, showShortcuts])

  // Webview → UI shortcut bridge (guest pages forward combos via postMessage)
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data
      if (!d) return
      if (d.voxWatch) {
        try {
          const host = new URL(d.url).hostname
          useStore.getState().pushToast(`⏱ На странице ${host} что-то меняется — следим за обновлениями`)
        } catch {}
        return
      }
      if (!d.voxKey) return
      try {
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: d.key, ctrlKey: d.ctrl, shiftKey: d.shift, altKey: d.alt, metaKey: d.meta, bubbles: true,
        }))
      } catch {}
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  // NTP keyboard handler: command palette (:), Escape, etc.
  useEffect(() => {
    if (!vimEnabled) return
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const inp = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
      if (e.key === 'Escape') {
        const st = useStore.getState()
        if (st.showPalette) { setPalette(false); e.preventDefault(); return }
        if (st.vimMode !== 'normal') { setVimMode('normal'); e.preventDefault(); return }
      }
      if (e.key === ':' && !inp && !useStore.getState().showPalette && useStore.getState().vimMode === 'normal') {
        e.preventDefault(); setPalette(true); return
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [vimEnabled, setVimMode, setPalette])

  const active = tabs.find(t => t.id === activeId)
  const isNew = active?.url === 'about:blank'
  const isBlocked = active?.url.startsWith('vox:blocked')

  const wsPos = settings.workspacePosition || 'top'
  const zen = settings.zenMode
  const tabPos = settings.tabBarPosition || 'bottom'
  const statusPos = settings.statusBarPosition || 'bottom'
  const sidePos = settings.sidebarPosition || 'left'

  if (!picked) {
    return (
      <StartModePicker
        onPick={(mode: UiMode) => {
          const st = useStore.getState()
          st.setSettings(modeSettings(mode, st.settings))
          ;(window as any).onyx?.pickerDone?.()
          setPicked(true)
        }}
      />
    )
  }

  return (
    <div className={`browser${zen ? ' zen-layout' : ''}`}>
      <div className="chrome chrome-top">
        {statusPos === 'top' && settings.showStatusBar && (
          <StatusBar showWorkspaces={wsPos === 'bottom' && settings.workspaceShow} />
        )}
        {isAndroid ? (
          statusPos === 'top' && settings.showStatusBar && (
            <StatusBar showWorkspaces={wsPos === 'bottom' && settings.workspaceShow} />
          )
        ) : settings.browserChrome ? (
          <BrowserToolbar />
        ) : (
          <div className="titlebar" style={{ height: settings.titlebarHeight }} />
        )}
        {!zen && wsPos === 'top' && settings.workspaceShow && <WorkspaceBar />}
        {!zen && tabPos === 'top' && settings.showTabBar && <TabBar />}
      </div>
      <div className="content">
        {zen && <ZenSidebar />}
        {sidePos === 'left' && <Sidebar />}
        <div className="main" ref={mainRef}>
          {tabs.map(t => {
            const specialActive = t.id === activeId && t.workspace === activeWorkspace
            const cls = `special-page${specialActive ? ' active' : ''}`
            if (t.url === 'vox:settings')
              return <div key={t.id} className={cls}><SettingsPage /></div>
            if (t.url === 'vox:store')
              return <div key={t.id} className={cls}><StorePage /></div>
            if (t.url.startsWith('vox:blocked'))
              return <div key={t.id} className={cls}><BlockedPage tabId={t.id} /></div>
            return <WebContent key={t.id} id={t.id} url={t.url} active={t.id === activeId} visible={t.workspace === activeWorkspace} />
          })}
          {isNew && !isBlocked && <NewTabPage />}
          <HintOverlay />
        </div>
        {sidePos === 'right' && <Sidebar />}
      </div>
      <div className="chrome chrome-bottom">
        {!zen && tabPos === 'bottom' && settings.showTabBar && <TabBar />}
        {!zen && wsPos === 'bottom' && settings.workspaceShow && !settings.showStatusBar && <WorkspaceBar />}
        {statusPos === 'bottom' && settings.showStatusBar && (
          <StatusBar showWorkspaces={wsPos === 'bottom' && settings.workspaceShow} />
        )}
      </div>
      {!isAndroid && !settings.browserChrome && (!settings.showStatusBar || statusPos === 'bottom') && (
        <div className="floating-win-controls">
          <button className="fwc-btn" onClick={() => window.onyx?.minimize()} title="Minimize">─</button>
          <button className="fwc-btn" onClick={() => window.onyx?.maximize()} title="Maximize">□</button>
          <button className="fwc-btn fwc-close" onClick={() => window.onyx?.close()} title="Close">×</button>
        </div>
      )}
      <CommandPalette />
      {settings.dynamicisland && <DynamicIsland />}
      <FindBar show={showFind} onClose={() => setShowFind(false)} />
      <ShortcutOverlay />
      <TabExpose />
      <GrepOverlay />
      <SessionGraph />
      <Onboarding />
      <div className="toasts">
        {toasts.map(t => (
          <div key={t.id} className="toast">{t.text}</div>
        ))}
      </div>
      {showWarmup && (
        <div className="warmup-toast">
          <span>В магазине появились новые расширения</span>
          <button
            onClick={() => {
              useStore.getState().openStore()
              useStore.getState().setSettings({ featureVersion: LATEST_FEATURE_VERSION })
              setShowWarmup(false)
            }}
          >Открыть</button>
          <button className="warmup-dismiss" onClick={() => {
            useStore.getState().setSettings({ featureVersion: LATEST_FEATURE_VERSION })
            setShowWarmup(false)
          }}>×</button>
        </div>
      )}
    </div>
  )
}

function BlockedPage({ tabId }: { tabId: string }) {
  const tabs = useStore(s => s.tabs)
  const unblockSite = useStore(s => s.unblockSite)
  const closeTab = useStore(s => s.closeTab)
  const t = tabs.find(x => x.id === tabId)
  let host = ''
  if (t?.url) {
    const m = t.url.match(/[?&]host=([^&]+)/)
    if (m) host = decodeURIComponent(m[1])
  }
  return (
    <div className="blocked-page">
      <div className="bp-shield"><Icon name="shield" size={56} /></div>
      <h1>Сайт заблокирован</h1>
      <p>Сайт <code>{host || '…'}</code> добавлен в список заблокированных в настройках конфиденциальности.</p>
      <div className="bp-actions">
        <button className="bp-btn" onClick={() => unblockSite(host)}>Разблокировать</button>
        <button className="bp-btn secondary" onClick={() => closeTab(tabId)}>Закрыть вкладку</button>
      </div>
    </div>
  )
}
