import React, { useEffect, useRef, useState } from 'react'
import { useStore, THEMES } from '../store'

const SEARCH_ENGINES = [
  { name: 'Google', url: 'https://www.google.com/search?q=%s' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
  { name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
  { name: 'Kagi', url: 'https://kagi.com/search?q=%s' },
]

const STEPS = [
  {
    title: 'Добро пожаловать в Vox',
    sub: 'Браузер, где всё на кончиках пальцев — и на клавиатуре.',
    icon: '👋',
  },
  {
    title: 'Выбери поисковую систему',
    sub: 'Это можно поменять в любой момент в настройках.',
    icon: '🔍',
  },
  {
    title: 'Выбери тему',
    sub: 'Включая экспериментальные — вдохновлённые новым Firefox Nightly.',
    icon: '🎨',
  },
  {
    title: 'Масштаб страниц по умолчанию',
    sub: 'Подгони под свой экран и глаза.',
    icon: '🔎',
  },
  {
    title: 'Готово. Поехали!',
    sub: 'Нажми Enter — и мир твой. Нажми ? в любой момент для списка горячих клавиш.',
    icon: '🚀',
  },
]

export default function Onboarding() {
  const onboarded = useStore(s => s.settings.onboarded)
  const setSettings = useStore(s => s.setSettings)
  const settings = useStore(s => s.settings)
  const addTab = useStore(s => s.addTab)
  const [step, setStep] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [dir, setDir] = useState(1)
  const startTime = useRef(Date.now())

  const finish = () => {
    setLeaving(true)
    setTimeout(() => {
      setSettings({ onboarded: true })
      const first = useStore.getState().tabs.find(t => t.url === 'about:blank')
      if (first) {
        useStore.getState().updateTab(first.id, { url: useStore.getState().settings.homepage || 'about:blank' })
      }
    }, 700)
  }

  useEffect(() => {
    if (onboarded) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (step === STEPS.length - 1) finish()
        else next()
      }
      if (e.key === 'ArrowRight') { e.preventDefault(); if (step < STEPS.length - 1) next() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); if (step > 0) prev() }
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [step, onboarded])

  const next = () => { setDir(1); setStep(s => s + 1) }
  const prev = () => { setDir(-1); setStep(s => s - 1) }

  if (onboarded) return null
  const s = STEPS[step]

  return (
    <div className={`onboarding${leaving ? ' leaving' : ''}`}>
      <div className={`onboarding-card${leaving ? ' leaving' : ''}`} key={step} data-dir={dir}>
        <div className="onboarding-glow" />
        <div className="onboarding-icon">{s.icon}</div>
        <h1 className="onboarding-title">{s.title}</h1>
        <p className="onboarding-sub">{s.sub}</p>

        {step === 1 && (
          <div className="onboarding-options">
            {SEARCH_ENGINES.map(se => (
              <button
                key={se.name}
                className={`onb-opt${settings.searchUrl === se.url ? ' sel' : ''}`}
                onClick={() => setSettings({ searchEngine: se.name, searchUrl: se.url })}
              >
                {se.name}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-options themes">
            {(['tokyo-night', 'dracula', 'one-dark', 'firefox-nova', 'synthwave', 'forest'] as const).map(t => (
              <button
                key={t}
                className={`onb-opt theme${settings.theme === t ? ' sel' : ''}`}
                onClick={() => setSettings({ theme: t })}
              >
                <span className="onb-theme-dot" style={{ background: THEMES[t].accent, boxShadow: `0 0 10px ${THEMES[t].accent}66` }} />
                {t}
                {(t === 'firefox-nova' || t === 'synthwave' || t === 'forest') && <span className="onb-experimental">эксперимент</span>}
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-zoom">
            <button className="onb-zoom-btn" onClick={() => setSettings({ defaultZoom: Math.max(0.5, (settings.defaultZoom || 1) - 0.1) })}>−</button>
            <span className="onb-zoom-val">{Math.round((settings.defaultZoom || 1) * 100)}%</span>
            <button className="onb-zoom-btn" onClick={() => setSettings({ defaultZoom: Math.min(2, (settings.defaultZoom || 1) + 0.1) })}>+</button>
          </div>
        )}

        <div className="onboarding-nav">
          <button className="btn ghost" onClick={prev} disabled={step === 0} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>Назад</button>
          <div className="onboarding-dots">
            {STEPS.map((_, i) => (
              <span key={i} className={`dot${i === step ? ' active' : ''}`} onClick={() => { setDir(i > step ? 1 : -1); setStep(i) }} />
            ))}
          </div>
          {step === STEPS.length - 1 ? (
            <button className="btn primary" onClick={finish}>Запуск 🚀</button>
          ) : (
            <button className="btn primary" onClick={next}>Далее</button>
          )}
        </div>
      </div>
    </div>
  )
}
