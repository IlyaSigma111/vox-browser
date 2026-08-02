import React, { useEffect, useState } from 'react'
import { useStore } from '../store'

export default function DynamicIsland() {
  const tabs = useStore(s => s.tabs)
  const activeId = useStore(s => s.activeId)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  const tab = tabs.find(t => t.id === activeId)
  const title = tab?.title || tab?.url || 'New Tab'
  let host = ''
  try { host = tab?.url ? new URL(tab.url).hostname.replace(/^www\./, '') : '' } catch {}
  const url = tab?.url && !tab.url.startsWith('vox:') ? tab.url : ''

  const copy = () => {
    if (!url) return
    const done = () => useStore.getState().pushToast('URL скопирован')
    const w = window as any
    if (w.onyx?.writeClipboard) w.onyx.writeClipboard(url).then(done).catch(done)
    else { navigator.clipboard?.writeText(url).then(done).catch(done); done() }
  }

  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const sec = String(now.getSeconds()).padStart(2, '0')

  return (
    <div className="dyn-island">
      <div className="dyn-island-main">
        {tab?.favicon ? <img className="dyn-icon" src={tab.favicon} alt="" /> : <span className="dyn-icon dyn-icon-fallback">◍</span>}
        <span className="dyn-title" title={title}>{host || title}</span>
        <span className="dyn-sep" />
        <span className="dyn-time">{hh}:{mm}<span className="dyn-sec">:{sec}</span></span>
        {tab?.loading && <span className="dyn-loading" />}
      </div>
      <div className="dyn-island-ext">
        {url ? (
          <>
            <span className="dyn-url">{url}</span>
            <button className="dyn-btn" onClick={copy} title="Copy URL">⎘</button>
          </>
        ) : (
          <span className="dyn-url dyn-url-plain">{title}</span>
        )}
      </div>
    </div>
  )
}
