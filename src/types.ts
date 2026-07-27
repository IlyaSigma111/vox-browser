export const GROUP_COLORS = [
  '#f7768e', '#ff9e64', '#e0af68', '#9ece6a', '#7dcfff',
  '#7aa2f7', '#bb9af7', '#f7768e', '#73daca', '#b4f9f8',
] as const

export const WORKSPACE_COLORS = [
  '#7aa2f7', '#f7768e', '#9ece6a', '#ff9e64', '#bb9af7',
  '#7dcfff', '#e0af68', '#73daca',
] as const

export interface Tab {
  id: string
  url: string
  title: string
  favicon: string
  loading: boolean
  pinned: boolean
  groupId: string | null
  workspace: number
}

export interface TabGroup {
  id: string
  name: string
  color: string
  collapsed: boolean
  workspace: number
}

export interface Workspace {
  id: number
  name: string
  color: string
}

export interface Bookmark {
  id: string
  title: string
  url: string
  favicon: string
  createdAt: number
}

export interface HistoryEntry {
  id: string
  url: string
  title: string
  visitedAt: number
}

export type VimMode = 'normal' | 'insert' | 'command' | 'hint'

export interface VimKeyBinding {
  key: string
  command: string
  mode: VimMode
  description: string
}

export type ThemePreset = 'tokyo-night' | 'dracula' | 'monokai' | 'nord' | 'solarized' | 'ayu' | 'one-dark' | 'gruvbox' | 'custom'

export interface ThemeColors {
  bg: string
  bgDim: string
  bgLight: string
  fg: string
  fgDim: string
  border: string
  accent: string
  green: string
  red: string
  orange: string
  cyan: string
  purple: string
}

export interface Settings {
  homepage: string
  searchEngine: string
  searchUrl: string
  vimEnabled: boolean
  showStatusBar: boolean
  showTabBar: boolean
  darkReader: boolean
  theme: ThemePreset
  customColors: ThemeColors
  language: string

  fontFamily: string
  fontSize: number

  tabBarHeight: number
  tabBarShowClose: boolean
  tabBarShowFavicon: boolean
  tabBarShowIndicator: boolean
  tabShape: 'square' | 'rounded' | 'pill' | 'trapezoid' | 'yandex' | 'wave'

  statusBarHeight: number
  statusBarShowMode: boolean
  statusBarShowUrl: boolean
  statusBarShowCount: boolean

  titlebarHeight: number

  workspaceShow: boolean
  workspacePosition: 'top' | 'bottom'

  ntpShowClock: boolean
  ntpShowDate: boolean
  ntpShowSearch: boolean
  ntpShowQuickLinks: boolean
  ntpQuickLinks: Array<{ name: string; url: string }>
  ntpBgColor: string

  borderRadius: number
  transitionSpeed: number
  tabOpacity: number

  smoothScroll: boolean
  restoreTabs: boolean
  confirmClose: boolean
}

declare global {
  interface Window {
    onyx: {
      minimize: () => void
      maximize: () => void
      close: () => void
      readData: (f: string, fb: any) => Promise<any>
      writeData: (f: string, d: any) => Promise<void>
      openDir: () => Promise<string | null>
      openExternal: (u: string) => Promise<void>
      getWebviewPreload: () => string
    }
  }
}
