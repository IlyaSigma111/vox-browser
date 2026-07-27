<div align="center">

# Vox

**Keyboard-driven browser with Vim integration**

[Download](https://github.com/IlyaSigma111/vox-browser/releases/latest) · [Landing Page](https://ilyasigma111.github.io/vox-browser/) · [Source](https://github.com/IlyaSigma111/vox-browser)

</div>

---

## Features

- **Vim Keybindings** — hint mode (`f`), command palette (`:`), insert mode (`i`), scroll (`j`/`k`/`h`/`l`), all handled inside the page like Vimium
- **Zen Mode** — vertical sidebar with tabs, workspaces, groups. Toggle with `Ctrl+Shift+E`
- **Workspaces** — Hyperland-style workspaces with `Alt+1-9` switching
- **Tab Groups** — color, rename, collapse/expand, assign via context menu
- **9 Themes** — Tokyo Night, Dracula, Monokai, Nord, Solarized, Ayu, One Dark, Gruvbox, Custom
- **6 Tab Shapes** — Square, Rounded, Pill, Trapezoid, Yandex, Wave
- **Dark Reader** — built-in dark mode injection, toggle with `Ctrl+D`
- **Russian + English** — full UI localization
- **30+ Settings** — font, bar heights, border radius, animation speed, tab opacity, NTP background, search engine, workspace position, and more
- **Search Engine** — Google, Yandex, DuckDuckGo, Bing, Brave
- **Extensions** — drop Chrome extensions into `userData/extensions/`
- **Default Browser** — register as system browser from settings

## Screenshots

Open the browser, press `Ctrl+Shift+E` for Zen mode, or keep the classic horizontal tab bar.

## Install

### Windows

Download the installer from [Releases](https://github.com/IlyaSigma111/vox-browser/releases/latest) and run it.

### Build from source

```bash
git clone https://github.com/IlyaSigma111/vox-browser.git
cd vox-browser
npm install
npm run start
```

### Package installer

```bash
npm run dist
```

Output will be in `release/`.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `f` | Hint mode — follow links |
| `i` | Insert mode |
| `:` | Command palette |
| `j` / `k` | Scroll down / up |
| `h` / `l` | Scroll left / right |
| `d` / `u` | Half-page down / up |
| `gg` / `G` | Go to top / bottom |
| `r` | Reload page |
| `H` / `L` | History back / forward |
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close tab |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Ctrl+D` | Toggle Dark Reader |
| `Ctrl+Shift+E` | Toggle Zen mode |
| `Alt+1-9` | Switch workspace |

## Architecture

- **Electron** — Chromium shell, frameless window, CSP override for extensions
- **React + Zustand** — UI layer, state management
- **Vim Engine** — injected into every `<webview>` via preload script (Vimium architecture, capture-phase keydown)
- **Workspaces** — per-workspace tab isolation, persisted to `workspace-state.json`
- **Settings** — persisted to `settings.json`, restored on startup

## Project Structure

```
browser/
├── electron/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Main window preload (IPC bridge)
│   └── webview-preload.js   # Webview preload (vim engine injection)
├── src/
│   ├── App.tsx              # Root layout + keyboard shortcuts
│   ├── store.ts             # Zustand store (tabs, workspaces, settings)
│   ├── types.ts             # TypeScript types
│   ├── lang.ts              # i18n (ru/en)
│   ├── components/
│   │   ├── WebContent.tsx   # Webview wrapper + vim/darkreader injection
│   │   ├── TabBar.tsx       # Horizontal tab bar (classic mode)
│   │   ├── ZenSidebar.tsx   # Vertical sidebar (zen mode)
│   │   ├── Sidebar.tsx      # Settings/bookmarks/history panel
│   │   ├── StatusBar.tsx    # Bottom bar (mode, URL, controls)
│   │   ├── CommandPalette.tsx
│   │   ├── HintOverlay.tsx
│   │   └── NewTabPage.tsx   # Clock, search, quick links
│   └── vim/
│       ├── engine.ts        # VimEngine class (command parsing)
│       ├── hints.ts         # Hint scripts
│       └── webview-engine.js
├── landing/                 # GitHub Pages landing page
├── build/                   # App icons
└── vite.config.ts
```

## License

MIT
