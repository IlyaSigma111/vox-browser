import { VimMode, VimKeyBinding } from '../types'

export const DEFAULT_BINDINGS: VimKeyBinding[] = [
  { key: 'j', command: 'scrollDown', mode: 'normal', description: 'Прокрутка вниз' },
  { key: 'k', command: 'scrollUp', mode: 'normal', description: 'Прокрутка вверх' },
  { key: 'h', command: 'scrollLeft', mode: 'normal', description: 'Прокрутка влево' },
  { key: 'l', command: 'scrollRight', mode: 'normal', description: 'Прокрутка вправо' },
  { key: 'f', command: 'hintMode', mode: 'normal', description: 'Режим подсказок' },
  { key: 'F', command: 'hintModeNewTab', mode: 'normal', description: 'Подсказки в новой вкладке' },
  { key: 'i', command: 'enterInsert', mode: 'normal', description: 'Режим вставки' },
  { key: ':', command: 'commandMode', mode: 'normal', description: 'Командный режим' },
  { key: 'Tab', command: 'nextTab', mode: 'normal', description: 'Следующая вкладка' },
  { key: 'Shift+Tab', command: 'prevTab', mode: 'normal', description: 'Предыдущая вкладка' },
  { key: 'x', command: 'closeTab', mode: 'normal', description: 'Закрыть вкладку' },
  { key: 'u', command: 'reopenTab', mode: 'normal', description: 'Восстановить вкладку' },
  { key: 'r', command: 'reload', mode: 'normal', description: 'Перезагрузить' },
  { key: 'R', command: 'hardReload', mode: 'normal', description: 'Жёсткая перезагрузка' },
  { key: 'g g', command: 'goToTop', mode: 'normal', description: 'В начало страницы' },
  { key: 'Shift+G', command: 'goToBottom', mode: 'normal', description: 'В конец страницы' },
  { key: '/', command: 'findOnPage', mode: 'normal', description: 'Поиск по странице' },
  { key: 'n', command: 'findNext', mode: 'normal', description: 'Следующее совпадение' },
  { key: 'N', command: 'findPrev', mode: 'normal', description: 'Предыдущее совпадение' },
  { key: 'o', command: 'openUrl', mode: 'normal', description: 'Открыть URL' },
  { key: 'O', command: 'openUrlNewTab', mode: 'normal', description: 'URL в новой вкладке' },
  { key: 'J', command: 'prevTab', mode: 'normal', description: 'Пред. вкладка' },
  { key: 'K', command: 'nextTab', mode: 'normal', description: 'След. вкладка' },
  { key: 'H', command: 'historyBack', mode: 'normal', description: 'Назад' },
  { key: 'L', command: 'historyForward', mode: 'normal', description: 'Вперёд' },
  { key: 'Shift+X', command: 'closeOtherTabs', mode: 'normal', description: 'Закрыть другие' },
  { key: 'g t', command: 'lastTab', mode: 'normal', description: 'Последняя вкладка' },
  { key: 'g b', command: 'toggleBookmarks', mode: 'normal', description: 'Закладки' },
  { key: 'g h', command: 'openHistory', mode: 'normal', description: 'История' },
  { key: 'g s', command: 'openSettings', mode: 'normal', description: 'Настройки' },
  { key: 'Escape', command: 'exitMode', mode: 'command', description: 'Выход' },
  { key: 'Escape', command: 'exitMode', mode: 'hint', description: 'Выход' },
  { key: 'Escape', command: 'exitInsert', mode: 'insert', description: 'Выход из вставки' },
  { key: 'Shift+A', command: 'enterInsertEnd', mode: 'normal', description: 'Вставка в конце' },
]

export interface HintLabel {
  label: string
  x: number
  y: number
  width: number
  height: number
  tagName: string
  index: number
}

export const HINT_CHARS = 'asdfghjkl'

export function generateHintLabels(count: number): string[] {
  const labels: string[] = []
  if (count <= HINT_CHARS.length) {
    for (let i = 0; i < count; i++) {
      labels.push(HINT_CHARS[i])
    }
  } else {
    for (const c1 of HINT_CHARS) {
      for (const c2 of HINT_CHARS) {
        labels.push(c1 + c2)
        if (labels.length >= count) return labels
      }
    }
  }
  return labels
}

export function parseCommand(input: string): { command: string; args: string[] } {
  const parts = input.trim().split(/\s+/)
  return {
    command: parts[0] || '',
    args: parts.slice(1),
  }
}

export interface CommandDef {
  name: string
  aliases: string[]
  description: string
  execute: (args: string[]) => void
}

