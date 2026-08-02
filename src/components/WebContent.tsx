import { useRef, useEffect } from 'react'
import { useStore } from '../store'
import { enabledPageMods, buildApplyScript } from '../pageMods'
import { isAndroid, getFakeWv } from '../android/shim'

const DARK_READER_CSS = `
(function() {
  if(document.getElementById('vox-dark-reader'))return;
  var s = document.createElement('style');
  s.id = 'vox-dark-reader';
  s.textContent = 'html{filter:invert(1) hue-rotate(180deg) !important;background:#000 !important}img,video,picture,canvas,svg,embed,object,iframe{filter:invert(1) hue-rotate(180deg) !important}';
  document.documentElement.appendChild(s);
})()`

const DARK_READER_REMOVE = `
(function() {
  var s = document.getElementById('vox-dark-reader');
  if (s) s.remove();
})()`

const SMOOTH_CSS = `
(function() {
  if(document.getElementById('vox-smooth'))return;
  var s = document.createElement('style');
  s.id = 'vox-smooth';
  s.textContent = 'html{scroll-behavior:smooth !important}';
  document.documentElement.appendChild(s);
})()`

const SMOOTH_REMOVE = `
(function() {
  var s = document.getElementById('vox-smooth');
  if (s) s.remove();
})()`

const READER_CSS = `
(function() {
  if(document.getElementById('vox-reader'))return;
  var s = document.createElement('style');
  s.id = 'vox-reader';
  s.textContent = 'html.vox-reader body{max-width:46rem!important;margin:0 auto!important;padding:1.5rem 1.25rem 4rem!important;font-size:18px!important;line-height:1.75!important;background:inherit}html.vox-reader header,html.vox-reader nav,html.vox-reader footer,html.vox-reader aside,html.vox-reader form,html.vox-reader .ad,html.vox-reader [class*="ad-"],html.vox-reader [class*="adsbygoogle"],html.vox-reader [class*="cookie"],html.vox-reader [id*="cookie"],html.vox-reader .newsletter,html.vox-reader .share{display:none!important}html.vox-reader img,html.vox-reader video{max-width:100%!important;height:auto!important}';
  document.documentElement.classList.add('vox-reader');
  document.documentElement.appendChild(s);
})()`

const READER_REMOVE = `
(function() {
  document.documentElement.classList.remove('vox-reader');
  var s = document.getElementById('vox-reader');
  if (s) s.remove();
})()`

const FOCUS_CSS = `
(function() {
  if(document.getElementById('vox-focus'))return;
  var s = document.createElement('style');
  s.id = 'vox-focus';
  s.textContent = 'html.vox-focus::after{content:"";position:fixed;left:0;right:0;top:50%;transform:translateY(-50%);height:68vh;pointer-events:none;z-index:2147483646;background:linear-gradient(180deg,rgba(0,0,0,.58),transparent 12%,transparent 88%,rgba(0,0,0,.58))}';
  document.documentElement.classList.add('vox-focus');
  document.documentElement.appendChild(s);
})()`

const FOCUS_REMOVE = `
(function() {
  document.documentElement.classList.remove('vox-focus');
  var s = document.getElementById('vox-focus');
  if (s) s.remove();
})()`

const NIGHT_CSS = `
(function() {
  if(document.getElementById('vox-night'))return;
  var s = document.createElement('style');
  s.id = 'vox-night';
  s.textContent = 'body{filter:sepia(.4) saturate(.88) hue-rotate(-8deg)!important;background:#ffc79a}';
  document.documentElement.appendChild(s);
})()`

const NIGHT_REMOVE = `
(function() {
  var s = document.getElementById('vox-night');
  if (s) s.remove();
})()`

// Fetch title + favicon after page load
const FETCH_META = `
(function() {
  var title = document.title || '';
  var link = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  var fav = link ? link.href : '';
  return JSON.stringify({title: title, favicon: fav});
})()`

// Extract readable text for full-history grep
const TEXT_EXTRACT = `
(function(){
  var root = document.body;
  if(!root) return '';
  var clone = root.cloneNode(true);
  clone.querySelectorAll('script,style,noscript,svg,canvas,iframe,video,audio,button,input,select,textarea,pre,[aria-hidden="true"]').forEach(function(n){n.remove()});
  var t = (clone.innerText || '').replace(/\\s+/g,' ').trim().slice(0, 4000);
  return t;
})()`

