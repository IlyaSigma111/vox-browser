import { create } from 'zustand'
import type { Tab, TabGroup, Workspace, Bookmark, HistoryEntry, Download, Settings, VimMode, ThemePreset, ThemeColors } from './types'
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

function makeTab(over?: Partial<Tab>): Tab {
  return {
    id: uid(), url: 'about:blank', title: 'New tab',
    favicon: '', loading: false, pinned: false,
    groupId: null, workspace: 1, ...over,
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
  sidebarTab: 'bookmarks' | 'history' | 'downloads' | 'settings' | null
  webviews: Map<string, any>
  customPresets: UIPreset[]

  addTab: (url?: string, workspace?: number) => string
  closeTab: (id: string) => void
  activate: (id: string) => void
  updateTab: (id: string, p: Partial<Tab>) => void
  moveTab: (a: number, b: number) => void

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

  addHistory: (h: Omit<HistoryEntry, 'id' | 'visitedAt'>) => void
  clearHistory: () => void

  addDownload: (d: Download) => void
  updateDownload: (id: string, p: Partial<Download>) => void

  saveCustomPreset: (p: UIPreset) => void
  removeCustomPreset: (id: string) => void

  setSettings: (p: Partial<Settings>) => void
  setVimMode: (m: VimMode) => void
  setPalette: (v: boolean) => void
  setPaletteInput: (s: string) => void
  setSidebar: (s: 'bookmarks' | 'history' | 'downloads' | 'settings' | null) => void

  registerWv: (id: string, ref: any) => void
  unregisterWv: (id: string) => void
  navigateTo: (id: string, url: string) => void
}

const defaultSettings: Settings = {
  homepage: 'about:blank',
  searchEngine: 'Google',
  searchUrl: 'https://www.google.com/search?q=%s',
  vimEnabled: true,
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

  smoothScroll: true,
  restoreTabs: false,
  confirmClose: false,
  zenMode: false,
}

function persist(store: Store) {
  try {
    if (window.onyx?.writeData) {
      window.onyx.writeData('settings.json', store.settings)
      // Save tab state (strip webview refs)
      const tabsToSave = store.tabs.map(t => ({
        id: t.id, url: t.url, title: t.title, favicon: t.favicon,
        pinned: t.pinned, groupId: t.groupId, workspace: t.workspace,
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
    sidebarTab: null as 'bookmarks' | 'history' | 'downloads' | 'settings' | null,
    webviews: new Map<string, any>(),
    customPresets: [] as UIPreset[],
  }

  window.onyx?.readData?.('settings.json', null).then((data: any) => {
    if (data && typeof data === 'object') {
      set({ settings: { ...defaultSettings, ...data, customColors: { ...defaultSettings.customColors, ...data.customColors } } })
      if (data.language) setLang(data.language)
    }
  }).catch(() => {})

  window.onyx?.readData?.('workspace-state.json', null).then((data: any) => {
    if (data && typeof data === 'object') {
      const restored: any = {
        groups: data.groups || [],
        workspaces: data.workspaces || defaultWorkspaces,
        activeWorkspace: data.activeWorkspace || 1,
      }
      if (data.tabs && Array.isArray(data.tabs) && data.tabs.length > 0) {
        restored.tabs = data.tabs.map((t: any) => ({
          id: t.id || uid(), url: t.url || 'about:blank', title: t.title || 'New tab',
          favicon: t.favicon || '', loading: false, pinned: t.pinned || false,
          groupId: t.groupId || null, workspace: t.workspace || 1,
        }))
        restored.activeId = data.activeId || restored.tabs[0].id
      }
      set(restored)
    }
  }).catch(() => {})

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

  addTab: (url, ws) => {
    const s = get()
    const workspace = ws ?? s.activeWorkspace
    const t = makeTab(url ? { url: normalize(url, s.settings.searchUrl), title: url, workspace } : { workspace })
    set(st => ({ tabs: [...st.tabs, t], activeId: t.id }))
    persistNow()
    return t.id
  },

  closeTab: (id) => {
    set(s => {
      const next = s.tabs.filter(t => t.id !== id)
      if (!next.length) { const t = makeTab({ workspace: s.activeWorkspace }); return { tabs: [t], activeId: t.id } }
      return {
        tabs: next,
        activeId: s.activeId === id ? next[Math.min(s.tabs.findIndex(x => x.id === id), next.length - 1)].id : s.activeId,
      }
    })
    persistNow()
  },

  activate: (id) => set({ activeId: id }),

  updateTab: (id, p) => set(s => {
    const next = { tabs: s.tabs.map(t => t.id === id ? { ...t, ...p } : t) }
    if (p.url) persistNow()
    return next
  }),

  moveTab: (a, b) => set(s => {
    const tabs = [...s.tabs]; const [m] = tabs.splice(a, 1); tabs.splice(b, 0, m); return { tabs }
  }),

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
  setSidebar: (s) => set(st => ({ sidebarTab: st.sidebarTab === s ? null : s })),

  registerWv: (id, ref) => set(s => {
    const m = new Map(s.webviews); m.set(id, ref); return { webviews: m }
  }),
  unregisterWv: (id) => set(s => {
    const m = new Map(s.webviews); m.delete(id); return { webviews: m }
  }),

  navigateTo: (id, url) => {
    const s = get()
    const n = normalize(url, s.settings.searchUrl)
    get().updateTab(id, { url: n, loading: true })
  },
}})

export { normalize }
