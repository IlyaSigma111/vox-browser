import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { t } from '../lang'

interface Props {
  showWorkspaces?: boolean
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
  const active = tabs.find(t => t.id === activeId)
  const wsTabs = tabs.filter(t => t.workspace === activeWorkspace)
  const ws = workspaces.find(w => w.id === activeWorkspace)

  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [ctxMenu, setCtxMenu] = useState<{id: number, x: number, y: number} | null>(null)

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

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
        <div className="sb-url" onClick={() => { setInput(active?.url === 'about:blank' ? '' : active?.url || ''); setEditing(true) }}>
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
            <span>{active?.url === 'about:blank' ? '' : active?.url || ''}</span>
          )}
        </div>
      )}
      <button className="sb-btn" onClick={() => addTab()} title="New Tab (Ctrl+T)">+</button>
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
      <button className="sb-btn sb-icon" onClick={() => setSidebar('settings')} title="Settings">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="2"/>
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M13.1 2.9l-1.4 1.4M4.3 11.7l-1.4 1.4"/>
        </svg>
      </button>
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