export const BUILTIN_COMMANDS: { name: string; aliases: string[]; description: string }[] = [
  { name: 'tabnew', aliases: ['t', 'tabnew'], description: 'Новая вкладка' },
  { name: 'tabclose', aliases: ['tabclose', 'tabc'], description: 'Закрыть вкладку' },
  { name: 'tabnext', aliases: ['tabn', 'tn'], description: 'Следующая вкладка' },
  { name: 'tabprev', aliases: ['tabp', 'tp'], description: 'Предыдущая вкладка' },
  { name: 'close', aliases: ['q', 'close'], description: 'Закрыть вкладку' },
  { name: 'quit', aliases: ['q!', 'quit'], description: 'Закрыть вкладку' },
  { name: 'open', aliases: ['o', 'open', 'e'], description: 'Открыть URL' },
  { name: 'reload', aliases: ['reload'], description: 'Перезагрузить' },
  { name: 'stop', aliases: ['stop'], description: 'Остановить загрузку' },
  { name: 'history', aliases: ['history'], description: 'История' },
  { name: 'bookmarks', aliases: ['bookmarks', 'bm'], description: 'Закладки' },
  { name: 'downloads', aliases: ['downloads', 'dl'], description: 'Загрузки' },
  { name: 'settings', aliases: ['settings', 'set'], description: 'Настройки' },
  { name: 'devtools', aliases: ['devtools', 'dev'], description: 'Инструменты разработчика' },
  { name: 'back', aliases: ['back'], description: 'Назад' },
  { name: 'forward', aliases: ['forward'], description: 'Вперёд' },
  { name: 'newwindow', aliases: ['newwindow'], description: 'Новое окно' },
  { name: 'print', aliases: ['print'], description: 'Печать' },
  { name: 'find', aliases: ['find', '/'], description: 'Поиск по странице' },
  { name: 'set', aliases: ['set'], description: 'Настройка параметра' },
  { name: 'help', aliases: ['help', 'h'], description: 'Справка' },
]

export class VimEngine {
  private mode: VimMode = 'normal'
  private pendingKey = ''
  private modeChangeCallback: ((mode: VimMode) => void) | null = null
  private commandCallback: ((command: string) => void) | null = null
  private bindings: VimKeyBinding[] = [...DEFAULT_BINDINGS]

  onModeChange(cb: (mode: VimMode) => void) {
    this.modeChangeCallback = cb
  }

  onCommand(cb: (command: string) => void) {
    this.commandCallback = cb
  }

  setBindings(bindings: VimKeyBinding[]) {
    this.bindings = [...DEFAULT_BINDINGS, ...bindings]
  }

  getMode(): VimMode {
    return this.mode
  }

  getPendingKey(): string {
    return this.pendingKey
  }

  setMode(mode: VimMode) {
    this.mode = mode
    this.pendingKey = ''
    this.modeChangeCallback?.(mode)
  }

  handleKey(key: string, ctrlKey: boolean, shiftKey: boolean, altKey: boolean): boolean {
    if (this.mode === 'insert') {
      if (key === 'Escape') {
        this.setMode('normal')
        return true
      }
      return false
    }

    if (this.mode === 'command' || this.mode === 'hint') {
      return false
    }

    let fullKey = key
    if (ctrlKey) fullKey = `Ctrl+${key}`
    if (shiftKey && key.length === 1) fullKey = `Shift+${key}`
    if (altKey) fullKey = `Alt+${key}`

    if (this.pendingKey) {
      const combo = `${this.pendingKey} ${fullKey}`
      const binding = this.bindings.find(b => b.mode === 'normal' && b.key === combo)
      if (binding) {
        this.pendingKey = ''
        this.commandCallback?.(binding.command)
        return true
      }
      const partialMatch = this.bindings.some(b =>
        b.mode === 'normal' && (b.key.startsWith(combo) || combo.startsWith(b.key))
      )
      if (!partialMatch) {
        this.pendingKey = ''
        return false
      }
      this.pendingKey = combo
      return true
    }

    const binding = this.bindings.find(b => b.mode === 'normal' && b.key === fullKey)
    if (binding) {
      this.commandCallback?.(binding.command)
      return true
    }

    const hasPrefix = this.bindings.some(b =>
      b.mode === 'normal' && b.key.startsWith(fullKey) && b.key.includes(' ')
    )
    if (hasPrefix) {
      this.pendingKey = fullKey
      return true
    }

    if (/^[1-9]$/.test(key) && !ctrlKey && !shiftKey && !altKey) {
      this.commandCallback?.(`goToTab:${key}`)
      return true
    }

    return false
  }
}
