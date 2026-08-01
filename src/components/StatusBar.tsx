import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { t } from '../lang'

interface Props {
  showWorkspaces?: boolean
}

function PomodoroBtn() {
  const [mode, setMode] = useState<'idle' | 'work' | 'break'>('idle')
  const [left, setLeft] = useState(25 * 60)
  useEffect(() => {
    if (mode === 'idle') return
    const iv = setInterval(() => {
      setLeft(l => {
        if (l <= 1) {
          if (mode === 'work') { setMode('break'); return 5 * 60 }
          setMode('idle')
          return 0
        }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [mode])
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const label = mode === 'idle' ? '🍅' : mode === 'work' ? `🍅 ${fmt(left)}` : `☕ ${fmt(left)}`
  return (
    <button
      className={`sb-btn sb-icon pomodoro${mode === 'work' ? ' work' : mode === 'break' ? ' break' : ''}`}
      onClick={() => { if (mode === 'idle') setMode('work'); else if (mode === 'work') setMode('break'); else setMode('idle') }}
      title="Pomodoro 25/5 — click to start"
    >{label}</button>
  )
}

export default function StatusBar({ showWorkspaces }: Props) {
  const tabs = useStore(s => s.tabs)
  const activeId = useStore(s => s.activeId)
  const activeWorkspace = useStore(s => s.activeWorkspace)
  const workspaces = useStore(s => s.workspaces)
  const addTab = useStore(s => s.addTab)
  const navigateTo = useStore(s => s.navigateTo)
  const setSidebar = useStore(s => s.setSidebar)
  const setVimMode = useStore(s => s.setVimMode)
  const mode = useStore(s => s.vimMode)
  const showMode = useStore(s => s.settings.statusBarShowMode)
  const showUrl = useStore(s => s.settings.statusBarShowUrl)
  const showCount = useStore(s => s.settings.statusBarShowCount)
  const readTime = useStore(s => s.settings.readTime)
  const readlist = useStore(s => s.settings.readlist)
  const settings = useStore(s => s.settings)
  const pageTexts = useStore(s => s.pageTexts)
  const active = tabs.find(t => t.id === activeId)
  const wsTabs = tabs.filter(t => t.workspace === activeWorkspace)
  const ws = workspaces.find(w => w.id === activeWorkspace)
  const zoomPct = Math.round((active?.zoom || 1) * 100)

  const readMin = (() => {
    if (!readTime || !active || !pageTexts[active.id]) return 0
    const words = pageTexts[active.id].split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.round(words / 200))
  })()

  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [ctxMenu, setCtxMenu] = useState<{id: number, x: number, y: number} | null>(null)

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  const focusUrlBar = useStore(s => s.focusUrlBar)
  useEffect(() => {
    if (focusUrlBar > 0) {
      setInput(active?.url === 'about:blank' ? '' : active?.url || '')
      setEditing(true)
    }
  }, [focusUrlBar])

  useEffect(() => {
    if (!ctxMenu) return
    const h = () => setCtxMenu(null)
    window.addEventListener('click', h)
    window.addEventListener('contextmenu', h)
    return () => { window.removeEventListener('click', h); window.removeEventListener('contextmenu', h) }
  }, [ctxMenu])

  const searchUrl = useStore(s => s.settings.searchUrl)

  const submit = () => {
    setEditing(false)
    if (!input.trim()) return
    const url = input.trim().match(/^https?:\/\//) ? input.trim() : searchUrl.replace('%s', encodeURIComponent(input.trim()))
    navigateTo(activeId, url)
  }

  return (
    <>
    <div className="statusbar">
      {ws && (
        <button
          className="sb-btn ws-indicator"
          style={{ color: ws.color, fontWeight: 'bold', fontSize: 11, textShadow: `0 0 8px ${ws.color}40` }}
          title={`Workspace: ${ws.name}`}
        >
          WS:{ws.name}
        </button>
      )}
      {showWorkspaces && (
        <div className="sb-workspaces">
          {workspaces.map(w => (
            <button
              key={w.id}
              className={`sb-ws-btn${w.id === activeWorkspace ? ' active' : ''}`}
              style={w.id === activeWorkspace ? { background: w.color, color: '#fff', boxShadow: `0 0 12px ${w.color}60` } : undefined}
              onClick={() => useStore.getState().switchWorkspace(w.id)}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (workspaces.length <= 1) return
                setCtxMenu({ id: w.id, x: e.clientX, y: e.clientY })
              }}
            >
              {w.name}
              <span className="sb-ws-count">{tabs.filter(t => t.workspace === w.id).length}</span>
            </button>
          ))}
          <button className="sb-ws-btn add" onClick={() => useStore.getState().addWorkspace()}>+</button>
        </div>
      )}
      {showMode && (
        <button
          className="sb-btn mode"
          onClick={() => setVimMode(mode === 'insert' ? 'normal' : 'insert')}
        >
          {mode === 'insert' ? t('mode.insert') : mode === 'hint' ? t('mode.hint') : t('mode.normal')}
        </button>
      )}
      {showUrl && (
        <div className="sb-url" onClick={() => { setInput(active?.url === 'about:blank' || active?.url === 'vox:settings' ? '' : active?.url || ''); setEditing(true) }}>
          {editing ? (
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setEditing(false) }}
              onBlur={submit}
              className="sb-url-input"
              autoFocus
            />
          ) : (
            <span>{active?.url === 'about:blank' ? '' : active?.url === 'vox:settings' ? '⚙ Settings' : active?.url === 'vox:store' ? '🛍 Store' : active?.url || ''}</span>
          )}
        </div>
      )}
      <button className="sb-btn" onClick={() => addTab()} title="New Tab (Ctrl+T)">+</button>
      {readMin > 0 && <span className="sb-btn sb-readtime" title="Estimated reading time">≈ {readMin} мин</span>}
      {zoomPct !== 100 && <span className="sb-btn sb-zoom" title="Zoom">{zoomPct}%</span>}
      {settings.reader && <button className="sb-btn sb-icon" onClick={() => useStore.getState().toggleReader()} title="Reader mode">📖</button>}
      {settings.focus && <button className="sb-btn sb-icon" onClick={() => useStore.getState().toggleFocus()} title="Focus mode">🎯</button>}
      {settings.translator && <button className="sb-btn sb-icon" onClick={() => useStore.getState().translatePage()} title="Translate page">🌐</button>}
      {settings.pomodoro && <PomodoroBtn />}
      {readlist && <button className="sb-btn sb-icon" onClick={() => setSidebar('reading')} title="Reading list">📚</button>}
      <button className="sb-btn sb-icon" onClick={() => setSidebar('bookmarks')} title="Bookmarks">★</button>
      <button className="sb-btn sb-icon" onClick={() => setSidebar('history')} title="History">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="6.5"/>
          <polyline points="8,4 8,8 11,10"/>
        </svg>
      </button>
      <button className="sb-btn sb-icon" onClick={() => setSidebar('downloads')} title="Downloads">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v8M5 7l3 3 3-3M3 12h10"/>
        </svg>
      </button>
      <button className="sb-btn sb-icon" onClick={() => useStore.getState().openSettings()} title="Settings (Ctrl+,)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
      <button className="sb-btn sb-icon store" onClick={() => useStore.getState().openStore()} title="Store (Ctrl+Shift+O)">🛍</button>
      <button className="sb-btn sb-icon" onClick={() => setSidebar('extensions')} title="Extensions">🧩</button>
      {showCount && <span className="sb-count">{wsTabs.length}</span>}
      {window.onyx && (
        <div className="sb-win">
          <button className="sb-btn" onClick={() => window.onyx!.minimize()}>—</button>
          <button className="sb-btn" onClick={() => window.onyx!.maximize()}>□</button>
          <button className="sb-btn sb-close" onClick={() => window.onyx!.close()}>×</button>
        </div>
      )}
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
    </>
  )
}
