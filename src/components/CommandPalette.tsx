import { useState, useRef, useEffect, useMemo } from 'react'
import { useStore } from '../store'

const COMMANDS = [
  { name: 'tabnew', alias: ['t'], desc: 'New tab' },
  { name: 'tabclose', alias: ['tabc', 'q'], desc: 'Close tab' },
  { name: 'tabnext', alias: ['tabn'], desc: 'Next tab' },
  { name: 'tabprev', alias: ['tabp'], desc: 'Prev tab' },
  { name: 'reload', alias: [], desc: 'Reload page' },
  { name: 'stop', alias: [], desc: 'Stop loading' },
  { name: 'back', alias: [], desc: 'Go back' },
  { name: 'forward', alias: [], desc: 'Go forward' },
  { name: 'history', alias: [], desc: 'Open history' },
  { name: 'bookmarks', alias: ['bm'], desc: 'Open bookmarks' },
  { name: 'settings', alias: ['set'], desc: 'Open settings' },
  { name: 'devtools', alias: ['dev'], desc: 'Toggle DevTools' },
  { name: 'newgroup', alias: ['ng'], desc: 'New tab group' },
  { name: 'newworkspace', alias: ['nws'], desc: 'New workspace' },
  { name: 'help', alias: ['h'], desc: 'Show help' },
]

export default function CommandPalette() {
  const showPalette = useStore(s => s.showPalette)
  const setPalette = useStore(s => s.setPalette)
  const paletteInput = useStore(s => s.paletteInput)
  const setPaletteInput = useStore(s => s.setPaletteInput)
  const tabs = useStore(s => s.tabs)
  const activeId = useStore(s => s.activeId)
  const activeWorkspace = useStore(s => s.activeWorkspace)
  const activate = useStore(s => s.activate)
  const closeTab = useStore(s => s.closeTab)
  const addTab = useStore(s => s.addTab)
  const navigateTo = useStore(s => s.navigateTo)
  const setSidebar = useStore(s => s.setSidebar)
  const addGroup = useStore(s => s.addGroup)
  const assignGroup = useStore(s => s.assignGroup)
  const switchWorkspace = useStore(s => s.switchWorkspace)
  const workspaces = useStore(s => s.workspaces)
  const setShowShortcuts = useStore(s => s.setShowShortcuts)
  const wsTabs = tabs.filter(t => t.workspace === activeWorkspace)

  const ref = useRef<HTMLInputElement>(null)
  const [sel, setSel] = useState(0)

  function runCmd(name: string) {
    const idx = wsTabs.findIndex(t => t.id === activeId)
    const actions: Record<string, () => void> = {
      tabnew: () => addTab(),
      tabclose: () => closeTab(activeId),
      tabnext: () => { if (idx < wsTabs.length - 1) activate(wsTabs[idx + 1].id) },
      tabprev: () => { if (idx > 0) activate(wsTabs[idx - 1].id) },
      reload: () => {
        const wv = useStore.getState().webviews.get(activeId)
        if (wv) wv.reload()
      },
      stop: () => {
        const wv = useStore.getState().webviews.get(activeId)
        if (wv) wv.stop()
      },
      back: () => {
        const wv = useStore.getState().webviews.get(activeId)
        if (wv?.canGoBack?.()) wv.goBack()
      },
      forward: () => {
        const wv = useStore.getState().webviews.get(activeId)
        if (wv?.canGoForward?.()) wv.goForward()
      },
      history: () => setSidebar('history'),
      bookmarks: () => setSidebar('bookmarks'),
      settings: () => useStore.getState().openSettings(),
      help: () => setShowShortcuts(true),
      newgroup: () => {
        const name = prompt('Group name:')
        if (name) { const gid = addGroup(name); assignGroup(activeId, gid) }
      },
      newworkspace: () => useStore.getState().addWorkspace(),
      devtools: () => {
        const wv = useStore.getState().webviews.get(activeId)
        if (wv) wv.openDevTools()
      },
    }
    actions[name]?.()
  }

  const results = useMemo(() => {
    const q = paletteInput.trim()
    if (!q) return COMMANDS.map(c => ({ type: 'cmd' as const, name: c.name, desc: c.desc, action: () => { runCmd(c.name); setPalette(false) } }))
    const lq = q.toLowerCase()
    const cmds = COMMANDS.filter(c => c.name.includes(lq) || c.alias.some(a => a.includes(lq)) || c.desc.toLowerCase().includes(lq))
    const tbs = wsTabs.filter(t => t.title.toLowerCase().includes(lq) || t.url.toLowerCase().includes(lq)).slice(0, 5)
    const open = () => { navigateTo(activeId, q); setPalette(false) }
    const urlRow: Array<{ type: 'url' | 'tab' | 'cmd'; name: string; desc: string; action: () => void }> = [{
      type: 'url', name: q, desc: /^(https?:|www\.)/i.test(q) ? 'Open URL' : 'Search', action: open,
    }]
    return [
      ...urlRow,
      ...tbs.map(t => ({ type: 'tab' as const, name: t.title, desc: t.url, action: () => { activate(t.id); setPalette(false) } })),
      ...cmds.map(c => ({ type: 'cmd' as const, name: c.name, desc: c.desc, action: () => { runCmd(c.name); setPalette(false) } })),
    ]
  }, [paletteInput, wsTabs, activeId, navigateTo])

  useEffect(() => { if (showPalette) { setTimeout(() => ref.current?.focus(), 30); setSel(0) } }, [showPalette])
  useEffect(() => setSel(0), [paletteInput])

  useEffect(() => {
    if (!showPalette) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setPalette(false) }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setSel(i => Math.min(i + 1, results.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(i => Math.max(i - 1, 0)) }
      else if (e.key === 'Enter') { e.preventDefault(); results[sel]?.action() }
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [showPalette, results, sel])

  if (!showPalette) return null

  return (
    <div className="palette-overlay" onClick={() => setPalette(false)}>
      <div className="palette" onClick={e => e.stopPropagation()}>
        <div className="palette-input-row">
          <span className="palette-cmd">:</span>
          <input
            ref={ref}
            className="palette-input"
            value={paletteInput}
            onChange={e => setPaletteInput(e.target.value)}
            placeholder="type a command or URL..."
            spellCheck={false}
          />
        </div>
        {results.length > 0 && (
          <div className="palette-results">
            {results.map((r, i) => (
              <div
                key={`${r.type}-${r.name}-${i}`}
                className={`palette-item${i === sel ? ' sel' : ''}`}
                onClick={r.action}
                onMouseEnter={() => setSel(i)}
              >
                <span className={`pi-type ${r.type}`}>{r.type === 'tab' ? '>' : r.type === 'url' ? '→' : ':'}</span>
                <span className="pi-name">{r.name}</span>
                <span className="pi-desc">{r.desc}</span>
              </div>
            ))}
          </div>
        )}
        {!paletteInput && (
          <div className="palette-results">
            <div className="palette-item sel" onClick={() => setPalette(false)}>
              <span className="pi-type cmd">:</span>
              <span className="pi-name">open &lt;url&gt;</span>
              <span className="pi-desc">Navigate to URL or search</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
