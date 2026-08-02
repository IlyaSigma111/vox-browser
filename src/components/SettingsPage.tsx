import React from 'react'
import { SettingsPanel } from './Sidebar'

export default function SettingsPage() {
  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <span className="settings-page-title">Настройки</span>
        <span className="settings-page-hint">Закрыть вкладку — Ctrl+W · <kbd>?</kbd> — все хоткеи</span>
      </div>
      <SettingsPanel />
    </div>
  )
}
