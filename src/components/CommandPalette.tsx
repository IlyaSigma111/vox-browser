import { useState, useRef, useEffect, useMemo } from 'react'
import { useStore } from '../store'
import { featureOn } from '../features'
import { evalMath, convertUnits, convertBase, genPassword, genUuid, parseColor, translit, slugify, caseConv, hashText, toB64, urlEnc, fmtJson, emojiSearch } from '../tools'

type Cmd = { name: string; alias: string[]; desc: string; feat?: string; core?: boolean }

const COMMANDS: Cmd[] = [
  { name: 'tabnew', alias: ['t'], desc: 'New tab', core: true },
  { name: 'tabclose', alias: ['tabc', 'q'], desc: 'Close tab', core: true },
  { name: 'tabnext', alias: ['tabn'], desc: 'Next tab' },
  { name: 'tabprev', alias: ['tabp'], desc: 'Prev tab' },
  { name: 'reload', alias: [], desc: 'Reload page' },
  { name: 'stop', alias: [], desc: 'Stop loading' },
  { name: 'back', alias: [], desc: 'Go back' },
  { name: 'forward', alias: [], desc: 'Go forward' },
  { name: 'history', alias: [], desc: 'Open history' },
  { name: 'bookmarks', alias: ['bm'], desc: 'Open bookmarks' },
  { name: 'settings', alias: ['set'], desc: 'Open settings', core: true },
  { name: 'devtools', alias: ['dev'], desc: 'Toggle DevTools' },
  { name: 'newgroup', alias: ['ng'], desc: 'New tab group' },
  { name: 'newworkspace', alias: ['nws'], desc: 'New workspace' },
  { name: 'store', alias: ['shop'], desc: 'Open the store', core: true },
  { name: 'help', alias: ['h'], desc: 'Show help', core: true },
  { name: 'dedupe', alias: ['dupes'], desc: 'Close duplicate tabs', feat: 'dedupe' },
  { name: 'translate', alias: ['tr'], desc: 'Translate current page', feat: 'translator' },
  { name: 'export', alias: [], desc: 'Export backup (settings/bookmarks/history)', feat: 'backup' },
  { name: 'import', alias: [], desc: 'Import backup from JSON', feat: 'backup' },
  { name: 'reader', alias: ['read'], desc: 'Toggle reader mode', feat: 'reader' },
  { name: 'focus', alias: ['focusmode'], desc: 'Toggle focus mode', feat: 'focus' },
  { name: 'searchsel', alias: ['sels', 'searchselection'], desc: 'Search selected text', feat: 'selectSearch' },
  { name: 'readlist', alias: ['rl'], desc: 'Save current page to reading list', feat: 'readlist' },
  { name: 'sorturl', alias: ['sorttabs'], desc: 'Sort tabs by domain', feat: 'sorturl' },
  { name: 'groupby', alias: ['group'], desc: 'Group tabs by domain', feat: 'groupby' },
  { name: 'yank', alias: ['yankmd'], desc: 'Copy page as Markdown link', feat: 'yankmd' },
  { name: 'yanktitle', alias: ['yt'], desc: 'Copy page title', feat: 'yanktitle' },
  { name: 'yanktabs', alias: ['ytabs'], desc: 'Copy all tab URLs', feat: 'copyalltabs' },
  { name: 'wc', alias: ['words'], desc: 'Word & char count of page', feat: 'wordcount' },
  { name: 'stats', alias: [], desc: 'Page stats (words/links/images)', feat: 'stats' },
  { name: 'savemd', alias: ['exportmd'], desc: 'Save page as Markdown', feat: 'savemd' },
  { name: 'savepdf', alias: ['pdf'], desc: 'Save page as PDF', feat: 'savepdf' },
  { name: 'forget', alias: ['forgetsite'], desc: 'Forget this site (history + data)', feat: 'forgetsite' },
  { name: 'block', alias: ['blockthis'], desc: 'Block this site', feat: 'siteblock' },
  { name: 'cache', alias: ['clearcache'], desc: 'Clear cache now', feat: 'cacheclear' },
  { name: 'cookies', alias: ['showcookies'], desc: 'Inspect cookies of this site', feat: 'cookieview' },
  { name: 'clip', alias: ['clipboard'], desc: 'Clipboard history', feat: 'cliphist' },
  { name: 'opensel', alias: ['opens'], desc: 'Open selected text as URL', feat: 'openselection' },
  { name: 'note', alias: ['quicknote'], desc: 'Save a quick note (or open notes)', feat: 'quicknote' },
  { name: 'snap', alias: ['snapshot'], desc: 'Save / restore window snapshots', feat: 'snap' },
  { name: 'searchsite', alias: ['onsite'], desc: 'Search within the current site', feat: 'searchsite' },
  { name: 'findregex', alias: ['rx'], desc: 'Regex find on the page  (findregex \b\w+@\w+)', feat: 'findregex' },
  { name: 'emoji', alias: [':)', '😀'], desc: 'Insert emoji', feat: 'emoji' },
  { name: 'units', alias: [], desc: 'Convert units  (units 5km in mi)', feat: 'units' },
  { name: 'pwgen', alias: ['pass'], desc: 'Generate password', feat: 'pwgen' },
  { name: 'uuid', alias: ['guid'], desc: 'Generate UUID', feat: 'uuid' },
  { name: 'color', alias: ['hex'], desc: 'Parse color  (#ff8800)', feat: 'colorparse' },
  { name: 'hash', alias: [], desc: 'Hash text  (hash sha256 hello)', feat: 'hash' },
  { name: 'b64', alias: ['base64'], desc: 'Base64 encode/decode', feat: 'b64' },
  { name: 'urlenc', alias: ['urldec'], desc: 'URL encode/decode', feat: 'urlenc' },
  { name: 'jsonfmt', alias: ['jfmt'], desc: 'Format JSON', feat: 'jsonfmt' },
  { name: 'translit', alias: ['lat'], desc: 'Transliterate text (ru→en)', feat: 'translit' },
  { name: 'slug', alias: ['slugify'], desc: 'Make URL-friendly slug', feat: 'slugify' },
  { name: 'case', alias: ['caseconv'], desc: 'Convert case  (case upper hello)', feat: 'caseconv' },
  { name: 'tts', alias: ['read', 'speak'], desc: 'Read page aloud', feat: 'tts' },
]

