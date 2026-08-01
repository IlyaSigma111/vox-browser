// Generic page-modification engine for the Feature Store (v1.3.0).
// CSS mods are idempotent <style> elements; behavior mods are guarded installers.
// buildApplyScript() returns one JS payload that reconciles the page with the
// currently-enabled feature set, so live toggles work without a reload.

const CSS_MODS: Record<string, string> = {
  grayscale: 'html{filter:grayscale(1)!important}',
  sepia: 'html{filter:sepia(.55)!important}',
  contrast: 'html{filter:contrast(1.12) saturate(1.08)!important}',
  dim: 'html{filter:brightness(.85)!important}',
  invert: 'html{filter:invert(1) hue-rotate(180deg)!important;background:#000!important}img,video,picture,canvas,svg,embed,object,iframe{filter:invert(1) hue-rotate(180deg)!important}',
  maxcol: 'body{max-width:50rem!important;margin-left:auto!important;margin-right:auto!important}',
  serif: 'body,article,section,p,li,blockquote,h1,h2,h3,h4{font-family:Georgia,"Times New Roman",serif!important}',
  leading: 'p,li,blockquote{line-height:1.8!important}',
  bigtext: 'html,body{font-size:19px!important}',
  imgdim: 'img{filter:brightness(.82)!important}',
  linkhl: 'a{color:#4a9eff!important;text-decoration:underline!important}a:visited{color:#a78bfa!important}',
  fontsmooth: '*{-webkit-font-smoothing:antialiased!important;text-rendering:optimizeLegibility!important}',
  vidhide: 'video,iframe[src*="youtube"],iframe[src*="vimeo"],iframe[src*="player."]{display:none!important}',
  twocolreader: 'article,main{column-count:2!important;column-gap:3em!important}',
  justify: 'p,article,main{text-align:justify!important}',
  hyphen: 'p,li,h1,h2,h3{hyphens:auto!important;-webkit-hyphens:auto!important}',
  paraspace: 'p{margin-bottom:1.15em!important}',
  codefont: 'pre,code,kbd{font-family:"Cascadia Code",Consolas,monospace!important;white-space:pre-wrap!important}',
  duotone: 'html{filter:sepia(.9) saturate(1.4) hue-rotate(-12deg) contrast(1.05)!important}',
  printclean: '@media print{nav,header,footer,aside,form,.ad,[class*=cookie],[id*=cookie],[class*=sidebar],[class*=menu]{display:none!important}body{max-width:none!important}}',
}

