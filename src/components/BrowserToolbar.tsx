import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { Icon } from './icons'

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
  const isSettings = active?.url === 'vox:settings'
  const displayUrl = (isNtp || isSettings) ? '' : active?.url || ''

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
        <button className="bt-btn" onClick={goBack} title="Back"><Icon name="back" /></button>
        <button className="bt-btn" onClick={goForward} title="Forward"><Icon name="forward" /></button>
        <button className="bt-btn" onClick={reload} title="Reload"><Icon name="reload" /></button>
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

      <div className="bt-title">{isNtp ? 'New Tab' : isSettings ? 'Settings' : active?.title || ''}</div>

      <div className="bt-actions">
        <button className="bt-btn" onClick={() => setZoom(activeId, (active?.zoom || 1) - 0.1)} title="Zoom out">−</button>
        <span className="bt-zoom">{Math.round((active?.zoom || 1) * 100)}%</span>
        <button className="bt-btn" onClick={() => setZoom(activeId, (active?.zoom || 1) + 0.1)} title="Zoom in">+</button>
        <button className="bt-btn" onClick={() => setSessionGraph(!useStore.getState().showSessionGraph)} title="Session trail"><Icon name="graph" /></button>
        <button className="bt-btn" onClick={() => setTabSearch(!useStore.getState().showTabSearch)} title="Tab Exposé (Ctrl+Shift+A)"><Icon name="grid" /></button>
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
        ><Icon name="camera" /></button>
        <button className="bt-btn" onClick={() => setSidebar('bookmarks')} title="Bookmarks"><Icon name="star" /></button>
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
        <button className="bt-btn" onClick={() => useStore.getState().openSettings()} title="Settings (Ctrl+,)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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
