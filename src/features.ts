import type { Settings } from './types'

export type FeatureId =
  | 'vim' | 'palette' | 'darkreader' | 'aurora' | 'expose' | 'grep' | 'pip' | 'trail'
  | 'sleep' | 'lens' | 'incognito' | 'shots' | 'smooth' | 'zen' | 'chrome'
  | 'reader' | 'focus' | 'night' | 'adblock' | 'aliases' | 'clipboard' | 'select'
  | 'readtime' | 'tabcolors' | 'duplicate' | 'dedupe' | 'backup' | 'readlist' | 'translator' | 'pomodoro'

export interface StoreFeature {
  id: FeatureId
  icon: string
  name: string
  desc: string
  cat: string
  hotkey?: string
  size: string
  downloads: string
  key: keyof Settings
}

export const FEATURE_CATS = ['Управление', 'Оформление', 'Умные', 'Приватность'] as const

export const LATEST_FEATURE_VERSION = 3

export const FEATURES: StoreFeature[] = [
  // ─── Управление ────────────────────────────────
  { id: 'vim', icon: '⌨️', name: 'Vim-движок', desc: 'j/k/h/l — скролл, gg/G — вверх/вниз, H/L — история. Веб как Vim.', cat: 'Управление', hotkey: 'j · k · gg · G', size: '1.2 МБ', downloads: '12 408', key: 'vimEnabled' },
  { id: 'palette', icon: '🛠', name: 'Командная строка', desc: 'Жми ":" — команды и переходы без мыши: :tabnew, :reload, :history.', cat: 'Управление', hotkey: ':', size: '240 КБ', downloads: '9 876', key: 'palette' },
  { id: 'select', icon: '🔎', name: 'Поиск выделенного', desc: 'Выдели текст на странице и ищи его в поисковике в один клик.', cat: 'Управление', hotkey: 'кнопка', size: '90 КБ', downloads: '5 120', key: 'selectSearch' },
  { id: 'clipboard', icon: '📋', name: 'Открыть из буфера', desc: 'Ctrl+Shift+V открывает скопированный URL без переключения окон.', cat: 'Управление', hotkey: 'Ctrl+Shift+V', size: '60 КБ', downloads: '3 944', key: 'clipboard' },
  { id: 'duplicate', icon: '📑', name: 'Дубликат вкладки', desc: 'Копия текущей вкладки по Ctrl+Shift+J или из контекстного меню.', cat: 'Управление', hotkey: 'Ctrl+Shift+J', size: '30 КБ', downloads: '7 301', key: 'duplicate' },
  { id: 'aliases', icon: '⚡', name: 'URL-алиасы', desc: 'yt → youtube.com, gh → github.com. Свои алиасы — в настройках.', cat: 'Управление', hotkey: 'yt', size: '110 КБ', downloads: '6 522', key: 'aliases' },

  // ─── Оформление ────────────────────────────────
  { id: 'aurora', icon: '🎨', name: 'Aurora', desc: 'Акцент интерфейса подстраивается под цвет открытой страницы.', cat: 'Оформление', size: '480 КБ', downloads: '8 230', key: 'aurora' },
  { id: 'reader', icon: '📖', name: 'Reader Mode', desc: 'Одна чистая статья без рекламы и меню — кнопка в тулбаре.', cat: 'Оформление', hotkey: 'кнопка', size: '320 КБ', downloads: '11 045', key: 'reader' },
  { id: 'focus', icon: '🎯', name: 'Focus Mode', desc: 'Затемняет всё, кроме статьи: сосредоточься на главном.', cat: 'Оформление', hotkey: 'кнопка', size: '140 КБ', downloads: '4 877', key: 'focus' },
  { id: 'night', icon: '🌆', name: 'Ночная подсветка', desc: 'Тёплый фильтр вечером — меньше синего, легче глазам.', cat: 'Оформление', hotkey: 'кнопка', size: '70 КБ', downloads: '9 401', key: 'nightShift' },
  { id: 'tabcolors', icon: '🌈', name: 'Цвета вкладок', desc: 'Каждый домен получает свой цвет — видно с одного взгляда.', cat: 'Оформление', size: '50 КБ', downloads: '6 098', key: 'tabColors' },
  { id: 'zen', icon: '🧘', name: 'Zen-режим', desc: 'Сверхминимализм: только вкладки и страница. Ctrl+\\.', cat: 'Оформление', hotkey: 'Ctrl+\\', size: '210 КБ', downloads: '10 332', key: 'zenMode' },
  { id: 'chrome', icon: '🧭', name: 'Browser Chrome', desc: 'Классическая панель навигации сверху: назад/вперёд/URL.', cat: 'Оформление', hotkey: 'кнопка', size: '380 КБ', downloads: '7 655', key: 'browserChrome' },
  { id: 'smooth', icon: '🌊', name: 'Плавный скролл', desc: 'Мягкая прокрутка страниц вместо резких прыжков.', cat: 'Оформление', size: '20 КБ', downloads: '13 210', key: 'smoothScroll' },

  // ─── Умные ─────────────────────────────────────
  { id: 'expose', icon: '🔲', name: 'Tab Exposé', desc: 'Все вкладки сеткой на одном экране с живым поиском. Ctrl+Shift+A.', cat: 'Умные', hotkey: 'Ctrl+Shift+A', size: '1.1 МБ', downloads: '8 911', key: 'expose' },
  { id: 'grep', icon: '🔍', name: 'Grep по истории', desc: 'Полнотекстовый поиск по всему, что ты читал. Ctrl+Shift+F.', cat: 'Умные', hotkey: 'Ctrl+Shift+F', size: '2.4 МБ', downloads: '6 208', key: 'grep' },
  { id: 'trail', icon: '🗺', name: 'Session Trail', desc: 'Граф навигации: куда вёл каждый клик. Ctrl+Shift+G.', cat: 'Умные', hotkey: 'Ctrl+Shift+G', size: '520 КБ', downloads: '5 553', key: 'trail' },
  { id: 'lens', icon: '🔭', name: 'Site Lenses', desc: 'Свои настройки под сайты: масштаб, тёмный режим, vim на конкретном домене.', cat: 'Умные', size: '160 КБ', downloads: '4 410', key: 'lens' },
  { id: 'readtime', icon: '⏱', name: 'Время чтения', desc: 'Оценка «≈ 7 мин» в статусбаре — сразу видно, стоит ли читать.', cat: 'Умные', size: '40 КБ', downloads: '3 702', key: 'readTime' },
  { id: 'readlist', icon: '📚', name: 'Список чтения', desc: 'Сохраняй статьи на потом одним кликом. Потом — в сайдбаре.', cat: 'Умные', hotkey: 'кнопка', size: '95 КБ', downloads: '9 884', key: 'readlist' },
  { id: 'translator', icon: '🌐', name: 'Перевод страницы', desc: 'Открывает страницу в Google Translate целиком, в новой вкладке.', cat: 'Умные', hotkey: 'кнопка', size: '55 КБ', downloads: '7 117', key: 'translator' },
  { id: 'pomodoro', icon: '🍅', name: 'Помодоро', desc: 'Таймер 25/5 прямо в статусбаре. Фокусируйся.', cat: 'Умные', hotkey: 'кнопка', size: '35 КБ', downloads: '12 004', key: 'pomodoro' },

  // ─── Приватность и система ─────────────────────
  { id: 'incognito', icon: '🕶', name: 'Инкогнито', desc: 'Приватные вкладки без сохранения. Ctrl+Shift+N.', cat: 'Приватность', hotkey: 'Ctrl+Shift+N', size: '300 КБ', downloads: '14 255', key: 'incognito' },
  { id: 'sleep', icon: '💤', name: 'Спящие вкладки', desc: 'Фоновые вкладки автоматически замьючены — меньше шума и трафика.', cat: 'Приватность', size: '80 КБ', downloads: '8 655', key: 'sleep' },
  { id: 'adblock', icon: '🛡️', name: 'Ad Blocker', desc: 'Блокирует известные рекламные и трекерные домены на лету.', cat: 'Приватность', size: '410 КБ', downloads: '18 730', key: 'adblock' },
  { id: 'dedupe', icon: '🧹', name: 'Закрыть дубли', desc: 'Одной командой убирает повторные вкладки с одинаковым URL.', cat: 'Приватность', hotkey: ':dedupe', size: '25 КБ', downloads: '2 908', key: 'dedupe' },
  { id: 'backup', icon: '💾', name: 'Резервная копия', desc: 'Экспорт и импорт всех настроек, закладок и истории в JSON.', cat: 'Приватность', hotkey: ':export', size: '130 КБ', downloads: '4 552', key: 'backup' },
  { id: 'shots', icon: '📷', name: 'Скриншоты', desc: 'Ctrl+Shift+S сохранить страницу, Ctrl+Shift+C — в буфер.', cat: 'Приватность', hotkey: 'Ctrl+Shift+S/C', size: '260 КБ', downloads: '9 377', key: 'shots' },
  { id: 'pip', icon: '📺', name: 'Page PiP', desc: 'Страница улетает в маленькое окно поверх всех. Ctrl+Shift+P.', cat: 'Приватность', hotkey: 'Ctrl+Shift+P', size: '350 КБ', downloads: '10 990', key: 'pip' },
]

export function featureOn(settings: Settings, id: FeatureId): boolean {
  const f = FEATURES.find(x => x.id === id)
  if (!f) return false
  return !!settings[f.key]
}

export function toggleFeature(settings: Settings, id: FeatureId, on: boolean): Partial<Settings> {
  const f = FEATURES.find(x => x.id === id)
  if (!f) return {}
  const patch: Partial<Settings> = { [f.key]: on }
  if (id === 'palette' && on) patch.vimEnabled = true
  return patch
}