// Behavior installers. Each is a function body receiving `window`; must be
// self-guarding via window.__voxM_<id> and stop-aware via window.__voxS_<id>.
const BEHAVIOR_MODS: Record<string, string> = {
  scrollmem: `
    var key='vox_scroll_'+location.hostname+location.pathname;
    var sv=sessionStorage.getItem(key);
    if(sv&&location.hash===''){try{window.scrollTo(0,+sv)}catch(e){}}
    var timer=null;
    function save(){try{sessionStorage.setItem(key,String(window.pageYOffset||document.documentElement.scrollTop||0))}catch(e){}}
    window.addEventListener('scroll',function(){clearTimeout(timer);timer=setTimeout(save,400)});
    window.addEventListener('beforeunload',save);
  `,
  readingbar: `
    if(document.getElementById('vox-progress'))return;
    var d=document.createElement('div');
    d.id='vox-progress';
    d.style.cssText='position:fixed;top:0;left:0;height:3px;width:0;z-index:2147483647;background:linear-gradient(90deg,#f7768e,#7aa2f7);pointer-events:none;transition:width .1s linear';
    document.documentElement.appendChild(d);
    function upd(){
      var h=document.documentElement;
      var max=(h.scrollHeight-h.clientHeight)||1;
      var p=Math.min(100,(h.scrollTop||window.pageYOffset||0)/max*100);
      d.style.width=p+'%';
      if(window.__voxS_readingbar){d.remove();window.removeEventListener('scroll',upd);return}
    }
    window.addEventListener('scroll',upd);
    upd();
  `,
  wordcount: `
    if(document.getElementById('vox-wordcount'))return;
    var txt=(document.body?document.body.innerText:'').replace(/\\s+/g,' ').trim();
    var n=txt?txt.split(' ').length:0;
    var d=document.createElement('div');
    d.id='vox-wordcount';
    d.textContent=n.toLocaleString()+' words';
    d.style.cssText='position:fixed;right:12px;bottom:12px;z-index:2147483646;background:rgba(0,0,0,.72);color:#fff;font:11px/1.4 sans-serif;padding:4px 9px;border-radius:999px;pointer-events:none';
    document.documentElement.appendChild(d);
  `,
  toc: `
    var running=window.__voxS_toc;
    var btn=document.getElementById('vox-toc-btn');
    var panel=document.getElementById('vox-toc');
    function make(){
      if(btn)return;
      btn=document.createElement('div');
      btn.id='vox-toc-btn';
      btn.textContent='☰';
      btn.title='Table of contents';
      btn.style.cssText='position:fixed;left:12px;bottom:12px;z-index:2147483646;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.72);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font:16px sans-serif;user-select:none';
      btn.onclick=function(){
        if(panel){panel.remove();panel=null;return}
        panel=document.createElement('div');
        panel.id='vox-toc';
        panel.style.cssText='position:fixed;left:12px;bottom:50px;z-index:2147483646;max-height:60vh;overflow:auto;background:rgba(15,15,20,.94);color:#eee;border-radius:10px;padding:8px;min-width:220px;font:12px/1.5 sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.4)';
        var hs=Array.prototype.slice.call(document.querySelectorAll('h1,h2,h3,h4'));
        if(!hs.length){panel.textContent='No headings found';document.documentElement.appendChild(panel);return}
        hs.forEach(function(h){
          var a=document.createElement('div');
          a.textContent=(h.tagName.charAt(1))+' · '+(h.innerText||h.textContent||'').slice(0,60);
          a.style.cssText='cursor:pointer;padding:3px 6px;border-radius:6px;margin:1px 0;color:#ccc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
          a.onmouseover=function(){a.style.background='rgba(122,162,247,.2)'};
          a.onmouseout=function(){a.style.background='transparent'};
          a.onclick=function(){h.scrollIntoView({behavior:'smooth',block:'start'});panel.remove();panel=null};
          panel.appendChild(a);
        });
        document.documentElement.appendChild(panel);
      };
      document.documentElement.appendChild(btn);
    }
    if(!running)make();
  `,
  spellcheck: `
    document.documentElement.setAttribute('spellcheck','true');
    var t=null;
    var run=function(){document.querySelectorAll('input[type=text],input:not([type]),textarea,[contenteditable]').forEach(function(e){e.setAttribute('spellcheck','true')})};
    run();
    var mo=new MutationObserver(function(){clearTimeout(t);t=setTimeout(run,800)});
    mo.observe(document.body||document.documentElement,{childList:true,subtree:true});
  `,
  autoplay: `
    document.querySelectorAll('video,audio').forEach(function(v){v.pause()});
    var mo=new MutationObserver(function(){document.querySelectorAll('video,audio').forEach(function(v){if(!v.paused)v.pause()})});
    mo.observe(document.body||document.documentElement,{childList:true,subtree:true});
    window.addEventListener('capture',null);
  `,
  noautofill: `
    if(window.__voxNoAuto)return;
    window.__voxNoAuto=true;
    function scrub(){
      if(window.__voxS_noautofill)return;
      document.querySelectorAll('input,select,textarea').forEach(function(e){
        e.setAttribute('autocomplete','off');
        e.setAttribute('autocapitalize','off');
        e.setAttribute('autocorrect','off');
      });
    }
    scrub();
    var mo=new MutationObserver(scrub);
    mo.observe(document.body||document.documentElement,{childList:true,subtree:true});
  `,
  tts: `
    if(window.__voxTTS)return;
    window.__voxTTS=function(){
      if(window.__voxS_tts)return;
      var txt=(document.body?document.body.innerText:'');
      var art=document.querySelector('article,main')?document.querySelector('article,main').innerText:'';
      var text=(art||txt).replace(/\\s+/g,' ').slice(0,6000);
      if(!text)return false;
      if(window.speechSynthesis.speaking){window.speechSynthesis.cancel();return true}
      var u=new SpeechSynthesisUtterance(text);
      u.lang=document.documentElement.lang||'en-US';
      u.rate=1;
      window.speechSynthesis.speak(u);
      return true;
    };
  `,
  watch: `
    if(window.__voxWatch)return;
    window.__voxWatch=true;
    var last='',dup=0,changed=0;
    function hash(){var r=document.body?document.body.innerText:'';return r.length+':'+(r.slice(0,600)||'').replace(/[^a-zA-Zа-яА-Я0-9]/g,'')}
    function tick(){
      if(window.__voxS_watch)return;
      var h=hash();
      if(last&&h!==last){changed++;if(changed>=2&&!dup){dup=1;try{window.parent.postMessage({voxWatch:true,url:location.href},'*')}catch(e){}}}
      else if(h===last){changed=0}
      last=h;
    }
    setInterval(tick,6000);
    tick();
  `,
  formfill: `
    if(window.__voxFormFill)return;
    window.__voxFormFill=function(){
      if(window.__voxS_formfill)return false;
      var D={
        name:'Alice Doe',email:'alice.doe@example.com',phone:'+1 555 010 3344',
        address:'742 Evergreen Terrace',city:'Springfield',zip:'90210',
        company:'Acme Inc',username:'alice_doe',password:'Str0ng!Pass',
        firstname:'Alice',lastname:'Doe'
      };
      var f=true;
      document.querySelectorAll('input,textarea').forEach(function(e){
        if(e.type==='hidden'||e.type==='submit'||e.type==='button'||e.type==='checkbox'||e.type==='radio'||e.type==='file'||e.disabled)return;
        var k=(e.name||e.id||e.placeholder||'').toLowerCase();
        var v='';
        for(var key in D){if(k.indexOf(key)>=0){v=D[key];break}}
        if(!v){
          if(k.indexOf('search')>=0||k.indexOf('query')>=0)return;
          if(k.indexOf('comment')>=0||k.indexOf('message')>=0||k.indexOf('text')>=0||k.indexOf('about')>=0)v='This is a sample comment generated by Vox form filler.';
          else if(e.tagName==='TEXTAREA')v='Sample multi-line text.\\nSecond line.';
          else if(v==='')v='x'+Math.floor(Math.random()*99999);
        }
        var set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value');
        if(e.tagName==='TEXTAREA')set=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value');
        if(set&&set.set){set.set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}
        else{e.value=v}
        f=false;
      });
      return true;
    };
  `,
  hidecookie: `
    var tries=0;
    function dismiss(){
      if(window.__voxS_hidecookie||tries>8)return;
      var sels=['[id*=cookie] button','[class*=cookie] button','[id*=consent] button','[class*=consent] button','[id*=gdpr] button','[class*=gdpr] button','#onetrust-accept-btn-handler','.accept','.agree','button:contains'];
      var clicked=false;
      for(var i=0;i<sels.length;i++){
        var els=document.querySelectorAll(sels[i]);
        for(var j=0;j<els.length;j++){
          var b=els[j],tx=(b.textContent||'').toLowerCase();
          if(tx.indexOf('accept')>=0||tx.indexOf('agree')>=0||tx.indexOf('ok')===0||tx.indexOf('принимаю')>=0||tx.indexOf('согласен')>=0||tx.indexOf('продолжить')>=0){
            try{b.click()}catch(e){}
            clicked=true;
            if(b.offsetParent!==null){break}
          }
        }
        if(clicked)break;
      }
      if(clicked){setTimeout(dismiss,600)}
    }
    setTimeout(dismiss,1200);
  `,
  commenthide: `
    function kill(){
      if(window.__voxS_commenthide)return;
      var sels=['[id*=comment]','[class*=comment]','[id*=discussion]','[class*=discussion]','[id*=disqus]','[class*=disqus]','#respond','.related-comments'];
      sels.forEach(function(sel){
        document.querySelectorAll(sel).forEach(function(el){
          var c=(el.getAttribute('id')||'')+(el.getAttribute('class')||'');
          if(el.offsetHeight>40)el.style.display='none';
        });
      });
    }
    kill();
    var mo=new MutationObserver(kill);
    mo.observe(document.body||document.documentElement,{childList:true,subtree:true});
  `,
  stickykill: `
    function unstick(){
      if(window.__voxS_stickykill)return;
      var all=document.querySelectorAll('*');
      for(var i=0;i<all.length;i++){
        var el=all[i];
        if(el.style&&el.style.position==='fixed'){
          var r=el.getBoundingClientRect();
          if(r.width>0&&r.height>0&&(r.height<window.innerHeight*0.6)){el.style.position='absolute'}
        }
      }
    }
    unstick();
  `,
  hidedistract: `
    function hide(){
      if(window.__voxS_hidedistract)return;
      var sels=['[class*=recommend]','[id*=recommend]','[class*=related]','[id*=related]','[class*=suggest]','[id*=suggest]','[class*=feed]','[id*=feed]','[class*=you-may-like]','[class*=watch-next]','[aria-label*=recommend]'];
      sels.forEach(function(sel){
        document.querySelectorAll(sel).forEach(function(el){
          if(el.offsetHeight>60)el.style.display='none';
        });
      });
    }
    hide();
    var mo=new MutationObserver(hide);
    mo.observe(document.body||document.documentElement,{childList:true,subtree:true});
  `,
  fingerprint: `
    if(window.__voxFp)return;
    window.__voxFp=true;
    var noise=Math.floor(Math.random()*12)-6;
    var oc=HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL=function(){
      var c=document.createElement('canvas');
      c.width=this.width;c.height=this.height;
      try{var g=c.getContext('2d');g.drawImage(this,0,0);g.fillStyle='rgba(0,0,0,0.001)';g.fillRect(noise<0?0:this.width-1,noise<0?this.height-1:0,1,1)}catch(e){}
      return oc.call(c);
    };
    try{var gl=WebGLRenderingContext&&WebGLRenderingContext.prototype;var og=gl&&gl.getParameter;if(og){gl.getParameter=function(p){if(p===37445||p===37446){return 'Vox WebGL'}return og.call(this,p)}}}catch(e){}
  `,
}

