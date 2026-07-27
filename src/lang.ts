import type { Settings } from './types'

type Lang = 'en' | 'ru'

const strings: Record<Lang, Record<string, string>> = {
  en: {
    // Sidebar
    'sidebar.bookmarks': '★ Bookmarks',
    'sidebar.history': '⏱ History',
    'sidebar.settings': '⚙ Settings',
    'sidebar.noBookmarks': 'No bookmarks yet',
    'sidebar.noHistory': 'No history yet',
    'sidebar.clearHistory': 'Clear history',

    // Settings — Theme
    'theme': 'Theme',
    'theme.preset': 'Preset',
    'theme.background': 'Background',
    'theme.bgDim': 'BG Dim',
    'theme.bgLight': 'BG Light',
    'theme.foreground': 'Foreground',
    'theme.fgDim': 'FG Dim',
    'theme.border': 'Border',
    'theme.accent': 'Accent',
    'theme.green': 'Green',
    'theme.red': 'Red',
    'theme.orange': 'Orange',
    'theme.cyan': 'Cyan',
    'theme.purple': 'Purple',

    // Settings — Language
    'lang': 'Language',
    'lang.en': 'English',
    'lang.ru': 'Русский',

    // Settings — Font
    'font': 'Font',
    'font.family': 'Family',
    'font.size': 'Size',

    // Settings — Tab Bar
    'tabBar': 'Tab Bar',
    'tabBar.shape': 'Shape',
    'tabBar.height': 'Height',
    'tabBar.showClose': 'Close buttons',
    'tabBar.showFavicon': 'Favicon',
    'tabBar.showIndicator': 'Indicator dot',
    'tabBar.show': 'Show tab bar',

    // Settings — Status Bar
    'statusBar': 'Status Bar',
    'statusBar.height': 'Height',
    'statusBar.showMode': 'Mode indicator',
    'statusBar.showUrl': 'URL',
    'statusBar.showCount': 'Tab count',
    'statusBar.show': 'Show status bar',

    // Settings — Titlebar
    'titlebar': 'Title Bar',
    'titlebar.height': 'Height',

    // Settings — Workspace
    'workspace': 'Workspace',
    'workspace.position': 'Position',
    'workspace.position.top': 'Top',
    'workspace.position.bottom': 'Bottom',
    'workspace.show': 'Show workspace bar',

    // Settings — New Tab Page
    'ntp': 'New Tab Page',
    'ntp.clock': 'Clock',
    'ntp.date': 'Date',
    'ntp.search': 'Search',
    'ntp.quickLinks': 'Quick links',
    'ntp.background': 'Background color',

    // Settings — Visual
    'visual': 'Visual',
    'visual.borderRadius': 'Border radius',
    'visual.transition': 'Transition speed',
    'visual.tabOpacity': 'Tab opacity',

    // Settings — Behavior
    'behavior': 'Behavior',
    'behavior.vim': 'Vim keybindings',
    'behavior.darkReader': 'Dark Reader',
    'behavior.searchEngine': 'Search engine',
    'behavior.smoothScroll': 'Smooth scroll',
    'behavior.zenMode': 'Zen mode',
    'behavior.setDefault': 'Set as default browser',
    'behavior.openDefaultApps': 'Open default apps settings',
    'behavior.defaultSet': 'Default browser set!',
    'behavior.defaultOpen': 'Opening Windows settings...',

    // Tab shapes
    'shape.square': 'Square',
    'shape.rounded': 'Rounded',
    'shape.pill': 'Pill',
    'shape.trapezoid': 'Trapezoid',
    'shape.yandex': 'Yandex',
    'shape.wave': 'Wave',

    // Status bar
    'mode.normal': 'NORMAL',
    'mode.insert': 'INSERT',
    'mode.hint': 'HINT',
    'mode.command': 'CMD',
  },

  ru: {
    'sidebar.bookmarks': '★ Закладки',
    'sidebar.history': '⏱ История',
    'sidebar.settings': '⚙ Настройки',
    'sidebar.noBookmarks': 'Нет закладок',
    'sidebar.noHistory': 'Нет истории',
    'sidebar.clearHistory': 'Очистить историю',

    'theme': 'Тема',
    'theme.preset': 'Пресет',
    'theme.background': 'Фон',
    'theme.bgDim': 'Фон тёмный',
    'theme.bgLight': 'Фон светлый',
    'theme.foreground': 'Текст',
    'theme.fgDim': 'Текст тусклый',
    'theme.border': 'Граница',
    'theme.accent': 'Акцент',
    'theme.green': 'Зелёный',
    'theme.red': 'Красный',
    'theme.orange': 'Оранжевый',
    'theme.cyan': 'Голубой',
    'theme.purple': 'Фиолетовый',

    'lang': 'Язык',
    'lang.en': 'English',
    'lang.ru': 'Русский',

    'font': 'Шрифт',
    'font.family': 'Семейство',
    'font.size': 'Размер',

    'tabBar': 'Панель вкладок',
    'tabBar.shape': 'Форма',
    'tabBar.height': 'Высота',
    'tabBar.showClose': 'Кнопка закрытия',
    'tabBar.showFavicon': 'Favicon',
    'tabBar.showIndicator': 'Индикатор',
    'tabBar.show': 'Показать панель',

    'statusBar': 'Строка состояния',
    'statusBar.height': 'Высота',
    'statusBar.showMode': 'Индикатор режима',
    'statusBar.showUrl': 'URL',
    'statusBar.showCount': 'Счётчик вкладок',
    'statusBar.show': 'Показать строку',

    'titlebar': 'Заголовок',
    'titlebar.height': 'Высота',

    'workspace': 'Рабочее пространство',
    'workspace.position': 'Позиция',
    'workspace.position.top': 'Сверху',
    'workspace.position.bottom': 'Снизу',
    'workspace.show': 'Показать панель',

    'ntp': 'Страница новой вкладки',
    'ntp.clock': 'Часы',
    'ntp.date': 'Дата',
    'ntp.search': 'Поиск',
    'ntp.quickLinks': 'Быстрые ссылки',
    'ntp.background': 'Цвет фона',

    'visual': 'Визуал',
    'visual.borderRadius': 'Скругление углов',
    'visual.transition': 'Скорость анимации',
    'visual.tabOpacity': 'Прозрачность вкладок',

    'behavior': 'Поведение',
    'behavior.vim': 'Vim-сочетания клавиш',
    'behavior.darkReader': 'Dark Reader',
    'behavior.searchEngine': 'Поисковая система',
    'behavior.smoothScroll': 'Плавная прокрутка',
    'behavior.zenMode': 'Режим Zen',
    'behavior.setDefault': 'Сделать браузером по умолчанию',
    'behavior.openDefaultApps': 'Открыть настройки приложений по умолчанию',
    'behavior.defaultSet': 'Браузер установлен по умолчанию!',
    'behavior.defaultOpen': 'Открытие настроек Windows...',

    'shape.square': 'Квадрат',
    'shape.rounded': 'Скруглённые',
    'shape.pill': 'Капсула',
    'shape.trapezoid': 'Трапеция',
    'shape.yandex': 'Яндекс',
    'shape.wave': 'Волна',

    'mode.normal': 'НОРМА',
    'mode.insert': 'ВСТАВКА',
    'mode.hint': 'ПОДСКАЗКА',
    'mode.command': 'КОМАНДА',
  },
}

let currentLang: Lang = 'en'

export function t(key: string): string {
  return strings[currentLang]?.[key] || strings.en[key] || key
}

export function setLang(lang: string) {
  if (lang === 'en' || lang === 'ru') currentLang = lang
}

export function getLang(): Lang {
  return currentLang
}

export type { Lang }