type Row = { type: 'url' | 'tab' | 'cmd' | 'tool'; name: string; desc: string; action: () => void }

export default function CommandPalette() {
  const showPalette = useStore(s => s.showPalette)
  const setPalette = useStore(s => s.setPalette)
  const paletteInput = useStore(s => s.paletteInput)
  const setPaletteInput = useStore(s => s.setPaletteInput)
  const tabs = useStore(s => s.tabs)
  const activeId = useStore(s => s.activeId)
  const activeWorkspace = useStore(s => s.activeWorkspace)
  const activate = useStore(s => s.activate)
  const closeTab = useStore(s => s.closeTab)
  const addTab = useStore(s => s.addTab)
  const navigateTo = useStore(s => s.navigateTo)
  const setSidebar = useStore(s => s.setSidebar)
  const addGroup = useStore(s => s.addGroup)
  const assignGroup = useStore(s => s.assignGroup)
  const addWorkspace = useStore(s => s.addWorkspace)
  const setShowShortcuts = useStore(s => s.setShowShortcuts)
  const settings = useStore(s => s.settings)
  const wsTabs = tabs.filter(t => t.workspace === activeWorkspace)
  const feat = (id: string) => featureOn(settings, id as any)

  const ref = useRef<HTMLInputElement>(null)
  const [sel, setSel] = useState(0)

  function toast(s: string) { useStore.getState().pushToast(s) }
  function copy(s: string) {
    useStore.getState().copyText(s)
    return s
  }

  function runCmd(name: string) {
    const st = useStore.getState()
    const idx = wsTabs.findIndex(t => t.id === activeId)
    const wv = () => st.webviews.get(activeId)
    const actions: Record<string, () => void> = {
      tabnew: () => addTab(),
      tabclose: () => closeTab(activeId),
      tabnext: () => { if (idx < wsTabs.length - 1) activate(wsTabs[idx + 1].id) },
      tabprev: () => { if (idx > 0) activate(wsTabs[idx - 1].id) },
      reload: () => wv()?.reload(),
      stop: () => wv()?.stop(),
      back: () => { const w = wv(); if (w?.canGoBack?.()) w.goBack() },
      forward: () => { const w = wv(); if (w?.canGoForward?.()) w.goForward() },
      history: () => setSidebar('history'),
      bookmarks: () => setSidebar('bookmarks'),
      settings: () => st.openSettings(),
      help: () => setShowShortcuts(true),
      newgroup: () => { const n = prompt('Group name:'); if (n) { const gid = addGroup(n); assignGroup(activeId, gid) } },
      newworkspace: () => addWorkspace(),
      store: () => st.openStore(),
      dedupe: () => st.closeDuplicates(),
      translate: () => st.translatePage(),
      export: () => st.exportSettings(),
      import: () => st.importSettings(),
      reader: () => st.toggleReader(),
      focus: () => st.toggleFocus(),
      searchsel: () => st.searchSelection(),
      readlist: () => { const t = st.tabs.find(x => x.id === st.activeId); if (t) st.addToReadList(t.url, t.title || t.url) },
      devtools: () => wv()?.openDevTools(),
      sorturl: () => st.sortTabs(),
      groupby: () => st.groupByDomain(),
      yank: () => { const t = st.tabs.find(x => x.id === st.activeId); if (t) copy(`[${t.title || t.url}](${t.url})`) },
      yanktitle: () => { const t = st.tabs.find(x => x.id === st.activeId); if (t) copy(t.title || t.url) },
      yanktabs: () => copy(st.tabs.filter(x => x.workspace === st.activeWorkspace && x.url && x.url !== 'about:blank').map(x => x.url).join('\n')),
      wc: () => { const t = st.pageTexts[st.activeId]; if (t) toast(`Words: ${t.split(/\s+/).filter(Boolean).length}, chars: ${t.length}`) },
      stats: () => {
        const w = wv()
        if (w) w.executeJavaScript(`(function(){var t=document.body?document.body.innerText:'';return 'Words: '+t.trim().split(/\\s+/).filter(Boolean).length+', chars: '+t.length+', links: '+document.querySelectorAll('a').length+', images: '+document.images.length}())`).then((r: string) => toast(r)).catch(() => toast('No page'))
      },
      savemd: async () => {
        const w = wv(); const t = st.tabs.find(x => x.id === st.activeId)
        if (!w || !t) return
        try {
          const md = await w.executeJavaScript(`(function(){var title=document.title||'';var h='#'+window.location.pathname.slice(1);var body=document.body?document.body.innerText:'':'';return '# '+title+'\\n\\n'+body.slice(0,200000)}())`)
          const blob = new Blob([md], { type: 'text/markdown' })
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
          a.download = (t.title || 'page').replace(/[\\/:*?"<>|]/g, '_') + '.md'; a.click()
          URL.revokeObjectURL(a.href); toast('Markdown saved')
        } catch { toast('Could not extract page') }
      },
      savepdf: async () => {
        const w = wv()
        if (!w) return
        try {
          const data = await w.printToPDF({ printBackground: true, pageSize: 'A4', marginsType: 1 })
          const buf: any = data && typeof (data as any).toBuffer === 'function' ? (data as any).toBuffer() : data
          const p = await window.onyx.saveShot(buf, `vox-page-${Date.now()}.pdf`)
          toast(p ? `PDF saved` : 'PDF saved to shots folder')
        } catch { toast('PDF failed (page not loaded)') }
      },
      forget: () => st.forgetSite(),
      block: () => st.blockSite(),
      cache: () => st.clearCacheNow(),
      cookies: async () => {
        const t = st.tabs.find(x => x.id === st.activeId)
        let host = ''
        if (t?.url) try { host = new URL(t.url).hostname } catch {}
        const list = await st.cookiesNow()
        const mine = list.filter(c => c.domain.includes(host) || host.includes(c.domain.replace(/^\./, '')))
        const total = mine.length || list.length
        toast(`Cookies: ${total} (${mine.slice(0, 4).map(c => c.name).join(', ') || 'none for this site'})`)
      },
      clip: () => { /* rows provided dynamically */ },
      opensel: () => {
        const w = wv()
        if (w) w.executeJavaScript(`(function(){var s=window.getSelection?window.getSelection().toString():'';return s?{ok:true,url:/^https?:\\/\\//i.test(s.trim())?s.trim():'https://'+s.trim()}:{ok:false}})()`).then((r: { ok: boolean; url?: string }) => {
          if (r?.ok && r.url) { st.addTab(r.url); toast('Opened selection') } else toast('No selection on page')
        }).catch(() => toast('No selection'))
      },
      note: () => { setPalette(false); setSidebar('notes') },
      snap: () => { /* rows provided dynamically */ },
      searchsite: () => {
        const t = st.tabs.find(x => x.id === st.activeId)
        let host = ''
        if (t?.url) try { host = new URL(t.url).hostname } catch {}
        const q = paletteInput.replace(/^:?searchsite\s*/i, '')
        if (q && host) st.addTab(`https://www.google.com/search?q=${encodeURIComponent('site:' + host + ' ' + q)}`)
        else if (host) st.addTab(`https://www.google.com/search?q=${encodeURIComponent('site:' + host)}`)
      },
      findregex: () => {
        const w = wv()
        if (!w) return
        const pat = paletteInput.replace(/^:?findregex\s*/i, '')
        if (!pat) { toast('findregex <pattern>'); return }
        w.executeJavaScript(`(function(){
          var re=new RegExp(${JSON.stringify(pat)},'gi');
          var walker=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_TEXT);
          var n=0;
          while(walker.nextNode()){var t=walker.currentNode.nodeValue;var m=t.match(re);if(m)n+=m.length;}
          var last=null;
          var sel=window.getSelection();
          if(sel&&sel.removeAllRanges)sel.removeAllRanges();
          var ranges=[];
          walker=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_TEXT);
          var guard=0;
          while(walker.nextNode()&&guard++<20000){var t=walker.currentNode;re.lastIndex=0;var mm;while((mm=re.exec(t.nodeValue))&&guard++<40000){var r=document.createRange();r.setStart(t,mm.index);r.setEnd(t,mm.index+mm[0].length);ranges.push(r);if(last===null){sel.addRange(r);last=r;}}}
          return {count:n};
        })()`).then((r: { count: number }) => toast(`Regex matches: ${r.count}${r.count ? ' — first highlighted' : ''}`)).catch(() => toast('Regex error'))
      },
      emoji: () => { /* rows provided dynamically */ },
      tts: () => {
        const w = wv()
        if (w) w.executeJavaScript('window.__voxTTS?window.__voxTTS():false').then((r: boolean) => { if (!r) toast('Nothing to read aloud') }).catch(() => {})
      },
      pwgen: () => { const m = paletteInput.match(/:?pwgen\s*(\d+)?/i); const len = Math.min(64, Math.max(8, parseInt(m?.[1] || '16', 10))); copy(genPassword(len)) },
      uuid: () => copy(genUuid()),
      units: () => { const r = convertUnits(paletteInput); if (r) copy(r) },
      color: () => { const m = paletteInput.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})/); if (m) { const p = parseColor(m[0]); if (p) copy(`${p.hex}  ${p.rgb}  ${p.hsl}`) } },
      hash: async () => { const m = paletteInput.match(/:?hash\s+(md5|sha1|sha256)\s+(.+)/i); if (m) copy(await hashText(m[1].toLowerCase() as any, m[2])) },
      b64: async () => { const m = paletteInput.match(/:?b64\s*(en|de)?\s*(.+)/i); if (m) copy(toB64(m[2], m[1]?.toLowerCase() === 'de')) },
      urlenc: async () => { const m = paletteInput.match(/:?urlenc\s*(en|de)?\s*(.+)/i); if (m) copy(urlEnc(m[2], m[1]?.toLowerCase() === 'de')) },
      jsonfmt: () => { const m = paletteInput.match(/:?jsonfmt\s*([\s\S]+)/i); if (m) { const f = fmtJson(m[1]); if (f) copy(f) } },
      translit: () => { const m = paletteInput.match(/:?translit\s+(.+)/i); if (m) copy(translit(m[1])) },
      slug: () => { const m = paletteInput.match(/:?slug\s+(.+)/i); if (m) copy(slugify(m[1])) },
      case: () => { const m = paletteInput.match(/:?case\s+(upper|lower|title|camel|snake|kebab)\s+(.+)/i); if (m) copy(caseConv(m[2], m[1].toLowerCase())) },
    }
    actions[name]?.()
  }

  const [hashRow, setHashRow] = useState<Row | null>(null)
  useEffect(() => {
    const m = paletteInput.match(/:?hash\s+(md5|sha1|sha256)\s+(.+)/i)
    if (m) {
      let alive = true
      hashText(m[1].toLowerCase() as any, m[2]).then(h => {
        if (alive && h) setHashRow({ type: 'tool', name: h, desc: `${m[1].toLowerCase()} — click to copy`, action: () => { copy(h); setPalette(false) } })
      })
      return () => { alive = false; setHashRow(null) }
    }
    setHashRow(null)
  }, [paletteInput])

  const results = useMemo(() => {
    const q = paletteInput.trim()
    const lq = q.toLowerCase()

    if (!q) {
      return COMMANDS.filter(c => c.core || c.feat === 'snap' || c.feat === 'clip' || c.feat === 'quicknote' || c.feat === 'emoji').map(c => ({ type: 'cmd' as const, name: c.name, desc: c.desc, action: () => { runCmd(c.name); setPalette(false) } }))
    }

    const cmds = COMMANDS.filter(c => {
      if (c.feat && !feat(c.feat)) return false
      if (!c.feat && (c.name.includes('tab') || c.name.includes('reload') || c.name.includes('stop') || c.name.includes('back') || c.name.includes('forward') || c.name === 'history' || c.name === 'bookmarks' || c.name === 'settings' || c.name === 'devtools' || c.name === 'newgroup' || c.name === 'newworkspace' || c.name === 'store' || c.name === 'help')) return c.name.includes(lq) || c.alias.some(a => a.includes(lq)) || c.desc.toLowerCase().includes(lq)
      return c.name.includes(lq) || c.alias.some(a => a.includes(lq)) || c.desc.toLowerCase().includes(lq)
    })

    const tbs = wsTabs.filter(t => t.title.toLowerCase().includes(lq) || t.url.toLowerCase().includes(lq)).slice(0, 5)
    const open = () => { navigateTo(activeId, q); setPalette(false) }
    const urlRow: Row = { type: 'url', name: q, desc: /^(https?:|www\.)/i.test(q) ? 'Open URL' : 'Search', action: open }

    const tools: Row[] = []

    if (feat('calc') && /^[\d\s+\-*/().%e]+$/.test(q) && evalMath(q) !== null) {
      const v = evalMath(q)!
      tools.push({ type: 'tool', name: `= ${v}`, desc: 'Math — click to copy', action: () => { copy(v); setPalette(false) } })
    }
    if (feat('units')) {
      const r = convertUnits(q)
      if (r) tools.push({ type: 'tool', name: r, desc: 'Units — click to copy', action: () => { copy(r); setPalette(false) } })
    }
    if (feat('baseconv')) {
      const r = convertBase(q)
      if (r) tools.push({ type: 'tool', name: r, desc: 'Base conversion — click to copy', action: () => { copy(r); setPalette(false) } })
    }
    if (feat('pwgen')) {
      const m = q.match(/^:?pwgen\s*(\d+)?/i)
      if (m) { const p = genPassword(Math.min(64, Math.max(8, parseInt(m[1] || '16', 10)))); tools.push({ type: 'tool', name: p, desc: 'Password — click to copy', action: () => { copy(p); setPalette(false) } }) }
    }
    if (feat('uuid') && /^:?uuid/i.test(q)) {
      const u = genUuid()
      tools.push({ type: 'tool', name: u, desc: 'UUID — click to copy', action: () => { copy(u); setPalette(false) } })
    }
    if (feat('colorparse')) {
      const m = q.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})/)
      if (m) { const p = parseColor(m[0]); if (p) tools.push({ type: 'tool', name: `${p.hex}`, desc: `${p.rgb} · ${p.hsl} — click to copy`, action: () => { copy(`${p.hex}  ${p.rgb}  ${p.hsl}`); setPalette(false) } }) }
    }
    if (feat('translit')) {
      const m = q.match(/:?translit\s+(.+)/i)
      if (m) { const t = translit(m[1]); tools.push({ type: 'tool', name: t, desc: 'Транслит → латиница — click to copy', action: () => { copy(t); setPalette(false) } }) }
    }
    if (feat('slugify')) {
      const m = q.match(/:?slug\s+(.+)/i)
      if (m) { const s = slugify(m[1]); tools.push({ type: 'tool', name: s, desc: 'Slug — click to copy', action: () => { copy(s); setPalette(false) } }) }
    }
    if (feat('caseconv')) {
      const m = q.match(/:?case\s+(upper|lower|title|camel|snake|kebab)\s+(.+)/i)
      if (m) { const s = caseConv(m[2], m[1].toLowerCase()); tools.push({ type: 'tool', name: s, desc: `case ${m[1]} — click to copy`, action: () => { copy(s); setPalette(false) } }) }
    }
    if (feat('b64')) {
      const m = q.match(/:?b64\s*(en|de)?\s*(.+)/i)
      if (m) { const s = toB64(m[2], m[1]?.toLowerCase() === 'de'); tools.push({ type: 'tool', name: s, desc: 'Base64 — click to copy', action: () => { copy(s); setPalette(false) } }) }
    }
    if (feat('urlenc')) {
      const m = q.match(/:?urlenc\s*(en|de)?\s*(.+)/i)
      if (m) { const s = urlEnc(m[2], m[1]?.toLowerCase() === 'de'); tools.push({ type: 'tool', name: s, desc: 'URL encode/decode — click to copy', action: () => { copy(s); setPalette(false) } }) }
    }
    if (feat('jsonfmt')) {
      const m = q.match(/:?jsonfmt\s*([\s\S]+)/i)
      if (m) { const f = fmtJson(m[1]); if (f) tools.push({ type: 'tool', name: f.slice(0, 80) + (f.length > 80 ? '…' : ''), desc: 'Formatted JSON — click to copy', action: () => { copy(f); setPalette(false) } }) }
    }
    if (feat('emoji')) {
      const m = q.match(/:?emoji\s*(.*)/i)
      const qq = m ? m[1] : q
      if (m || /^\p{Emoji}/u.test(q)) {
        emojiSearch(qq).forEach(([k, e]) => tools.push({ type: 'tool', name: `${e}`, desc: k, action: () => { copy(e); setPalette(false) } }))
      }
    }
    if (feat('clip') && (q === ':clip' || q.startsWith(':clip'))) {
      settings.clipHistory.slice(0, 10).forEach((c, i) => tools.push({ type: 'tool', name: c.slice(0, 60), desc: 'Clipboard history — click to copy', action: () => { copy(c); setPalette(false) } }))
    }
    if (feat('snap') && (q === ':snap' || q.startsWith(':snap'))) {
      const m = q.match(/^:snap\s+save\s+(.+)/i)
      if (m) {
        tools.push({ type: 'tool', name: `save as “${m[1]}”`, desc: 'Snapshot of current window', action: () => { st_save(m[1]); setPalette(false) } })
      }
      settings.snapshots.slice(0, 10).forEach(s => tools.push({ type: 'tool', name: s.name, desc: `${s.tabs.length} tabs · ${new Date(s.at).toLocaleString()} — click to restore`, action: () => { useStore.getState().restoreSnapshot(s.id); setPalette(false) } }))
    }
    if (hashRow) tools.push(hashRow)

    return [
      urlRow,
      ...tools,
      ...tbs.map(t => ({ type: 'tab' as const, name: t.title, desc: t.url, action: () => { activate(t.id); setPalette(false) } })),
      ...cmds.map(c => ({ type: 'cmd' as const, name: c.name, desc: c.desc, action: () => { runCmd(c.name); setPalette(false) } })),
    ]
  }, [paletteInput, wsTabs, activeId, navigateTo, settings, hashRow])

  function st_save(n: string) { useStore.getState().saveSnapshot(n) }

  useEffect(() => { if (showPalette) { setTimeout(() => ref.current?.focus(), 30); setSel(0) } }, [showPalette])
  useEffect(() => setSel(0), [paletteInput])

  useEffect(() => {
    if (!showPalette) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setPalette(false) }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setSel(i => Math.min(i + 1, results.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(i => Math.max(i - 1, 0)) }
      else if (e.key === 'Enter') { e.preventDefault(); results[sel]?.action() }
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [showPalette, results, sel])

  if (!showPalette) return null

  return (
    <div className="palette-overlay" onClick={() => setPalette(false)}>
      <div className="palette" onClick={e => e.stopPropagation()}>
        <div className="palette-input-row">
          <span className="palette-cmd">:</span>
          <input
            ref={ref}
            className="palette-input"
            value={paletteInput}
            onChange={e => setPaletteInput(e.target.value)}
            placeholder="type a command or URL..."
            spellCheck={false}
          />
        </div>
        {results.length > 0 && (
          <div className="palette-results">
            {results.map((r, i) => (
              <div
                key={`${r.type}-${r.name}-${i}`}
                className={`palette-item${i === sel ? ' sel' : ''}`}
                onClick={r.action}
                onMouseEnter={() => setSel(i)}
              >
                <span className={`pi-type ${r.type}`}>{r.type === 'tab' ? '>' : r.type === 'url' ? '→' : r.type === 'tool' ? '⚙' : ':'}</span>
                <span className="pi-name">{r.name}</span>
                <span className="pi-desc">{r.desc}</span>
              </div>
            ))}
          </div>
        )}
        {!paletteInput && (
          <div className="palette-results">
            <div className="palette-item sel" onClick={() => setPalette(false)}>
              <span className="pi-type cmd">:</span>
              <span className="pi-name">open &lt;url&gt;</span>
              <span className="pi-desc">Navigate to URL or search</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
