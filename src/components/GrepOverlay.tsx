import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store'

function strip(t: string) {
  return (t || '').replace(/\s+/g, ' ').trim()
}

function snippet(text: string, q: string) {
  const t = strip(text)
  if (!q) return t.slice(0, 160)
  const i = t.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return t.slice(0, 160)
  const s = Math.max(0, i - 60)
  return (s > 0 ? '…' : '') + t.slice(s, s + 180) + (s + 180 < t.length ? '…' : '')
}

export default function GrepOverlay() {
  const history = useStore(s => s.history)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const activate = useStore(s => s.activate)
  const navigateTo = useStore(s => s.navigateTo)
  const addTab = useStore(s => s.addTab)
  const setTabSearch = useStore(s => s.setTabSearch)

  const showShortcuts = useStore(s => s.showShortcuts)

  // Toggle with Ctrl+Shift+F via store-less event
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [])

  useEffect(() => {
    if (!open) { setQ(''); return }
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [open])

  const results = useMemo(() => {
    const lq = q.trim().toLowerCase()
    const seen = new Set<string>()
    const out: any[] = []
    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i]
      if (seen.has(h.url)) continue
      const title = (h.title || '').toLowerCase()
      const text = (h.text || '').toLowerCase()
      const u = h.url.toLowerCase()
      if (!lq || title.includes(lq) || u.includes(lq) || text.includes(lq)) {
        seen.add(h.url)
        out.push(h)
      }
      if (out.length >= 60) break
    }
    return out
  }, [history, q])

  if (!open) return null

  return (
    <div className="grep-overlay" onClick={() => setOpen(false)}>
      <div className="grep-inner" onClick={e => e.stopPropagation()}>
        <div className="grep-search-row">
          <span className="grep-icon">🔎</span>
          <input
            ref={inputRef}
            className="grep-search"
            placeholder="Search across every page you've visited…"
            value={q}
            onChange={e => setQ(e.target.value)}
            spellCheck={false}
          />
          <span className="grep-count">{results.length} results</span>
        </div>
        <div className="grep-list">
          {results.map(h => (
            <button
              key={h.id}
              className="grep-item"
              onClick={() => { navigateTo(useStore.getState().activeId, h.url); setOpen(false) }}
              onAuxClick={(e) => { if (e.button === 1) { addTab(h.url); setOpen(false) } }}
            >
              <div className="grep-item-title">{h.title || h.url}</div>
              <div className="grep-item-snippet">{snippet(h.text || '', q)}</div>
              <div className="grep-item-url">{h.url}</div>
            </button>
          ))}
          {results.length === 0 && <div className="grep-empty">Nothing found — pages get indexed as you visit them.</div>}
        </div>
        <div className="grep-footer">
          <span>Enter — open · Middle-click — open in new tab · Esc — close</span>
        </div>
      </div>
    </div>
  )
}
