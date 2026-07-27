export const HINT_INJECTION_SCRIPT = `
(function() {
  if (window.__veloxHintsActive) return;
  window.__veloxHintsActive = true;
  window.__veloxHintLabels = {};

  const selectors = [
    'a[href]', 'button', 'input:not([type=hidden])', 'textarea', 'select',
    '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]',
    '[onclick]', '[tabindex]:not([tabindex="-1"])', 'summary', 'details',
    '[contenteditable="true"]', 'label[for]'
  ].join(', ');

  const elements = Array.from(document.querySelectorAll(selectors)).filter(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    if (rect.top > window.innerHeight || rect.bottom < 0) return false;
    if (rect.left > window.innerWidth || rect.right < 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    return true;
  });

  const chars = 'asdfghjkl';
  const labels = [];
  if (elements.length <= chars.length) {
    for (let i = 0; i < elements.length; i++) labels.push(chars[i]);
  } else {
    for (const c1 of chars) {
      for (const c2 of chars) {
        labels.push(c1 + c2);
        if (labels.length >= elements.length) break;
      }
      if (labels.length >= elements.length) break;
    }
  }

  const overlay = document.createElement('div');
  overlay.id = 'velox-hints-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:none;';

  elements.forEach((el, i) => {
    if (i >= labels.length) return;
    const rect = el.getBoundingClientRect();
    const label = labels[i];
    window.__veloxHintLabels[label] = el;

    const badge = document.createElement('div');
    badge.className = 'velox-hint-badge';
    badge.textContent = label;
    badge.dataset.veloxLabel = label;
    badge.style.cssText = \`
      position: fixed;
      left: \${rect.left + window.scrollX}px;
      top: \${rect.top + window.scrollY}px;
      z-index: 2147483647;
      pointer-events: none;
      background: rgba(124, 92, 252, 0.95);
      color: #fff;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 13px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.3);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      letter-spacing: 0.5px;
      white-space: nowrap;
      animation: veloxHintFadeIn 0.08s ease-out;
      backdrop-filter: blur(4px);
    \`;
    overlay.appendChild(badge);
  });

  const style = document.createElement('style');
  style.textContent = \`
    @keyframes veloxHintFadeIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    .velox-hint-badge.pressed {
      background: rgba(16, 185, 129, 0.95) !important;
      transform: scale(1.1);
    }
  \`;
  document.head.appendChild(style);
  document.body.appendChild(overlay);

  window.__veloxCurrentInput = '';

  window.__veloxHandleHintInput = function(char) {
    window.__veloxCurrentInput += char;
    const input = window.__veloxCurrentInput;

    document.querySelectorAll('.velox-hint-badge').forEach(badge => {
      const label = badge.dataset.veloxLabel;
      if (label === input) {
        badge.classList.add('pressed');
      } else if (!label.startsWith(input)) {
        badge.style.opacity = '0.15';
      }
    });

    if (window.__veloxHintLabels[input]) {
      window.__veloxSelectHint(input);
    } else {
      const hasMatch = Object.keys(window.__veloxHintLabels).some(l => l.startsWith(input));
      if (!hasMatch) window.__veloxCleanupHints();
    }
  };

  window.__veloxSelectHint = function(label) {
    const el = window.__veloxHintLabels[label];
    window.__veloxCleanupHints();
    if (el) {
      if (el.tagName === 'A' && el.href) {
        window.location.href = el.href;
      } else {
        el.focus();
        el.click();
      }
    }
  };

  window.__veloxCleanupHints = function() {
    window.__veloxHintsActive = false;
    window.__veloxHintLabels = {};
    window.__veloxCurrentInput = '';
    const overlay = document.getElementById('velox-hints-overlay');
    if (overlay) overlay.remove();
    const style = document.querySelector('style[data-velox-hint]');
    if (style) style.remove();
  };
})();
`

export const SCROLL_SCRIPT = {
  scrollDown: 'window.scrollBy({ top: window.innerHeight * 0.35, behavior: "smooth" })',
  scrollUp: 'window.scrollBy({ top: -window.innerHeight * 0.35, behavior: "smooth" })',
  scrollLeft: 'window.scrollBy({ left: -window.innerWidth * 0.35, behavior: "smooth" })',
  scrollRight: 'window.scrollBy({ left: window.innerWidth * 0.35, behavior: "smooth" })',
  goToTop: 'window.scrollTo({ top: 0, behavior: "smooth" })',
  goToBottom: 'window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })',
}
