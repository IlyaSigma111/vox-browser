import React from 'react'
import { useStore } from '../store'

const shortcuts = [
  { section: 'Tabs', items: [
    ['Ctrl+T', 'New tab'],
    ['Ctrl+W', 'Close tab'],
    ['Ctrl+Shift+T', 'Reopen closed tab'],
    ['Ctrl+Tab', 'Next tab'],
    ['Ctrl+Shift+Tab', 'Previous tab'],
    ['Alt+1–9', 'Switch to tab 1–9'],
    ['Ctrl+Alt+1–9', 'Move tab to workspace 1–9'],
    ['Middle click', 'Close tab'],
    ['Right click → Pin', 'Pin/unpin tab'],
  ]},
  { section: 'Navigation', items: [
    ['Alt+←', 'Back'],
    ['Alt+→', 'Forward'],
    ['F5 / Ctrl+R', 'Reload'],
    ['Ctrl+L', 'Focus address bar'],
    ['Ctrl+Enter', 'Navigate to URL'],
    ['Ctrl+D', 'Bookmark page'],
  ]},
  { section: 'Panels', items: [
    ['Ctrl+B', 'Bookmarks sidebar'],
    ['Ctrl+H', 'History sidebar'],
    ['Ctrl+E', 'Downloads sidebar'],
    ['Ctrl+G', 'Tab groups'],
  ]},
  { section: 'Interface', items: [
    ['Ctrl+,', 'Settings'],
    ['Ctrl+.', 'Settings (shortcut)'],
    ['Ctrl+F', 'Find on page'],
    ['Ctrl+\\', 'Toggle Zen mode'],
    ['F11', 'Toggle fullscreen'],
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
