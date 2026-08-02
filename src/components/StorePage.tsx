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
        <div className="store-card-cat">{f.cat}</div>
        <div className="store-card-name">
          {f.name}
          {installed && <span className="store-badge">вкл</span>}
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
        {installed ? 'Отключить' : 'Включить'}
      </button>
    </div>
  )
}

export default function StorePage() {
  const settings = useStore(s => s.settings)
  const setSettings = useStore(s => s.setSettings)
  const [cat, setCat] = useState<string>('Все')
  const [q, setQ] = useState('')
  const [onlyOn, setOnlyOn] = useState(false)
  const installedCount = FEATURES.filter(f => featureOn(settings, f.id)).length

  useEffect(() => {
    if (settings.featureVersion < LATEST_FEATURE_VERSION) {
      setSettings({ featureVersion: LATEST_FEATURE_VERSION })
    }
  }, []) // eslint-disable-line

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return FEATURES.filter(f => {
      if (onlyOn && !featureOn(settings, f.id)) return false
      if (cat !== 'Все' && f.cat !== cat) return false
      if (!query) return true
      return f.name.toLowerCase().includes(query) || f.desc.toLowerCase().includes(query) || f.cat.toLowerCase().includes(query)
    })
  }, [cat, q, onlyOn, settings])

  const grouped = cat === 'Все' && !q.trim() && !onlyOn

  return (
    <div className="store-page">
      <div className="store-header">
        <div className="store-head-row">
          <div className="store-title">Магазин Vox</div>
          <div className="store-stats">
            <span className="store-stat">{FEATURES.length} расширений</span>
            <span className="store-stat">v1.5</span>
          </div>
        </div>
        <div className="store-subtitle">
          Лёгкий браузер — включай только то, что нужно.
          <b>{installedCount}</b> из {FEATURES.length} включено
        </div>
        <div className="store-progress">
          <div className="store-progress-fill" style={{ width: `${(installedCount / FEATURES.length) * 100}%` }} />
        </div>
        <div className="store-controls">
          <input
            className="store-search"
            placeholder="Найти расширение… (vim, grepper, тёмная…)"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button
            className={`store-filter${onlyOn ? ' active' : ''}`}
            onClick={() => setOnlyOn(v => !v)}
            title="Показать только включённые"
          >
            ✓ {installedCount} вкл.
          </button>
        </div>
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

      {grouped ? (
        FEATURE_CATS.map(c => {
          const items = FEATURES.filter(f => f.cat === c)
          return (
            <div className="store-section" key={c}>
              <div className="store-section-title">{c}<span>{items.length}</span></div>
              <div className="store-grid">
                {items.map(f => <FeatureCard key={f.id} f={f} />)}
              </div>
            </div>
          )
        })
      ) : (
        <div className="store-grid">
          {filtered.map(f => <FeatureCard key={f.id} f={f} />)}
          {!filtered.length && (
            <div className="store-empty">
              {onlyOn && !q.trim() ? 'Пока ничего не включено. Открой раздел и нажми «Включить».' : `Ничего не найдено по запросу «${q}». Попробуй «vim», «тёмн» или «вкладки».`}
            </div>
          )}
        </div>
      )}

      <div className="store-footer">
        Все расширения встроены в браузер и включаются мгновенно. Свои идеи — в настройках: 🧩 Дополнительно.
        <button className="store-clear" onClick={() => setSettings({ ...Object.fromEntries(FEATURES.map(f => [f.key, false])) })}>
          Сбросить все
        </button>
      </div>
    </div>
  )
}
