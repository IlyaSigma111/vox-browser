import React, { useState, useEffect } from 'react'
import { useStore, THEMES } from './store'
import { setLang } from './lang'
import BrowserToolbar from './components/BrowserToolbar'
import TabBar from './components/TabBar'
import StatusBar from './components/StatusBar'
import WebContent from './components/WebContent'
import Sidebar from './components/Sidebar'
import ZenSidebar from './components/ZenSidebar'
import CommandPalette from './components/CommandPalette'
import HintOverlay from './components/HintOverlay'
import ShortcutOverlay from './components/ShortcutOverlay'
import FindBar from './components/FindBar'
import NewTabPage from './components/NewTabPage'
import TabExpose from './components/TabExpose'
import GrepOverlay from './components/GrepOverlay'
import Onboarding from './components/Onboarding'
import SessionGraph from './components/SessionGraph'
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

  const wsTabs = tabs.filter(t => t.workspace === activeWorkspace)

  // Sync language from settings on mount
  useEffect(() => {
    setLang(settings.language)
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
    const c = settings.theme === 'custom' ? settings.customColors : colors
    const accent = settings.aurora && auroraColor ? `rgb(${auroraColor})` : c.accent
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

      // Navigation
      if (e.key === 'F5') { e.preventDefault(); nav('reload') }
      if (meta && !e.shiftKey && e.key === 'r') { e.preventDefault(); nav('reload') }
      if (e.altKey && !meta && e.key === 'ArrowLeft') { e.preventDefault(); nav('back') }
      if (e.altKey && !meta && e.key === 'ArrowRight') { e.preventDefault(); nav('forward') }

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

      // Page actions
      if (meta && !e.shiftKey && e.key === 'd') {
        e.preventDefault()
        const st = useStore.getState()
        const t = st.tabs.find(x => x.id === st.activeId)
        if (t) st.toggleBookmark(t.url, t.title || t.url, t.favicon)
      }
      if (meta && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        s.setSettings({ darkReader: !s.settings.darkReader })
      }
      if (meta && e.key === 'f') { e.preventDefault(); setShowFind(prev => !prev) }
      if (meta && !e.shiftKey && e.key === 'l') { e.preventDefault(); useStore.getState().triggerUrlBar() }
      if (meta && !e.shiftKey && e.key === 'h') { e.preventDefault(); useStore.getState().setSidebar('history') }
      if (meta && !e.shiftKey && e.key === 'e') { e.preventDefault(); useStore.getState().setSidebar('downloads') }
      if (meta && !e.shiftKey && e.key === 'b') { e.preventDefault(); useStore.getState().setSidebar('bookmarks') }
      if (meta && !e.shiftKey && e.key === ',') { e.preventDefault(); useStore.getState().setSidebar('settings') }
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
      if (!d || !d.voxKey) return
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

  const wsPos = settings.workspacePosition || 'top'
  const zen = settings.zenMode
  const tabPos = settings.tabBarPosition || 'bottom'
  const statusPos = settings.statusBarPosition || 'bottom'
  const sidePos = settings.sidebarPosition || 'left'

  const content = (
    <div className="content">
      {sidePos === 'left' && <Sidebar />}
      <div className="main">
        {tabs.map(t => (
          <WebContent key={t.id} id={t.id} url={t.url} active={t.id === activeId} visible={t.workspace === activeWorkspace} />
        ))}
        {isNew && <NewTabPage />}
        <HintOverlay />
      </div>
      {sidePos === 'right' && <Sidebar />}
    </div>
  )

  return (
    <div className={`browser${zen ? ' zen-layout' : ''}`}>
      {statusPos === 'top' && settings.showStatusBar && (
        <StatusBar showWorkspaces={wsPos === 'bottom' && settings.workspaceShow} />
      )}
      {settings.browserChrome ? (
        <BrowserToolbar />
      ) : (
        <div className="titlebar" style={{ height: settings.titlebarHeight }} />
      )}
      {zen ? (
        <>
          <div className="content">
            <ZenSidebar />
            {sidePos === 'left' && <Sidebar />}
            <div className="main">
              {tabs.map(t => (
                <WebContent key={t.id} id={t.id} url={t.url} active={t.id === activeId} visible={t.workspace === activeWorkspace} />
              ))}
              {isNew && <NewTabPage />}
              <HintOverlay />
            </div>
            {sidePos === 'right' && <Sidebar />}
          </div>
        </>
      ) : (
        <>
          {wsPos === 'top' && settings.workspaceShow && <WorkspaceBar />}
          {tabPos === 'top' && settings.showTabBar && <TabBar />}
          {content}
          {tabPos === 'bottom' && settings.showTabBar && <TabBar />}
          {wsPos === 'bottom' && settings.workspaceShow && !settings.showStatusBar && <WorkspaceBar />}
        </>
      )}
      {statusPos === 'bottom' && settings.showStatusBar && (
        <StatusBar showWorkspaces={wsPos === 'bottom' && settings.workspaceShow} />
      )}
      {(!settings.showStatusBar || statusPos === 'bottom') && (
        <div className="floating-win-controls">
          <button className="fwc-btn" onClick={() => window.onyx?.minimize()} title="Minimize">─</button>
          <button className="fwc-btn" onClick={() => window.onyx?.maximize()} title="Maximize">□</button>
          <button className="fwc-btn fwc-close" onClick={() => window.onyx?.close()} title="Close">×</button>
        </div>
      )}
      <CommandPalette />
      <FindBar show={showFind} onClose={() => setShowFind(false)} />
      <ShortcutOverlay />
      <TabExpose />
      <GrepOverlay />
      <SessionGraph />
      <Onboarding />
    </div>
  )
}
