import type { Settings } from './types'

export type FeatureId =
  | 'vim' | 'palette' | 'darkreader' | 'aurora' | 'expose' | 'grep' | 'pip' | 'trail'
  | 'sleep' | 'lens' | 'incognito' | 'shots' | 'smooth' | 'zen' | 'chrome'
  | 'reader' | 'focus' | 'night' | 'adblock' | 'aliases' | 'clipboard' | 'select'
  | 'readtime' | 'tabcolors' | 'duplicate' | 'dedupe' | 'backup' | 'readlist' | 'translator' | 'pomodoro'
  // v1.3.0 — 100 new
  | 'grayscale' | 'sepia' | 'contrast' | 'dim' | 'invert' | 'maxcol' | 'serif' | 'leading'
  | 'bigtext' | 'imgdim' | 'linkhl' | 'fontsmooth' | 'vidhide' | 'commenthide' | 'stickykill'
  | 'hidedistract' | 'readingbar' | 'tabgrad' | 'roundui' | 'density' | 'glowui' | 'ntpgrad'
  | 'ntpquote' | 'amoled' | 'duotone' | 'twocolreader' | 'justify' | 'hyphen' | 'paraspace'
  | 'webfont' | 'codefont' | 'scrollmem' | 'wordcount' | 'toc' | 'nightauto' | 'hidecookie'
  | 'clock' | 'timer' | 'sessiontime' | 'copyurl' | 'copyalltabs' | 'yankmd' | 'yanktitle'
  | 'calc' | 'units' | 'baseconv' | 'pwgen' | 'uuid' | 'colorparse' | 'wc' | 'stats'
  | 'sorturl' | 'groupby' | 'muteall' | 'mediactl' | 'qrcode' | 'tabage' | 'unreaddot'
  | 'taboverflow' | 'snap' | 'cliphist'
  | 'spellcheck' | 'autoplay' | 'tts' | 'watch' | 'formfill' | 'searchsite' | 'findregex'
  | 'themeauto' | 'savemd' | 'savepdf' | 'printclean' | 'emoji' | 'translit' | 'slugify'
  | 'caseconv' | 'hash' | 'b64' | 'urlenc' | 'jsonfmt' | 'openselection' | 'quicknote'
  | 'refstrip' | 'ua' | 'webrtc' | 'cookiekill' | 'noautofill' | 'autodelete' | 'imagelite'
  | 'trackhide' | 'privateclick' | 'fingerprint' | 'historyoff' | 'trailoff' | 'forgetsite'
  | 'siteblock' | 'dnt' | 'cleanurl' | 'blockpop' | 'cacheclear' | 'cookieview'
  // v1.5 — dynamic island + vibes
  | 'dynamicisland' | 'cursorglow' | 'docklift'

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

export const LATEST_FEATURE_VERSION = 4

