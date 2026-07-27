import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { t } from '../lang'

interface CtxMenu {
  x: number; y: number; type: 'workspace'; wsId: number; wsName: string
}

export default function ZenSidebar() {
  const tabs = useStore(s => s.tabs)
  const activeId = useStore(s => s.activeId)
  const activeWorkspace = useStore(s => s.activeWorkspace)
  const workspaces = useStore(s => s.workspaces)
  const groups = useStore(s => s.groups)
  const activate = useStore(s => s.activate)
  const addTab = useStore(s => s.addTab)
  const closeTab = useStore(s => s.closeTab)
  const switchWorkspace = useStore(s => s.switchWorkspace)
  const toggleGroupCollapse = useStore(s => s.toggleGroupCollapse)
  const removeWorkspace = useStore(s => s.removeWorkspace)
  const renameWorkspace = useStore(s => s.renameWorkspace)
  const removeGroup = useStore(s => s.removeGroup)
  const renameGroup = useStore(s => s.renameGroup)
  const setGroupColor = useStore(s => s.setGroupColor)
  const setSidebar = useStore(s => s.setSidebar)

  const wsTabs = tabs.filter(t => t.workspace === activeWorkspace)
  const wsGroups = groups.filter(g => g.workspace === activeWorkspace)
  const ungrouped = wsTabs.filter(t => !t.groupId || !wsGroups.find(g => g.id === t.groupId))

  const [collapsed, setCollapsed] = useState(false)
  const [ctx, setCtx] = useState<CtxMenu | null>(null)
  const [renaming, setRenaming] = useState<{ type: 'workspace' | 'group'; id: string | number } | null>(null)
  const renameRef = useRef<HTMLInputElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (renaming && renameRef.current) {
      renameRef.current.focus()
      renameRef.current.select()
    }
  }, [renaming])

  useEffect(() => {
    if (!ctx) return
    const close = () => setCtx(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [ctx])

  const openCtx = (e: React.MouseEvent, wsId: number, wsName: string) => {
    e.preventDefault()
    e.stopPropagation()
    setCtx({ x: e.clientX, y: e.clientY, type: 'workspace', wsId, wsName })
  }

  const startRename = (type: 'workspace' | 'group', id: string | number) => {
    setRenaming({ type, id })
    setCtx(null)
  }

  const commitRename = () => {
    if (!renaming || !renameRef.current) return
    const val = renameRef.current.value.trim()
    if (val) {
      if (renaming.type === 'workspace') renameWorkspace(renaming.id as number, val)
      else renameGroup(renaming.id as string, val)
    }
    setRenaming(null)
  }

  const getRenameValue = () => {
    if (!renaming) return ''
    if (renaming.type === 'workspace') {
      return workspaces.find(w => w.id === renaming.id)?.name || ''
    }
    return groups.find(g => g.id === renaming.id)?.name || ''
  }

  const renderTab = (t: typeof wsTabs[0]) => {
    const grp = t.groupId ? wsGroups.find(g => g.id === t.groupId) : null
    return (
      <div
        key={t.id}
        className={`zen-tab${t.id === activeId ? ' active' : ''}`}
        onClick={() => activate(t.id)}
        style={grp ? { borderLeft: `2px solid ${grp.color}` } : undefined}
        title={t.url === 'about:blank' ? 'New Tab' : t.url}
      >
        {t.favicon ? (
          <img className="zen-tab-favicon" src={t.favicon} alt="" />
        ) : (
          <div className="zen-tab-favicon-placeholder" />
        )}
        <span className="zen-tab-title">{t.title || 'New Tab'}</span>
        <button
          className="zen-tab-close"
          onClick={(e) => { e.stopPropagation(); closeTab(t.id) }}
        >
          ×
        </button>
      </div>
    )
  }

  if (collapsed) {
    return (
      <div className="zen-sidebar zen-collapsed" ref={sidebarRef}>
        <button className="zen-expand-btn" onClick={() => setCollapsed(false)} title="Expand sidebar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 3l5 5-5 5"/></svg>
        </button>
        <div className="zen-collapsed-workspaces">
          {workspaces.map(ws => (
            <button
              key={ws.id}
              className={`zen-collapsed-ws${ws.id === activeWorkspace ? ' active' : ''}`}
              style={ws.id === activeWorkspace ? { background: ws.color, color: '#fff' } : undefined}
              onClick={() => switchWorkspace(ws.id)}
              onContextMenu={(e) => openCtx(e, ws.id, ws.name)}
              title={ws.name}
            >
              {ws.name.charAt(0)}
            </button>
          ))}
        </div>
        <div className="zen-collapsed-tabs">
          {wsTabs.map(t => (
            <div
              key={t.id}
              className={`zen-collapsed-tab${t.id === activeId ? ' active' : ''}`}
              onClick={() => activate(t.id)}
              title={t.title || 'New Tab'}
            >
              {t.favicon ? (
                <img className="zen-collapsed-favicon" src={t.favicon} alt="" />
              ) : (
                <div className="zen-collapsed-favicon zen-tab-favicon-placeholder" />
              )}
            </div>
          ))}
        </div>
        <div className="zen-collapsed-bottom">
          <button className="zen-collapsed-add" onClick={() => addTab()} title="New tab">+</button>
          <button className="zen-collapsed-add" onClick={() => setSidebar('settings')} title="Settings">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M13.1 2.9l-1.4 1.4M4.3 11.7l-1.4 1.4"/></svg>
          </button>
        </div>
        {ctx && <ContextMenu {...ctx} onRename={startRename} onRemove={(id) => { removeWorkspace(id); setCtx(null) }} />}
        {renaming && (
          <div className="zen-rename-overlay" onClick={() => setRenaming(null)}>
            <div className="zen-rename-box" onClick={e => e.stopPropagation()}>
              <input ref={renameRef} className="zen-rename-input" defaultValue={getRenameValue()} onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null) }} />
              <button className="zen-rename-ok" onClick={commitRename}>✓</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="zen-sidebar" ref={sidebarRef}>
      <div className="zen-ws-bar">
        {workspaces.map(ws => (
          <button
            key={ws.id}
            className={`zen-ws-btn${ws.id === activeWorkspace ? ' active' : ''}`}
            style={ws.id === activeWorkspace ? { background: ws.color, color: '#fff' } : undefined}
            onClick={() => switchWorkspace(ws.id)}
            onContextMenu={(e) => openCtx(e, ws.id, ws.name)}
          >
            {ws.name}
            <span className="zen-ws-count">{tabs.filter(t => t.workspace === ws.id).length}</span>
          </button>
        ))}
        <button className="zen-ws-btn zen-ws-add" onClick={() => useStore.getState().addWorkspace()}>+</button>
      </div>

      <div className="zen-tabs">
        {wsGroups.map(grp => {
          const grpTabs = wsTabs.filter(t => t.groupId === grp.id)
          if (grpTabs.length === 0 && !grp.collapsed) {
            if (grp.collapsed) return null
          }
          return (
            <div key={grp.id} className="zen-group">
              <div
                className="zen-group-header"
                style={{ borderLeft: `3px solid ${grp.color}` }}
                onClick={() => toggleGroupCollapse(grp.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  startRename('group', grp.id)
                }}
              >
                <span className="zen-group-arrow">{grp.collapsed ? '›' : '⌄'}</span>
                <span className="zen-group-name">{grp.name}</span>
                <span className="zen-group-count">{grpTabs.length}</span>
              </div>
              {!grp.collapsed && grpTabs.map(renderTab)}
            </div>
          )
        })}
        {ungrouped.map(renderTab)}
      </div>

      <div className="zen-bottom">
        <button className="zen-add-tab" onClick={() => addTab()} title="New tab (Ctrl+T)">+</button>
        <button className="zen-collapse-btn" onClick={() => setSidebar('settings')} title="Settings">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M13.1 2.9l-1.4 1.4M4.3 11.7l-1.4 1.4"/></svg>
        </button>
        <button className="zen-collapse-btn" onClick={() => setCollapsed(true)} title="Collapse sidebar">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 3l-5 5 5 5"/></svg>
        </button>
      </div>

      {ctx && <ContextMenu {...ctx} onRename={startRename} onRemove={(id) => { removeWorkspace(id); setCtx(null) }} />}

      {renaming && (
        <div className="zen-rename-overlay" onClick={() => setRenaming(null)}>
          <div className="zen-rename-box" onClick={e => e.stopPropagation()}>
            <input ref={renameRef} className="zen-rename-input" defaultValue={getRenameValue()} onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null) }} />
            <button className="zen-rename-ok" onClick={commitRename}>✓</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ContextMenu({ x, y, wsId, wsName, onRename, onRemove }: { x: number; y: number; type: string; wsId: number; wsName: string; onRename: (type: 'workspace', id: number) => void; onRemove: (id: number) => void }) {
  return (
    <div className="ctx-overlay">
      <div className="ctx-menu" style={{ left: x, top: y }} onClick={e => e.stopPropagation()}>
        <div className="ctx-item" onClick={() => onRename('workspace', wsId)}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z"/></svg>
          {t('workspace.rename') || 'Rename'}
        </div>
        <div className="ctx-sep" />
        <div className="ctx-item danger" onClick={() => onRemove(wsId)}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h12M5 4V2h6v2M3 4v10h10V4"/><path d="M6 7v4M10 7v4"/></svg>
          {t('workspace.remove') || 'Delete workspace'}
        </div>
      </div>
    </div>
  )
}