// Build a self-contained JS payload reconciling the page with enabled features.
export function buildApplyScript(enabled: string[], webFont?: string): string {
  const cssJson = JSON.stringify(CSS_MODS)
  const behJson = JSON.stringify(BEHAVIOR_MODS)
  const onJson = JSON.stringify(enabled)
  const font = (webFont || '').replace(/'/g, '')
  return `(function(){
    var on=${onJson}, css=${cssJson}, beh=${behJson};
    function need(id){return on.indexOf(id)>=0}
    for(var id in css){
      var el=document.getElementById('vox-mod-'+id);
      if(need(id)&&!el){var s=document.createElement('style');s.id='vox-mod-'+id;s.textContent=css[id];(document.head||document.documentElement).appendChild(s);}
      if(!need(id)&&el){el.remove();}
    }
    var wf=document.getElementById('vox-mod-webfont');
    if(need('webfont')){if(!wf){wf=document.createElement('style');wf.id='vox-mod-webfont';(document.head||document.documentElement).appendChild(wf);}wf.textContent='body,article,main{font-family:"${font}",serif!important}';}
    if(!need('webfont')&&wf){wf.remove();}
    for(var jid in beh){
      if(need(jid)&&!window['__voxM_'+jid]){
        window['__voxM_'+jid]=true;window['__voxS_'+jid]=false;
        try{new Function('window', beh[jid])(window);}catch(e){}
      }
      if(!need(jid)){window['__voxS_'+jid]=true;}
    }
  })()`
}

export const PAGE_MOD_FEATURES: string[] = [
  ...Object.keys(CSS_MODS),
  ...Object.keys(BEHAVIOR_MODS),
  'webfont',
]

export function enabledPageMods(settings: Record<string, any>): string[] {
  return PAGE_MOD_FEATURES.filter(id => !!settings[id])
}

// Tool snippets for palette actions.
export const TOOLS = {
  saveMarkdown: `(function(){var t=(document.body?document.body.innerText:'').replace(/\\s+/g,' ').trim().slice(0,50000);return t})()`,
  savePdf: `(function(){return document.title||location.href})()`,
  stats: `(function(){
    return JSON.stringify({
      links:document.querySelectorAll('a').length,
      images:document.querySelectorAll('img').length,
      headings:document.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
      forms:document.querySelectorAll('form').length,
      words:(document.body?document.body.innerText:'').replace(/\\s+/g,' ').trim().split(' ').filter(Boolean).length,
      title:document.title
    });
  })()`,
  getSelection: `(function(){return window.getSelection?window.getSelection().toString():''})()`,
}
