import { useRef, useEffect } from 'react'
import { useStore } from '../store'

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

// Fetch title + favicon after page load
const FETCH_META = `
(function() {
  var title = document.title || '';
  var link = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  var fav = link ? link.href : '';
  return JSON.stringify({title: title, favicon: fav});
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

    if(e.key==='j'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();window.scrollBy(0,scrollAmount);return;}
    if(e.key==='k'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();window.scrollBy(0,-scrollAmount);return;}
    if(e.key==='h'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();window.scrollBy(-scrollAmount,0);return;}
    if(e.key==='l'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();window.scrollBy(scrollAmount,0);return;}
    if(e.key==='d'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();window.scrollBy(0,window.innerHeight/2);return;}
    if(e.key==='u'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();window.scrollBy(0,-window.innerHeight/2);return;}

    if(e.key==='f'&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();activateHints();return;}
    if(e.key==='F'&&e.shiftKey&&!e.ctrlKey&&!e.metaKey){e.preventDefault();activateHints();return;}

    if(e.key==='i'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();mode='insert';keyBuffer='';return;}

    if(e.key==='r'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();window.location.reload();return;}

    if(e.key==='g'){
      if(keyBuffer==='g'){e.preventDefault();window.scrollTo(0,0);keyBuffer='';return;}
      keyBuffer='g';return;
    }
    if(e.key==='G'&&e.shiftKey){e.preventDefault();window.scrollTo(0,document.body.scrollHeight);keyBuffer='';return;}

    if(e.key==='H'&&e.shiftKey&&!e.ctrlKey&&!e.metaKey){e.preventDefault();window.history.back();return;}
    if(e.key==='L'&&e.shiftKey&&!e.ctrlKey&&!e.metaKey){e.preventDefault();window.history.forward();return;}

    keyBuffer='';
  }

  window.addEventListener('keydown',handleKey,true);
})();`

export default function WebContent({ id, url, active, visible = true }: { id: string; url: string; active: boolean; visible?: boolean }) {
  const ref = useRef<HTMLWebViewElement>(null)
  const navRef = useRef('')
  const registerWv = useStore(s => s.registerWv)
  const unregisterWv = useStore(s => s.unregisterWv)
  const updateTab = useStore(s => s.updateTab)
  const addHistory = useStore(s => s.addHistory)
  const darkReader = useStore(s => s.settings.darkReader)

  const webviewPreload = window.onyx?.getWebviewPreload?.() || ''

  const hasUrl = url && url !== 'about:blank'

  useEffect(() => {
    const wv = ref.current
    if (!wv) return
    registerWv(id, wv)
    return () => unregisterWv(id)
  }, [id, registerWv, unregisterWv])

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

  // Inject vim engine + dark reader on page load
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
          wv.executeJavaScript(darkReader ? DARK_READER_CSS : DARK_READER_REMOVE).catch(() => {})
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
      fetchMeta()
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
  }, [darkReader, id, updateTab])

  // Events: title, favicon, navigation
  useEffect(() => {
    const wv = ref.current as any
    if (!wv) return

    const onNav = (e: any) => {
      if (!e.url || e.url === 'about:blank') return
      navRef.current = e.url
      updateTab(id, { url: e.url, loading: false })
      addHistory({ url: e.url, title: '' })
    }
    const onTitle = (e: any) => updateTab(id, { title: e.title })
    const onFavicon = (e: any) => { if (e.favicons?.length) updateTab(id, { favicon: e.favicons[0] }) }
    const onStart = () => updateTab(id, { loading: true })
    const onStop = () => {
      updateTab(id, { loading: false })
      // Re-fetch title in case page-title-updated didn't fire
      try {
        const t = wv.getTitle?.()
        if (t) updateTab(id, { title: t })
      } catch {}
    }
    const onFail = (e: any) => { if (e.errorCode !== -3) updateTab(id, { loading: false }) }
    const onInPage = (e: any) => {
      if (e.isMainFrame && e.url && e.url !== 'about:blank') {
        navRef.current = e.url
        updateTab(id, { url: e.url })
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
  }, [id, updateTab, addHistory])

  if (!hasUrl) return null

  return (
    <div className={`webview-container${active ? ' active' : ''}`} style={visible ? undefined : { position: 'absolute', left: '-9999px', top: 0, width: '1px', height: '1px', overflow: 'hidden', opacity: 0, pointerEvents: 'none' as const }}>
      <webview
        ref={ref}
        className="wv"
        src={url}
        partition={`persist:vox`}
        allowpopups={'true' as any}
        preload={webviewPreload}
      />
    </div>
  )
}
