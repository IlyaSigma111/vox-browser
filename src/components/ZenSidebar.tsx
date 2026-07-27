import { useState } from 'react'
import { useStore } from '../store'

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
  const assignGroup = useStore(s => s.assignGroup)
  const addGroup = useStore(s => s.addGroup)

  const wsTabs = tabs.filter(t => t.workspace === activeWorkspace)
  const wsGroups = groups.filter(g => g.workspace === activeWorkspace)
  const ungrouped = wsTabs.filter(t => !t.groupId || !wsGroups.find(g => g.id === t.groupId))

  const [collapsed, setCollapsed] = useState(false)

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
          <div className="zen-tab-favicon zen-tab-favicon-placeholder" />
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
      <div className="zen-sidebar zen-collapsed">
        <button className="zen-expand-btn" onClick={() => setCollapsed(false)} title="Expand sidebar">›</button>
        <div className="zen-collapsed-workspaces">
          {workspaces.map(ws => (
            <button
              key={ws.id}
              className={`zen-collapsed-ws${ws.id === activeWorkspace ? ' active' : ''}`}
              style={ws.id === activeWorkspace ? { background: ws.color, color: '#fff' } : undefined}
              onClick={() => switchWorkspace(ws.id)}
              title={`Workspace ${ws.name}`}
            >
              {ws.name}
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
        </div>
      </div>
    )
  }

  return (
    <div className="zen-sidebar">
      <div className="zen-ws-bar">
        {workspaces.map(ws => (
          <button
            key={ws.id}
            className={`zen-ws-btn${ws.id === activeWorkspace ? ' active' : ''}`}
            style={ws.id === activeWorkspace ? { background: ws.color, color: '#fff' } : undefined}
            onClick={() => switchWorkspace(ws.id)}
            onContextMenu={(e) => {
              e.preventDefault()
              const name = prompt('Rename workspace:', ws.name)
              if (name !== null) useStore.getState().renameWorkspace(ws.id, name)
            }}
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
          if (grpTabs.length === 0) return null
          return (
            <div key={grp.id} className="zen-group">
              <div
                className="zen-group-header"
                style={{ borderLeft: `3px solid ${grp.color}` }}
                onClick={() => toggleGroupCollapse(grp.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  const name = prompt('Group name:', grp.name)
                  if (name !== null) useStore.getState().renameGroup(grp.id, name)
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
        <button className="zen-collapse-btn" onClick={() => setCollapsed(true)} title="Collapse sidebar">‹</button>
      </div>
    </div>
  )
}