// Sample a vivid accent color for Aurora adaptive theme.
// Prefers saturated, readable colors — on dark sites it lifts + saturates instead of returning near-black.
const AURORA_SAMPLE = `
(function(){
  try{
    var colors={};
    function push(c,w){ if(c&&c!=='transparent'&&c.indexOf('rgba(0, 0, 0, 0)')!==0){ colors[c]=(colors[c]||0)+w; } }
    var el=document.documentElement;
    push(getComputedStyle(el).backgroundColor, 40);
    push(getComputedStyle(document.body).backgroundColor, 40);
    var walk=function(n,d){
      if(d>8||!n||!n.children)return;
      for(var i=0;i<n.children.length;i++){
        var ch=n.children[i];
        if(ch.getBoundingClientRect){var r=ch.getBoundingClientRect();if(r.width>120&&r.height>120){push(getComputedStyle(ch).backgroundColor,8);}}
        if(i<12)walk(ch,d+1);
      }
    };
    walk(document.body,0);
    function parse(c){
      var m=c.match(/rgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)/);
      if(!m)return null;
      return {r:+m[1],g:+m[2],b:+m[3]};
    }
    var best=null,bestScore=-1,fallback=null,fallbackScore=-1;
    for(var c in colors){
      var p=parse(c);
      if(!p)continue;
      var mx=Math.max(p.r,p.g,p.b),mn=Math.min(p.r,p.g,p.b);
      var sat=mx===0?0:(mx-mn)/mx;
      var lum=(p.r*0.299+p.g*0.587+p.b*0.114)/255;
      var score=sat*(0.35+lum);
      if(lum>0.14&&lum<0.9&&sat>0.16){
        if(score>bestScore){bestScore=score;best=p;}
      }
      var fs=sat*0.5+lum*0.5;
      if(fs>fallbackScore&&lum>0.1&&lum<0.94){fallbackScore=fs;fallback=p;}
    }
    var chosen=best||fallback;
    if(!chosen)return '';
    var r=chosen.r,g=chosen.g,b=chosen.b;
    var L=(Math.max(r,g,b)+Math.min(r,g,b))/2;
    // lift dark sites so the accent is visible on dark UI
    if(L<120){
      var f=120/(L||1);
      r=Math.min(255,Math.round(r*f));g=Math.min(255,Math.round(g*f));b=Math.min(255,Math.round(b*f));
    }
    // boost weak saturation a little
    var gray=Math.round((r+g+b)/3);
    var d=Math.max(0.3,(120-gray)/255);
    r=Math.round(r+(r-gray)*d);
    g=Math.round(g+(g-gray)*d);
    b=Math.round(b+(b-gray)*d);
    r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b));
    return r+','+g+','+b;
  }catch(e){return '';}
})()`

