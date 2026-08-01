import React, { useState, useMemo, useEffect } from 'react'
import { useStore } from '../store'
import { FEATURES, FEATURE_CATS, featureOn, toggleFeature, LATEST_FEATURE_VERSION, type StoreFeature } from '../features'

function FeatureCard({ f }: { f: StoreFeature }) {
  const settings = useStore(s => s.settings)
  const setSettings = useStore(s => s.setSettings)
  const installed = featureOn(settings, f.id)

  return (
    <div className={`store-card${installed ? ' installed' : ''}`}>
      <div className="store-card-icon">{f.icon}</div>
      <div className="store-card-body">
        <div className="store-card-name">
          {f.name}
          {installed && <span className="store-badge">установлено</span>}
        </div>
        <div className="store-card-desc">{f.desc}</div>
        <div className="store-card-meta">
          {f.hotkey && <span className="store-hotkey"><kbd>{f.hotkey}</kbd></span>}
          <span>{f.size}</span>
          <span>⬇ {f.downloads}</span>
        </div>
      </div>
      <button
        className={`store-btn${installed ? ' remove' : ''}`}
        onClick={() => setSettings(toggleFeature(settings, f.id, !installed))}
      >
        {installed ? 'Отключить' : 'Установить'}
      </button>
    </div>
  )
}

export default function StorePage() {
  const settings = useStore(s => s.settings)
  const setSettings = useStore(s => s.setSettings)
  const [cat, setCat] = useState<string>('Все')
  const [q, setQ] = useState('')
  const installedCount = FEATURES.filter(f => featureOn(settings, f.id)).length

  useEffect(() => {
    if (settings.featureVersion < LATEST_FEATURE_VERSION) {
      setSettings({ featureVersion: LATEST_FEATURE_VERSION })
    }
  }, []) // eslint-disable-line

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return FEATURES.filter(f => {
      if (cat !== 'Все' && f.cat !== cat) return false
      if (!query) return true
      return f.name.toLowerCase().includes(query) || f.desc.toLowerCase().includes(query) || f.cat.toLowerCase().includes(query)
    })
  }, [cat, q])

  return (
    <div className="store-page">
      <div className="store-header">
        <div className="store-header-top">
          <div>
            <div className="store-title">Магазин Vox</div>
            <div className="store-subtitle">
              Лёгкий браузер — включай только то, что нужно. {installedCount}/{FEATURES.length} включено.
            </div>
          </div>
          <div className="store-stats">
            <span className="store-stat">{FEATURES.length} расширений</span>
            <span className="store-stat">v1.2.0</span>
          </div>
        </div>
        <input
          className="store-search"
          placeholder="Найти расширение… (vim, grepper, тёмная…)"
          value={q}
          onChange={e => setQ(e.target.value)}
          autoFocus
        />
        <div className="store-cats">
          {['Все', ...FEATURE_CATS].map(c => (
            <button
              key={c}
              className={`store-cat${cat === c ? ' active' : ''}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="store-grid">
        {list.map(f => <FeatureCard key={f.id} f={f} />)}
        {!list.length && (
          <div className="store-empty">
            Ничего не найдено по запросу «{q}». Попробуй «vim», «тёмн» или «вкладки».
          </div>
        )}
      </div>
      <div className="store-footer">
        Все расширения встроены в браузер и включаются мгновенно. Свои идеи — в настройках: 🧩 Дополнительно.
        <button className="store-clear" onClick={() => setSettings({ ...Object.fromEntries(FEATURES.map(f => [f.key, false])) })}>
          Сбросить все
        </button>
      </div>
    </div>
  )
}
