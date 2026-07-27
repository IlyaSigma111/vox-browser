import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { t } from '../lang'

export default function NewTabPage() {
  const bookmarks = useStore(s => s.bookmarks)
  const settings = useStore(s => s.settings)
  const setSettings = useStore(s => s.setSettings)
  const navigateTo = useStore(s => s.navigateTo)
  const activeId = useStore(s => s.activeId)
  const [time, setTime] = useState(new Date())
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')

  useEffect(() => { const i = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(i) }, [])

  const go = (url: string) => navigateTo(activeId, url)

  const h = (e: React.FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    const url = q.trim().match(/^https?:\/\//) ? q.trim() : settings.searchUrl.replace('%s', encodeURIComponent(q.trim()))
    go(url)
  }

  const addLink = () => {
    if (!newName.trim() || !newUrl.trim()) return
    const url = newUrl.trim().match(/^https?:\/\//) ? newUrl.trim() : `https://${newUrl.trim()}`
    setSettings({ ntpQuickLinks: [...settings.ntpQuickLinks, { name: newName.trim(), url }] })
    setNewName('')
    setNewUrl('')
    setAdding(false)
  }

  const removeLink = (idx: number) => {
    setSettings({ ntpQuickLinks: settings.ntpQuickLinks.filter((_, i) => i !== idx) })
  }

  const layout = settings.ntpLayout || 'default'
  const locale = settings.language === 'ru' ? 'ru-RU' : 'en-US'

  const clock = settings.ntpShowClock && (
    <div className="ntp-clock">
      {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
    </div>
  )

  const date = settings.ntpShowDate && (
    <div className="ntp-date">
      {time.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
    </div>
  )

  const search = settings.ntpShowSearch && (
    <form className="ntp-search" onSubmit={h}>
      <span className="ntp-prompt">&gt;</span>
      <input
        className="ntp-input"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={settings.searchEngine.toLowerCase()}
        autoFocus
        spellCheck={false}
      />
    </form>
  )

  const quickLinks = settings.ntpShowQuickLinks && (
    <div className="ntp-links-wrap">
      <div className="ntp-links">
        {settings.ntpQuickLinks.map((link, i) => (
          <div key={i} className="ntp-link-item">
            <button className="ntp-link" onClick={() => go(link.url)}>{link.name}</button>
            {editing && (
              <button className="ntp-link-rm" onClick={() => removeLink(i)} title="Remove">×</button>
            )}
          </div>
        ))}
        {adding ? (
          <form className="ntp-link-add" onSubmit={e => { e.preventDefault(); addLink() }}>
            <input className="ntp-add-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="name" autoFocus />
            <input className="ntp-add-url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="url" />
            <button type="submit" className="ntp-add-ok">✓</button>
            <button type="button" className="ntp-add-cancel" onClick={() => setAdding(false)}>×</button>
          </form>
        ) : (
          <button className="ntp-link ntp-link-add-btn" onClick={() => setAdding(true)} title="Add link">+</button>
        )}
      </div>
      {settings.ntpQuickLinks.length > 0 && (
        <button className="ntp-edit-btn" onClick={() => setEditing(!editing)}>
          {editing ? '✓' : '✎'}
        </button>
      )}
    </div>
  )

  const bms = bookmarks.length > 0 && (
    <div className="ntp-bm">
      <span className="ntp-label">{t('sidebar.bookmarks')}</span>
      <div className="ntp-links">
        {bookmarks.slice(0, 6).map(b => (
          <button key={b.id} className="ntp-link" onClick={() => go(b.url)}>{b.title}</button>
        ))}
      </div>
    </div>
  )

  const footer = (
    <div className="ntp-footer">
      f: hints · :: command · i: insert · j/k: scroll · Alt+1-9: workspace · Ctrl+Shift+E: zen
      <br />
      <a href="https://ilyasigma111.github.io/vox-browser/" onClick={e => { e.preventDefault(); window.onyx?.openExternal?.('https://ilyasigma111.github.io/vox-browser/') }} style={{ color: 'var(--accent)', textDecoration: 'none', opacity: 0.6 }}>Vox Browser</a>
    </div>
  )

  const editControls = (
    <div className="ntp-links-wrap" style={{ position: 'fixed', top: 12, right: 12 }}>
      {settings.ntpQuickLinks.length > 0 && (
        <button className="ntp-edit-btn" onClick={() => setEditing(!editing)}>
          {editing ? '✓' : '✎'}
        </button>
      )}
    </div>
  )

  if (layout === 'minimal') {
    return (
      <div className="ntp ntp-minimal">
        {search}
        {footer}
      </div>
    )
  }

  if (layout === 'centered') {
    return (
      <div className="ntp ntp-centered">
        <div className="ntp-centered-wrap">
          {clock}
          {date}
          {search}
          {quickLinks}
        </div>
        {footer}
      </div>
    )
  }

  if (layout === 'zen') {
    return (
      <div className="ntp ntp-zen-layout">
        {search}
        {editControls}
        {footer}
      </div>
    )
  }

  if (layout === 'gradient') {
    return (
      <div className="ntp ntp-gradient">
        <div className="ntp-gradient-wrap">
          {clock}
          {date}
          {search}
          {quickLinks}
          {bms}
        </div>
        {footer}
      </div>
    )
  }

  // default
  return (
    <div className="ntp">
      {clock}
      {date}
      {search}
      {quickLinks}
      {bms}
      {footer}
    </div>
  )
}
