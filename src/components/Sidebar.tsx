import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useStore, THEMES } from '../store'
import type { ThemePreset } from '../types'
import { t, setLang } from '../lang'
import PresetCatalog from './PresetCatalog'
import { featureOn } from '../features'

const ICONS = {
  bookmark: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <path d="M3 1h10v14l-5-3.5L3 15V1z"/>
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5"/>
      <polyline points="8,4 8,8 11,10"/>
    </svg>
  ),
  download: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 2v8M5 7l3 3 3-3M3 12h10"/>
    </svg>
  ),
}

export default function Sidebar() {
  const sidebarTab = useStore(s => s.sidebarTab)
  const setSidebar = useStore(s => s.setSidebar)
  const sidePos = useStore(s => s.settings.sidebarPosition)
  if (!sidebarTab) return null

  return (
    <div className={`sidebar${sidePos === 'right' ? ' sidebar-right' : ''}`}>
      <div className="sidebar-header">
        <h3>{sidebarTab === 'bookmarks' ? t('sidebar.bookmarks') : sidebarTab === 'history' ? t('sidebar.history') : sidebarTab === 'downloads' ? t('sidebar.downloads') : sidebarTab === 'reading' ? '📚 Список чтения' : sidebarTab === 'extensions' ? '🧩 Расширения' : t('sidebar.settings')}</h3>
        <button className="sidebar-close" onClick={() => setSidebar(null)}>×</button>
      </div>
      <div className="sidebar-body">
        {sidebarTab === 'bookmarks' && <Bookmarks />}
        {sidebarTab === 'history' && <History />}
        {sidebarTab === 'downloads' && <Downloads />}
        {sidebarTab === 'reading' && <ReadingList />}
        {sidebarTab === 'extensions' && <ExtensionsPanel />}
        {sidebarTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  )
}

function Bookmarks() {
  const bookmarks = useStore(s => s.bookmarks)
  const removeBookmark = useStore(s => s.removeBookmark)
  const navigateTo = useStore(s => s.navigateTo)
  const activeId = useStore(s => s.activeId)
  const setSidebar = useStore(s => s.setSidebar)
  if (!bookmarks.length) return <div className="sidebar-section">{t('sidebar.noBookmarks')}</div>
  return <>
    {bookmarks.map(b => (
      <div key={b.id} className="sidebar-item" onClick={() => { navigateTo(activeId, b.url); setSidebar(null) }}>
        <span className="si-icon">{ICONS.bookmark}</span>
        <span className="title">{b.title}</span>
        <button className="sb-btn si-rm" onClick={e => { e.stopPropagation(); removeBookmark(b.id) }}>×</button>
      </div>
    ))}
  </>
}

function History() {
  const history = useStore(s => s.history)
  const navigateTo = useStore(s => s.navigateTo)
  const activeId = useStore(s => s.activeId)
  const setSidebar = useStore(s => s.setSidebar)
  const clearHistory = useStore(s => s.clearHistory)
  const [search, setSearch] = useState('')
  const filtered = search ? history.filter(h => (h.title || h.url).toLowerCase().includes(search.toLowerCase()) || h.url.toLowerCase().includes(search.toLowerCase())) : history
  if (!history.length) return <div className="sidebar-section">{t('sidebar.noHistory')}</div>
  return <>
    <div style={{ padding: '6px 12px' }}>
      <input
        type="text"
        placeholder={`${t('sidebar.history')}...`}
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: '12px', padding: '4px 8px', borderRadius: 'var(--radius)', outline: 'none' }}
        spellCheck={false}
      />
    </div>
    {filtered.slice(0, 100).map(h => (
      <div key={h.id} className="sidebar-item" onClick={() => { navigateTo(activeId, h.url); setSidebar(null) }}>
        <span className="si-icon">{ICONS.clock}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="title">{h.title || h.url}</div>
          <div className="url">{new Date(h.visitedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    ))}
    <div className="sidebar-section" style={{ cursor: 'pointer' }} onClick={clearHistory}>{t('sidebar.clearHistory')}</div>
  </>
}

function ExtensionsPanel() {
  const [exts, setExts] = useState<string[] | null>(null)
  useEffect(() => {
    let alive = true
    window.onyx?.listExtensions?.().then((d: string[]) => { if (alive) setExts(d) }).catch(() => {})
    return () => { alive = false }
  }, [])
  return (
    <div className="ext-panel">
      <div className="st-hint" style={{ padding: '6px 14px' }}>Unpacked extensions (.crx распакованные) кладутся в папку <code>extensions</code> в userData. Vox загружает их при запуске.</div>
      <div className="st-actions" style={{ padding: '2px 14px 8px' }}>
        <button className="st-action-btn" onClick={() => window.onyx?.openExtensionsFolder?.()}>📂 Открыть папку расширений</button>
      </div>
      <div className="st-section">
        <div className="st-section-title">Загруженные</div>
        <div className="ext-list">
          {exts === null && <div className="st-hint" style={{ padding: '4px 14px' }}>Проверяю…</div>}
          {exts !== null && exts.length === 0 && <div className="st-hint" style={{ padding: '4px 14px' }}>Пока пусто. Расширения работают вместе с Магазином: файлы — вручную, флаги — в 🛍 Магазине.</div>}
          {exts?.map(d => <div key={d} className="ext-row">🧩 {d}</div>)}
        </div>
      </div>
    </div>
  )
}

function ReadingList() {
  const readList = useStore(s => s.settings.readList)
  const removeFromReadList = useStore(s => s.removeFromReadList)
  const navigateTo = useStore(s => s.navigateTo)
  const activeId = useStore(s => s.activeId)
  const setSidebar = useStore(s => s.setSidebar)
  if (!readList.length) return <div className="sidebar-section">Пока пусто. Сохраняй статьи на потом по Ctrl+Shift+R или через кнопку 📚 в статусбаре.</div>
  return <>
    {readList.map(r => (
      <div key={r.url} className="sidebar-item" onClick={() => { navigateTo(activeId, r.url); setSidebar(null) }}>
        <span className="si-icon">📄</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="title">{r.title}</div>
          <div className="url">{new Date(r.addedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</div>
        </div>
        <button className="sb-btn si-rm" onClick={e => { e.stopPropagation(); removeFromReadList(r.url) }}>×</button>
      </div>
    ))}
  </>
}

function Downloads() {
  const downloads = useStore(s => s.downloads)
  const removeDownload = useStore(s => s.removeDownload)
  const openExternal = (url: string) => window.onyx?.openExternal?.(url)
  const formatBytes = (b: number) => {
    if (b < 1024) return b + ' B'
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
    return (b / 1048576).toFixed(1) + ' MB'
  }
  if (!downloads.length) return <div className="sidebar-section">{t('sidebar.noDownloads')}</div>
  return <>
    {downloads.map(d => (
      <div key={d.id} className="sidebar-item" onClick={() => {
        if (d.savePath) window.onyx?.showInFolder?.(d.savePath)
        else openExternal(d.url)
      }} title={d.url}>
        <span className="si-icon">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 2v8M5 7l3 3 3-3M3 12h10"/>
          </svg>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="title">{d.filename}</div>
          <div className="url">
            {d.state === 'completed' ? <span style={{ color: 'var(--green)' }}>✓ {formatBytes(d.totalBytes)}</span>
              : d.state === 'cancelled' || d.state === 'interrupted' ? <span style={{ color: 'var(--red)' }}>✗ {t('download.interrupted')}</span>
              : d.state === 'paused' ? <span style={{ color: 'var(--orange)' }}>⏸ {formatBytes(d.receivedBytes)} / {formatBytes(d.totalBytes)}</span>
              : <span>{formatBytes(d.receivedBytes)} / {formatBytes(d.totalBytes)}</span>
            }
          </div>
          <div className="dl-actions" onClick={e => e.stopPropagation()}>
            {d.state === 'progressing' && <>
              <button className="dl-btn" onClick={() => window.onyx?.pauseDownload?.(d.id)}>⏸</button>
              <button className="dl-btn" onClick={() => window.onyx?.cancelDownload?.(d.id)}>✕</button>
            </>}
            {d.state === 'paused' && <button className="dl-btn" onClick={() => window.onyx?.resumeDownload?.(d.id)}>▶</button>}
            {d.state === 'completed' && d.savePath && <>
              <button className="dl-btn" title="Show in folder" onClick={() => window.onyx?.showInFolder?.(d.savePath!)}>📁</button>
              <button className="dl-btn" title="Open file" onClick={() => window.onyx?.openPath?.(d.savePath!)}>↗</button>
            </>}
            <button className="dl-btn" title="Remove from list" onClick={() => removeDownload(d.id)}>🗑</button>
          </div>
        </div>
      </div>
    ))}
  </>
}

export function SettingsPanel() {
  const settings = useStore(s => s.settings)
  const setSettings = useStore(s => s.setSettings)
  const c = settings.theme === 'custom' ? settings.customColors : THEMES[settings.theme]
  const [tab, setTab] = useState<'general' | 'appearance' | 'behavior'>('general')
  const [showPresets, setShowPresets] = useState(false)

  const setLangAndSettings = (lang: string) => {
    setLang(lang)
    setSettings({ language: lang })
  }

  return <div className="settings-panel">
    {showPresets && createPortal(<PresetCatalog onClose={() => setShowPresets(false)} />, document.body)}
    <div className="settings-tabs">
      <button className={`settings-tab${tab === 'general' ? ' active' : ''}`} onClick={() => setTab('general')}>{t('settings.general')}</button>
      <button className={`settings-tab${tab === 'appearance' ? ' active' : ''}`} onClick={() => setTab('appearance')}>{t('settings.appearance')}</button>
      <button className={`settings-tab${tab === 'behavior' ? ' active' : ''}`} onClick={() => setTab('behavior')}>{t('settings.behavior')}</button>
    </div>

    {tab === 'general' && <div className="settings-sections">
      <div className="store-cta" onClick={() => useStore.getState().openStore()}>
        <span className="store-cta-icon">🛍</span>
        <span className="store-cta-text">
          <b>Магазин Vox</b>
          <span>29 встроенных расширений — включай одним кликом</span>
        </span>
        <span className="store-cta-arrow">→</span>
      </div>
      <Section title={t('lang')}>
        <StRow label={t('lang')}>
          <select value={settings.language} onChange={e => setLangAndSettings(e.target.value)}>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>
        </StRow>
        <StRow label={t('behavior.searchEngine')}>
          <select value={settings.searchEngine} onChange={e => {
            const engines: Record<string, string> = {
              Google: 'https://www.google.com/search?q=%s',
              Yandex: 'https://yandex.ru/search/?text=%s',
              DuckDuckGo: 'https://duckduckgo.com/?q=%s',
              Bing: 'https://www.bing.com/search?q=%s',
              Brave: 'https://search.brave.com/search?q=%s',
            }
            setSettings({ searchEngine: e.target.value, searchUrl: engines[e.target.value] || '' })
          }}>
            <option>Google</option><option>Yandex</option><option>DuckDuckGo</option><option>Bing</option><option>Brave</option>
          </select>
        </StRow>
      </Section>

      <Section title={t('font')}>
        <StRow label={t('font.family')}>
          <select value={settings.fontFamily} onChange={e => setSettings({ fontFamily: e.target.value })}>
            <option value="'Consolas', monospace">Consolas</option>
            <option value="'Fira Code', monospace">Fira Code</option>
            <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
            <option value="'Cascadia Code', monospace">Cascadia Code</option>
            <option value="'Source Code Pro', monospace">Source Code Pro</option>
            <option value="'IBM Plex Mono', monospace">IBM Plex Mono</option>
            <option value="monospace">System Mono</option>
            <option value="system-ui, sans-serif">System UI</option>
          </select>
        </StRow>
        <StRow label={t('font.size')}>
          <div className="st-slider-row">
            <input type="range" min="10" max="20" value={settings.fontSize}
              onChange={e => setSettings({ fontSize: Number(e.target.value) })} />
            <span className="st-val">{settings.fontSize}px</span>
          </div>
        </StRow>
      </Section>

      <Section title={t('ntp')}>
        <StRow label={t('ntp.layout')}>
          <select value={settings.ntpLayout || 'default'} onChange={e => setSettings({ ntpLayout: e.target.value as any })}>
            <option value="default">{t('ntpLayout.default')}</option>
            <option value="minimal">{t('ntpLayout.minimal')}</option>
            <option value="centered">{t('ntpLayout.centered')}</option>
            <option value="zen">{t('ntpLayout.zen')}</option>
            <option value="gradient">{t('ntpLayout.gradient')}</option>
          </select>
        </StRow>
        <StRow label={t('ntp.clock')}><Toggle value={settings.ntpShowClock} onChange={v => setSettings({ ntpShowClock: v })} /></StRow>
        <StRow label={t('ntp.date')}><Toggle value={settings.ntpShowDate} onChange={v => setSettings({ ntpShowDate: v })} /></StRow>
        <StRow label={t('ntp.search')}><Toggle value={settings.ntpShowSearch} onChange={v => setSettings({ ntpShowSearch: v })} /></StRow>
        <StRow label={t('ntp.quickLinks')}><Toggle value={settings.ntpShowQuickLinks} onChange={v => setSettings({ ntpShowQuickLinks: v })} /></StRow>
        <StRow label={t('ntp.background')}>
          <input type="color" value={settings.ntpBgColor || '#1a1b26'} onChange={e => setSettings({ ntpBgColor: e.target.value })} />
        </StRow>
      </Section>
    </div>}

    {tab === 'appearance' && <div className="settings-sections">
      <Section title={t('settings.presets')}>
        <div className="st-actions">
          <button className="st-action-btn" onClick={() => setShowPresets(true)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
            {t('presets.title')} — {settings.currentPreset || 'Vox Classic'}
          </button>
        </div>
      </Section>

      <Section title={t('theme')}>
        {settings.theme !== 'custom' && (
          <div className="theme-live">
            <div className="tl-win" style={{ background: c.bg, borderColor: c.border }}>
              <div className="tl-bar" style={{ background: c.bgDim, borderColor: c.border }}>
                <i className="tl-dot" style={{ background: c.red }} />
                <i className="tl-dot" style={{ background: c.orange }} />
                <i className="tl-dot" style={{ background: c.green }} />
                <span className="tl-addr" style={{ background: c.bgLight, color: c.fgDim }}>site.example</span>
              </div>
              <div className="tl-body">
                <div className="tl-tabline">
                  <span className="tl-tab" style={{ background: c.bgLight, color: c.fgDim }}>Вкладка</span>
                  <span className="tl-tab act" style={{ background: c.bg, color: c.accent, boxShadow: `inset 0 -2px 0 ${c.accent}` }}>Активная</span>
                </div>
                <span className="tl-line" style={{ background: c.accent, opacity: .55 }} />
                <span className="tl-line" style={{ background: c.fgDim, opacity: .35 }} />
                <span className="tl-line short" style={{ background: c.fgDim, opacity: .2 }} />
                <span className="tl-btn" style={{ background: c.accent }} />
              </div>
              <div className="tl-status" style={{ background: c.bgDim, borderColor: c.border, color: c.fgDim }}>
                <i style={{ background: c.green }} /> готово · <b style={{ color: c.accent }}>{settings.theme}</b>
              </div>
            </div>
          </div>
        )}
        <StRow label={t('theme.preset')}>
          <select value={settings.theme} onChange={e => setSettings({ theme: e.target.value as ThemePreset })}>
            <optgroup label={t('theme.dark')}>
              <option value="tokyo-night">Tokyo Night</option>
              <option value="dracula">Dracula</option>
              <option value="monokai">Monokai</option>
              <option value="nord">Nord</option>
              <option value="solarized">Solarized</option>
              <option value="ayu">Ayu Dark</option>
              <option value="one-dark">One Dark</option>
              <option value="gruvbox">Gruvbox</option>
              <option value="catppuccin">Catppuccin Mocha</option>
            </optgroup>
            <optgroup label={t('theme.light')}>
              <option value="tokyo-day">Tokyo Day</option>
              <option value="solarized-light">Solarized Light</option>
              <option value="nord-light">Nord Light</option>
              <option value="github-light">GitHub Light</option>
              <option value="catppuccin-latte">Catppuccin Latte</option>
            </optgroup>
            <optgroup label="✨ Experimental">
              <option value="firefox-nova">Firefox Nova (Nightly)</option>
              <option value="nova-light">Nova Light</option>
              <option value="synthwave">Synthwave '86</option>
              <option value="outrun">Outrun</option>
              <option value="forest">Forest</option>
              <option value="everforest">Everforest</option>
              <option value="rose-pine">Rosé Pine</option>
              <option value="github-dark">GitHub Dark</option>
              <option value="midnight">Midnight</option>
              <option value="paper">Paper</option>
            </optgroup>
            <option value="custom">{t('theme.custom')}</option>
          </select>
        </StRow>
        {settings.theme !== 'custom' && (
          <div className="theme-grid">
            {Object.keys(THEMES).filter(k => k !== 'custom').map(k => {
              const tc = THEMES[k as ThemePreset]
              return (
                <button
                  key={k}
                  className={`theme-chip${settings.theme === k ? ' sel' : ''}`}
                  title={k}
                  onClick={() => setSettings({ theme: k as ThemePreset })}
                >
                  <span
                    className="theme-chip-bar"
                    style={{ background: `linear-gradient(90deg, ${tc.bg}, ${tc.bgLight} 55%, ${tc.accent})` }}
                  >
                    <i style={{ background: tc.accent }} />
                  </span>
                  <span className="theme-chip-name">{k}</span>
                </button>
              )
            })}
          </div>
        )}
        {settings.theme === 'custom' && <>
          <StRow label={t('theme.background')}><input type="color" value={c.bg} onChange={e => setSettings({ customColors: { ...settings.customColors, bg: e.target.value } })} /></StRow>
          <StRow label={t('theme.bgDim')}><input type="color" value={c.bgDim} onChange={e => setSettings({ customColors: { ...settings.customColors, bgDim: e.target.value } })} /></StRow>
          <StRow label={t('theme.bgLight')}><input type="color" value={c.bgLight} onChange={e => setSettings({ customColors: { ...settings.customColors, bgLight: e.target.value } })} /></StRow>
          <StRow label={t('theme.foreground')}><input type="color" value={c.fg} onChange={e => setSettings({ customColors: { ...settings.customColors, fg: e.target.value } })} /></StRow>
          <StRow label={t('theme.fgDim')}><input type="color" value={c.fgDim} onChange={e => setSettings({ customColors: { ...settings.customColors, fgDim: e.target.value } })} /></StRow>
          <StRow label={t('theme.border')}><input type="color" value={c.border} onChange={e => setSettings({ customColors: { ...settings.customColors, border: e.target.value } })} /></StRow>
          <StRow label={t('theme.accent')}><input type="color" value={c.accent} onChange={e => setSettings({ customColors: { ...settings.customColors, accent: e.target.value } })} /></StRow>
          <StRow label={t('theme.green')}><input type="color" value={c.green} onChange={e => setSettings({ customColors: { ...settings.customColors, green: e.target.value } })} /></StRow>
          <StRow label={t('theme.red')}><input type="color" value={c.red} onChange={e => setSettings({ customColors: { ...settings.customColors, red: e.target.value } })} /></StRow>
          <StRow label={t('theme.orange')}><input type="color" value={c.orange} onChange={e => setSettings({ customColors: { ...settings.customColors, orange: e.target.value } })} /></StRow>
          <StRow label={t('theme.cyan')}><input type="color" value={c.cyan} onChange={e => setSettings({ customColors: { ...settings.customColors, cyan: e.target.value } })} /></StRow>
          <StRow label={t('theme.purple')}><input type="color" value={c.purple} onChange={e => setSettings({ customColors: { ...settings.customColors, purple: e.target.value } })} /></StRow>
        </>}
      </Section>

      <Section title="Aurora">
        <StRow label="Adaptive accent (Aurora)">
          <Toggle value={settings.aurora} onChange={v => setSettings({ aurora: v })} />
        </StRow>
        <div className="st-hint">Собирает доминантный цвет открытой страницы и подстраивает акцентный цвет интерфейса под неё.</div>
      </Section>

      {featureOn(settings, 'lens') && (
        <Section title="Site Lenses">
          <SiteLenses />
        </Section>
      )}

      <Section title={t('tabBar')}>
        <StRow label={t('tabBar.shape')}>
          <select value={settings.tabShape} onChange={e => setSettings({ tabShape: e.target.value as any })}>
            <option value="square">{t('shape.square')}</option>
            <option value="rounded">{t('shape.rounded')}</option>
            <option value="pill">{t('shape.pill')}</option>
            <option value="trapezoid">{t('shape.trapezoid')}</option>
            <option value="yandex">{t('shape.yandex')}</option>
            <option value="wave">{t('shape.wave')}</option>
          </select>
        </StRow>
        <StRow label={t('tabBar.height')}>
          <div className="st-slider-row">
            <input type="range" min="24" max="48" value={settings.tabBarHeight}
              onChange={e => setSettings({ tabBarHeight: Number(e.target.value) })} />
            <span className="st-val">{settings.tabBarHeight}px</span>
          </div>
        </StRow>
        <StRow label={t('tabBar.showClose')}><Toggle value={settings.tabBarShowClose} onChange={v => setSettings({ tabBarShowClose: v })} /></StRow>
        <StRow label={t('tabBar.showFavicon')}><Toggle value={settings.tabBarShowFavicon} onChange={v => setSettings({ tabBarShowFavicon: v })} /></StRow>
        <StRow label={t('tabBar.showIndicator')}><Toggle value={settings.tabBarShowIndicator} onChange={v => setSettings({ tabBarShowIndicator: v })} /></StRow>
        <StRow label={t('tabBar.show')}><Toggle value={settings.showTabBar} onChange={v => setSettings({ showTabBar: v })} /></StRow>
      </Section>

      <Section title={t('statusBar')}>
        <StRow label={t('statusBar.height')}>
          <div className="st-slider-row">
            <input type="range" min="22" max="40" value={settings.statusBarHeight}
              onChange={e => setSettings({ statusBarHeight: Number(e.target.value) })} />
            <span className="st-val">{settings.statusBarHeight}px</span>
          </div>
        </StRow>
        <StRow label={t('statusBar.showMode')}><Toggle value={settings.statusBarShowMode} onChange={v => setSettings({ statusBarShowMode: v })} /></StRow>
        <StRow label={t('statusBar.showUrl')}><Toggle value={settings.statusBarShowUrl} onChange={v => setSettings({ statusBarShowUrl: v })} /></StRow>
        <StRow label={t('statusBar.showCount')}><Toggle value={settings.statusBarShowCount} onChange={v => setSettings({ statusBarShowCount: v })} /></StRow>
        <StRow label={t('statusBar.show')}><Toggle value={settings.showStatusBar} onChange={v => setSettings({ showStatusBar: v })} /></StRow>
      </Section>

      <Section title={t('layout')}>
        <StRow label={t('layout.tabBarPosition')}>
          <select value={settings.tabBarPosition} onChange={e => setSettings({ tabBarPosition: e.target.value as any })}>
            <option value="top">{t('layout.top')}</option>
            <option value="bottom">{t('layout.bottom')}</option>
          </select>
        </StRow>
        <StRow label={t('layout.statusBarPosition')}>
          <select value={settings.statusBarPosition} onChange={e => setSettings({ statusBarPosition: e.target.value as any })}>
            <option value="top">{t('layout.top')}</option>
            <option value="bottom">{t('layout.bottom')}</option>
          </select>
        </StRow>
        <StRow label={t('layout.sidebarPosition')}>
          <select value={settings.sidebarPosition} onChange={e => setSettings({ sidebarPosition: e.target.value as any })}>
            <option value="left">{t('layout.left')}</option>
            <option value="right">{t('layout.right')}</option>
          </select>
        </StRow>
        <StRow label={t('layout.sidebarWidth')}>
          <div className="st-slider-row">
            <input type="range" min="200" max="500" value={settings.sidebarWidth}
              onChange={e => setSettings({ sidebarWidth: Number(e.target.value) })} />
            <span className="st-val">{settings.sidebarWidth}px</span>
          </div>
        </StRow>
        <StRow label="Browser Chrome"><Toggle value={settings.browserChrome} onChange={v => setSettings({ browserChrome: v })} /></StRow>
      </Section>

      <Section title={t('visual')}>
        <StRow label={t('visual.borderRadius')}>
          <div className="st-slider-row">
            <input type="range" min="0" max="12" value={settings.borderRadius}
              onChange={e => setSettings({ borderRadius: Number(e.target.value) })} />
            <span className="st-val">{settings.borderRadius}px</span>
          </div>
        </StRow>
        <StRow label={t('visual.transition')}>
          <div className="st-slider-row">
            <input type="range" min="0" max="500" step="25" value={settings.transitionSpeed}
              onChange={e => setSettings({ transitionSpeed: Number(e.target.value) })} />
            <span className="st-val">{settings.transitionSpeed}ms</span>
          </div>
        </StRow>
        <StRow label={t('visual.tabOpacity')}>
          <div className="st-slider-row">
            <input type="range" min="0.3" max="1" step="0.05" value={settings.tabOpacity}
              onChange={e => setSettings({ tabOpacity: Number(e.target.value) })} />
            <span className="st-val">{Math.round(settings.tabOpacity * 100)}%</span>
          </div>
        </StRow>
      </Section>

      <Section title={t('titlebar') + ' / ' + t('workspace')}>
        <StRow label={t('titlebar.height')}>
          <div className="st-slider-row">
            <input type="range" min="0" max="20" value={settings.titlebarHeight}
              onChange={e => setSettings({ titlebarHeight: Number(e.target.value) })} />
            <span className="st-val">{settings.titlebarHeight}px</span>
          </div>
        </StRow>
        <StRow label={t('workspace.show')}><Toggle value={settings.workspaceShow} onChange={v => setSettings({ workspaceShow: v })} /></StRow>
        <StRow label={t('workspace.position')}>
          <select value={settings.workspacePosition} onChange={e => setSettings({ workspacePosition: e.target.value as any })}>
            <option value="top">{t('workspace.position.top')}</option>
            <option value="bottom">{t('workspace.position.bottom')}</option>
          </select>
        </StRow>
      </Section>
    </div>}

    {tab === 'behavior' && <div className="settings-sections">
      <Section title={t('behavior')}>
        <StRow label={t('behavior.zenMode')}><Toggle value={settings.zenMode} onChange={v => setSettings({ zenMode: v })} /></StRow>
        <StRow label={t('behavior.vim')}><Toggle value={settings.vimEnabled} onChange={v => setSettings({ vimEnabled: v })} /></StRow>
        <StRow label={t('behavior.darkReader')}><Toggle value={settings.darkReader} onChange={v => setSettings({ darkReader: v })} /></StRow>
        <StRow label={t('behavior.smoothScroll')}><Toggle value={settings.smoothScroll} onChange={v => setSettings({ smoothScroll: v })} /></StRow>
        <StRow label="Restore tabs on launch"><Toggle value={settings.restoreTabs} onChange={v => setSettings({ restoreTabs: v })} /></StRow>
        <StRow label="Confirm before closing"><Toggle value={settings.confirmClose} onChange={v => setSettings({ confirmClose: v })} /></StRow>
      </Section>

      <Section title="Start & zoom">
        <StRow label="Homepage">
          <input
            type="text"
            value={settings.homepage}
            onChange={e => setSettings({ homepage: e.target.value })}
            placeholder="https://example.com"
            style={{ width: '100%', background: 'var(--bg-light)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 12, padding: '4px 8px', borderRadius: 'var(--radius)', outline: 'none' }}
            spellCheck={false}
          />
        </StRow>
        <StRow label="Default zoom">
          <div className="st-slider-row">
            <input type="range" min="0.5" max="2" step="0.1" value={settings.defaultZoom || 1}
              onChange={e => setSettings({ defaultZoom: Number(e.target.value) })} />
            <span className="st-val">{Math.round((settings.defaultZoom || 1) * 100)}%</span>
          </div>
        </StRow>
      </Section>

      <Section title={t('settings.system')}>
        <div className="st-actions">
          <button className="st-action-btn" onClick={() => window.onyx?.setDefaultBrowser?.()}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6.5"/><path d="M8 2v6l3 3"/></svg>
            {t('behavior.setDefault')}
          </button>
          <button className="st-action-btn secondary" onClick={() => window.onyx?.openDefaultApps?.()}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6.5"/><path d="M8 2v6l3 3"/></svg>
            {t('behavior.openDefaultApps')}
          </button>
        </div>
      </Section>
    </div>}
  </div>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="st-section">
      <div className="st-section-title">{title}</div>
      <div className="st-section-body">{children}</div>
    </div>
  )
}

function StRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="st-row">
      <label>{label}</label>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className={`toggle${value ? ' on' : ''}`} onClick={() => onChange(!value)}>
      <div className="toggle-knob" />
    </div>
  )
}

function hostOf(url: string) {
  try { return new URL(url).hostname } catch { return '' }
}

function SiteLenses() {
  const lenses = useStore(s => s.settings.lenses)
  const setSettings = useStore(s => s.setSettings)
  const tabs = useStore(s => s.tabs)
  const [editing, setEditing] = useState<string | null>(null)
  const [domain, setDomain] = useState('')
  const [zoom, setZoom] = useState(1)
  const [dark, setDark] = useState(false)
  const [vim, setVim] = useState(true)

  const saveLens = () => {
    const d = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!d) return
    const others = lenses.filter(l => l.domain !== d)
    const next = [...others, { domain: d, zoom, darkReader: dark, vimEnabled: vim, enabled: true }]
    setSettings({ lenses: next })
    setEditing(null)
  }

  const startEdit = (l?: { domain: string; zoom?: number; darkReader?: boolean; vimEnabled?: boolean }) => {
    if (l) { setDomain(l.domain); setZoom(l.zoom || 1); setDark(!!l.darkReader); setVim(l.vimEnabled !== false) }
    setEditing(l?.domain || '')
  }

  return (
    <div className="lens-list">
      {editing === null && (
        <button className="st-action-btn" onClick={() => startEdit()}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>
          + Add lens for current site
        </button>
      )}
      {editing === null && (
        <div className="lens-current">
          <span className="lens-current-domain">{hostOf(tabs.find(t => t.id === useStore.getState().activeId)?.url || '') || 'no active page'}</span>
        </div>
      )}
      {editing !== null && (
        <div className="lens-edit">
          <input className="lens-domain-input" placeholder="example.com" value={domain} onChange={e => setDomain(e.target.value)} spellCheck={false} />
          <StRow label="Zoom">
            <div className="st-slider-row">
              <input type="range" min="0.5" max="2" step="0.1" value={zoom} onChange={e => setZoom(Number(e.target.value))} />
              <span className="st-val">{Math.round(zoom * 100)}%</span>
            </div>
          </StRow>
          <StRow label="Dark reader"><Toggle value={dark} onChange={setDark} /></StRow>
          <StRow label="Vim keys"><Toggle value={vim} onChange={setVim} /></StRow>
          <div className="st-actions" style={{ marginTop: 8 }}>
            <button className="st-action-btn" onClick={saveLens}>Save</button>
            <button className="st-action-btn secondary" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
      {lenses.map(l => (
        <div className="lens-row" key={l.domain}>
          <span className="lens-domain">{l.domain}</span>
          <span className="lens-meta">{Math.round((l.zoom || 1) * 100)}%{l.darkReader ? ' · dark' : ''}{l.vimEnabled === false ? '' : ' · vim'}</span>
          <button className="sb-btn" onClick={() => startEdit(l)}>✎</button>
          <button className="sb-btn" onClick={() => setSettings({ lenses: lenses.filter(x => x.domain !== l.domain) })}>×</button>
        </div>
      ))}
      {lenses.length === 0 && editing === null && <div className="st-hint">Одна «линза» = набор настроек для конкретного сайта: масштаб, тёмный режим, vim-клавиши.</div>}
    </div>
  )
}
