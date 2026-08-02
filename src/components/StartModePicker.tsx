import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import { MODES, type UiMode } from '../modes'
import { Icon } from './icons'

const MODE_SVG: Record<UiMode, React.ReactNode> = {
  full: <Icon name="rocket" />,
  debloat: <Icon name="sparkles" />,
  gaming: <Icon name="gamepad" />,
}

export default function StartModePicker({ onPick }: { onPick: (mode: UiMode) => void }) {
  const uiMode = useStore(s => s.settings.uiMode)
  const [leaving, setLeaving] = useState<UiMode | null>(null)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const i = ['1', '2', '3'].indexOf(e.key)
      if (i >= 0) {
        e.preventDefault()
        pick(MODES[i].id)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pick = (mode: UiMode) => {
    if (leaving) return
    setLeaving(mode)
    setTimeout(() => onPick(mode), 180)
  }

  return (
    <div className={`mode-picker${leaving ? ' leaving' : ''}`}>
      <div className="mp-window">
        <div className="mp-win-title">Vox</div>
        <div className="mp-body">
          <h1 className="mp-title">Какой режим запускаем?</h1>
          <div className="mp-buttons">
            {MODES.map((m, i) => (
              <button
                key={m.id}
                className={`mp-btn${uiMode === m.id ? ' active' : ''}${leaving === m.id ? ' picked' : ''}`}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => pick(m.id)}
              >
                <span className="mp-icon">{MODE_SVG[m.id]}</span>
                <span className="mp-name">{m.name}</span>
              </button>
            ))}
          </div>
          <p className="mp-hint">1 · 2 · 3</p>
        </div>
      </div>
    </div>
  )
}
