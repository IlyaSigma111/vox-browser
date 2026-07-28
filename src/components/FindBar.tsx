import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'

export default function FindBar({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [count, setCount] = useState({ current: 0, total: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const activeId = useStore(s => s.activeId)

  useEffect(() => {
    if (show) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setCount({ current: 0, total: 0 })
    }
  }, [show])

  const find = (forward: boolean = true) => {
    const wv = useStore.getState().webviews.get(activeId)
    if (!wv || !query) return
    wv.findInPage(query, { forward, findNext: false })
    // Get match count via executeJavaScript
    wv.executeJavaScript(`
      (function() {
        var marks = document.querySelectorAll('vox-find-mark');
        return marks.length;
      })()
    `).catch(() => {})
  }

  const findNext = () => find(true)
  const findPrev = () => find(false)

  const stopFind = () => {
    const wv = useStore.getState().webviews.get(activeId)
    if (wv) wv.stopFindInPage('clearSelection')
  }

  useEffect(() => {
    if (!query) {
      stopFind()
      setCount({ current: 0, total: 0 })
      return
    }
    const wv = useStore.getState().webviews.get(activeId)
    if (!wv) return
    wv.findInPage(query, { forward: true, findNext: false })
    // Track active match count
    const h = (_e: any, result: any) => {
      if (result && result.activeMatchOrdinal !== undefined) {
        setCount({ current: result.activeMatchOrdinal, total: result.matches || 0 })
      }
    }
    wv.on('found-in-page', h)
    return () => { wv.off('found-in-page', h); wv.stopFindInPage('clearSelection') }
  }, [query, activeId])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!show) return
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault() }
      if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? findPrev() : findNext() }
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [show, query, onClose])

  if (!show) return null

  return (
    <div className="find-bar">
      <input
        ref={inputRef}
        className="find-input"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Find in page..."
        spellCheck={false}
      />
      {query && (
        <span className="find-count">
          {count.total > 0 ? `${count.current}/${count.total}` : '0/0'}
        </span>
      )}
      <button className="find-btn" onClick={findPrev} title="Previous (Shift+Enter)">↑</button>
      <button className="find-btn" onClick={findNext} title="Next (Enter)">↓</button>
      <button className="find-btn find-close" onClick={() => { stopFind(); onClose() }} title="Close (Esc)">×</button>
    </div>
  )
}
