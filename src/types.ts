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
  reader?: boolean
  focus?: boolean
  color?: string
  createdAt?: number
  unread?: boolean
}

export interface ReadItem {
  url: string
  title: string
  addedAt: number
}

export interface TrailEntry {
  url: string
  title: string
  t: number
}

export interface Snapshot {
  id: string
  name: string
  at: number
  tabs: Array<{ url: string; title: string }>
}

export interface Note {
  id: string
  text: string
  at: number
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

  // ─── Feature Store ──────────────────────────────
  palette: boolean
  expose: boolean
  grep: boolean
  pip: boolean
  trail: boolean
  sleep: boolean
  lens: boolean
  incognito: boolean
  shots: boolean
  reader: boolean
  focus: boolean
  nightShift: boolean
  adblock: boolean
  aliases: boolean
  urlAliases: Record<string, string>
  clipboard: boolean
  selectSearch: boolean
  readTime: boolean
  tabColors: boolean
  duplicate: boolean
  dedupe: boolean
  backup: boolean
  readlist: boolean
  readList: ReadItem[]
  translator: boolean
  pomodoro: boolean
  featureVersion: number

  // ─── v1.3.0 — 100 new store features ──────────────
  // Page mods (Оформление / visual + Умные / behavior)
  grayscale: boolean
  sepia: boolean
  contrast: boolean
  dim: boolean
  invert: boolean
  maxcol: boolean
  serif: boolean
  leading: boolean
  bigtext: boolean
  imgdim: boolean
  linkhl: boolean
  fontsmooth: boolean
  vidhide: boolean
  commenthide: boolean
  stickykill: boolean
  hidedistract: boolean
  readingbar: boolean
  tabgrad: boolean
  roundui: boolean
  density: boolean
  glowui: boolean
  ntpgrad: boolean
  ntpquote: boolean
  amoled: boolean
  duotone: boolean
  twocolreader: boolean
  justify: boolean
  hyphen: boolean
  paraspace: boolean
  webfont: boolean
  webFont: string
  codefont: boolean
  scrollmem: boolean
  wordcount: boolean
  toc: boolean
  nightauto: boolean
  nightAutoStart: number
  nightAutoEnd: number
  hidecookie: boolean

  // StatusBar widgets + tab control (Управление)
  clock: boolean
  timer: boolean
  timerMinutes: number
  sessiontime: boolean
  copyurl: boolean
  copyalltabs: boolean
  yankmd: boolean
  yanktitle: boolean
  calc: boolean
  units: boolean
  baseconv: boolean
  pwgen: boolean
  uuid: boolean
  colorparse: boolean
  wc: boolean
  stats: boolean
  sorturl: boolean
  groupby: boolean
  muteall: boolean
  mediactl: boolean
  qrcode: boolean
  tabage: boolean
  unreaddot: boolean
  taboverflow: boolean
  snap: boolean
  cliphist: boolean
  clipHistory: string[]

  // Smart tools (Умные)
  spellcheck: boolean
  autoplay: boolean
  tts: boolean
  watch: boolean
  formfill: boolean
  searchsite: boolean
  findregex: boolean
  themeauto: boolean
  savemd: boolean
  savepdf: boolean
  printclean: boolean
  emoji: boolean
  translit: boolean
  slugify: boolean
  caseconv: boolean
  hash: boolean
  b64: boolean
  urlenc: boolean
  jsonfmt: boolean
  openselection: boolean
  quicknote: boolean
  notes: Note[]
  snapshots: Snapshot[]

  // Privacy (Приватность)
  refstrip: boolean
  ua: boolean
  userAgent: string
  webrtc: boolean
  cookiekill: boolean
  cookieTtl: number
  noautofill: boolean
  autodelete: boolean
  imagelite: boolean
  trackhide: boolean
  privateclick: boolean
  fingerprint: boolean
  historyoff: boolean
  trailoff: boolean
  forgetsite: boolean
  siteblock: boolean
  blockedSites: string[]
  dnt: boolean
  cleanurl: boolean
  blockpop: boolean
  cacheclear: boolean
  cookieview: boolean
}

declare global {
  interface Window {
    onyx: {
      isAndroid?: boolean
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
      setAdblock: (enabled: boolean) => void
      setPrivacy: (cfg: { ua?: string | null; refstrip?: boolean; dnt?: boolean; imagelite?: boolean; trackhide?: boolean; cleanurl?: boolean; webrtc?: boolean; noautofill?: boolean; autodelete?: boolean }) => void
      setCookieTtl: (days: number) => void
      saveBackup: (name: string, text: string) => Promise<string>
      loadBackup: () => Promise<string | null>
      clearCache: () => Promise<void>
      getCookies: () => Promise<Array<{ name: string; domain: string; expires: number }>>
      clearSiteData: (origin: string) => Promise<void>
      clearAllCookies: () => Promise<void>
      readClipboard: () => string
      writeClipboard: (s: string) => void
      onDownloadStart: (cb: (info: any) => void) => void
      onDownloadProgress: (cb: (data: any) => void) => void
      onDownloadDone: (cb: (data: any) => void) => void
    }
  }
}
