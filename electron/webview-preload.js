// Vox webview preload — injects vim engine into every page before any page scripts
(function() {
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
      var sel='a[href],button,input:not([type=hidden]),textarea,select,[role=button],[role=link],[role=tab],[onclick],[tabindex]:not([tabindex="-1"]),summary,[contenteditable]';
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
      if(matched){var el=matched.el;exitHints();clickEl(el);}
      else if(typed&&!matchCount){exitHints();}
    }

    function clickEl(el){
      if(!el)return;
      el.scrollIntoView({behavior:'smooth',block:'center'});
      // Dispatch a proper mouse event instead of location.href — works with JS routers
      try{
        var rect=el.getBoundingClientRect();
        var cx=rect.left+rect.width/2;
        var cy=rect.top+rect.height/2;
        ['mousedown','mouseup','click'].forEach(function(type){
          el.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,view:window,clientX:cx,clientY:cy}));
        });
      }catch(e){
        // Fallback for anchors with real href
        if(el.tagName==='A'&&el.href&&!el.href.startsWith('javascript:')){window.location.href=el.href;}
        else{el.click();}
      }
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
      var isShort=(e.ctrlKey||e.metaKey||e.altKey)&&(k==='t'||k==='w'||k==='tab'||k==='f'||k==='d'||k==='l'||k==='h'||k==='e'||k==='b'||k===','||k==='\\'||k==='='||k==='+'||k==='-'||k==='0'||k==='arrowleft'||k==='arrowright'||k==='r');
      if((e.ctrlKey||e.metaKey)&&e.shiftKey&&(k==='t'||k==='n'||k==='a'||k==='p'||k==='g'||k==='d'||k==='s'||k==='c'||k==='o'||k==='j'||k==='v'||k==='r'))isShort=true;
      if(e.key==='F5')isShort=true;
      if(e.key==='?'&&!(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey))isShort=true;
      if(!isShort)return;
      try{window.parent.postMessage({voxKey:true,key:e.key,ctrl:e.ctrlKey,shift:e.shiftKey,alt:e.altKey,meta:e.metaKey},'*');}catch(err){}
    }
    window.addEventListener('keydown',forwardCombo,false);

    window.addEventListener('keydown',handleKey,true);
  })()`;

  function inject() {
    if (window._voxEngine) return;
    try {
      var s = document.createElement('script');
      s.textContent = VIM_ENGINE;
      (document.documentElement || document.head || document.body).appendChild(s);
      s.remove();
    } catch(e) {}
  }

  // Inject as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  // Also inject when webview becomes visible (switching back to workspace)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && !window._voxEngine) {
      setTimeout(inject, 10);
    }
  });

  // Re-inject on SPA navigations (pushState/replaceState)
  var origPush = history.pushState;
  var origReplace = history.replaceState;
  history.pushState = function() {
    origPush.apply(this, arguments);
    window._voxEngine = false;
    setTimeout(inject, 50);
  };
  history.replaceState = function() {
    origReplace.apply(this, arguments);
  };

  window.addEventListener('popstate', function() {
    window._voxEngine = false;
    setTimeout(inject, 50);
  });
})();
