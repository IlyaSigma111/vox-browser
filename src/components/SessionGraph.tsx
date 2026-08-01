import React, { useEffect, useMemo } from 'react'
import { useStore } from '../store'

function host(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u }
}

function icon(u: string) {
  try { return `https://${new URL(u).hostname}/favicon.ico` } catch { return '' }
}

export default function SessionGraph() {
  const show = useStore(s => s.showSessionGraph)
  const setSessionGraph = useStore(s => s.setSessionGraph)
  const trails = useStore(s => s.navTrails)
  const activeId = useStore(s => s.activeId)
  const navigateTo = useStore(s => s.navigateTo)
  const closeTab = useStore(s => s.closeTab)

  useEffect(() => {
    if (!show) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setSessionGraph(false) }
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [show, setSessionGraph])

  const trail = useMemo(() => trails[activeId] || [], [trails, activeId])

  if (!show) return null

  return (
    <div className="graph-overlay" onClick={() => setSessionGraph(false)}>
      <div className="graph-inner" onClick={e => e.stopPropagation()}>
        <div className="graph-head">
          <h2>Session trail</h2>
          <span className="graph-count">{trail.length} hops · active tab</span>
          <button className="btn" onClick={() => setSessionGraph(false)} style={{ marginLeft: 'auto' }}>✕</button>
        </div>
        {trail.length === 0 ? (
          <div className="graph-empty">No navigation trail yet for this tab.</div>
        ) : (
          <div className="graph-track">
            {trail.map((t, i) => {
              const isLast = i === trail.length - 1
              return (
                <div className={`graph-node${isLast ? ' current' : ''}`} key={i} style={{ ['--i' as any]: i }}>
                  <div className="graph-node-row">
                    <span className="graph-dot">{i + 1}</span>
                    <div className="graph-node-body">
                      <div className="graph-node-title">{t.title || host(t.url)}</div>
                      <div className="graph-node-url">{t.url}</div>
                    </div>
                    {isLast && <span className="graph-current-badge">now</span>}
                    <div className="graph-node-actions">
                      <button className="btn ghost small" onClick={() => navigateTo(activeId, t.url)}>↗</button>
                      <button className="btn ghost small" onClick={() => { navigateTo(activeId, t.url); setSessionGraph(false) }}>open</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="graph-foot">Esc — close · dotted line = one navigation hop</div>
      </div>
    </div>
  )
}
