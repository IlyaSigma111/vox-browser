import { useState } from 'react'
import { useStore, THEMES } from '../store'
import type { UIPreset } from '../presets'
import { BUILT_IN_PRESETS, applyPreset } from '../presets'
import { t } from '../lang'

export default function PresetCatalog({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<'builtin' | 'custom'>('builtin')
  const settings = useStore(s => s.settings)
  const setSettings = useStore(s => s.setSettings)
  const customPresets = useStore(s => s.customPresets)
  const saveCustomPreset = useStore(s => s.saveCustomPreset)
  const removeCustomPreset = useStore(s => s.removeCustomPreset)

  const [saving, setSaving] = useState(false)
  const [saveName, setSaveName] = useState('')

  const currentPreset = settings.currentPreset || 'vox-classic'

  const allPresets = tab === 'builtin' ? BUILT_IN_PRESETS : customPresets

  const handleSave = () => {
    if (!saveName.trim()) return
    const preset: UIPreset = {
      id: 'custom-' + Date.now(),
      name: saveName.trim(),
      description: 'Custom preset',
      author: 'You',
      accent: settings.customColors.accent,
      bg: settings.customColors.bg,
      theme: settings.theme,
      customColors: settings.theme === 'custom' ? { ...settings.customColors } : undefined,
      tabShape: settings.tabShape,
      fontFamily: settings.fontFamily,
      fontSize: settings.fontSize,
      tabBarHeight: settings.tabBarHeight,
      statusBarHeight: settings.statusBarHeight,
      titlebarHeight: settings.titlebarHeight,
      borderRadius: settings.borderRadius,
      transitionSpeed: settings.transitionSpeed,
      tabOpacity: settings.tabOpacity,
      ntpLayout: settings.ntpLayout,
      workspacePosition: settings.workspacePosition,
      showTabBar: settings.showTabBar,
      showStatusBar: settings.showStatusBar,
      workspaceShow: settings.workspaceShow,
      zenMode: settings.zenMode,
    }
    saveCustomPreset(preset)
    setSaveName('')
    setSaving(false)
    setTab('custom')
  }

  return (
    <div className="preset-overlay" onClick={onClose}>
      <div className="preset-modal" onClick={e => e.stopPropagation()}>
        <div className="preset-header">
          <h2>{t('presets.title')}</h2>
          <button className="preset-close" onClick={onClose}>×</button>
        </div>
        <div className="preset-tabs">
          <button className={`preset-tab${tab === 'builtin' ? ' active' : ''}`} onClick={() => setTab('builtin')}>
            {t('presets.builtin')} ({BUILT_IN_PRESETS.length})
          </button>
          <button className={`preset-tab${tab === 'custom' ? ' active' : ''}`} onClick={() => setTab('custom')}>
            {t('presets.mine')} ({customPresets.length})
          </button>
        </div>
        <div className="preset-grid">
          {allPresets.map(p => (
            <div
              key={p.id}
              className={`preset-card${currentPreset === p.id ? ' active' : ''}${selected === p.id ? ' selected' : ''}`}
              onClick={() => setSelected(selected === p.id ? null : p.id)}
            >
              <div className="preset-preview" style={{ background: p.bg }}>
                <div className="preset-preview-bar" style={{ background: p.bg }}>
                  <div className="pp-dot" style={{ background: '#ff5f57' }} />
                  <div className="pp-dot" style={{ background: '#febc2e' }} />
                  <div className="pp-dot" style={{ background: '#28c840' }} />
                  <div className="pp-tabs">
                    <div className="pp-tab" style={{ background: p.accent, borderRadius: p.borderRadius + 'px' }} />
                    <div className="pp-tab dim" style={{ borderRadius: p.borderRadius + 'px' }} />
                  </div>
                </div>
                <div className="preset-preview-content" style={{ color: p.accent }}>
                  <div className="pp-line" style={{ width: '40%', height: 16, background: p.accent, borderRadius: p.borderRadius + 'px', opacity: 0.3 }} />
                  <div className="pp-line" style={{ width: '60%', height: 8, background: p.accent, borderRadius: p.borderRadius + 'px', opacity: 0.15 }} />
                </div>
              </div>
              <div className="preset-info">
                <div className="preset-name">{p.name}</div>
                <div className="preset-desc">{p.description}</div>
                <div className="preset-meta">
                  <span className="preset-tag" style={{ borderColor: p.accent }}>{p.theme}</span>
                  <span className="preset-tag">{p.tabShape}</span>
                  {p.zenMode && <span className="preset-tag accent">zen</span>}
                </div>
              </div>
              {currentPreset === p.id && <div className="preset-active-badge">●</div>}
              {selected === p.id && (
                <div className="preset-actions">
                  <button className="preset-apply-btn" onClick={e => { e.stopPropagation(); applyPreset(p, setSettings); onClose() }}>
                    {t('presets.apply')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="preset-footer">
          {tab === 'custom' && (
            saving ? (
              <div className="preset-save-form">
                <input
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder={t('presets.namePlaceholder')}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSaving(false) }}
                />
                <button className="preset-save-ok" onClick={handleSave}>✓</button>
                <button className="preset-save-cancel" onClick={() => setSaving(false)}>×</button>
              </div>
            ) : (
              <button className="preset-save-btn" onClick={() => setSaving(true)}>
                {t('presets.saveCurrent')}
              </button>
            )
          )}
          {tab === 'builtin' && (
            <div className="preset-footer-hint">{t('presets.hint')}</div>
          )}
        </div>
      </div>
    </div>
  )
}