export const FEATURES: StoreFeature[] = [
  // ─── Управление ────────────────────────────────
  { id: 'vim', icon: '⌨️', name: 'Vim-движок', desc: 'j/k/h/l — скролл, gg/G — вверх/вниз, H/L — история. Веб как Vim.', cat: 'Управление', hotkey: 'j · k · gg · G', size: '1.2 МБ', downloads: '12 408', key: 'vimEnabled' },
  { id: 'palette', icon: '🛠', name: 'Командная строка', desc: 'Жми ":" — команды и переходы без мыши: :tabnew, :reload, :history.', cat: 'Управление', hotkey: ':', size: '240 КБ', downloads: '9 876', key: 'palette' },
  { id: 'select', icon: '🔎', name: 'Поиск выделенного', desc: 'Выдели текст на странице и ищи его в поисковике в один клик.', cat: 'Управление', hotkey: 'кнопка', size: '90 КБ', downloads: '5 120', key: 'selectSearch' },
  { id: 'clipboard', icon: '📋', name: 'Открыть из буфера', desc: 'Ctrl+Shift+V открывает скопированный URL без переключения окон.', cat: 'Управление', hotkey: 'Ctrl+Shift+V', size: '60 КБ', downloads: '3 944', key: 'clipboard' },
  { id: 'duplicate', icon: '📑', name: 'Дубликат вкладки', desc: 'Копия текущей вкладки по Ctrl+Shift+J или из контекстного меню.', cat: 'Управление', hotkey: 'Ctrl+Shift+J', size: '30 КБ', downloads: '7 301', key: 'duplicate' },
  { id: 'aliases', icon: '⚡', name: 'URL-алиасы', desc: 'yt → youtube.com, gh → github.com. Свои алиасы — в настройках.', cat: 'Управление', hotkey: 'yt', size: '110 КБ', downloads: '6 522', key: 'aliases' },
  { id: 'clock', icon: '🕐', name: 'Часы в статусбаре', desc: 'Время и дата всегда перед глазами — не нужно отвлекаться от клавиатуры.', cat: 'Управление', hotkey: 'статусбар', size: '12 КБ', downloads: '9 104', key: 'clock' },
  { id: 'timer', icon: '⏲', name: 'Таймер на любой срок', desc: 'Свой интервал (не только 25/5): вводи минуты в статусбаре.', cat: 'Управление', hotkey: 'статусбар', size: '28 КБ', downloads: '6 550', key: 'timer' },
  { id: 'sessiontime', icon: '⏱', name: 'Время сессии', desc: 'Сколько минут уже сидишь в этом запуске — для честности перед собой.', cat: 'Управление', hotkey: 'статусбар', size: '10 КБ', downloads: '4 902', key: 'sessiontime' },
  { id: 'copyurl', icon: '🔗', name: 'Копировать URL', desc: 'URL текущей вкладки в буфер одной кнопкой. Без переключения окон.', cat: 'Управление', hotkey: 'Ctrl+Shift+Y', size: '18 КБ', downloads: '11 320', key: 'copyurl' },
  { id: 'copyalltabs', icon: '🗂', name: 'Все URL разом', desc: 'Скопировать адреса всех вкладок списком — готово для экспорта или заметки.', cat: 'Управление', hotkey: 'Ctrl+Shift+K', size: '22 КБ', downloads: '3 718', key: 'copyalltabs' },
  { id: 'yankmd', icon: '🧷', name: 'Ссылка в Markdown', desc: 'Копирует [заголовок](url) — для статей, README и заметок на лету.', cat: 'Управление', hotkey: ':yank', size: '15 КБ', downloads: '5 811', key: 'yankmd' },
  { id: 'yanktitle', icon: '🏷', name: 'Скопировать заголовок', desc: 'Заголовок страницы в буфер — для списков, ТЗ и почты.', cat: 'Управление', hotkey: 'Ctrl+Shift+U', size: '12 КБ', downloads: '3 440', key: 'yanktitle' },
  { id: 'calc', icon: '🧮', name: 'Калькулятор в палитре', desc: 'Набери :2+2*3 — мгновенный ответ. С процентами и степенями.', cat: 'Управление', hotkey: ':выражение', size: '20 КБ', downloads: '14 088', key: 'calc' },
  { id: 'units', icon: '📏', name: 'Конвертер единиц', desc: ':units 5km in mi, :units 30c in f. Длина, масса, температура, объём.', cat: 'Управление', hotkey: ':units', size: '34 КБ', downloads: '4 276', key: 'units' },
  { id: 'baseconv', icon: '🔢', name: 'Системы счисления', desc: ':hex 255 → ff, :bin 13 → 1101, :oct 8 → 10. Для debug и не только.', cat: 'Управление', hotkey: ':hex', size: '16 КБ', downloads: '2 845', key: 'baseconv' },
  { id: 'pwgen', icon: '🎲', name: 'Генератор паролей', desc: ':pwgen 20 — стойкий пароль сразу в буфер. Символы на выбор.', cat: 'Управление', hotkey: ':pwgen', size: '18 КБ', downloads: '13 577', key: 'pwgen' },
  { id: 'uuid', icon: '🔖', name: 'UUID на лету', desc: ':uuid копирует v4 — для тестов, БД и уникальных id.', cat: 'Управление', hotkey: ':uuid', size: '8 КБ', downloads: '3 109', key: 'uuid' },
  { id: 'colorparse', icon: '🎨', name: 'Цветовой помощник', desc: ':color #7aa2f7 → rgb/hsl и мини-превью. Разбор любого формата.', cat: 'Управление', hotkey: ':color', size: '24 КБ', downloads: '2 603', key: 'colorparse' },
  { id: 'wc', icon: '🔤', name: 'Счётчик слов', desc: ':wc — слова и символы на странице. Как у редакторов кода.', cat: 'Управление', hotkey: ':wc', size: '12 КБ', downloads: '5 044', key: 'wc' },
  { id: 'stats', icon: '📊', name: 'Статистика страницы', desc: ':stats — сколько ссылок, картинок и заголовков на странице.', cat: 'Управление', hotkey: ':stats', size: '20 КБ', downloads: '2 390', key: 'stats' },
  { id: 'sorturl', icon: '↕️', name: 'Сортировка вкладок', desc: ':sorturl — по алфавиту адресов. Долой хаос.', cat: 'Управление', hotkey: ':sorturl', size: '22 КБ', downloads: '3 521', key: 'sorturl' },
  { id: 'groupby', icon: '🗃', name: 'Группы по доменам', desc: ':groupby — каждая группа вкладок = один домен. Авто-группировка.', cat: 'Управление', hotkey: ':groupby', size: '30 КБ', downloads: '4 830', key: 'groupby' },
  { id: 'muteall', icon: '🔇', name: 'Заглушить все', desc: 'Один клик — тишина во всех вкладках. Полезно при фоновой музыке.', cat: 'Управление', hotkey: 'кнопка', size: '14 КБ', downloads: '7 655', key: 'muteall' },
  { id: 'mediactl', icon: '▶️', name: 'Управление медиа', desc: 'Пауза/плей всех видео и музыки на странице одной кнопкой.', cat: 'Управление', hotkey: 'кнопка', size: '16 КБ', downloads: '6 012', key: 'mediactl' },
  { id: 'qrcode', icon: '▦', name: 'QR страницы', desc: 'Код текущего URL — открыть на телефоне за секунду.', cat: 'Управление', hotkey: 'кнопка', size: '60 КБ', downloads: '8 944', key: 'qrcode' },
  { id: 'tabage', icon: '🕰', name: 'Возраст вкладки', desc: 'Подпись «12 мин» на вкладке — как долго она открыта.', cat: 'Управление', size: '10 КБ', downloads: '1 989', key: 'tabage' },
  { id: 'unreaddot', icon: '⚫', name: 'Точка непрочитанного', desc: 'Фоновая вкладка, в которой появился новый контент, получает точку.', cat: 'Управление', size: '16 КБ', downloads: '4 372', key: 'unreaddot' },
  { id: 'taboverflow', icon: '⇄', name: 'Скролл вкладок', desc: 'Вкладки больше не сжимаются — бар прокручивается как полоса.', cat: 'Управление', size: '20 КБ', downloads: '3 018', key: 'taboverflow' },
  { id: 'snap', icon: '📸', name: 'Снапшоты вкладок', desc: ':snap save work, :snap restore — сохраняй и возвращай целые наборы вкладок.', cat: 'Управление', hotkey: ':snap', size: '45 КБ', downloads: '5 690', key: 'snap' },
  { id: 'cliphist', icon: '📑', name: 'История буфера', desc: 'Каждое копирование запоминается. :clip — список, клик возвращает в буфер.', cat: 'Управление', hotkey: ':clip', size: '40 КБ', downloads: '9 207', key: 'cliphist' },
  { id: 'scrollmem', icon: '🧭', name: 'Память скролла', desc: 'Возвращаясь на сайт, встаёшь ровно туда, где остановился. На каждый домен.', cat: 'Управление', size: '26 КБ', downloads: '6 845', key: 'scrollmem' },
  { id: 'wordcount', icon: '🔠', name: 'Счётчик слов на странице', desc: 'Маленький бейдж «1 240 слов» на странице — для рерайтеров и копирайтеров.', cat: 'Управление', size: '14 КБ', downloads: '3 334', key: 'wordcount' },
  { id: 'toc', icon: '📋', name: 'Оглавление страницы', desc: 'Плавающая кнопка собирает оглавление из заголовков — прыгай по разделам.', cat: 'Управление', hotkey: 'кнопка', size: '38 КБ', downloads: '4 126', key: 'toc' },

  // ─── Оформление ────────────────────────────────
  { id: 'aurora', icon: '🎨', name: 'Aurora', desc: 'Акцент интерфейса подстраивается под цвет открытой страницы.', cat: 'Оформление', size: '480 КБ', downloads: '8 230', key: 'aurora' },
  { id: 'reader', icon: '📖', name: 'Reader Mode', desc: 'Одна чистая статья без рекламы и меню — кнопка в тулбаре.', cat: 'Оформление', hotkey: 'кнопка', size: '320 КБ', downloads: '11 045', key: 'reader' },
  { id: 'focus', icon: '🎯', name: 'Focus Mode', desc: 'Затемняет всё, кроме статьи: сосредоточься на главном.', cat: 'Оформление', hotkey: 'кнопка', size: '140 КБ', downloads: '4 877', key: 'focus' },
  { id: 'night', icon: '🌆', name: 'Ночная подсветка', desc: 'Тёплый фильтр вечером — меньше синего, легче глазам.', cat: 'Оформление', hotkey: 'кнопка', size: '70 КБ', downloads: '9 401', key: 'nightShift' },
  { id: 'tabcolors', icon: '🌈', name: 'Цвета вкладок', desc: 'Каждый домен получает свой цвет — видно с одного взгляда.', cat: 'Оформление', size: '50 КБ', downloads: '6 098', key: 'tabColors' },
  { id: 'zen', icon: '🧘', name: 'Zen-режим', desc: 'Сверхминимализм: только вкладки и страница. Ctrl+\\.', cat: 'Оформление', hotkey: 'Ctrl+\\', size: '210 КБ', downloads: '10 332', key: 'zenMode' },
  { id: 'chrome', icon: '🧭', name: 'Browser Chrome', desc: 'Классическая панель навигации сверху: назад/вперёд/URL.', cat: 'Оформление', hotkey: 'кнопка', size: '380 КБ', downloads: '7 655', key: 'browserChrome' },
  { id: 'smooth', icon: '🌊', name: 'Плавный скролл', desc: 'Мягкая прокрутка страниц вместо резких прыжков.', cat: 'Оформление', size: '20 КБ', downloads: '13 210', key: 'smoothScroll' },
  { id: 'grayscale', icon: '⚫', name: 'Ч/б страницы', desc: 'Весь веб в градациях серого. Для режима «не отвлекаюсь».', cat: 'Оформление', size: '8 КБ', downloads: '2 812', key: 'grayscale' },
  { id: 'sepia', icon: '🟤', name: 'Сепия', desc: 'Тёплый старинный фильтр — приятнее читать долгие тексты.', cat: 'Оформление', size: '8 КБ', downloads: '2 350', key: 'sepia' },
  { id: 'contrast', icon: '◐', name: 'Контраст', desc: 'Усиливает контраст и сочность цветов. Помогает на блёклых экранах.', cat: 'Оформление', size: '8 КБ', downloads: '1 977', key: 'contrast' },
  { id: 'dim', icon: '🌗', name: 'Приглушить страницу', desc: 'Снижает яркость сайта — спасает глаза вечером без полного инверта.', cat: 'Оформление', size: '8 КБ', downloads: '3 466', key: 'dim' },
  { id: 'invert', icon: '🔄', name: 'Инверсия', desc: 'Полный тёмный режим даже на сайтах, где его нет.', cat: 'Оформление', size: '10 КБ', downloads: '7 240', key: 'invert' },
  { id: 'maxcol', icon: '⊞', name: 'Колонка чтения', desc: 'Контент центрируется и сужается до удобной ширины — не разлетается на весь экран.', cat: 'Оформление', size: '12 КБ', downloads: '5 088', key: 'maxcol' },
  { id: 'serif', icon: '✒️', name: 'Серифный шрифт', desc: 'Заменяет шрифт сайта на книжный — тексты читаются как в книге.', cat: 'Оформление', size: '10 КБ', downloads: '3 014', key: 'serif' },
  { id: 'leading', icon: '⇵', name: 'Просторный текст', desc: 'Увеличивает межстрочный интервал — вёрстке становится легче дышать.', cat: 'Оформление', size: '8 КБ', downloads: '2 645', key: 'leading' },
  { id: 'bigtext', icon: '🔍', name: 'Крупнее текст', desc: 'База страниц увеличивается — удобно на большом экране и при слабом зрении.', cat: 'Оформление', size: '8 КБ', downloads: '2 201', key: 'bigtext' },
  { id: 'imgdim', icon: '🌫', name: 'Приглушить фото', desc: 'Снижает яркость изображений — меньше бликов на белых сайтах.', cat: 'Оформление', size: '8 КБ', downloads: '1 744', key: 'imgdim' },
  { id: 'linkhl', icon: '🔵', name: 'Подсветить ссылки', desc: 'Все ссылки становятся явно синими и подчёркнутыми — видна структура.', cat: 'Оформление', size: '8 КБ', downloads: '2 140', key: 'linkhl' },
  { id: 'fontsmooth', icon: '🖋', name: 'Чёткий шрифт', desc: 'Антиалиасинг и лигатуры на всех сайтах — текст как в дизайне.', cat: 'Оформление', size: '8 КБ', downloads: '1 902', key: 'fontsmooth' },
  { id: 'vidhide', icon: '🚫', name: 'Спрятать видео', desc: 'Прячет все видеоплееры — страница без роликов.', cat: 'Оформление', size: '8 КБ', downloads: '1 655', key: 'vidhide' },
  { id: 'commenthide', icon: '💬', name: 'Скрыть комментарии', desc: 'Убирает блоки комментариев на новостях и форумах.', cat: 'Оформление', size: '22 КБ', downloads: '5 098', key: 'commenthide' },
  { id: 'stickykill', icon: '📍', name: 'Отклеить шапки', desc: '«Прилипшие» меню и баннеры перестают следовать за скроллом.', cat: 'Оформление', size: '18 КБ', downloads: '3 740', key: 'stickykill' },
  { id: 'hidedistract', icon: '🎭', name: 'Убрать ленты', desc: 'Скрывает рекомендации, «похожее», ленты и виджеты «вам может понравиться».', cat: 'Оформление', size: '26 КБ', downloads: '6 311', key: 'hidedistract' },
  { id: 'readingbar', icon: '📈', name: 'Прогресс чтения', desc: 'Тонкая линия сверху показывает, сколько статьи уже прочитано.', cat: 'Оформление', size: '14 КБ', downloads: '7 902', key: 'readingbar' },
  { id: 'tabgrad', icon: '🌄', name: 'Градиентные вкладки', desc: 'Вкладки окрашиваются градиентом — красиво и различимо.', cat: 'Оформление', size: '20 КБ', downloads: '2 830', key: 'tabgrad' },
  { id: 'roundui', icon: '🫧', name: 'Скруглённый UI', desc: 'Более мягкие углы у кнопок, панелей и вкладок.', cat: 'Оформление', size: '12 КБ', downloads: '3 944', key: 'roundui' },
  { id: 'density', icon: '▦', name: 'Компактный UI', desc: 'Меньше отступов и воздуха — больше контента на экране.', cat: 'Оформление', size: '14 КБ', downloads: '4 455', key: 'density' },
  { id: 'glowui', icon: '✨', name: 'Неоновое свечение', desc: 'Акценты интерфейса светятся — Vox на стероидах.', cat: 'Оформление', size: '16 КБ', downloads: '3 102', key: 'glowui' },
  { id: 'ntpgrad', icon: '🌌', name: 'Живой фон NTP', desc: 'Медленно переливающийся градиент на странице новой вкладки.', cat: 'Оформление', size: '20 КБ', downloads: '6 720', key: 'ntpgrad' },
  { id: 'ntpquote', icon: '💡', name: 'Цитата дня', desc: 'Случайная мудрая фраза на стартовой странице — по клавише G.', cat: 'Оформление', size: '12 КБ', downloads: '4 018', key: 'ntpquote' },
  { id: 'amoled', icon: '⬛', name: 'AMOLED-тема', desc: 'Глубокий чёрный интерфейс — экономит батарею на OLED.', cat: 'Оформление', size: '10 КБ', downloads: '8 844', key: 'amoled' },
  { id: 'duotone', icon: '🌓', name: 'Дуотон-фильтр', desc: 'Стильный двухцветный фильтр страниц — необычно и красиво.', cat: 'Оформление', size: '8 КБ', downloads: '1 280', key: 'duotone' },
  { id: 'twocolreader', icon: '⫲', name: 'Текст в 2 колонки', desc: 'Статьи верстаются в две колонки — читай как газету.', cat: 'Оформление', size: '16 КБ', downloads: '1 733', key: 'twocolreader' },
  { id: 'justify', icon: '↔', name: 'Выравнивание текста', desc: 'Текст по ширине — аккуратная вёрстка на любом сайте.', cat: 'Оформление', size: '8 КБ', downloads: '1 502', key: 'justify' },
  { id: 'hyphen', icon: '✂️', name: 'Переносы', desc: 'Русские и английские переносы слов — нет «дыр» в тексте.', cat: 'Оформление', size: '8 КБ', downloads: '1 244', key: 'hyphen' },
  { id: 'paraspace', icon: '␥', name: 'Воздух между абзацами', desc: 'Добавляет отступы между абзацами — тексты читаются легче.', cat: 'Оформление', size: '8 КБ', downloads: '1 618', key: 'paraspace' },
  { id: 'webfont', icon: '🔤', name: 'Свой шрифт веба', desc: 'Все сайты используют выбранный тобой шрифт (задаётся в настройках).', cat: 'Оформление', size: '16 КБ', downloads: '2 090', key: 'webfont' },
  { id: 'codefont', icon: '💻', name: 'Моно-код', desc: 'Блоки кода на всех сайтах — в моноширинном шрифте с переносами.', cat: 'Оформление', size: '10 КБ', downloads: '2 555', key: 'codefont' },

  // ─── Умные ─────────────────────────────────────
  { id: 'expose', icon: '🔲', name: 'Tab Exposé', desc: 'Все вкладки сеткой на одном экране с живым поиском. Ctrl+Shift+A.', cat: 'Умные', hotkey: 'Ctrl+Shift+A', size: '1.1 МБ', downloads: '8 911', key: 'expose' },
  { id: 'grep', icon: '🔍', name: 'Grep по истории', desc: 'Полнотекстовый поиск по всему, что ты читал. Ctrl+Shift+F.', cat: 'Умные', hotkey: 'Ctrl+Shift+F', size: '2.4 МБ', downloads: '6 208', key: 'grep' },
  { id: 'trail', icon: '🗺', name: 'Session Trail', desc: 'Граф навигации: куда вёл каждый клик. Ctrl+Shift+G.', cat: 'Умные', hotkey: 'Ctrl+Shift+G', size: '520 КБ', downloads: '5 553', key: 'trail' },
  { id: 'lens', icon: '🔭', name: 'Site Lenses', desc: 'Свои настройки под сайты: масштаб, тёмный режим, vim на конкретном домене.', cat: 'Умные', size: '160 КБ', downloads: '4 410', key: 'lens' },
  { id: 'readtime', icon: '⏱', name: 'Время чтения', desc: 'Оценка «≈ 7 мин» в статусбаре — сразу видно, стоит ли читать.', cat: 'Умные', size: '40 КБ', downloads: '3 702', key: 'readTime' },
  { id: 'readlist', icon: '📚', name: 'Список чтения', desc: 'Сохраняй статьи на потом одним кликом. Потом — в сайдбаре.', cat: 'Умные', hotkey: 'кнопка', size: '95 КБ', downloads: '9 884', key: 'readlist' },
  { id: 'translator', icon: '🌐', name: 'Перевод страницы', desc: 'Открывает страницу в Google Translate целиком, в новой вкладке.', cat: 'Умные', hotkey: 'кнопка', size: '55 КБ', downloads: '7 117', key: 'translator' },
  { id: 'pomodoro', icon: '🍅', name: 'Помодоро', desc: 'Таймер 25/5 прямо в статусбаре. Фокусируйся.', cat: 'Умные', hotkey: 'кнопка', size: '35 КБ', downloads: '12 004', key: 'pomodoro' },
  { id: 'spellcheck', icon: '✅', name: 'Проверка орфографии', desc: 'Включает проверку в любых полях на любых сайтах.', cat: 'Умные', size: '12 КБ', downloads: '2 918', key: 'spellcheck' },
  { id: 'autoplay', icon: '⏸', name: 'Блок авто-видео', desc: 'Видео и звук не запускаются сами. Тишина и трафик под контролем.', cat: 'Умные', size: '14 КБ', downloads: '5 331', key: 'autoplay' },
  { id: 'tts', icon: '🗣', name: 'Озвучка страницы', desc: 'Читает статью вслух через синтез речи — слушай, пока занят.', cat: 'Умные', hotkey: 'кнопка', size: '40 КБ', downloads: '6 108', key: 'tts' },
  { id: 'watch', icon: '👀', name: 'Слежение за сайтом', desc: 'Сообщает, когда страница изменилась: курс доллара, наличие товара, релиз.', cat: 'Умные', hotkey: ':watch', size: '30 КБ', downloads: '3 844', key: 'watch' },
  { id: 'formfill', icon: '🧾', name: 'Заполнить форму', desc: 'Заполняет тестовые формы вымышленными данными — для разработчиков.', cat: 'Умные', hotkey: 'кнопка', size: '24 КБ', downloads: '2 660', key: 'formfill' },
  { id: 'searchsite', icon: '🏠', name: 'Поиск по сайту', desc: ':searchsite запрос — ищет только по текущему домену.', cat: 'Умные', hotkey: ':searchsite', size: '14 КБ', downloads: '4 175', key: 'searchsite' },
  { id: 'findregex', icon: '.*', name: 'Regex в поиске', desc: 'Расширенный поиск по странице с регулярными выражениями.', cat: 'Умные', hotkey: 'Ctrl+Shift+F', size: '22 КБ', downloads: '2 430', key: 'findregex' },
  { id: 'themeauto', icon: '🌓', name: 'Тема по времени', desc: 'Ночью автоматически включает тёмную тему интерфейса.', cat: 'Умные', size: '14 КБ', downloads: '3 702', key: 'themeauto' },
  { id: 'nightauto', icon: '🌙', name: 'Ночь по расписанию', desc: 'Ночная подсветка включается сама в заданные часы.', cat: 'Умные', size: '16 КБ', downloads: '4 955', key: 'nightauto' },
  { id: 'hidecookie', icon: '🍪', name: 'Убрать cookie-баннеры', desc: 'Автоматически закрывает согласия на куки — чисто и без кликов.', cat: 'Умные', size: '28 КБ', downloads: '9 660', key: 'hidecookie' },
  { id: 'savemd', icon: '📝', name: 'Сохранить как MD', desc: 'Текст страницы превращается в Markdown-файл одним кликом.', cat: 'Умные', hotkey: ':savemd', size: '30 КБ', downloads: '2 918', key: 'savemd' },
  { id: 'savepdf', icon: '📄', name: 'Сохранить в PDF', desc: 'Печатает текущую страницу в PDF-файл без диалога печати.', cat: 'Умные', hotkey: ':savepdf', size: '36 КБ', downloads: '5 874', key: 'savepdf' },
  { id: 'printclean', icon: '🧻', name: 'Чистая печать', desc: 'При печати убирает меню, шапки и рекламу — только контент.', cat: 'Умные', size: '18 КБ', downloads: '1 690', key: 'printclean' },
  { id: 'emoji', icon: '😀', name: 'Эмодзи-панель', desc: ':emoji — быстрый поиск и копирование эмодзи по ключевому слову.', cat: 'Умные', hotkey: ':emoji', size: '26 КБ', downloads: '3 588', key: 'emoji' },
  { id: 'translit', icon: '🔄', name: 'Транслитерация', desc: ':translit Привет → Privet. Кириллица в латиницу и обратно.', cat: 'Умные', hotkey: ':translit', size: '16 КБ', downloads: '1 377', key: 'translit' },
  { id: 'slugify', icon: '🔠', name: 'Slug-ификатор', desc: ':slug Заголовок → zagolovok. URL-фрагменты из любого текста.', cat: 'Умные', hotkey: ':slug', size: '12 КБ', downloads: '1 220', key: 'slugify' },
  { id: 'caseconv', icon: 'Aa', name: 'Регистры текста', desc: ':case upper/lower/title — быстро меняет регистр выделенного.', cat: 'Умные', hotkey: ':case', size: '14 КБ', downloads: '1 640', key: 'caseconv' },
  { id: 'hash', icon: '#️⃣', name: 'Хэши', desc: ':hash md5/sha1/sha256 — хэши любого текста для проверки целостности.', cat: 'Умные', hotkey: ':hash', size: '24 КБ', downloads: '1 108', key: 'hash' },
  { id: 'b64', icon: '🆑', name: 'Base64', desc: ':b64 енcode/decode — кодирование текста на лету.', cat: 'Умные', hotkey: ':b64', size: '12 КБ', downloads: '1 940', key: 'b64' },
  { id: 'urlenc', icon: '🌐', name: 'URL-кодирование', desc: ':urlenc encode/decode — экранирование и разэкранирование текста.', cat: 'Умные', hotkey: ':urlenc', size: '12 КБ', downloads: '1 305', key: 'urlenc' },
  { id: 'jsonfmt', icon: '🧾', name: 'Форматирование JSON', desc: ':jsonfmt — красивый вывод JSON из буфера. Для любителей API.', cat: 'Умные', hotkey: ':jsonfmt', size: '16 КБ', downloads: '3 410', key: 'jsonfmt' },
  { id: 'openselection', icon: '➜', name: 'Открыть выделенное', desc: ':opensel — выделенный текст открывается как URL или запрос.', cat: 'Умные', hotkey: ':opensel', size: '14 КБ', downloads: '2 022', key: 'openselection' },
  { id: 'quicknote', icon: '🗒', name: 'Быстрые заметки', desc: ':note текст — сохранить мысль, не покидая вкладку. Всё в сайдбаре.', cat: 'Умные', hotkey: ':note', size: '30 КБ', downloads: '4 509', key: 'quicknote' },

  // ─── Приватность и система ─────────────────────
  { id: 'incognito', icon: '🕶', name: 'Инкогнито', desc: 'Приватные вкладки без сохранения. Ctrl+Shift+N.', cat: 'Приватность', hotkey: 'Ctrl+Shift+N', size: '300 КБ', downloads: '14 255', key: 'incognito' },
  { id: 'sleep', icon: '💤', name: 'Спящие вкладки', desc: 'Фоновые вкладки автоматически замьючены — меньше шума и трафика.', cat: 'Приватность', size: '80 КБ', downloads: '8 655', key: 'sleep' },
  { id: 'adblock', icon: '🛡️', name: 'Ad Blocker', desc: 'Блокирует известные рекламные и трекерные домены на лету.', cat: 'Приватность', size: '410 КБ', downloads: '18 730', key: 'adblock' },
  { id: 'dedupe', icon: '🧹', name: 'Закрыть дубли', desc: 'Одной командой убирает повторные вкладки с одинаковым URL.', cat: 'Приватность', hotkey: ':dedupe', size: '25 КБ', downloads: '2 908', key: 'dedupe' },
  { id: 'backup', icon: '💾', name: 'Резервная копия', desc: 'Экспорт и импорт всех настроек, закладок и истории в JSON.', cat: 'Приватность', hotkey: ':export', size: '130 КБ', downloads: '4 552', key: 'backup' },
  { id: 'shots', icon: '📷', name: 'Скриншоты', desc: 'Ctrl+Shift+S сохранить страницу, Ctrl+Shift+C — в буфер.', cat: 'Приватность', hotkey: 'Ctrl+Shift+S/C', size: '260 КБ', downloads: '9 377', key: 'shots' },
  { id: 'pip', icon: '📺', name: 'Page PiP', desc: 'Страница улетает в маленькое окно поверх всех. Ctrl+Shift+P.', cat: 'Приватность', hotkey: 'Ctrl+Shift+P', size: '350 КБ', downloads: '10 990', key: 'pip' },
  { id: 'refstrip', icon: '🗑', name: 'Без реферера', desc: 'Сайты не узнают, откуда ты пришёл — заголовок Referer скрывается.', cat: 'Приватность', size: '18 КБ', downloads: '5 012', key: 'refstrip' },
  { id: 'ua', icon: '🤖', name: 'Свой User-Agent', desc: 'Подмена UA: сайты видят Chrome/Safari вместо Electron. Значение в настройках.', cat: 'Приватность', size: '22 КБ', downloads: '3 460', key: 'ua' },
  { id: 'webrtc', icon: '🌐', name: 'WebRTC-защита', desc: 'Блокирует утечку реального IP через WebRTC (mDNS вместо адреса).', cat: 'Приватность', size: '20 КБ', downloads: '2 909', key: 'webrtc' },
  { id: 'cookiekill', icon: '⏳', name: 'Авто-очистка куки', desc: 'Куки стираются через заданные минуты — ни один трекер не переживёт.', cat: 'Приватность', size: '26 КБ', downloads: '4 110', key: 'cookiekill' },
  { id: 'noautofill', icon: '🚫', name: 'Без автозаполнения', desc: 'Отключает автозаполнение форм — меньше утечек личных данных.', cat: 'Приватность', size: '14 КБ', downloads: '2 300', key: 'noautofill' },
  { id: 'autodelete', icon: '🧽', name: 'Чистый выход', desc: 'При закрытии браузера стираются все куки и кэш сессии.', cat: 'Приватность', size: '24 КБ', downloads: '3 877', key: 'autodelete' },
  { id: 'imagelite', icon: '🖼', name: 'Лёгкие страницы', desc: 'Блокирует загрузку картинок — страницы грузятся мгновенно.', cat: 'Приватность', size: '20 КБ', downloads: '6 550', key: 'imagelite' },
  { id: 'trackhide', icon: '📡', name: 'Против пикселей', desc: 'Блокирует невидимые трекер-пиксели и счётчики (дополняет Ad Blocker).', cat: 'Приватность', size: '60 КБ', downloads: '3 120', key: 'trackhide' },
  { id: 'privateclick', icon: '🕶', name: 'Инкогнито-клики', desc: 'Ссылки на чужие домены открываются в приватных вкладках.', cat: 'Приватность', size: '22 КБ', downloads: '1 855', key: 'privateclick' },
  { id: 'fingerprint', icon: '🫥', name: 'Шум отпечатка', desc: 'Canvas-отпечаток браузера слегка искажается — сайты не смогут следить.', cat: 'Приватность', size: '30 КБ', downloads: '2 622', key: 'fingerprint' },
  { id: 'historyoff', icon: '🚫', name: 'Без истории', desc: 'Сайты не попадают в историю и Grep-индекс.', cat: 'Приватность', size: '14 КБ', downloads: '2 048', key: 'historyoff' },
  { id: 'trailoff', icon: '🧊', name: 'Без следов', desc: 'Не сохраняется карта навигации (Session Trail).', cat: 'Приватность', size: '14 КБ', downloads: '1 330', key: 'trailoff' },
  { id: 'forgetsite', icon: '🗑', name: 'Забыть сайт', desc: ':forget — удаляет историю и куки только текущего домена.', cat: 'Приватность', hotkey: ':forget', size: '28 КБ', downloads: '2 703', key: 'forgetsite' },
  { id: 'siteblock', icon: '🚧', name: 'Блокировать сайт', desc: ':block — сайт перестаёт открываться до снятия блокировки.', cat: 'Приватность', hotkey: ':block', size: '26 КБ', downloads: '5 940', key: 'siteblock' },
  { id: 'dnt', icon: '🚩', name: 'Do Not Track', desc: 'Отправляет заголовок DNT=1 — честная просьба не следить.', cat: 'Приватность', size: '12 КБ', downloads: '2 901', key: 'dnt' },
  { id: 'cleanurl', icon: '🧹', name: 'Чистые ссылки', desc: 'Вырезает utm_*-мусор и tracking-параметры из адресов.', cat: 'Приватность', size: '30 КБ', downloads: '7 322', key: 'cleanurl' },
  { id: 'blockpop', icon: '🪟', name: 'Блок всплывающих', desc: 'Запрещает страницам открывать новые окна через window.open.', cat: 'Приватность', size: '18 КБ', downloads: '2 144', key: 'blockpop' },
  { id: 'cacheclear', icon: '💨', name: 'Очистка кэша', desc: ':cache — очищает кэш одним движением. Для вёрстки без «жёстких» перезагрузок.', cat: 'Приватность', hotkey: ':cache', size: '16 КБ', downloads: '3 811', key: 'cacheclear' },
  { id: 'cookieview', icon: '🥠', name: 'Инспектор куки', desc: ':cookies — все куки текущего сайта списком. Изучай и удаляй.', cat: 'Приватность', hotkey: ':cookies', size: '40 КБ', downloads: '2 099', key: 'cookieview' },
  // ─── Dynamic Island + vibes (v1.5) ─────────────
  { id: 'dynamicisland', icon: '◯', name: 'Dynamic Island', desc: 'Стеклянная «капсула» сверху: активная вкладка, живые часы и прогресс загрузки. При наведении раскрывается.', cat: 'Оформление', hotkey: 'наведение', size: '44 КБ', downloads: '4 210', key: 'dynamicisland' },
  { id: 'cursorglow', icon: '✨', name: 'Свечение курсора', desc: 'Мягкий неоновый свет следует за мышью по всему интерфейсу.', cat: 'Оформление', size: '14 КБ', downloads: '2 840', key: 'cursorglow' },
  { id: 'docklift', icon: '↥', name: 'Всплытие вкладки', desc: 'Активная вкладка приподнимается и «причаливает» к панели, как дока MacOS.', cat: 'Оформление', size: '12 КБ', downloads: '1 990', key: 'docklift' },
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

export function featureHotkey(settings: Settings, id: FeatureId): string | undefined {
  return FEATURES.find(f => f.id === id)?.hotkey
}
