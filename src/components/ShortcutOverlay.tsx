import React from 'react'
import { useStore } from '../store'

const shortcuts = [
  { section: 'Tabs', items: [
    ['Ctrl+T', 'New tab'],
    ['Ctrl+Shift+T', 'Reopen closed tab'],
    ['Ctrl+Shift+N', 'New incognito tab'],
    ['Ctrl+W', 'Close tab'],
    ['Ctrl+Tab / Ctrl+Shift+Tab', 'Next / previous tab'],
    ['Alt+1–9', 'Switch workspace 1–9'],
    ['Ctrl+Alt+1–9', 'Move tab to workspace 1–9'],
    ['Middle click', 'Close tab'],
  ]},
  { section: 'Navigation', items: [
    ['Alt+←', 'Back'],
    ['Alt+→', 'Forward'],
    ['F5 / Ctrl+R', 'Reload'],
    ['Ctrl+L', 'Focus address bar'],
    ['Ctrl+D', 'Bookmark page'],
    ['Ctrl+F', 'Find on page'],
    ['Ctrl+- / Ctrl+= / Ctrl+0', 'Zoom out / in / reset'],
  ]},
  { section: 'Features', items: [
    ['Ctrl+Shift+A', 'Tab Exposé'],
    ['Ctrl+Shift+F', 'Grep full history'],
    ['Ctrl+Shift+P', 'Page in PiP window'],
    ['Ctrl+Shift+S', 'Save page screenshot'],
    ['Ctrl+Shift+C', 'Copy page screenshot'],
    ['Ctrl+H', 'History sidebar'],
    ['Ctrl+E', 'Downloads sidebar'],
    ['Ctrl+B', 'Bookmarks sidebar'],
    ['Ctrl+,', 'Settings'],
    ['Ctrl+\\', 'Zen mode'],
    ['?', 'Show this overlay'],
  ]},
]

export default function ShortcutOverlay() {
  const showShortcuts = useStore(s => s.showShortcuts)
  const setShowShortcuts = useStore(s => s.setShowShortcuts)
  if (!showShortcuts) return null
  return (
    <div className="modal-backdrop" onClick={() => setShowShortcuts(false)}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Keyboard Shortcuts</h2>
          <button className="btn" onClick={() => setShowShortcuts(false)} style={{ fontSize: 18, padding: '2px 8px' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
          {shortcuts.map(group => (
            <div key={group.section}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{group.section}</div>
              {group.items.map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-dim)' }}>{desc}</span>
                  <kbd style={{
                    background: 'var(--bg-light)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    padding: '1px 6px',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    color: 'var(--fg)',
                    whiteSpace: 'nowrap',
                    marginLeft: 8,
                  }}>{key}</kbd>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
