// Vox Vim Engine — injected into every webview, handles all keyboard input locally
// Architecture mirrors Vimium: content script captures keys via window keydown in capture phase
(function() {
  if (window._voxEngine) return; // already injected
  window._voxEngine = true;

  var mode = 'normal'; // 'normal' | 'hint' | 'insert'
  var hintChars = 'asdfghjkl';
  var allHints = [];
  var typed = '';
  var container = null;
  var keyBuffer = '';

  // ─── Hint System ──────────────────────────────
  function getClickableElements() {
    var sel = 'a[href],button,input:not([type=hidden]),textarea,select,[role=button],[role=link],[role=tab],[onclick],[tabindex]:not([tabindex="-1"]),summary';
    var els = Array.from(document.querySelectorAll(sel));
    var result = [];
    for (var i = 0; i < els.length; i++) {
      var e = els[i];
      var r = e.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.top > window.innerHeight || r.bottom < 0) continue;
      if (r.left > window.innerWidth || r.right < 0) continue;
      var cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
      result.push({ el: e, rect: r });
    }
    return result;
  }

  function genLabels(count) {
    var labels = [];
    if (count <= hintChars.length) {
      for (var i = 0; i < count; i++) labels.push(hintChars[i]);
    } else {
      for (var a of hintChars) {
        for (var b of hintChars) {
          labels.push(a + b);
          if (labels.length >= count) return labels;
        }
      }
    }
    return labels;
  }

  function activateHints() {
    var els = getClickableElements();
    if (!els.length) return;

    container = document.createElement('div');
    container.id = 'vox-hints';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:none;font-family:Helvetica,Arial,sans-serif;';

    var labels = genLabels(els.length);
    allHints = [];

    for (var i = 0; i < els.length; i++) {
      var h = els[i];
      var label = labels[i];
      var d = document.createElement('div');
      d.textContent = label;
      d.dataset.label = label;
      d.style.cssText = 'position:absolute;z-index:2147483647;pointer-events:none;background:linear-gradient(to bottom,#fff785,#ffc542);color:#302505;font-size:11px;font-weight:bold;padding:1px 3px;border:1px solid #c38a22;border-radius:3px;box-shadow:0 3px 7px rgba(0,0,0,.3);white-space:nowrap;line-height:1.2;left:' + (h.rect.left + window.scrollX - 1) + 'px;top:' + (h.rect.top + window.scrollY - 1) + 'px;';
      container.appendChild(d);
      allHints.push({ label: label, el: h.el, div: d });
    }
    document.documentElement.appendChild(container);
    mode = 'hint';
    typed = '';
  }

  function updateHints() {
    if (!container) return;
    var matched = null;
    var matchCount = 0;
    for (var i = 0; i < allHints.length; i++) {
      var h = allHints[i];
      if (h.label === typed) {
        matched = h;
        h.div.style.background = '#00aa00';
        h.div.style.color = '#fff';
        h.div.style.borderColor = '#008800';
      } else if (h.label.indexOf(typed) === 0) {
        matchCount++;
        h.div.style.background = '#ffc542';
      } else {
        h.div.style.opacity = '0.15';
      }
    }
    if (matched) {
      exitHints();
      clickElement(matched.el);
    } else if (typed && !matchCount) {
      exitHints();
    }
  }

  function clickElement(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (el.tagName === 'A' && el.href) {
      window.location.href = el.href;
    } else {
      el.focus();
      el.click();
    }
  }

  function exitHints() {
    mode = 'normal';
    if (container) { container.remove(); container = null; }
    allHints = [];
    typed = '';
    keyBuffer = '';
  }

  // ─── Keyboard Handler ─────────────────────────
  function handleKey(e) {
    // Skip if in an input/textarea/contenteditable (let the page handle it)
    var tag = (e.target.tagName || '').toLowerCase();
    var inp = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;

    if (mode === 'hint') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (e.key === 'Escape') { exitHints(); return; }
      if (e.key === 'Backspace') {
        typed = typed.slice(0, -1);
        if (!typed) exitHints();
        else updateHints();
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        typed += e.key.toLowerCase();
        updateHints();
      }
      return;
    }

    if (mode === 'insert') {
      if (e.key === 'Escape') {
        e.preventDefault();
        mode = 'normal';
        keyBuffer = '';
      }
      return; // let page handle all other keys in insert mode
    }

    // ─── Normal mode ────────────────────────────
    if (inp) return; // don't intercept if focused in input

    if (e.key === 'Escape') {
      e.preventDefault();
      keyBuffer = '';
      return;
    }

    // Scroll commands
    var scrollAmount = window.innerHeight * 0.4;

    if (e.key === 'j') {
      e.preventDefault();
      window.scrollBy(0, scrollAmount);
      return;
    }
    if (e.key === 'k') {
      e.preventDefault();
      window.scrollBy(0, -scrollAmount);
      return;
    }
    if (e.key === 'h') {
      e.preventDefault();
      window.scrollBy(-scrollAmount, 0);
      return;
    }
    if (e.key === 'l') {
      e.preventDefault();
      window.scrollBy(scrollAmount, 0);
      return;
    }
    if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      window.scrollBy(0, window.innerHeight / 2);
      return;
    }
    if (e.key === 'u' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      window.scrollBy(0, -window.innerHeight / 2);
      return;
    }

    // Enter hint mode
    if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      activateHints();
      return;
    }
    if (e.key === 'F' && e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      activateHints();
      return;
    }

    // Enter insert mode
    if (e.key === 'i') {
      e.preventDefault();
      mode = 'insert';
      keyBuffer = '';
      return;
    }

    // Reload
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      window.location.reload();
      return;
    }

    // Go to top / bottom (gg / G)
    if (e.key === 'g') {
      if (keyBuffer === 'g') {
        e.preventDefault();
        window.scrollTo(0, 0);
        keyBuffer = '';
        return;
      }
      keyBuffer = 'g';
      return;
    }
    if (e.key === 'G' && e.shiftKey) {
      e.preventDefault();
      window.scrollTo(0, document.body.scrollHeight);
      keyBuffer = '';
      return;
    }

    // History
    if (e.key === 'H' && e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      window.history.back();
      return;
    }
    if (e.key === 'L' && e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      window.history.forward();
      return;
    }

    // Clear key buffer if no match
    keyBuffer = '';
  }

  // ─── Install ──────────────────────────────────
  // Use capture phase on window — fires before any page handlers (Vimium approach)
  window.addEventListener('keydown', handleKey, true);
})();
