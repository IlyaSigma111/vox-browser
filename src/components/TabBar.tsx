import React, { useState } from 'react'
import { useStore } from '../store'
import { GROUP_COLORS } from '../types'

export default function TabBar() {
  const tabs = useStore(s => s.tabs)
  const activeId = useStore(s => s.activeId)
  const activate = useStore(s => s.activate)
  const addTab = useStore(s => s.addTab)
  const closeTab = useStore(s => s.closeTab)
  const groups = useStore(s => s.groups)
  const activeWorkspace = useStore(s => s.activeWorkspace)
  const assignGroup = useStore(s => s.assignGroup)
  const bookmarks = useStore(s => s.bookmarks)
  const toggleGroupCollapse = useStore(s => s.toggleGroupCollapse)
  const addGroup = useStore(s => s.addGroup)
  const removeGroup = useStore(s => s.removeGroup)
  const renameGroup = useStore(s => s.renameGroup)
  const setGroupColor = useStore(s => s.setGroupColor)
  const tabBarShowClose = useStore(s => s.settings.tabBarShowClose)
  const tabBarShowFavicon = useStore(s => s.settings.tabBarShowFavicon)
  const tabBarShowIndicator = useStore(s => s.settings.tabBarShowIndicator)
  const tabShape = useStore(s => s.settings.tabShape)
  const tabColors = useStore(s => s.settings.tabColors)

  function domainStyle(t: any): React.CSSProperties | undefined {
    if (!tabColors) return undefined
    let host = ''
    try { host = new URL(t.url).hostname || '' } catch {}
    if (!host) return undefined
    let h = 0
    for (let i = 0; i < host.length; i++) h = (h * 31 + host.charCodeAt(i)) >>> 0
    return { borderTop: `2px solid hsl(${h % 360} 70% 60%)` }
  }

  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ tabId: string; x: number; y: number } | null>(null)
  const [groupCtx, setGroupCtx] = useState<{ groupId: string; x: number; y: number } | null>(null)
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const wsTabs = tabs.filter(t => t.workspace === activeWorkspace)
  const wsGroups = groups.filter(g => g.workspace === activeWorkspace)
  const ungrouped = wsTabs.filter(t => !t.groupId || !wsGroups.find(g => g.id === t.groupId))

  // Sort pinned tabs first
  const sortedWsTabs = [...wsTabs].sort((a, b) => (a.pinned ? 0 : 1) - (b.pinned ? 0 : 1))

  const handleDragStart = (i: number) => (e: React.DragEvent) => {
    setDragIdx(i)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (i: number) => (e: React.DragEvent) => {
    e.preventDefault()
    setOverIdx(i)
  }
  const handleDrop = (i: number) => (e: React.DragEvent) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) return
    const arr = [...wsTabs]
    const [moved] = arr.splice(dragIdx, 1)
    arr.splice(i, 0, moved)
    const allTabs = [...tabs.filter(t => t.workspace !== activeWorkspace), ...arr]
    useStore.setState({ tabs: allTabs })
    setDragIdx(null)
    setOverIdx(null)
  }
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null) }

  const handleCtx = (tabId: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setCtxMenu({ tabId, x: e.clientX, y: e.clientY })
  }

  const closeCtx = () => { setCtxMenu(null); setGroupCtx(null) }

  function renderTab(t: any, i: number) {
    const grp = t.groupId ? wsGroups.find(g => g.id === t.groupId) : null
    return (
      <div
        key={t.id}
        className={`tab${t.id === activeId ? ' active' : ''}${overIdx === i ? ' drag-over' : ''}${t.loading ? ' loading' : ''}${t.pinned ? ' pinned' : ''}`}
        style={{ ...(grp ? { borderLeft: `2px solid ${grp.color}` } : {}), ...domainStyle(t) }}
        draggable
        onDragStart={handleDragStart(i)}
        onDragOver={handleDragOver(i)}
        onDrop={handleDrop(i)}
        onDragEnd={handleDragEnd}
        onClick={() => activate(t.id)}
        onContextMenu={handleCtx(t.id)}
        onAuxClick={(e) => { if (e.button === 1) { e.preventDefault(); closeTab(t.id) } }}
        title={t.pinned ? `📌 ${t.title || t.url}` : undefined}
      >
        {tabBarShowIndicator && <div className="tab-indicator" />}
        {tabBarShowFavicon && t.favicon && <img className="tab-favicon" src={t.favicon} alt="" />}
        <span className="tab-title">{t.title || t.url || 'New Tab'}</span>
        {t.incognito && <span className="tab-badge incognito" title="Incognito">🕶</span>}
        {t.muted && t.id !== activeId && <span className="tab-badge sleeping" title="Sleeping (muted)">zZ</span>}
        {tabBarShowClose && wsTabs.length > 1 && (
          <button
            className="tab-close"
            onClick={(e) => { e.stopPropagation(); closeTab(t.id) }}
          >
            ×
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="tab-bar" data-shape={tabShape}>
        {wsGroups.map(grp => {
          const grpTabs = wsTabs.filter(t => t.groupId === grp.id)
          if (grpTabs.length === 0) return null
          const isCollapsed = grp.collapsed
          return (
            <div key={grp.id} className="tab-group">
              <div
                className="tab-group-header"
                style={{ borderLeft: `3px solid ${grp.color}` }}
                onClick={() => toggleGroupCollapse(grp.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setGroupCtx({ groupId: grp.id, x: e.clientX, y: e.clientY })
                }}
              >
                <span className="tg-arrow">{isCollapsed ? '▶' : '▼'}</span>
                <span className="tg-color" style={{ background: grp.color }} />
                {editingGroup === grp.id ? (
                  <input
                    className="tg-name-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => { renameGroup(grp.id, editName); setEditingGroup(null) }}
                    onKeyDown={e => { if (e.key === 'Enter') { renameGroup(grp.id, editName); setEditingGroup(null) } }}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="tg-name">{grp.name}</span>
                )}
                <span className="tg-count">{grpTabs.length}</span>
              </div>
              {!isCollapsed && grpTabs.map((t, i) => renderTab(t, wsTabs.indexOf(t)))}
            </div>
          )
        })}
        {ungrouped.map((t, i) => renderTab(t, wsTabs.indexOf(t)))}
        <div className="tab new-tab" onClick={() => addTab()}>+</div>
      </div>

      {ctxMenu && (
        <div className="ctx-overlay" onClick={closeCtx}>
          <div className="ctx-menu" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={e => e.stopPropagation()}>
            <div className="ctx-item" onClick={() => { closeTab(ctxMenu.tabId); closeCtx() }}>Close tab</div>
            <div className="ctx-item" onClick={() => {
              const t = tabs.find(x => x.id === ctxMenu.tabId)
              if (t) { useStore.getState().duplicateTab(ctxMenu.tabId); closeCtx() }
            }}>Duplicate tab</div>
            <div className="ctx-item" onClick={() => {
              const t = tabs.find(x => x.id === ctxMenu.tabId)
              if (!t) return
              useStore.getState().toggleBookmark(t.url, t.title || t.url, t.favicon)
              closeCtx()
            }}>{(() => {
              const t = tabs.find(x => x.id === ctxMenu.tabId)
              const isBm = t && bookmarks.find(b => b.url === t.url)
              return isBm ? 'Remove bookmark' : 'Bookmark this tab'
            })()}</div>
            <div className="ctx-item" onClick={() => {
              const t = tabs.find(x => x.id === ctxMenu.tabId)
              if (t) { useStore.getState().updateTab(ctxMenu.tabId, { pinned: !t.pinned }); closeCtx() }
            }}>{tabs.find(x => x.id === ctxMenu.tabId)?.pinned ? 'Unpin tab' : 'Pin tab'}</div>
            <div className="ctx-sep" />
            <div className="ctx-label">Assign to group</div>
            <div className="ctx-item" onClick={() => { assignGroup(ctxMenu.tabId, null); closeCtx() }}>
              <span className="ctx-dot" style={{ background: 'var(--fg-dim)' }} /> None
            </div>
            {wsGroups.map(g => (
              <div key={g.id} className="ctx-item" onClick={() => { assignGroup(ctxMenu.tabId, g.id); closeCtx() }}>
                <span className="ctx-dot" style={{ background: g.color }} /> {g.name}
              </div>
            ))}
            <div className="ctx-item" onClick={() => {
              const name = prompt('Group name:')
              if (name) { const gid = addGroup(name); assignGroup(ctxMenu.tabId, gid); closeCtx() }
            }}>+ New group</div>
          </div>
        </div>
      )}

      {groupCtx && (
        <div className="ctx-overlay" onClick={closeCtx}>
          <div className="ctx-menu" style={{ left: groupCtx.x, top: groupCtx.y }} onClick={e => e.stopPropagation()}>
            <div className="ctx-item" onClick={() => {
              const g = groups.find(x => x.id === groupCtx.groupId)
              if (g) { setEditingGroup(g.id); setEditName(g.name); closeCtx() }
            }}>Rename</div>
            <div className="ctx-label">Color</div>
            {GROUP_COLORS.map(c => (
              <div key={c} className="ctx-item" onClick={() => { setGroupColor(groupCtx.groupId, c); closeCtx() }}>
                <span className="ctx-dot" style={{ background: c }} /> {c}
              </div>
            ))}
            <div className="ctx-sep" />
            <div className="ctx-item danger" onClick={() => { removeGroup(groupCtx.groupId); closeCtx() }}>Delete group</div>
          </div>
        </div>
      )}
    </>
  )
}
