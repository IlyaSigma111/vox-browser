import React, { useEffect, useMemo, useRef } from 'react'
import { useStore } from '../store'

export default function TabExpose() {
  const show = useStore(s => s.showTabSearch)
  const setTabSearch = useStore(s => s.setTabSearch)
  const tabs = useStore(s => s.tabs)
  const activeId = useStore(s => s.activeId)
  const activate = useStore(s => s.activate)
  const closeTab = useStore(s => s.closeTab)
  const setSidebar = useStore(s => s.setSidebar)
  const addTab = useStore(s => s.addTab)
  const [q, setQ] = React.useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!show) { setQ(''); return }
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [show])

  useEffect(() => {
    if (!show) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setTabSearch(false) }
      if (e.key === 'Enter') { e.preventDefault(); setTabSearch(false) }
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [show, setTabSearch])

  const results = useMemo(() => {
    const lq = q.trim().toLowerCase()
    let list = tabs
    if (lq) list = tabs.filter(t => t.title.toLowerCase().includes(lq) || t.url.toLowerCase().includes(lq))
    return list
  }, [tabs, q])

  if (!show) return null

  return (
    <div className="expose-overlay" onClick={() => setTabSearch(false)}>
      <div className="expose-inner" onClick={e => e.stopPropagation()}>
        <div className="expose-search-row">
          <input
            ref={inputRef}
            className="expose-search"
            placeholder="Search tabs…  (Esc to close)"
            value={q}
            onChange={e => setQ(e.target.value)}
            spellCheck={false}
          />
          <button className="btn" onClick={() => { addTab(); setTabSearch(false) }}>+ New tab</button>
        </div>
        <div className="expose-grid">
          {results.map(t => (
            <button
              key={t.id}
              className={`expose-card${t.id === activeId ? ' active' : ''}`}
              onClick={() => { activate(t.id); setTabSearch(false) }}
              onDoubleClick={() => closeTab(t.id)}
            >
              <div className="expose-card-top">
                {t.favicon ? <img className="expose-fav" src={t.favicon} alt="" /> : <span className="expose-fav placeholder" />}
                <span className="expose-title">{t.title || 'New tab'}</span>
                <span className="expose-close" onClick={(e) => { e.stopPropagation(); closeTab(t.id) }}>✕</span>
              </div>
              <div className="expose-preview">
                <span className="expose-domain">{(t.url || 'about:blank').replace(/^https?:\/\//, '').split('/')[0]}</span>
              </div>
              <div className="expose-card-bottom">
                <span className="expose-url">{t.url}</span>
                {t.incognito && <span className="expose-badge">incognito</span>}
              </div>
            </button>
          ))}
          {results.length === 0 && <div className="expose-empty">No tabs match "{q}"</div>}
        </div>
        <div className="expose-footer">
          <button className="btn" onClick={() => { setSidebar('history'); setTabSearch(false) }}>History</button>
          <button className="btn" onClick={() => { useStore.getState().openSettings(); setTabSearch(false) }}>Settings</button>
        </div>
      </div>
    </div>
  )
}
