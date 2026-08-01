import React, { useEffect, useRef, useState } from 'react'
import { useStore, THEMES } from '../store'
import type { ThemePreset } from '../types'

const SEARCH_ENGINES = [
  { name: 'Google', url: 'https://www.google.com/search?q=%s', hint: 'Классика' },
  { name: 'Yandex', url: 'https://yandex.ru/search/?text=%s', hint: 'Популярно в РФ' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s', hint: 'Без слежки' },
  { name: 'Brave', url: 'https://search.brave.com/search?q=%s', hint: 'С фокусом на приватность' },
  { name: 'Bing', url: 'https://www.bing.com/search?q=%s', hint: 'От Microsoft' },
]

const THEME_OPTIONS = ['tokyo-night', 'dracula', 'firefox-nova', 'synthwave', 'rose-pine', 'everforest', 'github-dark', 'outrun'] as const

const SHORTCUTS: Array<[string, string]> = [
  ['Ctrl+T', 'новая вкладка'],
  ['Ctrl+W', 'закрыть вкладку'],
  ['Ctrl+Shift+T', 'вернуть закрытую'],
  ['Ctrl+L', 'адресная строка'],
  ['?', 'все хоткеи'],
]

const STEPS = [
  {
    title: 'Добро пожаловать в Vox',
    sub: 'Клавиатурный браузер, который уважает твоё время. Выбери пару настроек — и вперёд.',
    icon: '👋',
  },
  {
    title: 'Поисковик по умолчанию',
    sub: 'Поменять можно в любой момент — Настройки → Основное.',
    icon: '🔍',
  },
  {
    title: 'Тема оформления',
    sub: 'Плюс 6 новых экспериментальных. Всё меняется на лету.',
    icon: '🎨',
  },
  {
    title: 'Готово. Поехали!',
    sub: 'Базовые хоткеи — чтобы не тянуться к мыши. Полный список — по клавише ?',
    icon: '🚀',
  },
]

function ThemeSwatch({ t }: { t: ThemePreset }) {
  const c = THEMES[t]
  return (
    <span className="onb-swatch">
      {[c.bg, c.bgLight, c.accent, c.cyan, c.red].map((col, i) => (
        <i key={i} style={{ background: col }} />
      ))}
    </span>
  )
}

export default function Onboarding() {
  const onboarded = useStore(s => s.settings.onboarded)
  const setSettings = useStore(s => s.setSettings)
  const settings = useStore(s => s.settings)
  const [step, setStep] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [dir, setDir] = useState(1)

  const done = () => {
    setLeaving(true)
    setTimeout(() => {
      setSettings({ onboarded: true })
      const first = useStore.getState().tabs.find(t => t.url === 'about:blank')
      if (first) {
        useStore.getState().updateTab(first.id, { url: useStore.getState().settings.homepage || 'about:blank' })
      }
    }, 500)
  }

  useEffect(() => {
    if (onboarded) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (step === STEPS.length - 1) done()
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
  const last = step === STEPS.length - 1

  return (
    <div className={`onboarding${leaving ? ' leaving' : ''}`}>
      <div className="onboarding-glow" />
      <div className="onboarding-card" key={step} data-dir={dir}>
        <button className="onb-skip" onClick={done}>Пропустить →</button>

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
                <span className="onb-opt-name">{se.name}</span>
                <span className="onb-opt-hint">{se.hint}</span>
                {settings.searchUrl === se.url && <span className="onb-check">✓</span>}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-options themes">
            {THEME_OPTIONS.map(t => (
              <button
                key={t}
                className={`onb-opt theme${settings.theme === t ? ' sel' : ''}`}
                onClick={() => setSettings({ theme: t })}
              >
                <ThemeSwatch t={t} />
                <span className="onb-opt-name">{t}</span>
                {settings.theme === t && <span className="onb-check">✓</span>}
              </button>
            ))}
          </div>
        )}

        {last && (
          <div className="onb-shortcuts">
            {SHORTCUTS.map(([k, d]) => (
              <div key={k} className="onb-shortcut">
                <kbd>{k}</kbd>
                <span>{d}</span>
              </div>
            ))}
          </div>
        )}

        <div className="onboarding-nav">
          <button className="btn ghost" onClick={prev} disabled={step === 0} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>← Назад</button>
          <div className="onboarding-dots">
            {STEPS.map((_, i) => (
              <span key={i} className={`dot${i === step ? ' active' : ''}`} onClick={() => { setDir(i > step ? 1 : -1); setStep(i) }} />
            ))}
          </div>
          <button className="btn primary onb-next" onClick={last ? done : next}>
            {last ? '🚀 Запуск' : 'Далее →'}
          </button>
        </div>
      </div>
    </div>
  )
}
