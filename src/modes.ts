import { FEATURES, type FeatureId } from './features'
import type { Settings, ThemeColors, ThemePreset } from './types'

export type UiMode = 'full' | 'debloat' | 'gaming'

// Firefox default dark theme (Proton): toolbar #2b2a33, tab strip #1c1b22,
// selected tab #42414d, text #fbfbfe, link accent #8cb4ff.
export const FIREFOX_DARK: ThemeColors = {
  bg: '#2b2a33',
  bgDim: '#1c1b22',
  bgLight: '#42414d',
  fg: '#fbfbfe',
  fgDim: '#cfcfd8',
  border: '#52525e',
  accent: '#8cb4ff',
  green: '#3dd68c',
  red: '#ff4f5e',
  orange: '#ff9f0a',
  cyan: '#45c9e8',
  purple: '#ad3ad4',
}

// Firefox default light theme (Proton): toolbar #f9f9fb, field #ffffff,
// text #15141a, link accent #0060df, separator #d5d5dd.
export const FIREFOX_LIGHT: ThemeColors = {
  bg: '#f9f9fb',
  bgDim: '#f0f0f4',
  bgLight: '#ffffff',
  fg: '#15141a',
  fgDim: '#5b5b66',
  border: '#d5d5dd',
  accent: '#0060df',
  green: '#2a9d5f',
  red: '#d70022',
  orange: '#c96100',
  cyan: '#007a99',
  purple: '#6a2ad4',
}

export const GAMING_THEMES: ThemePreset[] = [
  'gx', 'gx-neon', 'gx-magma', 'gx-royal', 'gx-teal', 'gx-gold', 'gx-ice',
]

export function pickGamingTheme(avoid?: ThemePreset): ThemePreset {
  const pool = avoid && GAMING_THEMES.includes(avoid)
    ? GAMING_THEMES.filter(t => t !== avoid)
    : GAMING_THEMES
  return pool[Math.floor(Math.random() * pool.length)]
}

const FULL_ON: FeatureId[] = [
  // Управление
  'vim', 'palette', 'select', 'clipboard', 'duplicate', 'aliases',
  'clock', 'timer', 'sessiontime', 'copyurl', 'copyalltabs', 'yankmd', 'yanktitle',
  'calc', 'units', 'baseconv', 'pwgen', 'uuid', 'colorparse', 'wc', 'stats',
  'sorturl', 'groupby', 'muteall', 'mediactl', 'qrcode', 'tabage', 'unreaddot',
  'taboverflow', 'snap', 'cliphist', 'scrollmem', 'wordcount', 'toc',
  // Оформление
  'aurora', 'reader', 'focus', 'night', 'tabcolors', 'zen', 'chrome', 'smooth',
  'tabgrad', 'roundui', 'glowui', 'ntpgrad', 'ntpquote',
  // Умные
  'expose', 'grep', 'trail', 'lens', 'readtime', 'readlist', 'translator', 'pomodoro',
  'findregex', 'themeauto', 'nightauto', 'hidecookie',
  'savemd', 'savepdf', 'emoji', 'translit', 'slugify', 'caseconv', 'hash', 'b64',
  'urlenc', 'jsonfmt', 'openselection', 'quicknote',
  // Приватность
  'incognito', 'sleep', 'adblock', 'dedupe', 'backup', 'shots', 'pip',
  'refstrip', 'dnt', 'cleanurl', 'blockpop', 'cacheclear', 'cookieview',
  // Vibes
  'dynamicisland', 'cursorglow', 'docklift',
]

const DEBLOAT_ON: FeatureId[] = ['adblock']
const GAMING_ON: FeatureId[] = ['density', 'adblock', 'sleep', 'docklift']

function allOff(): Record<string, boolean> {
  const o: Record<string, boolean> = {}
  for (const f of FEATURES) o[f.key] = false
  return o
}

function on(list: FeatureId[]): Record<string, boolean> {
  const o: Record<string, boolean> = {}
  for (const id of list) {
    const f = FEATURES.find(x => x.id === id)
    if (f) o[f.key] = true
  }
  return o
}

export function modePatch(mode: UiMode, opts?: { theme?: ThemePreset }): Partial<Settings> {
  const patch = { ...allOff() } as Partial<Settings>
  let enabled: FeatureId[]
  switch (mode) {
    case 'debloat':
      enabled = DEBLOAT_ON
      patch.tabBarPosition = 'top'
      patch.showTabBar = true
      patch.showStatusBar = true
      break
    case 'gaming':
      enabled = GAMING_ON
      patch.theme = opts?.theme ?? pickGamingTheme()
      break
    default:
      enabled = FULL_ON
  }
  Object.assign(patch, on(enabled))
  return patch
}

export function modeSettings(mode: UiMode, cur: Settings): Partial<Settings> {
  const patch = {
    ...modePatch(mode, mode === 'gaming' ? { theme: pickGamingTheme(cur.theme) } : undefined),
    uiMode: mode,
  }
  const enteringGaming = mode === 'gaming' && cur.uiMode !== 'gaming'
  const leavingGaming = cur.uiMode === 'gaming' && mode !== 'gaming'
  const enteringDebloat = mode === 'debloat' && cur.uiMode !== 'debloat'
  const leavingDebloat = cur.uiMode === 'debloat' && mode !== 'debloat'
  if (enteringGaming) {
    patch.gamingPrevTheme = cur.uiMode === 'gaming' && cur.gamingPrevTheme ? cur.gamingPrevTheme : cur.theme
  } else if (leavingGaming) {
    patch.theme = cur.gamingPrevTheme ?? 'tokyo-night'
  }
  if (enteringDebloat) {
    patch.debloatPrevTabPos = cur.tabBarPosition
  } else if (leavingDebloat) {
    patch.tabBarPosition = cur.debloatPrevTabPos ?? 'top'
  }
  return patch
}

export const MODES: { id: UiMode; icon: string; name: string; desc: string; tagline: string; accent: string; grad: string }[] = [
  { id: 'full', icon: '🚀', name: 'Full', tagline: 'Всё включено', desc: 'vim, Exposé, grep, айленд, адблок и все 130 дополнений', accent: '#4da3ff', grad: 'linear-gradient(135deg,#4da3ff,#7c5cff)' },
  { id: 'debloat', icon: '🧹', name: 'Debloat', tagline: 'Только суть', desc: 'Обычный браузер: вкладки сверху, статус-бар и адблок', accent: '#3dff8f', grad: 'linear-gradient(135deg,#3dff8f,#19e3ff)' },
  { id: 'gaming', icon: '🎮', name: 'Gaming', tagline: 'Максимум FPS', desc: 'Агрессивный сон вкладок, случайная GX-тема, без стекла и анимаций', accent: '#ff2d7c', grad: 'linear-gradient(135deg,#ff2d7c,#b95aff)' },
]
