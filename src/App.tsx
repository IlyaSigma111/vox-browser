import React, { useEffect } from 'react'
import { useStore, THEMES } from './store'
import { setLang } from './lang'
import TabBar from './components/TabBar'
import StatusBar from './components/StatusBar'
import WebContent from './components/WebContent'
import Sidebar from './components/Sidebar'
import ZenSidebar from './components/ZenSidebar'
import CommandPalette from './components/CommandPalette'
import HintOverlay from './components/HintOverlay'
import NewTabPage from './components/NewTabPage'
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
            style={ws.id === activeWorkspace ? { background: ws.color, color: '#fff' } : undefined}
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
    window.onyx?.onDownloadProgress?.((data: any) => updateDownload(data.id, { receivedBytes: data.receivedBytes }))
    window.onyx?.onDownloadDone?.((data: any) => updateDownload(data.id, { state: data.state, receivedBytes: data.receivedBytes }))
  }, [])

  // Theme + layout CSS vars
  useEffect(() => {
    const colors = THEMES[settings.theme] || THEMES['tokyo-night']
    const c = settings.theme === 'custom' ? settings.customColors : colors
    const root = document.documentElement
    root.style.setProperty('--bg', c.bg)
    root.style.setProperty('--bg-dim', c.bgDim)
    root.style.setProperty('--bg-light', c.bgLight)
    root.style.setProperty('--fg', c.fg)
    root.style.setProperty('--fg-dim', c.fgDim)
    root.style.setProperty('--border', c.border)
    root.style.setProperty('--accent', c.accent)
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
  }, [settings])

  // Global keyboard shortcuts (Ctrl+T, Ctrl+W, Alt+N, Ctrl+Tab)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') { e.preventDefault(); addTab() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') { e.preventDefault(); closeTab(useStore.getState().activeId) }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault()
        const s = useStore.getState()
        const wTabs = s.tabs.filter(t => t.workspace === s.activeWorkspace)
        const i = wTabs.findIndex(t => t.id === s.activeId)
        if (e.shiftKey) { if (i > 0) activate(wTabs[i - 1].id) }
        else { if (i < wTabs.length - 1) activate(wTabs[i + 1].id) }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        const s = useStore.getState()
        s.setSettings({ darkReader: !s.settings.darkReader })
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        const s = useStore.getState()
        s.setSettings({ workspaceShow: !s.settings.workspaceShow })
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault()
        useStore.getState().addWorkspace()
      }
      if ((e.ctrlKey || e.metaKey) && e.altKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault()
        const wsId = parseInt(e.key)
        const st = useStore.getState()
        if (st.workspaces.find(w => w.id === wsId)) switchWorkspace(wsId)
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault()
        const s = useStore.getState()
        s.setSettings({ zenMode: !s.settings.zenMode })
      }
      if (e.altKey && /^[1-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        const wsId = parseInt(e.key)
        const st = useStore.getState()
        if (st.workspaces.find(w => w.id === wsId)) switchWorkspace(wsId)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [addTab, closeTab, activate, switchWorkspace])

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
        {wsTabs.map(t => (
          <WebContent key={t.id} id={t.id} url={t.url} active={t.id === activeId} />
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
      <div className="titlebar" style={{ height: settings.titlebarHeight }} />
      {zen ? (
        <>
          <div className="content">
            <ZenSidebar />
            {sidePos === 'left' && <Sidebar />}
            <div className="main">
              {wsTabs.map(t => (
                <WebContent key={t.id} id={t.id} url={t.url} active={t.id === activeId} />
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
      {!settings.showStatusBar && (
        <button className="floating-settings" onClick={() => useStore.getState().setSidebar('settings')} title="Settings">⚙</button>
      )}
      <CommandPalette />
    </div>
  )
}