const VIM_ENGINE = `(function(){
  if(window._voxEngine)return;
  window._voxEngine=true;
  var mode='normal';
  var hintChars='asdfghjkl';
  var allHints=[];
  var typed='';
  var container=null;
  var keyBuffer='';

  function getClickable(){
    var sel='a[href],button,input:not([type=hidden]),textarea,select,[role=button],[role=link],[role=tab],[onclick],[tabindex]:not([tabindex="-1"]),summary';
    var els=Array.from(document.querySelectorAll(sel));
    var r=[];
    for(var i=0;i<els.length;i++){
      var e=els[i];
      var b=e.getBoundingClientRect();
      if(!b.width||!b.height)continue;
      if(b.top>window.innerHeight||b.bottom<0)continue;
      if(b.left>window.innerWidth||b.right<0)continue;
      var cs=getComputedStyle(e);
      if(cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0')continue;
      r.push({el:e,rect:b});
    }
    return r;
  }

  function genLabels(n){
    var L=[];
    if(n<=hintChars.length){for(var i=0;i<n;i++)L.push(hintChars[i]);}
    else{for(var a of hintChars)for(var b of hintChars){L.push(a+b);if(L.length>=n)return L;}}
    return L;
  }

  function activateHints(){
    var els=getClickable();
    if(!els.length)return;
    container=document.createElement('div');
    container.id='vox-hints';
    container.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:none;font-family:Helvetica,Arial,sans-serif;';
    var labels=genLabels(els.length);
    allHints=[];
    for(var i=0;i<els.length;i++){
      var h=els[i];var lbl=labels[i];
      var d=document.createElement('div');
      d.textContent=lbl;
      d.style.cssText='position:absolute;z-index:2147483647;pointer-events:none;background:linear-gradient(to bottom,#fff785,#ffc542);color:#302505;font-size:11px;font-weight:bold;padding:1px 3px;border:1px solid #c38a22;border-radius:3px;box-shadow:0 3px 7px rgba(0,0,0,.3);white-space:nowrap;line-height:1.2;left:'+(h.rect.left+window.scrollX-1)+'px;top:'+(h.rect.top+window.scrollY-1)+'px;';
      container.appendChild(d);
      allHints.push({label:lbl,el:h.el,div:d});
    }
    document.documentElement.appendChild(container);
    mode='hint';
    typed='';
  }

  function updateHints(){
    if(!container)return;
    var matched=null;
    var matchCount=0;
    for(var i=0;i<allHints.length;i++){
      var h=allHints[i];
      if(h.label===typed){matched=h;h.div.style.background='#00aa00';h.div.style.color='#fff';h.div.style.borderColor='#008800';}
      else if(h.label.indexOf(typed)===0){matchCount++;h.div.style.background='#ffc542';}
      else{h.div.style.opacity='0.15';}
    }
    if(matched){exitHints();clickEl(matched.el);}
    else if(typed&&!matchCount){exitHints();}
  }

  function clickEl(el){
    if(!el)return;
    el.scrollIntoView({behavior:'smooth',block:'center'});
    if(el.tagName==='A'&&el.href){window.location.href=el.href;}
    else{el.focus();el.click();}
  }

  function exitHints(){
    mode='normal';
    if(container){container.remove();container=null;}
    allHints=[];typed='';keyBuffer='';
  }

  function handleKey(e){
    var tag=(e.target.tagName||'').toLowerCase();
    var inp=tag==='input'||tag==='textarea'||e.target.isContentEditable;

    if(mode==='hint'){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      if(e.key==='Escape'){exitHints();return;}
      if(e.key==='Backspace'){typed=typed.slice(0,-1);if(!typed)exitHints();else updateHints();return;}
      if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){typed+=e.key.toLowerCase();updateHints();}
      return;
    }

    if(mode==='insert'){
      if(e.key==='Escape'){e.preventDefault();mode='normal';keyBuffer='';}
      return;
    }

    if(inp)return;

    if(e.key==='Escape'){e.preventDefault();keyBuffer='';return;}

    var scrollAmount=window.innerHeight*0.4;

    function target(){
      var ae=document.activeElement;
      if(ae&&ae.tagName==='IFRAME'&&ae.contentWindow){
        try{
          var d=ae.contentWindow.document;
          if(d&&d.body)return ae.contentWindow;
        }catch(e){}
      }
      return window;
    }

    if(e.key==='j'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();target().scrollBy(0,scrollAmount);return;}
    if(e.key==='k'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();target().scrollBy(0,-scrollAmount);return;}
    if(e.key==='h'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();target().scrollBy(-scrollAmount,0);return;}
    if(e.key==='l'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();target().scrollBy(scrollAmount,0);return;}
    if(e.key==='d'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();target().scrollBy(0,window.innerHeight/2);return;}
    if(e.key==='u'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();target().scrollBy(0,-window.innerHeight/2);return;}

    if(e.key==='f'&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();activateHints();return;}
    if(e.key==='F'&&e.shiftKey&&!e.ctrlKey&&!e.metaKey){e.preventDefault();activateHints();return;}

    if(e.key==='i'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();mode='insert';keyBuffer='';return;}

    if(e.key==='r'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();window.location.reload();return;}

    if(e.key==='g'){
      if(keyBuffer==='g'){e.preventDefault();target().scrollTo(0,0);keyBuffer='';return;}
      keyBuffer='g';return;
    }
    if(e.key==='G'&&e.shiftKey){e.preventDefault();target().scrollTo(0,target().document.body.scrollHeight);keyBuffer='';return;}

    if(e.key==='H'&&e.shiftKey&&!e.ctrlKey&&!e.metaKey){e.preventDefault();window.history.back();return;}
    if(e.key==='L'&&e.shiftKey&&!e.ctrlKey&&!e.metaKey){e.preventDefault();window.history.forward();return;}

    keyBuffer='';
  }

  function forwardCombo(e){
    if(e.defaultPrevented)return;
    var k=(e.key||'').toLowerCase();
    var isShort=(e.ctrlKey||e.metaKey||e.altKey)&&(k==='t'||k==='w'||k==='tab'||k==='f'||k==='d'||k==='l'||k==='h'||k==='e'||k==='b'||k===','||k==='\\\\'||k==='='||k==='+'||k==='-'||k==='0'||k==='arrowleft'||k==='arrowright'||k==='r');
    if((e.ctrlKey||e.metaKey)&&e.shiftKey&&(k==='t'||k==='n'||k==='a'||k==='p'||k==='g'||k==='d'||k==='s'||k==='c'||k==='o'||k==='j'||k==='v'||k==='r'||k==='y'||k==='u'||k==='k'))isShort=true;
    if(e.key==='F5')isShort=true;
    if(e.key==='?'&&!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey))isShort=true;
    if(!isShort)return;
    try{window.parent.postMessage({voxKey:true,key:e.key,ctrl:e.ctrlKey,shift:e.shiftKey,alt:e.altKey,meta:e.metaKey},'*');}catch(err){}
  }
  window.addEventListener('keydown',forwardCombo,false);

  window.addEventListener('keydown',handleKey,true);
})();`

