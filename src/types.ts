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
  zoom: number
  incognito: boolean
  muted: boolean
}

export interface TrailEntry {
  url: string
  title: string
  t: number
}

export interface SiteLens {
  domain: string
  zoom?: number
  darkReader?: boolean
  vimEnabled?: boolean
  accent?: string
  enabled: boolean
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
  text?: string
}

export interface Download {
  id: string
  filename: string
  url: string
  totalBytes: number
  receivedBytes: number
  state: string
  startTime: number
  savePath?: string
}

export type VimMode = 'normal' | 'insert' | 'command' | 'hint'

export interface VimKeyBinding {
  key: string
  command: string
  mode: VimMode
  description: string
}

export type ThemePreset = 'tokyo-night' | 'dracula' | 'monokai' | 'nord' | 'solarized' | 'ayu' | 'one-dark' | 'gruvbox' | 'catppuccin' | 'tokyo-day' | 'solarized-light' | 'nord-light' | 'github-light' | 'catppuccin-latte' | 'firefox-nova' | 'nova-light' | 'synthwave' | 'forest' | 'rose-pine' | 'everforest' | 'github-dark' | 'midnight' | 'outrun' | 'paper' | 'custom'

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
  tabBarPosition: 'top' | 'bottom'

  statusBarHeight: number
  statusBarShowMode: boolean
  statusBarShowUrl: boolean
  statusBarShowCount: boolean
  statusBarPosition: 'top' | 'bottom'

  sidebarPosition: 'left' | 'right'
  sidebarWidth: number

  titlebarHeight: number

  workspaceShow: boolean
  workspacePosition: 'top' | 'bottom'

  browserChrome: boolean

  aurora: boolean
  lenses: SiteLens[]
  onboarded: boolean

  ntpShowClock: boolean
  ntpShowDate: boolean
  ntpShowSearch: boolean
  ntpShowQuickLinks: boolean
  ntpQuickLinks: Array<{ name: string; url: string }>
  ntpBgColor: string
  ntpLayout: 'default' | 'minimal' | 'centered' | 'zen' | 'gradient'
  currentPreset: string

  borderRadius: number
  transitionSpeed: number
  tabOpacity: number

  smoothScroll: boolean
  restoreTabs: boolean
  confirmClose: boolean
  zenMode: boolean
  defaultZoom: number
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
      openPath: (p: string) => Promise<void>
      showInFolder: (p: string) => Promise<void>
      getWebviewPreload: () => string
      setDefaultBrowser: () => Promise<{ success: boolean; error?: string }>
      openDefaultApps: () => Promise<void>
      getBrowserPath: () => Promise<string>
      toggleFullscreen: () => void
      listExtensions: () => Promise<string[]>
      openExtensionsFolder: () => Promise<void>
      cancelDownload: (id: string) => void
      pauseDownload: (id: string) => void
      resumeDownload: (id: string) => void
      saveShot: (buf: ArrayBuffer, name: string) => Promise<string>
      copyImage: (buf: ArrayBuffer) => Promise<void>
      pipOpen: (url: string, title?: string) => Promise<void>
      onDownloadStart: (cb: (info: any) => void) => void
      onDownloadProgress: (cb: (data: any) => void) => void
      onDownloadDone: (cb: (data: any) => void) => void
    }
  }
}
