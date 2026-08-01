import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'

export default function BrowserToolbar() {
  const tabs = useStore(s => s.tabs)
  const activeId = useStore(s => s.activeId)
  const navigateTo = useStore(s => s.navigateTo)
  const setSidebar = useStore(s => s.setSidebar)
  const setZoom = useStore(s => s.setZoom)
  const setTabSearch = useStore(s => s.setTabSearch)
  const setSessionGraph = useStore(s => s.setSessionGraph)
  const active = tabs.find(t => t.id === activeId)

  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const searchUrl = useStore(s => s.settings.searchUrl)

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  const focusUrlBar = useStore(s => s.focusUrlBar)
  useEffect(() => {
    if (focusUrlBar > 0) {
      setInput(displayUrl)
      setEditing(true)
    }
  }, [focusUrlBar])

  const isNtp = active?.url === 'about:blank'
  const displayUrl = isNtp ? '' : active?.url || ''

  const submit = () => {
    setEditing(false)
    if (!input.trim()) return
    const url = input.trim().match(/^https?:\/\//) ? input.trim() : searchUrl.replace('%s', encodeURIComponent(input.trim()))
    navigateTo(activeId, url)
  }

  const goBack = () => {
    const wv = useStore.getState().webviews.get(activeId)
    if (wv?.canGoBack?.()) wv.goBack()
  }
  const goForward = () => {
    const wv = useStore.getState().webviews.get(activeId)
    if (wv?.canGoForward?.()) wv.goForward()
  }
  const reload = () => {
    const wv = useStore.getState().webviews.get(activeId)
    if (wv) wv.reload()
  }

  return (
    <div className="browser-toolbar">
      <div className="bt-nav">
        <button className="bt-btn" onClick={goBack} title="Back">←</button>
        <button className="bt-btn" onClick={goForward} title="Forward">→</button>
        <button className="bt-btn" onClick={reload} title="Reload">↻</button>
      </div>

      <div className="bt-url" onClick={() => { setInput(displayUrl); setEditing(true) }}>
        {editing ? (
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setEditing(false) }}
            onBlur={submit}
            className="bt-url-input"
            autoFocus
            spellCheck={false}
          />
        ) : (
          <span className="bt-url-text">{displayUrl}</span>
        )}
      </div>

      <div className="bt-title">{isNtp ? 'New Tab' : active?.title || ''}</div>

      <div className="bt-actions">
        <button className="bt-btn" onClick={() => setZoom(activeId, (active?.zoom || 1) - 0.1)} title="Zoom out">−</button>
        <span className="bt-zoom">{Math.round((active?.zoom || 1) * 100)}%</span>
        <button className="bt-btn" onClick={() => setZoom(activeId, (active?.zoom || 1) + 0.1)} title="Zoom in">+</button>
        <button className="bt-btn" onClick={() => setSessionGraph(!useStore.getState().showSessionGraph)} title="Session trail">🌐</button>
        <button className="bt-btn" onClick={() => setTabSearch(!useStore.getState().showTabSearch)} title="Tab Exposé (Ctrl+Shift+A)">▦</button>
        <button
          className="bt-btn"
          title="Save screenshot (Ctrl+Shift+S)"
          onClick={async () => {
            const wv = useStore.getState().webviews.get(useStore.getState().activeId)
            if (!wv?.capturePage) return
            try {
              const img = await wv.capturePage()
              const d = new Date()
              const pad = (n: number) => String(n).padStart(2, '0')
              window.onyx?.saveShot?.(img.toPNG(), `vox-shot-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.png`)
            } catch {}
          }}
        >📷</button>
        <button className="bt-btn" onClick={() => setSidebar('bookmarks')} title="Bookmarks">★</button>
        <button className="bt-btn" onClick={() => setSidebar('history')} title="History">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="6.5"/>
            <polyline points="8,4 8,8 11,10"/>
          </svg>
        </button>
        <button className="bt-btn" onClick={() => setSidebar('downloads')} title="Downloads">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 2v8M5 7l3 3 3-3M3 12h10"/>
          </svg>
        </button>
        <button className="bt-btn" onClick={() => setSidebar('settings')} title="Settings">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="2"/>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M13.1 2.9l-1.4 1.4M4.3 11.7l-1.4 1.4"/>
          </svg>
        </button>
      </div>

      <div className="bt-win">
        <button className="bt-btn bt-win-btn" onClick={() => window.onyx?.minimize()}>─</button>
        <button className="bt-btn bt-win-btn" onClick={() => window.onyx?.maximize()}>□</button>
        <button className="bt-btn bt-win-btn bt-win-close" onClick={() => window.onyx?.close()}>×</button>
      </div>
    </div>
  )
}