export default function WebContent({ id, url, active, visible = true }: { id: string; url: string; active: boolean; visible?: boolean }) {
  const ref = useRef<any>(null)
  const navRef = useRef('')
  const registerWv = useStore(s => s.registerWv)
  const unregisterWv = useStore(s => s.unregisterWv)
  const updateTab = useStore(s => s.updateTab)
  const addHistory = useStore(s => s.addHistory)
  const pushTrail = useStore(s => s.pushTrail)
  const darkReader = useStore(s => s.settings.darkReader)
  const smoothScroll = useStore(s => s.settings.smoothScroll)
  const nightShift = useStore(s => s.settings.nightShift)
  const aurora = useStore(s => s.settings.aurora)
  const setAuroraColor = useStore(s => s.setAuroraColor)
  const lensOn = useStore(s => s.settings.lens)
  const lenses = useStore(s => s.settings.lenses)
  const tab = useStore(s => s.tabs.find(t => t.id === id))
  const settings = useStore(s => s.settings)

  let host = ''
  try { host = new URL(url).hostname } catch {}

  const lens = lensOn ? lenses.find(l => l.enabled !== false && l.domain === host) : undefined
  const zoom = (lens?.zoom) || (tab?.zoom ?? 1)
  const muted = tab?.muted ?? false
  const incognito = tab?.incognito ?? false
  const effectiveDark = lens ? !!lens.darkReader : darkReader

  const nightAutoOn = (() => {
    if (!settings.nightauto) return false
    const h = new Date().getHours()
    const start = settings.nightAutoStart ?? 22
    const end = settings.nightAutoEnd ?? 7
    return start <= end ? h >= start && h < end : h >= start || h < end
  })()

  const effectiveNight = nightShift || nightAutoOn

  const webviewPreload = window.onyx?.getWebviewPreload?.() || ''

  const hasUrl = url && url !== 'about:blank'

  useEffect(() => {
    const wv = ref.current
    if (!wv) return
    registerWv(id, wv)
    if (isAndroid) {
      try { (window as any).AndroidVox?.createTab?.(id, url) } catch {}
    }
    return () => {
      unregisterWv(id)
      if (isAndroid) {
        try { (window as any).AndroidVox?.destroyTab?.(id) } catch {}
      }
    }
  }, [id, url, registerWv, unregisterWv])

  // Focus webview when it becomes active
  useEffect(() => {
    const wv = ref.current
    if (!wv || !active) return
    wv.focus()
  }, [active])

  // Navigate
  useEffect(() => {
    const wv = ref.current as any
    if (!wv || !hasUrl) return
    if (navRef.current === url) return
    navRef.current = url
    try { wv.loadURL(url).catch(() => {}) } catch {}
  }, [url, hasUrl]) // eslint-disable-line

  // Per-tab zoom
  useEffect(() => {
    const wv = ref.current as any
    if (!wv) return
    try { wv.setZoomFactor(zoom) } catch {}
  }, [zoom])

  // Sleeping tabs: mute when not active
  useEffect(() => {
    const wv = ref.current as any
    if (!wv) return
    try { wv.setAudioMuted(muted) } catch {}
  }, [muted, id, active])

  // Keep muted flag in sync with active state
  useEffect(() => {
    if (!active && tab && !tab.muted) updateTab(id, { muted: true })
    if (active && tab?.muted) updateTab(id, { muted: false })
  }, [active]) // eslint-disable-line

  // Inject vim engine + dark reader + smooth scroll on page load
  useEffect(() => {
    const wv = ref.current as any
    if (!wv) return

    let destroyed = false

    const tryInject = (attempt: number) => {
      if (destroyed) return
      wv.executeJavaScript(VIM_ENGINE).catch(() => {
        if (attempt < 5 && !destroyed) {
          setTimeout(() => tryInject(attempt + 1), 300 * (attempt + 1))
        }
      })
    }

    const injectDark = () => {
      if (destroyed) return
      setTimeout(() => {
        if (destroyed) return
        try {
          wv.executeJavaScript(effectiveDark ? DARK_READER_CSS : DARK_READER_REMOVE).catch(() => {})
        } catch {}
      }, 100)
    }

    const injectSmooth = () => {
      if (destroyed) return
      setTimeout(() => {
        if (destroyed) return
        try {
          wv.executeJavaScript(smoothScroll ? SMOOTH_CSS : SMOOTH_REMOVE).catch(() => {})
        } catch {}
      }, 120)
    }

    const injectReader = () => {
      if (destroyed) return
      setTimeout(() => {
        if (destroyed) return
        try {
          wv.executeJavaScript(tab?.reader ? READER_CSS : READER_REMOVE).catch(() => {})
        } catch {}
      }, 140)
    }

    const injectFocus = () => {
      if (destroyed) return
      setTimeout(() => {
        if (destroyed) return
        try {
          wv.executeJavaScript(tab?.focus ? FOCUS_CSS : FOCUS_REMOVE).catch(() => {})
        } catch {}
      }, 160)
    }

    const injectNight = () => {
      if (destroyed) return
      setTimeout(() => {
        if (destroyed) return
        try {
          wv.executeJavaScript(effectiveNight ? NIGHT_CSS : NIGHT_REMOVE).catch(() => {})
        } catch {}
      }, 180)
    }

    const injectMods = () => {
      if (destroyed) return
      setTimeout(() => {
        if (destroyed) return
        try {
          wv.executeJavaScript(buildApplyScript(enabledPageMods(settings), settings.webFont)).catch(() => {})
        } catch {}
      }, 100)
    }

    const fetchMeta = () => {
      if (destroyed) return
      setTimeout(() => {
        if (destroyed) return
        wv.executeJavaScript(FETCH_META).then((raw: string) => {
          if (destroyed) return
          try {
            const meta = JSON.parse(raw)
            const patch: any = {}
            if (meta.title) patch.title = meta.title
            if (meta.favicon) patch.favicon = meta.favicon
            if (Object.keys(patch).length) updateTab(id, patch)
          } catch {}
        }).catch(() => {})
      }, 500)
    }

    const onReady = () => {
      wv.focus()
      tryInject(0)
      injectDark()
      injectSmooth()
      injectReader()
      injectFocus()
      injectNight()
      injectMods()
      fetchMeta()
      if (aurora) {
        setTimeout(() => {
          if (destroyed) return
          try {
            wv.executeJavaScript(AURORA_SAMPLE).then((c: string) => {
              if (c) setAuroraColor(c)
            }).catch(() => {})
          } catch {}
        }, 400)
      }
    }

    wv.addEventListener('dom-ready', onReady)
    wv.addEventListener('did-navigate', onReady)
    wv.addEventListener('did-navigate-in-page', onReady)

    // Also fetch meta after page fully loads
    const onStop = () => {
      if (destroyed) return
      fetchMeta()
      tryInject(0)
    }
    wv.addEventListener('did-stop-loading', onStop)

    return () => {
      destroyed = true
      wv.removeEventListener('dom-ready', onReady)
      wv.removeEventListener('did-navigate', onReady)
      wv.removeEventListener('did-navigate-in-page', onReady)
      wv.removeEventListener('did-stop-loading', onStop)
    }
  }, [effectiveDark, smoothScroll, nightShift, aurora, tab?.reader, tab?.focus, id, updateTab, setAuroraColor, settings])

  // Live page-mod toggles (grayscale, scrollmem, toc, etc.) — no reload needed
  const modKey = enabledPageMods(settings).sort().join('|') + '|' + (settings.webFont || '')
  useEffect(() => {
    const wv = ref.current as any
    if (!wv) return
    const t = setTimeout(() => {
      try {
        wv.executeJavaScript(buildApplyScript(enabledPageMods(settings), settings.webFont)).catch(() => {})
      } catch {}
    }, 90)
    return () => clearTimeout(t)
  }, [modKey]) // eslint-disable-line
  useEffect(() => {
    const wv = ref.current as any
    if (!wv) return
    const run = () => {
      try {
        wv.executeJavaScript(tab?.reader ? READER_CSS : READER_REMOVE).catch(() => {})
        wv.executeJavaScript(tab?.focus ? FOCUS_CSS : FOCUS_REMOVE).catch(() => {})
        wv.executeJavaScript(effectiveNight ? NIGHT_CSS : NIGHT_REMOVE).catch(() => {})
      } catch {}
    }
    run()
  }, [tab?.reader, tab?.focus, effectiveNight])

  // Events: title, favicon, navigation, history + trail capture
  useEffect(() => {
    const wv = ref.current as any
    if (!wv) return

    const onNav = (e: any) => {
      if (!e.url || e.url === 'about:blank') return
      navRef.current = e.url
      updateTab(id, { url: e.url, loading: false })
      const st = useStore.getState()
      if (!st.settings.trailoff) pushTrail(id, { url: e.url, title: '', t: Date.now() })
    }
    const onTitle = (e: any) => updateTab(id, { title: e.title })
    const onFavicon = (e: any) => { if (e.favicons?.length) updateTab(id, { favicon: e.favicons[0] }) }
    const onStart = () => updateTab(id, { loading: true })
    const onStop = async () => {
      updateTab(id, { loading: false })
      let title = ''
      try { title = wv.getTitle?.() || '' } catch {}
      if (title) updateTab(id, { title })
      const st = useStore.getState()
      const active = st.activeId === id
      if (!active) updateTab(id, { unread: true })
      const u = navRef.current || url
      if (u && u !== 'about:blank') {
        let text = ''
        try { text = await wv.executeJavaScript(TEXT_EXTRACT) } catch {}
        const sliced = typeof text === 'string' ? text.slice(0, 4000) : ''
        st.setPageText(id, sliced)
        if (!st.settings.historyoff) addHistory({ url: u, title, text: sliced })
      }
    }
    const onFail = (e: any) => { if (e.errorCode !== -3) updateTab(id, { loading: false }) }
    const onInPage = (e: any) => {
      if (e.isMainFrame && e.url && e.url !== 'about:blank') {
        navRef.current = e.url
        updateTab(id, { url: e.url })
        const st = useStore.getState()
        if (!st.settings.trailoff) pushTrail(id, { url: e.url, title: '', t: Date.now() })
      }
    }

    wv.addEventListener('did-navigate', onNav)
    wv.addEventListener('did-navigate-in-page', onInPage)
    wv.addEventListener('page-title-updated', onTitle)
    wv.addEventListener('page-favicon-updated', onFavicon)
    wv.addEventListener('did-start-loading', onStart)
    wv.addEventListener('did-stop-loading', onStop)
    wv.addEventListener('did-fail-load', onFail)

    return () => {
      wv.removeEventListener('did-navigate', onNav)
      wv.removeEventListener('did-navigate-in-page', onInPage)
      wv.removeEventListener('page-title-updated', onTitle)
      wv.removeEventListener('page-favicon-updated', onFavicon)
      wv.removeEventListener('did-start-loading', onStart)
      wv.removeEventListener('did-stop-loading', onStop)
      wv.removeEventListener('did-fail-load', onFail)
    }
  }, [id, updateTab, addHistory, pushTrail, url])

  if (!hasUrl) return null

  // Android: there is no <webview> element. Render a transparent placeholder whose
  // ref becomes the FakeWv bridge — all injection/event/history logic above is reused.
  if (isAndroid) {
    return (
      <div
        className={`webview-container${active ? ' active' : ''}`}
        style={visible ? undefined : { display: 'none' }}
        ref={(el) => {
          if (el) {
            if (!ref.current?.isFake) {
              ref.current = getFakeWv(id, url)
              if (active) {
                const fw: any = (window as any).AndroidVox
                try { fw?.setActiveTab?.(id) } catch {}
              }
            }
          } else {
            ref.current = null
          }
        }}
        data-tabid={id}
      >
        <div className="wv-native" />
      </div>
    )
  }

  return (
    <div className={`webview-container${active ? ' active' : ''}`} style={visible ? undefined : { position: 'absolute', left: '-9999px', top: 0, width: '1px', height: '1px', overflow: 'hidden', opacity: 0, pointerEvents: 'none' as const }}>
      <webview
        ref={ref}
        className="wv"
        src={url}
        partition={incognito ? `vox-incognito-${id}` : `persist:vox`}
        {...(!settings.blockpop ? { allowpopups: 'true' as any } : {})}
        preload={webviewPreload}
      />
    </div>
  )
}
