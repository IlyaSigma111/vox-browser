import { useState } from 'react'
import { useStore, THEMES } from '../store'
import type { ThemePreset } from '../types'
import { t, setLang } from '../lang'

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
}

function CollapseSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="cs">
      <div className="cs-header" onClick={() => setOpen(!open)}>
        <span className={`cs-arrow${open ? ' open' : ''}`}>›</span>
        <span className="cs-title">{title}</span>
      </div>
      {open && <div className="cs-body">{children}</div>}
    </div>
  )
}

export default function Sidebar() {
  const sidebarTab = useStore(s => s.sidebarTab)
  const setSidebar = useStore(s => s.setSidebar)
  if (!sidebarTab) return null

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>{sidebarTab === 'bookmarks' ? t('sidebar.bookmarks') : sidebarTab === 'history' ? t('sidebar.history') : t('sidebar.settings')}</h3>
        <button className="sidebar-close" onClick={() => setSidebar(null)}>×</button>
      </div>
      <div className="sidebar-body">
        {sidebarTab === 'bookmarks' && <Bookmarks />}
        {sidebarTab === 'history' && <History />}
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
  if (!history.length) return <div className="sidebar-section">{t('sidebar.noHistory')}</div>
  return <>
    {history.slice(0, 100).map(h => (
      <div key={h.id} className="sidebar-item" onClick={() => { navigateTo(activeId, h.url); setSidebar(null) }}>
        <span className="si-icon">{ICONS.clock}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="title">{h.title || h.url}</div>
          <div className="url">{new Date(h.visitedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    ))}
    <div className="sidebar-section" style={{ cursor: 'pointer' }} onClick={clearHistory}>{t('sidebar.clearHistory')}</div>
  </>
}

function SettingsPanel() {
  const settings = useStore(s => s.settings)
  const setSettings = useStore(s => s.setSettings)
  const c = settings.theme === 'custom' ? settings.customColors : THEMES[settings.theme]

  const setLangAndSettings = (lang: string) => {
    setLang(lang)
    setSettings({ language: lang })
  }

  return <div style={{ padding: '4px 0' }}>

    <CollapseSection title={t('lang')}>
      <div className="st-row">
        <label>{t('lang')}</label>
        <select value={settings.language} onChange={e => setLangAndSettings(e.target.value)}>
          <option value="en">{t('lang.en')}</option>
          <option value="ru">{t('lang.ru')}</option>
        </select>
      </div>
      <div className="st-row">
        <label>{t('behavior.searchEngine')}</label>
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
      </div>
    </CollapseSection>

    <CollapseSection title={t('theme')}>
      <div className="st-row">
        <label>{t('theme.preset')}</label>
        <select value={settings.theme} onChange={e => setSettings({ theme: e.target.value as ThemePreset })}>
          <option value="tokyo-night">Tokyo Night</option>
          <option value="dracula">Dracula</option>
          <option value="monokai">Monokai</option>
          <option value="nord">Nord</option>
          <option value="solarized">Solarized</option>
          <option value="ayu">Ayu Dark</option>
          <option value="one-dark">One Dark</option>
          <option value="gruvbox">Gruvbox</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      {settings.theme === 'custom' && <>
        <div className="st-row"><label>{t('theme.background')}</label><input type="color" value={c.bg} onChange={e => setSettings({ customColors: { ...settings.customColors, bg: e.target.value } })} /></div>
        <div className="st-row"><label>{t('theme.bgDim')}</label><input type="color" value={c.bgDim} onChange={e => setSettings({ customColors: { ...settings.customColors, bgDim: e.target.value } })} /></div>
        <div className="st-row"><label>{t('theme.bgLight')}</label><input type="color" value={c.bgLight} onChange={e => setSettings({ customColors: { ...settings.customColors, bgLight: e.target.value } })} /></div>
        <div className="st-row"><label>{t('theme.foreground')}</label><input type="color" value={c.fg} onChange={e => setSettings({ customColors: { ...settings.customColors, fg: e.target.value } })} /></div>
        <div className="st-row"><label>{t('theme.fgDim')}</label><input type="color" value={c.fgDim} onChange={e => setSettings({ customColors: { ...settings.customColors, fgDim: e.target.value } })} /></div>
        <div className="st-row"><label>{t('theme.border')}</label><input type="color" value={c.border} onChange={e => setSettings({ customColors: { ...settings.customColors, border: e.target.value } })} /></div>
        <div className="st-row"><label>{t('theme.accent')}</label><input type="color" value={c.accent} onChange={e => setSettings({ customColors: { ...settings.customColors, accent: e.target.value } })} /></div>
        <div className="st-row"><label>{t('theme.green')}</label><input type="color" value={c.green} onChange={e => setSettings({ customColors: { ...settings.customColors, green: e.target.value } })} /></div>
        <div className="st-row"><label>{t('theme.red')}</label><input type="color" value={c.red} onChange={e => setSettings({ customColors: { ...settings.customColors, red: e.target.value } })} /></div>
        <div className="st-row"><label>{t('theme.orange')}</label><input type="color" value={c.orange} onChange={e => setSettings({ customColors: { ...settings.customColors, orange: e.target.value } })} /></div>
        <div className="st-row"><label>{t('theme.cyan')}</label><input type="color" value={c.cyan} onChange={e => setSettings({ customColors: { ...settings.customColors, cyan: e.target.value } })} /></div>
        <div className="st-row"><label>{t('theme.purple')}</label><input type="color" value={c.purple} onChange={e => setSettings({ customColors: { ...settings.customColors, purple: e.target.value } })} /></div>
      </>}
      {settings.theme !== 'custom' && (
        <div className="theme-preview">
          {Object.entries(c).map(([k, v]) => (
            <div key={k} className="theme-dot" style={{ background: v }} title={`${k}: ${v}`} />
          ))}
        </div>
      )}
    </CollapseSection>

    <CollapseSection title={t('font')} defaultOpen={false}>
      <div className="st-row">
        <label>{t('font.family')}</label>
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
      </div>
      <div className="st-row">
        <label>{t('font.size')}</label>
        <input type="range" min="10" max="20" value={settings.fontSize}
          onChange={e => setSettings({ fontSize: Number(e.target.value) })} />
        <span className="st-val">{settings.fontSize}px</span>
      </div>
    </CollapseSection>

    <CollapseSection title={t('tabBar')} defaultOpen={false}>
      <div className="st-row">
        <label>{t('tabBar.shape')}</label>
        <select value={settings.tabShape} onChange={e => setSettings({ tabShape: e.target.value as any })}>
          <option value="square">{t('shape.square')}</option>
          <option value="rounded">{t('shape.rounded')}</option>
          <option value="pill">{t('shape.pill')}</option>
          <option value="trapezoid">{t('shape.trapezoid')}</option>
          <option value="yandex">{t('shape.yandex')}</option>
          <option value="wave">{t('shape.wave')}</option>
        </select>
      </div>
      <div className="st-row">
        <label>{t('tabBar.height')}</label>
        <input type="range" min="24" max="48" value={settings.tabBarHeight}
          onChange={e => setSettings({ tabBarHeight: Number(e.target.value) })} />
        <span className="st-val">{settings.tabBarHeight}px</span>
      </div>
      <Toggle label={t('tabBar.showClose')} value={settings.tabBarShowClose} onChange={v => setSettings({ tabBarShowClose: v })} />
      <Toggle label={t('tabBar.showFavicon')} value={settings.tabBarShowFavicon} onChange={v => setSettings({ tabBarShowFavicon: v })} />
      <Toggle label={t('tabBar.showIndicator')} value={settings.tabBarShowIndicator} onChange={v => setSettings({ tabBarShowIndicator: v })} />
      <Toggle label={t('tabBar.show')} value={settings.showTabBar} onChange={v => setSettings({ showTabBar: v })} />
    </CollapseSection>

    <CollapseSection title={t('statusBar')} defaultOpen={false}>
      <div className="st-row">
        <label>{t('statusBar.height')}</label>
        <input type="range" min="22" max="40" value={settings.statusBarHeight}
          onChange={e => setSettings({ statusBarHeight: Number(e.target.value) })} />
        <span className="st-val">{settings.statusBarHeight}px</span>
      </div>
      <Toggle label={t('statusBar.showMode')} value={settings.statusBarShowMode} onChange={v => setSettings({ statusBarShowMode: v })} />
      <Toggle label={t('statusBar.showUrl')} value={settings.statusBarShowUrl} onChange={v => setSettings({ statusBarShowUrl: v })} />
      <Toggle label={t('statusBar.showCount')} value={settings.statusBarShowCount} onChange={v => setSettings({ statusBarShowCount: v })} />
      <Toggle label={t('statusBar.show')} value={settings.showStatusBar} onChange={v => setSettings({ showStatusBar: v })} />
    </CollapseSection>

    <CollapseSection title={t('titlebar') + ' / ' + t('workspace')} defaultOpen={false}>
      <div className="st-row">
        <label>{t('titlebar.height')}</label>
        <input type="range" min="0" max="20" value={settings.titlebarHeight}
          onChange={e => setSettings({ titlebarHeight: Number(e.target.value) })} />
        <span className="st-val">{settings.titlebarHeight}px</span>
      </div>
      <Toggle label={t('workspace.show')} value={settings.workspaceShow} onChange={v => setSettings({ workspaceShow: v })} />
      <div className="st-row">
        <label>{t('workspace.position')}</label>
        <select value={settings.workspacePosition} onChange={e => setSettings({ workspacePosition: e.target.value as any })}>
          <option value="top">{t('workspace.position.top')}</option>
          <option value="bottom">{t('workspace.position.bottom')}</option>
        </select>
      </div>
    </CollapseSection>

    <CollapseSection title={t('ntp')} defaultOpen={false}>
      <Toggle label={t('ntp.clock')} value={settings.ntpShowClock} onChange={v => setSettings({ ntpShowClock: v })} />
      <Toggle label={t('ntp.date')} value={settings.ntpShowDate} onChange={v => setSettings({ ntpShowDate: v })} />
      <Toggle label={t('ntp.search')} value={settings.ntpShowSearch} onChange={v => setSettings({ ntpShowSearch: v })} />
      <Toggle label={t('ntp.quickLinks')} value={settings.ntpShowQuickLinks} onChange={v => setSettings({ ntpShowQuickLinks: v })} />
      <div className="st-row">
        <label>{t('ntp.background')}</label>
        <input type="color" value={settings.ntpBgColor || '#1a1b26'} onChange={e => setSettings({ ntpBgColor: e.target.value })} />
      </div>
    </CollapseSection>

    <CollapseSection title={t('visual')}>
      <div className="st-row">
        <label>{t('visual.borderRadius')}</label>
        <input type="range" min="0" max="12" value={settings.borderRadius}
          onChange={e => setSettings({ borderRadius: Number(e.target.value) })} />
        <span className="st-val">{settings.borderRadius}px</span>
      </div>
      <div className="st-row">
        <label>{t('visual.transition')}</label>
        <input type="range" min="0" max="500" step="25" value={settings.transitionSpeed}
          onChange={e => setSettings({ transitionSpeed: Number(e.target.value) })} />
        <span className="st-val">{settings.transitionSpeed}ms</span>
      </div>
      <div className="st-row">
        <label>{t('visual.tabOpacity')}</label>
        <input type="range" min="0.3" max="1" step="0.05" value={settings.tabOpacity}
          onChange={e => setSettings({ tabOpacity: Number(e.target.value) })} />
        <span className="st-val">{Math.round(settings.tabOpacity * 100)}%</span>
      </div>
    </CollapseSection>

    <CollapseSection title={t('behavior')} defaultOpen={false}>
      <Toggle label={t('behavior.zenMode')} value={settings.zenMode} onChange={v => setSettings({ zenMode: v })} />
      <Toggle label={t('behavior.vim')} value={settings.vimEnabled} onChange={v => setSettings({ vimEnabled: v })} />
      <Toggle label={t('behavior.darkReader')} value={settings.darkReader} onChange={v => setSettings({ darkReader: v })} />
      <Toggle label={t('behavior.smoothScroll')} value={settings.smoothScroll} onChange={v => setSettings({ smoothScroll: v })} />
      <div className="st-sep" />
      <div className="st-row">
        <button className="st-action-btn" onClick={() => window.onyx?.setDefaultBrowser?.()}>
          {t('behavior.setDefault')}
        </button>
      </div>
      <div className="st-row">
        <button className="st-action-btn secondary" onClick={() => window.onyx?.openDefaultApps?.()}>
          {t('behavior.openDefaultApps')}
        </button>
      </div>
    </CollapseSection>
  </div>
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="st-row">
      <label>{label}</label>
      <div className={`toggle${value ? ' on' : ''}`} onClick={() => onChange(!value)}>
        <div className="toggle-knob" />
      </div>
    </div>
  )
}
