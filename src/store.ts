import { create } from 'zustand'
import type { Tab, TabGroup, Workspace, Bookmark, HistoryEntry, Download, Settings, VimMode, ThemePreset, ThemeColors, TrailEntry, ReadItem } from './types'
import type { UIPreset } from './presets'
import { GROUP_COLORS, WORKSPACE_COLORS } from './types'
import { setLang } from './lang'

let _id = Date.now()
const uid = () => `${++_id}-${Math.random().toString(36).slice(2, 6)}`

function normalize(input: string, searchUrl?: string): string {
  const s = input.trim()
  if (/^https?:\/\//i.test(s)) return s
  if (/^localhost/.test(s)) return `http://${s}`
  if (/^[\w-]+(\.[\w-]+)+/.test(s)) return `https://${s}`
  const url = searchUrl || 'https://www.google.com/search?q=%s'
  return url.replace('%s', encodeURIComponent(s))
}

function resolveUrl(input: string, settings: Settings): string {
  const s = input.trim()
  if (settings.aliases && settings.urlAliases) {
    const parts = s.split(/\s+/)
    const key = parts[0].toLowerCase().replace(/^www\./, '')
    const target = settings.urlAliases[key]
    if (target) {
      const base = /^https?:\/\//i.test(target) ? target : `https://${target}`
      return parts.length > 1 ? `${base}/${parts.slice(1).join('/')}` : base
    }
  }
  return normalize(s, settings.searchUrl)
}

function makeTab(over?: Partial<Tab>): Tab {
  return {
    id: uid(), url: 'about:blank', title: 'New tab',
    favicon: '', loading: false, pinned: false,
    groupId: null, workspace: 1, zoom: 1, incognito: false, muted: false, createdAt: Date.now(), ...over,
  }
}

export const THEMES: Record<ThemePreset, ThemeColors> = {
  'tokyo-night': {
    bg: '#1a1b26', bgDim: '#16161e', bgLight: '#24283b',
    fg: '#c0caf5', fgDim: '#565f89', border: '#292e42',
    accent: '#7aa2f7', green: '#9ece6a', red: '#f7768e',
    orange: '#ff9e64', cyan: '#7dcfff', purple: '#bb9af7',
  },
  'dracula': {
    bg: '#282a36', bgDim: '#21222c', bgLight: '#44475a',
    fg: '#f8f8f2', fgDim: '#6272a4', border: '#44475a',
    accent: '#bd93f9', green: '#50fa7b', red: '#ff5555',
    orange: '#ffb86c', cyan: '#8be9fd', purple: '#bd93f9',
  },
  'monokai': {
    bg: '#272822', bgDim: '#1e1f1c', bgLight: '#3e3d32',
    fg: '#f8f8f2', fgDim: '#75715e', border: '#3e3d32',
    accent: '#a6e22e', green: '#a6e22e', red: '#f92672',
    orange: '#fd971f', cyan: '#66d9ef', purple: '#ae81ff',
  },
  'nord': {
    bg: '#2e3440', bgDim: '#272c36', bgLight: '#3b4252',
    fg: '#eceff4', fgDim: '#4c566a', border: '#3b4252',
    accent: '#88c0d0', green: '#a3be8c', red: '#bf616a',
    orange: '#d08770', cyan: '#88c0d0', purple: '#b48ead',
  },
  'solarized': {
    bg: '#002b36', bgDim: '#001f27', bgLight: '#073642',
    fg: '#839496', fgDim: '#586e75', border: '#073642',
    accent: '#268bd2', green: '#859900', red: '#dc322f',
    orange: '#cb4b16', cyan: '#2aa198', purple: '#6c71c4',
  },
  'ayu': {
    bg: '#0f1419', bgDim: '#0b0e12', bgLight: '#1c2128',
    fg: '#bfbdb6', fgDim: '#4d5566', border: '#1c2128',
    accent: '#36a3d9', green: '#b8cc52', red: '#f07178',
    orange: '#ff8f40', cyan: '#95e6cb', purple: '#d2a6ff',
  },
  'one-dark': {
    bg: '#282c34', bgDim: '#21252b', bgLight: '#31353d',
    fg: '#abb2bf', fgDim: '#5c6370', border: '#31353d',
    accent: '#61afef', green: '#98c379', red: '#e06c75',
    orange: '#d19a66', cyan: '#56b6c2', purple: '#c678dd',
  },
  'gruvbox': {
    bg: '#282828', bgDim: '#1d2021', bgLight: '#3c3836',
    fg: '#ebdbb2', fgDim: '#7c6f64', border: '#3c3836',
    accent: '#458588', green: '#b8bb26', red: '#fb4934',
    orange: '#fe8019', cyan: '#83a598', purple: '#d3869b',
  },
  'catppuccin': {
    bg: '#1e1e2e', bgDim: '#181825', bgLight: '#313244',
    fg: '#cdd6f4', fgDim: '#6c7086', border: '#313244',
    accent: '#89b4fa', green: '#a6e3a1', red: '#f38ba8',
    orange: '#fab387', cyan: '#94e2d5', purple: '#cba6f7',
  },
  'tokyo-day': {
    bg: '#e1e2e7', bgDim: '#d5d6db', bgLight: '#c4c7cd',
    fg: '#3760bf', fgDim: '#848cb5', border: '#c4c7cd',
    accent: '#2e7de9', green: '#587539', red: '#f52a65',
    orange: '#ff8a4c', cyan: '#0f4b6e', purple: '#985ccc',
  },
  'solarized-light': {
    bg: '#fdf6e3', bgDim: '#eee8d5', bgLight: '#fdf6e3',
    fg: '#657b83', fgDim: '#93a1a1', border: '#eee8d5',
    accent: '#268bd2', green: '#859900', red: '#dc322f',
    orange: '#cb4b16', cyan: '#2aa198', purple: '#6c71c4',
  },
  'nord-light': {
    bg: '#eceff4', bgDim: '#e5e9f0', bgLight: '#d8dee9',
    fg: '#2e3440', fgDim: '#4c566a', border: '#d8dee9',
    accent: '#5e81ac', green: '#a3be8c', red: '#bf616a',
    orange: '#d08770', cyan: '#88c0d0', purple: '#b48ead',
  },
  'github-light': {
    bg: '#ffffff', bgDim: '#f6f8fa', bgLight: '#f6f8fa',
    fg: '#24292f', fgDim: '#57606a', border: '#d0d7de',
    accent: '#0969da', green: '#116329', red: '#cf222e',
    orange: '#953800', cyan: '#1b7c83', purple: '#8250df',
  },
  'catppuccin-latte': {
    bg: '#eff1f5', bgDim: '#e6e9ef', bgLight: '#e6e9ef',
    fg: '#4c4f69', fgDim: '#7c7f93', border: '#ccd0da',
    accent: '#1e66f5', green: '#40a02b', red: '#d20f39',
    orange: '#df8e1d', cyan: '#179299', purple: '#8839ef',
  },
  // ─── Experimental themes ⚗ ─────────────────────────
  'firefox-nova': {
    bg: '#2b2826', bgDim: '#232120', bgLight: '#3a3633',
    fg: '#f5f0e8', fgDim: '#9a9185', border: '#47413c',
    accent: '#ff6a3d', green: '#a3be8c', red: '#e05a47',
    orange: '#ff8f4c', cyan: '#7fc8d8', purple: '#c3a6e8',
  },
  'nova-light': {
    bg: '#fbf7f0', bgDim: '#f3ede2', bgLight: '#fffaf2',
    fg: '#3d3832', fgDim: '#8a8177', border: '#e4dccf',
    accent: '#e2560f', green: '#5c7c4a', red: '#c8452f',
    orange: '#e8762c', cyan: '#2f7d8c', purple: '#8259a8',
  },
  'synthwave': {
    bg: '#150b2a', bgDim: '#0e071e', bgLight: '#241239',
    fg: '#f8f0ff', fgDim: '#8d7bab', border: '#3a2460',
    accent: '#ff2ea6', green: '#36f9c1', red: '#ff3860',
    orange: '#ffb347', cyan: '#45e0ff', purple: '#b56cff',
  },
  'forest': {
    bg: '#1b2317', bgDim: '#141b11', bgLight: '#27321f',
    fg: '#e8f0e0', fgDim: '#7d8f6f', border: '#33401f',
    accent: '#8bc34a', green: '#aed581', red: '#ef5350',
    orange: '#ffab40', cyan: '#80cbc4', purple: '#b39ddb',
  },
  'rose-pine': {
    bg: '#191724', bgDim: '#13111e', bgLight: '#26233a',
    fg: '#e0def4', fgDim: '#6e6a86', border: '#26233a',
    accent: '#ebbcba', green: '#9ccfd8', red: '#eb6f92',
    orange: '#f6c177', cyan: '#9ccfd8', purple: '#c4a7e7',
  },
  'everforest': {
    bg: '#2d353b', bgDim: '#272e33', bgLight: '#3d484d',
    fg: '#d3c6aa', fgDim: '#859289', border: '#3d484d',
    accent: '#a7c080', green: '#a7c080', red: '#e67e80',
    orange: '#e69875', cyan: '#83c092', purple: '#d699b6',
  },
  'github-dark': {
    bg: '#0d1117', bgDim: '#010409', bgLight: '#161b22',
    fg: '#e6edf3', fgDim: '#8d96a0', border: '#30363d',
    accent: '#58a6ff', green: '#3fb950', red: '#f85149',
    orange: '#d29922', cyan: '#39c5cf', purple: '#bc8cff',
  },
  'midnight': {
    bg: '#0a0a12', bgDim: '#06060c', bgLight: '#16162a',
    fg: '#e8e8f0', fgDim: '#6b6b84', border: '#1e1e36',
    accent: '#a78bfa', green: '#34d399', red: '#f87171',
    orange: '#fbbf24', cyan: '#22d3ee', purple: '#c084fc',
  },
  'outrun': {
    bg: '#0d0221', bgDim: '#080116', bgLight: '#1c0b3d',
    fg: '#fff0f5', fgDim: '#8d6fb0', border: '#2e0f5e',
    accent: '#ff2975', green: '#01fdf6', red: '#ff2e63',
    orange: '#ffb347', cyan: '#01fdf6', purple: '#a200ff',
  },
  'paper': {
    bg: '#faf6ef', bgDim: '#f1ebe0', bgLight: '#fffdf8',
    fg: '#43302b', fgDim: '#8d7f74', border: '#e0d6c6',
    accent: '#d65d3d', green: '#5c7c4a', red: '#c8452f',
    orange: '#e0762c', cyan: '#2f7d8c', purple: '#8a5a96',
  },
  'custom': {
    bg: '#1a1b26', bgDim: '#16161e', bgLight: '#24283b',
    fg: '#c0caf5', fgDim: '#565f89', border: '#292e42',
    accent: '#7aa2f7', green: '#9ece6a', red: '#f7768e',
    orange: '#ff9e64', cyan: '#7dcfff', purple: '#bb9af7',
  },
}

const defaultWorkspaces: Workspace[] = [
  { id: 1, name: '1', color: WORKSPACE_COLORS[0] },
  { id: 2, name: '2', color: WORKSPACE_COLORS[1] },
  { id: 3, name: '3', color: WORKSPACE_COLORS[2] },
  { id: 4, name: '4', color: WORKSPACE_COLORS[3] },
]

interface Store {
  tabs: Tab[]
  activeId: string
  groups: TabGroup[]
  workspaces: Workspace[]
  activeWorkspace: number
  bookmarks: Bookmark[]
  history: HistoryEntry[]
  downloads: Download[]
  settings: Settings
  vimMode: VimMode
  showPalette: boolean
  paletteInput: string
  showShortcuts: boolean
  showTabSearch: boolean
  showSessionGraph: boolean
  closedTabs: Tab[]
  navTrails: Record<string, TrailEntry[]>
  pageTexts: Record<string, string>
  focusUrlBar: number
  auroraColor: string
  sidebarTab: 'bookmarks' | 'history' | 'downloads' | 'settings' | 'reading' | 'extensions' | 'notes' | null
  webviews: Map<string, any>
  customPresets: UIPreset[]
  toasts: Array<{ id: number; text: string }>
  sessionStart: number

  addTab: (url?: string, workspace?: number, incognito?: boolean) => string
  openSettings: () => void
  openStore: () => void
  closeTab: (id: string) => void
  reopenTab: () => void
  activate: (id: string) => void
  updateTab: (id: string, p: Partial<Tab>) => void
  moveTab: (a: number, b: number) => void
  moveTabToWorkspace: (id: string, ws: number) => void

  addGroup: (name: string, workspace?: number) => string
  removeGroup: (id: string) => void
  toggleGroupCollapse: (id: string) => void
  assignGroup: (tabId: string, groupId: string | null) => void
  renameGroup: (id: string, name: string) => void
  setGroupColor: (id: string, color: string) => void

  switchWorkspace: (id: number) => void
  addWorkspace: () => void
  removeWorkspace: (id: number) => void
  renameWorkspace: (id: number, name: string) => void

  addBookmark: (b: Omit<Bookmark, 'id' | 'createdAt'>) => void
  removeBookmark: (id: string) => void
  toggleBookmark: (url: string, title: string, favicon?: string) => void

  addHistory: (h: Omit<HistoryEntry, 'id' | 'visitedAt'>) => void
  clearHistory: () => void

  addDownload: (d: Download) => void
  updateDownload: (id: string, p: Partial<Download>) => void
  removeDownload: (id: string) => void

  saveCustomPreset: (p: UIPreset) => void
  removeCustomPreset: (id: string) => void

  setSettings: (p: Partial<Settings>) => void
  setVimMode: (m: VimMode) => void
  setPalette: (v: boolean) => void
  setPaletteInput: (s: string) => void
  setShowShortcuts: (v: boolean) => void
  setTabSearch: (v: boolean) => void
  setSessionGraph: (v: boolean) => void
  triggerUrlBar: () => void
  pushTrail: (id: string, entry: TrailEntry) => void
  setZoom: (id: string, zoom: number) => void
  setAuroraColor: (c: string) => void
  setSidebar: (s: 'bookmarks' | 'history' | 'downloads' | 'settings' | 'reading' | 'extensions' | 'notes' | null) => void

  registerWv: (id: string, ref: any) => void
  unregisterWv: (id: string) => void
  navigateTo: (id: string, url: string) => void

  toggleReader: () => void
  toggleFocus: () => void
  searchSelection: () => void
  setPageText: (id: string, text: string) => void
  duplicateTab: (id: string) => void
  closeDuplicates: () => void
  exportSettings: () => void
  importSettings: () => void
  addToReadList: (url: string, title: string) => void
  removeFromReadList: (url: string) => void
  translatePage: () => void

  // v1.3.0 — new actions
  pushToast: (text: string) => void
  copyText: (s: string) => void
  sortTabs: () => void
  groupByDomain: () => void
  muteAllTabs: () => void
  toggleMedia: () => void
  saveSnapshot: (name: string) => void
  restoreSnapshot: (id: string) => void
  removeSnapshot: (id: string) => void
  addNote: (text: string) => void
  removeNote: (id: string) => void
  addClip: (s: string) => void
  forgetSite: () => void
  blockSite: () => void
  unblockSite: (domain: string) => void
  clearCacheNow: () => Promise<void>
  cookiesNow: () => Promise<Array<{ name: string; domain: string; expires: number }>>
}

const defaultSettings: Settings = {
  homepage: 'about:blank',
  searchEngine: 'Google',
  searchUrl: 'https://www.google.com/search?q=%s',
  vimEnabled: false,
  showStatusBar: true,
  showTabBar: true,
  darkReader: false,
  theme: 'tokyo-night',
  customColors: { ...THEMES['tokyo-night'] },
  language: 'en',

  fontFamily: "'Consolas', 'SF Mono', 'Cascadia Code', monospace",
  fontSize: 13,

  tabBarHeight: 34,
  tabBarShowClose: true,
  tabBarShowFavicon: true,
  tabBarShowIndicator: true,
  tabShape: 'rounded',
  tabBarPosition: 'bottom',

  statusBarHeight: 28,
  statusBarShowMode: true,
  statusBarShowUrl: true,
  statusBarShowCount: true,
  statusBarPosition: 'bottom',

  sidebarPosition: 'left',
  sidebarWidth: 340,

  titlebarHeight: 6,

  workspaceShow: true,
  workspacePosition: 'top',
  browserChrome: false,
  aurora: false,
  lenses: [],
  onboarded: false,

  ntpShowClock: true,
  ntpShowDate: true,
  ntpShowSearch: true,
  ntpShowQuickLinks: true,
  ntpQuickLinks: [
    { name: 'youtube', url: 'https://youtube.com' },
    { name: 'github', url: 'https://github.com' },
    { name: 'reddit', url: 'https://reddit.com' },
    { name: 'wikipedia', url: 'https://wikipedia.org' },
    { name: 'news', url: 'https://news.ycombinator.com' },
  ],
  ntpBgColor: '',
  ntpLayout: 'default',
  currentPreset: 'vox-classic',

  borderRadius: 4,
  transitionSpeed: 150,
  tabOpacity: 1,

  smoothScroll: false,
  restoreTabs: true,
  confirmClose: false,
  zenMode: false,
  defaultZoom: 1,

  palette: false,
  expose: false,
  grep: false,
  pip: false,
  trail: false,
  sleep: false,
  lens: false,
  incognito: false,
  shots: false,
  reader: false,
  focus: false,
  nightShift: false,
  adblock: false,
  aliases: false,
  urlAliases: { yt: 'youtube.com', gh: 'github.com', g: 'google.com', w: 'wikipedia.org' },
  clipboard: false,
  selectSearch: false,
  readTime: false,
  tabColors: false,
  duplicate: false,
  dedupe: false,
  backup: false,
  readlist: false,
  readList: [],
  translator: false,
  pomodoro: false,
  featureVersion: 0,

  // v1.3.0 — 100 new features (all OFF, lean by default)
  grayscale: false, sepia: false, contrast: false, dim: false, invert: false,
  maxcol: false, serif: false, leading: false, bigtext: false, imgdim: false,
  linkhl: false, fontsmooth: false, vidhide: false, commenthide: false, stickykill: false,
  hidedistract: false, readingbar: false, tabgrad: false, roundui: false, density: false,
  glowui: false, ntpgrad: false, ntpquote: false, amoled: false, duotone: false,
  twocolreader: false, justify: false, hyphen: false, paraspace: false, webfont: false,
  webFont: "'Georgia', 'Times New Roman', serif", codefont: false, scrollmem: false,
  wordcount: false, toc: false, nightauto: false, nightAutoStart: 22, nightAutoEnd: 7,
  hidecookie: false,
  clock: false, timer: false, timerMinutes: 15, sessiontime: false, copyurl: false,
  copyalltabs: false, yankmd: false, yanktitle: false, calc: false, units: false,
  baseconv: false, pwgen: false, uuid: false, colorparse: false, wc: false,
  stats: false, sorturl: false, groupby: false, muteall: false, mediactl: false,
  qrcode: false, tabage: false, unreaddot: false, taboverflow: false, snap: false,
  cliphist: false, clipHistory: [],
  spellcheck: false, autoplay: false, tts: false, watch: false, formfill: false,
  searchsite: false, findregex: false, themeauto: false, savemd: false, savepdf: false,
  printclean: false, emoji: false, translit: false, slugify: false, caseconv: false,
  hash: false, b64: false, urlenc: false, jsonfmt: false, openselection: false,
  quicknote: false, notes: [], snapshots: [],
  refstrip: false, ua: false, userAgent: '', webrtc: false, cookiekill: false,
  cookieTtl: 60, noautofill: false, autodelete: false, imagelite: false,
  trackhide: false, privateclick: false, fingerprint: false, historyoff: false,
  trailoff: false, forgetsite: false, siteblock: false, blockedSites: [],
  dnt: false, cleanurl: false, blockpop: false, cacheclear: false, cookieview: false,
}

function persist(store: Store) {
  try {
    if (window.onyx?.writeData) {
      window.onyx.writeData('settings.json', store.settings)
      // Save tab state (strip webview refs, drop incognito tabs)
      const tabsToSave = store.tabs.filter(t => !t.incognito).map(t => ({
        id: t.id, url: t.url, title: t.title, favicon: t.favicon,
        pinned: t.pinned, groupId: t.groupId, workspace: t.workspace, zoom: t.zoom,
      }))
      window.onyx.writeData('workspace-state.json', {
        groups: store.groups,
        workspaces: store.workspaces,
        activeWorkspace: store.activeWorkspace,
        tabs: tabsToSave,
        activeId: store.activeId,
      })
      // Persist bookmarks and history
      window.onyx.writeData('bookmarks.json', store.bookmarks)
      window.onyx.writeData('history.json', store.history)
    }
  } catch {}
}

let _persistTimer: any = null
function persistDebounced() {
  clearTimeout(_persistTimer)
  _persistTimer = setTimeout(() => {
    const s = useStore.getState()
    persist(s)
  }, 300)
}

function persistNow() {
  clearTimeout(_persistTimer)
  persist(useStore.getState())
}

export const useStore = create<Store>((set, get) => {
  const firstTab = makeTab({ workspace: 1 })
  const initialState = {
    tabs: [firstTab],
    activeId: firstTab.id,
    groups: [] as TabGroup[],
    workspaces: defaultWorkspaces,
    activeWorkspace: 1,
    bookmarks: [] as Bookmark[],
    history: [] as HistoryEntry[],
    downloads: [] as Download[],
    settings: defaultSettings,
    vimMode: 'normal' as VimMode,
    showPalette: false,
    paletteInput: '',
    showShortcuts: false,
    showTabSearch: false,
    showSessionGraph: false,
    closedTabs: [] as Tab[],
    navTrails: {} as Record<string, TrailEntry[]>,
    pageTexts: {} as Record<string, string>,
    focusUrlBar: 0,
    auroraColor: '',
    sidebarTab: null as 'bookmarks' | 'history' | 'downloads' | 'settings' | 'reading' | 'extensions' | 'notes' | null,
    webviews: new Map<string, any>(),
    customPresets: [] as UIPreset[],
    toasts: [] as Array<{ id: number; text: string }>,
    sessionStart: Date.now(),
  }

  let pendingWs: any = null
  let pendingSettings: any = null

  function applyWorkspaceRestore() {
    if (!pendingWs || pendingSettings === undefined) return
    const data = pendingWs
    const restoreTabs = pendingSettings.restoreTabs
    const restored: any = {
      groups: data.groups || [],
      workspaces: data.workspaces || defaultWorkspaces,
      activeWorkspace: data.activeWorkspace || 1,
    }
    if (restoreTabs !== false && data.tabs && Array.isArray(data.tabs) && data.tabs.length > 0) {
      restored.tabs = data.tabs.map((t: any) => ({
        id: t.id || uid(), url: t.url || 'about:blank', title: t.title || 'New tab',
        favicon: t.favicon || '', loading: false, pinned: t.pinned || false,
        groupId: t.groupId || null, workspace: t.workspace || 1,
        zoom: t.zoom || (pendingSettings.defaultZoom || 1), incognito: false, muted: false,
      }))
      restored.activeId = data.activeId || restored.tabs[0].id
    } else {
      const hp = pendingSettings && typeof pendingSettings.homepage === 'string' && pendingSettings.homepage !== 'about:blank' ? pendingSettings.homepage : ''
      const t = makeTab(hp ? { url: hp, title: hp, workspace: restored.activeWorkspace, zoom: pendingSettings.defaultZoom || 1 } : { workspace: restored.activeWorkspace })
      restored.tabs = [t]
      restored.activeId = t.id
    }
    set(restored)
    pendingWs = null
    pendingSettings = undefined
  }

  window.onyx?.readData?.('settings.json', null).then((data: any) => {
    if (data && typeof data === 'object') {
      set({ settings: { ...defaultSettings, ...data, customColors: { ...defaultSettings.customColors, ...data.customColors } } })
      if (data.language) setLang(data.language)
    }
    pendingSettings = data && typeof data === 'object' ? data : {}
    applyWorkspaceRestore()
  }).catch(() => {
    pendingSettings = {}
    applyWorkspaceRestore()
  })

  window.onyx?.readData?.('workspace-state.json', null).then((data: any) => {
    if (data && typeof data === 'object') {
      pendingWs = data
    }
    applyWorkspaceRestore()
  }).catch(() => {
    applyWorkspaceRestore()
  })

  window.onyx?.readData?.('custom-presets.json', []).then((data: any) => {
    if (Array.isArray(data) && data.length > 0) {
      set({ customPresets: data })
    }
  }).catch(() => {})

  window.onyx?.readData?.('bookmarks.json', []).then((data: any) => {
    if (Array.isArray(data)) {
      set({ bookmarks: data })
    }
  }).catch(() => {})

  window.onyx?.readData?.('history.json', []).then((data: any) => {
    if (Array.isArray(data)) {
      set({ history: data })
    }
  }).catch(() => {})

  return {
  ...initialState,

  addTab: (url, ws, incognito) => {
    const s = get()
    const workspace = ws ?? s.activeWorkspace
    const zoom = s.settings.defaultZoom || 1
    let n = url ? resolveUrl(url, s.settings) : ''
    if (n) {
      let h = ''
      try { h = new URL(n).hostname } catch {}
      if (h && s.settings.blockedSites.includes(h)) {
        const bt = makeTab({ url: `vox:blocked?host=${encodeURIComponent(h)}`, title: `Blocked: ${h}`, workspace, incognito: !!incognito, zoom })
        set(st => ({ tabs: [...st.tabs, bt], activeId: bt.id, showTabSearch: false }))
        persistNow()
        return bt.id
      }
    }
    const t = makeTab(n ? { url: n, title: url, workspace, incognito: !!incognito, zoom } : { workspace, incognito: !!incognito, zoom })
    set(st => ({ tabs: [...st.tabs, t], activeId: t.id, showTabSearch: false }))
    persistNow()
    return t.id
  },

  openSettings: () => {
    const s = get()
    const existing = s.tabs.find(t => t.url === 'vox:settings' && t.workspace === s.activeWorkspace)
    if (existing) { set({ activeId: existing.id }); return }
    const t = makeTab({ url: 'vox:settings', title: 'Settings', workspace: s.activeWorkspace })
    set(st => ({ tabs: [...st.tabs, t], activeId: t.id, showTabSearch: false }))
    persistNow()
  },

  openStore: () => {
    const s = get()
    const existing = s.tabs.find(t => t.url === 'vox:store' && t.workspace === s.activeWorkspace)
    if (existing) { set({ activeId: existing.id }); return }
    const t = makeTab({ url: 'vox:store', title: 'Store', workspace: s.activeWorkspace })
    set(st => ({ tabs: [...st.tabs, t], activeId: t.id, showTabSearch: false }))
    persistNow()
  },

  closeTab: (id) => {
    const s = get()
    const tab = s.tabs.find(t => t.id === id)
    const closedTabs = tab ? [...s.closedTabs, tab].slice(-50) : s.closedTabs
    set(st => {
      const next = st.tabs.filter(t => t.id !== id)
      if (!next.length) { const t = makeTab({ workspace: st.activeWorkspace }); return { tabs: [t], activeId: t.id, closedTabs } }
      return {
        tabs: next,
        activeId: st.activeId === id ? next[Math.min(st.tabs.findIndex(x => x.id === id), next.length - 1)].id : st.activeId,
        closedTabs,
      }
    })
    persistNow()
  },

  reopenTab: () => {
    const s = get()
    if (!s.closedTabs.length) return
    const stack = [...s.closedTabs]
    const t = stack.pop()!
    const ws = s.workspaces.find(w => w.id === t.workspace) ? t.workspace : s.activeWorkspace
    const nt = { ...t, workspace: ws, groupId: null }
    set(st => ({ tabs: [...st.tabs, nt], activeId: nt.id, closedTabs: stack }))
    persistNow()
  },

  activate: (id) => set(st => ({ activeId: id, tabs: st.tabs.map(t => t.id === id ? { ...t, unread: false } : t) })),

  updateTab: (id, p) => set(s => {
    const next = { tabs: s.tabs.map(t => t.id === id ? { ...t, ...p } : t) }
    if (p.url) persistNow()
    return next
  }),

  moveTab: (a, b) => set(s => {
    const tabs = [...s.tabs]; const [m] = tabs.splice(a, 1); tabs.splice(b, 0, m); return { tabs }
  }),

  moveTabToWorkspace: (id, ws) => {
    const s = get()
    if (!s.workspaces.find(w => w.id === ws)) return
    set(st => ({ tabs: st.tabs.map(t => t.id === id ? { ...t, workspace: ws, groupId: null } : t) }))
    const wsTabs = get().tabs.filter(t => t.workspace === ws)
    set({ activeWorkspace: ws, activeId: (wsTabs.find(t => t.id === id) || wsTabs[0]).id })
    persist(get())
  },

  addGroup: (name, ws) => {
    const workspace = ws ?? get().activeWorkspace
    const existingColors = get().groups.filter(g => g.workspace === workspace).map(g => g.color)
    const color = GROUP_COLORS.find(c => !existingColors.includes(c)) || GROUP_COLORS[0]
    const g: TabGroup = { id: uid(), name, color, collapsed: false, workspace }
    set(s => ({ groups: [...s.groups, g] }))
    persist(get())
    return g.id
  },

  removeGroup: (id) => set(s => ({
    groups: s.groups.filter(g => g.id !== id),
    tabs: s.tabs.map(t => t.groupId === id ? { ...t, groupId: null } : t),
  })),

  toggleGroupCollapse: (id) => set(s => ({
    groups: s.groups.map(g => g.id === id ? { ...g, collapsed: !g.collapsed } : g),
  })),

  assignGroup: (tabId, groupId) => set(s => ({
    tabs: s.tabs.map(t => t.id === tabId ? { ...t, groupId } : t),
  })),

  renameGroup: (id, name) => set(s => ({
    groups: s.groups.map(g => g.id === id ? { ...g, name } : g),
  })),

  setGroupColor: (id, color) => set(s => ({
    groups: s.groups.map(g => g.id === id ? { ...g, color } : g),
  })),

  switchWorkspace: (id) => {
    const s = get()
    const ws = s.workspaces.find(w => w.id === id)
    if (!ws) return
    const wsTabs = s.tabs.filter(t => t.workspace === id)
    if (wsTabs.length === 0) {
      const t = makeTab({ workspace: id })
      set({ tabs: [...s.tabs, t], activeId: t.id, activeWorkspace: id })
    } else {
      set({ activeWorkspace: id, activeId: wsTabs[0].id })
    }
    persist(get())
  },

  addWorkspace: () => {
    const s = get()
    const maxId = Math.max(...s.workspaces.map(w => w.id), 0)
    const color = WORKSPACE_COLORS[maxId % WORKSPACE_COLORS.length]
    const ws: Workspace = { id: maxId + 1, name: String(maxId + 1), color }
    set({ workspaces: [...s.workspaces, ws] })
    persist(get())
  },

  removeWorkspace: (id) => set(s => {
    if (s.workspaces.length <= 1) return s
    const nextWs = s.workspaces.filter(w => w.id !== id)
    const nextTabs = s.tabs.filter(t => t.workspace !== id)
    if (nextTabs.length === 0) {
      const t = makeTab({ workspace: nextWs[0].id })
      nextTabs.push(t)
    }
    const newActive = s.activeWorkspace === id ? nextWs[0].id : s.activeWorkspace
    return {
      workspaces: nextWs,
      tabs: nextTabs,
      activeWorkspace: newActive,
      activeId: nextTabs.find(t => t.workspace === newActive)?.id || nextTabs[0].id,
      groups: s.groups.filter(g => g.workspace !== id),
    }
  }),

  renameWorkspace: (id, name) => set(s => ({
    workspaces: s.workspaces.map(w => w.id === id ? { ...w, name } : w),
  })),

  addBookmark: (b) => set(s => {
    const next = { bookmarks: [...s.bookmarks, { ...b, id: uid(), createdAt: Date.now() }] }
    setTimeout(() => persist({ ...get(), ...next } as any), 0)
    return next
  }),

  removeBookmark: (id) => set(s => {
    const next = { bookmarks: s.bookmarks.filter(b => b.id !== id) }
    setTimeout(() => persist({ ...get(), ...next } as any), 0)
    return next
  }),

  toggleBookmark: (url, title, favicon) => set(s => {
    const existing = s.bookmarks.find(b => b.url === url)
    const next = existing
      ? { bookmarks: s.bookmarks.filter(b => b.id !== existing.id) }
      : { bookmarks: [{ id: uid(), title: title || url, url, favicon: favicon || '', createdAt: Date.now() }, ...s.bookmarks] }
    setTimeout(() => persist({ ...get(), ...next } as any), 0)
    return next
  }),

  addHistory: (h) => set(s => {
    const next = { history: [{ ...h, id: uid(), visitedAt: Date.now() }, ...s.history].slice(0, 5000) }
    setTimeout(() => persist({ ...get(), ...next } as any), 0)
    return next
  }),

  clearHistory: () => set(s => {
    const next = { history: [] }
    setTimeout(() => persist({ ...get(), ...next } as any), 0)
    return next
  }),

  addDownload: (d) => set(s => ({ downloads: [d, ...s.downloads].slice(0, 200) })),

  updateDownload: (id, p) => set(s => ({
    downloads: s.downloads.map(d => d.id === id ? { ...d, ...p } : d),
  })),

  removeDownload: (id) => set(s => ({
    downloads: s.downloads.filter(d => d.id !== id),
  })),

  saveCustomPreset: (p) => set(s => {
    const next = [...s.customPresets.filter(x => x.id !== p.id), p]
    setTimeout(() => {
      if (window.onyx?.writeData) window.onyx.writeData('custom-presets.json', next)
    }, 0)
    return { customPresets: next }
  }),

  removeCustomPreset: (id) => set(s => {
    const next = s.customPresets.filter(p => p.id !== id)
    setTimeout(() => {
      if (window.onyx?.writeData) window.onyx.writeData('custom-presets.json', next)
    }, 0)
    return { customPresets: next }
  }),

  setSettings: (p) => set(s => {
    const next = { ...s.settings, ...p }
    if (p.theme && p.theme !== 'custom') {
      next.customColors = { ...THEMES[p.theme] }
    }
    setTimeout(() => persist({ ...get(), settings: next } as Store), 0)
    return { settings: next }
  }),

  setVimMode: (m) => set({ vimMode: m }),
  setPalette: (v) => set({ showPalette: v, paletteInput: '' }),
  setPaletteInput: (s) => set({ paletteInput: s }),
  setShowShortcuts: (v) => set({ showShortcuts: v }),
  setTabSearch: (v) => set({ showTabSearch: v }),
  setSessionGraph: (v) => set({ showSessionGraph: v }),
  triggerUrlBar: () => set(s => ({ focusUrlBar: s.focusUrlBar + 1 })),
  pushTrail: (id, entry) => set(s => {
    const trail = s.navTrails[id] ? [...s.navTrails[id], entry].slice(-50) : [entry]
    return { navTrails: { ...s.navTrails, [id]: trail } }
  }),
  setZoom: (id, zoom) => set(s => ({
    tabs: s.tabs.map(t => t.id === id ? { ...t, zoom: Math.min(3, Math.max(0.5, zoom)) } : t),
  })),
  setAuroraColor: (c) => set({ auroraColor: c }),
  setSidebar: (s) => set(st => ({ sidebarTab: st.sidebarTab === s ? null : s })),

  registerWv: (id, ref) => set(s => {
    const m = new Map(s.webviews); m.set(id, ref); return { webviews: m }
  }),
  unregisterWv: (id) => set(s => {
    const m = new Map(s.webviews); m.delete(id); return { webviews: m }
  }),

  navigateTo: (id, url) => {
    const s = get()
    const n = resolveUrl(url, s.settings)
    let host = ''
    try { host = new URL(n).hostname } catch {}
    if (host && s.settings.blockedSites.includes(host)) {
      get().updateTab(id, { url: `vox:blocked?host=${encodeURIComponent(host)}`, title: `Blocked: ${host}`, loading: false })
      return
    }
    if (s.settings.privateclick && /^https?:/i.test(n)) {
      const cur = s.tabs.find(t => t.id === id)
      let curHost = ''
      try { curHost = new URL(cur?.url || '').hostname } catch {}
      if (cur && !cur.incognito && curHost && curHost !== host) {
        get().addTab(n, cur.workspace, true)
        return
      }
    }
    get().updateTab(id, { url: n, loading: true })
  },

  toggleReader: () => {
    const s = get()
    const t = s.tabs.find(x => x.id === s.activeId)
    if (!t || t.url === 'about:blank' || t.url === 'vox:settings' || t.url === 'vox:store') return
    const reader = !t.reader
    set(st => ({ tabs: st.tabs.map(x => x.id === s.activeId ? { ...x, reader } : x) }))
    setTimeout(() => { const wv = get().webviews.get(get().activeId); if (wv?.reload) wv.reload() }, 60)
  },

  toggleFocus: () => {
    const s = get()
    const t = s.tabs.find(x => x.id === s.activeId)
    if (!t || t.url === 'about:blank' || t.url === 'vox:settings' || t.url === 'vox:store') return
    const focus = !t.focus
    set(st => ({ tabs: st.tabs.map(x => x.id === s.activeId ? { ...x, focus } : x) }))
  },

  searchSelection: async () => {
    const s = get()
    const wv = s.webviews.get(s.activeId)
    if (!wv) return
    let sel = ''
    try { sel = (await wv.executeJavaScript('window.getSelection().toString()')) || '' } catch {}
    if (sel && sel.trim()) {
      get().navigateTo(s.activeId, s.settings.searchUrl.replace('%s', encodeURIComponent(sel.trim())))
    }
  },

  setPageText: (id, text) => set(s => ({ pageTexts: { ...s.pageTexts, [id]: text ? text.slice(0, 4000) : '' } })),

  duplicateTab: (id) => {
    const s = get()
    const t = s.tabs.find(x => x.id === id)
    if (!t) return
    const nt = makeTab({ url: t.url, title: t.title, favicon: t.favicon, workspace: t.workspace, zoom: t.zoom })
    set(st => ({ tabs: [...st.tabs, nt], activeId: nt.id, showTabSearch: false }))
    persistNow()
  },

  closeDuplicates: () => {
    const s = get()
    const seen = new Set<string>()
    const remove = new Set<string>()
    for (const t of s.tabs) {
      if (t.url === 'about:blank') continue
      const k = `${t.workspace}|${t.url}`
      if (seen.has(k)) remove.add(t.id)
      else seen.add(k)
    }
    if (!remove.size) return
    let next = s.tabs.filter(t => !remove.has(t.id))
    if (!next.length) { const t = makeTab({ workspace: s.activeWorkspace }); next = [t] }
    const newActive = next.find(t => t.id === s.activeId) ? s.activeId : next[0].id
    set({ tabs: next, activeId: newActive })
    persistNow()
  },

  exportSettings: async () => {
    const s = get()
    try {
      const d = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const name = `vox-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`
      const data = JSON.stringify({ app: 'vox', version: 1, settings: s.settings, bookmarks: s.bookmarks, history: s.history }, null, 2)
      const path = await window.onyx?.saveBackup?.(name, data)
      if (path) window.onyx?.showInFolder?.(path)
    } catch {}
  },

  importSettings: async () => {
    try {
      const text = await window.onyx?.loadBackup?.()
      if (!text) return
      const data = JSON.parse(text)
      const merged = data && typeof data.settings === 'object' ? data.settings : null
      if (merged) get().setSettings({ ...merged, onboarded: true })
    } catch {}
  },

  addToReadList: (url, title) => {
    const s = get()
    if (!url || url === 'about:blank' || url === 'vox:settings' || url === 'vox:store') return
    if (s.settings.readList.some(r => r.url === url)) return
    get().setSettings({ readList: [...s.settings.readList, { url, title: title || url, addedAt: Date.now() }] })
  },

  removeFromReadList: (url) => {
    const s = get()
    get().setSettings({ readList: s.settings.readList.filter(r => r.url !== url) })
  },

  translatePage: () => {
    const s = get()
    const t = s.tabs.find(x => x.id === s.activeId)
    const u = t?.url && t.url !== 'about:blank' ? t.url : ''
    const tl = s.settings.language === 'ru' ? 'ru' : 'en'
    get().addTab(`https://translate.google.com/?sl=auto&tl=${tl}${u ? '&u=' + encodeURIComponent(u) : ''}`)
  },

  pushToast: (text) => {
    const id = Date.now() + Math.random()
    set(st => ({ toasts: [...st.toasts, { id, text }] }))
    setTimeout(() => {
      set(st => ({ toasts: st.toasts.filter(t => t.id !== id) }))
    }, 3800)
  },

  copyText: (s) => {
    try {
      if (window.onyx?.writeClipboard) window.onyx.writeClipboard(s)
      else if (navigator.clipboard?.writeText) navigator.clipboard.writeText(s).catch(() => {})
    } catch {}
    if (get().settings.cliphist) get().addClip(s)
    get().pushToast('Copied to clipboard')
  },

  addClip: (s) => {
    if (!s) return
    get().setSettings({ clipHistory: [s, ...get().settings.clipHistory.filter(x => x !== s)].slice(0, 30) })
  },

  sortTabs: () => {
    const st = get()
    const ws = st.activeWorkspace
    const group = st.tabs.filter(t => t.workspace === ws)
    const idx = st.tabs.map(t => t.id)
    const sorted = [...group].sort((a, b) => a.url.localeCompare(b.url))
    const sortedIds = sorted.map(t => t.id)
    const rest = st.tabs.filter(t => t.workspace !== ws).map(t => t.id)
    const order = [...rest, ...sortedIds]
    set({ tabs: order.map(id => st.tabs.find(t => t.id === id)!).filter(Boolean) })
  },

  groupByDomain: () => {
    const st = get()
    const ws = st.activeWorkspace
    const groups = st.tabs.filter(t => t.workspace === ws && !t.pinned)
    const dom = new Map<string, string>()
    for (const t of groups) {
      let host = ''
      try { host = new URL(t.url).hostname.replace(/^www\./, '') } catch {}
      if (!host) continue
      if (!dom.has(host)) {
        const gid = st.addGroup(host)
        dom.set(host, gid)
      }
      st.assignGroup(t.id, dom.get(host)!)
    }
  },

  muteAllTabs: () => {
    const st = get()
    const anyUnmuted = st.tabs.some(t => !t.muted)
    const next = st.tabs.map(t => ({ ...t, muted: anyUnmuted }))
    set({ tabs: next })
    st.webviews.forEach((wv, id) => {
      try { wv.setAudioMuted(anyUnmuted) } catch {}
    })
  },

  toggleMedia: () => {
    const st = get()
    const wv = st.webviews.get(st.activeId)
    if (!wv) return
    const js = `(function(){var v=document.querySelectorAll('video,audio');if(!v.length)return;var allPaused=true;for(var i=0;i<v.length;i++){if(!v[i].paused){allPaused=false;break}}for(var j=0;j<v.length;j++){if(allPaused){v[j].play().catch(function(){})}else{v[j].pause()}}}())`
    try { wv.executeJavaScript(js).catch(() => {}) } catch {}
  },

  saveSnapshot: (name) => {
    const st = get()
    const ws = st.activeWorkspace
    const tabs = st.tabs.filter(t => t.workspace === ws && t.url && t.url !== 'about:blank')
      .map(t => ({ url: t.url, title: t.title || t.url }))
    if (!tabs.length) return
    const snap = { id: String(Date.now()), name: name || `snap ${st.settings.snapshots.length + 1}`, at: Date.now(), tabs }
    get().setSettings({ snapshots: [...st.settings.snapshots, snap] })
    get().pushToast(`Snapshot saved: ${snap.name}`)
  },

  restoreSnapshot: (id) => {
    const st = get()
    const snap = st.settings.snapshots.find(x => x.id === id)
    if (!snap) return
    for (const t of snap.tabs) st.addTab(t.url)
    get().pushToast(`Restored: ${snap.name} (${snap.tabs.length} tabs)`)
  },

  removeSnapshot: (id) => {
    get().setSettings({ snapshots: get().settings.snapshots.filter(x => x.id !== id) })
  },

  addNote: (text) => {
    if (!text.trim()) return
    get().setSettings({ notes: [{ id: String(Date.now() + Math.random()), text: text.trim(), at: Date.now() }, ...get().settings.notes] })
  },

  removeNote: (id) => {
    get().setSettings({ notes: get().settings.notes.filter(n => n.id !== id) })
  },

  forgetSite: () => {
    const st = get()
    const t = st.tabs.find(x => x.id === st.activeId)
    if (!t?.url || t.url === 'about:blank') return
    let host = ''
    try { host = new URL(t.url).hostname } catch {}
    if (!host) return
    set({ history: st.history.filter(h => !h.url.includes(host)) })
    const origin = (() => { try { return new URL(t.url).origin } catch { return '' } })()
    if (origin && window.onyx?.clearSiteData) window.onyx.clearSiteData(origin).catch(() => {})
    get().pushToast(`Forget: ${host}`)
  },

  blockSite: () => {
    const st = get()
    const t = st.tabs.find(x => x.id === st.activeId)
    if (!t?.url || t.url === 'about:blank') return
    let host = ''
    try { host = new URL(t.url).hostname } catch {}
    if (!host) return
    const cur = st.settings.blockedSites
    if (!cur.includes(host)) {
      get().setSettings({ blockedSites: [...cur, host] })
      get().pushToast(`Blocked: ${host} (reload to apply)`)
    }
  },

  unblockSite: (domain) => {
    get().setSettings({ blockedSites: get().settings.blockedSites.filter(d => d !== domain) })
  },

  clearCacheNow: async () => {
    if (window.onyx?.clearCache) await window.onyx.clearCache().catch(() => {})
    get().pushToast('Cache cleared')
  },

  cookiesNow: async () => {
    if (window.onyx?.getCookies) return await window.onyx.getCookies().catch(() => []) || []
    return []
  },
}})

export { normalize }
