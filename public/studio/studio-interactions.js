(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function initClaimCounter(root) {
    const buttons = Array.from(root.querySelectorAll('.cc-btn'));
    const panels = Array.from(root.querySelectorAll('.cc-panel'));
    function setSide(side) {
      root.setAttribute('data-active', side);
      buttons.forEach((b) => b.setAttribute('aria-pressed', b.getAttribute('data-side') === side ? 'true' : 'false'));
      panels.forEach((p) => {
        const isActive = p.getAttribute('data-side') === side;
        if (isActive) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
    }
    root.addEventListener('click', (e) => {
      const t = e.target;
      const el = t instanceof Element ? t : null;
      const btn = el ? el.closest('.cc-btn') : null;
      if (!btn) return;
      e.preventDefault();
      const side = btn.getAttribute('data-side') === 'right' ? 'right' : 'left';
      setSide(side);
    });
  }

  function initDialectic(root) {
    const tabs = Array.from(root.querySelectorAll('.dialectic-tab'));
    const panels = Array.from(root.querySelectorAll('.dialectic-panel'));
    function setActive(name) {
      root.setAttribute('data-active', name);
      tabs.forEach((t) => t.setAttribute('aria-selected', t.id.endsWith(`-tab-${name}`) ? 'true' : 'false'));
      panels.forEach((p) => {
        const isActive = p.id.endsWith(`-panel-${name}`);
        if (isActive) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
    }
    root.addEventListener('click', (e) => {
      const t = e.target;
      const el = t instanceof Element ? t : null;
      const btn = el ? el.closest('.dialectic-tab') : null;
      if (!btn) return;
      e.preventDefault();
      if (btn.id.endsWith('-tab-thesis')) setActive('thesis');
      else if (btn.id.endsWith('-tab-antithesis')) setActive('antithesis');
      else if (btn.id.endsWith('-tab-synthesis')) setActive('synthesis');
    });
    root.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      if (!(activeEl instanceof HTMLElement) || !activeEl.classList.contains('dialectic-tab')) return;
      const idx = tabs.indexOf(activeEl);
      if (idx === -1) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = tabs[(idx + 1) % tabs.length];
        next.focus(); next.click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
        prev.focus(); prev.click();
      }
    });
  }

  function computeDefPlacement(root) {
    const prop = root.getAttribute('data-placement-prop') || 'auto';
    if (prop !== 'auto') return prop;
    const rect = root.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const rightSpace = vw - rect.right;
    if (vw >= 1024 && rightSpace > 260) return 'side';
    return 'below';
  }

  function initDefinitionPopover(root) {
    const trigger = root.querySelector('.def-trigger');
    const panel = root.querySelector('.def-panel');
    if (!trigger || !panel) return;

    function openPanel() {
      const placement = computeDefPlacement(root);
      root.setAttribute('data-placement', placement);
      panel.removeAttribute('hidden');
      void panel.offsetWidth;
      panel.classList.add('is-visible');
      trigger.setAttribute('aria-expanded', 'true');
    }

    function closePanel() {
      panel.classList.remove('is-visible');
      panel.setAttribute('hidden', '');
      trigger.setAttribute('aria-expanded', 'false');
    }

    function togglePanel() {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      if (expanded) closePanel();
      else {
        document.querySelectorAll('.def-popover-wrapper .def-trigger[aria-expanded="true"]').forEach((btn) => {
          const wrap = btn.closest('.def-popover-wrapper');
          const pnl = wrap ? wrap.querySelector('.def-panel') : null;
          if (pnl && btn instanceof HTMLElement) {
            pnl.classList.remove('is-visible');
            pnl.setAttribute('hidden', '');
            btn.setAttribute('aria-expanded', 'false');
          }
        });
        openPanel();
      }
    }

    const trigMode = root.getAttribute('data-trigger') || 'click';
    if (trigMode === 'hover') {
      let hoverTimer = null;
      root.addEventListener('mouseenter', () => {
        if (hoverTimer) window.clearTimeout(hoverTimer);
        openPanel();
      });
      root.addEventListener('mouseleave', () => {
        hoverTimer = window.setTimeout(() => closePanel(), 100);
      });
    } else {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        togglePanel();
      });
    }

    document.addEventListener('click', (e) => {
      const t = e.target;
      const el = t instanceof Element ? t : null;
      if (el && !el.closest(`#${root.id}`)) {
        if (trigger.getAttribute('aria-expanded') === 'true') closePanel();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') closePanel();
    });
  }

  function initFootnotes() {
    function closeAll(exceptId) {
      document.querySelectorAll('.footnote-content').forEach((el) => {
        const id = el.id;
        const shouldSkip = exceptId && id === `${exceptId}-content`;
        if (!shouldSkip) {
          el.setAttribute('hidden', '');
          el.classList.remove('is-visible');
        }
      });
      document.querySelectorAll('.footnote-trigger').forEach((el) => {
        const button = el;
        const id = button.getAttribute('data-footnote-id');
        const shouldSkip = exceptId && id === exceptId;
        if (!shouldSkip) button.setAttribute('aria-expanded', 'false');
      });
    }

    document.addEventListener('click', (e) => {
      const t = e.target;
      const el = t instanceof Element ? t : null;
      const button = el ? el.closest('.footnote-trigger') : null;
      if (!button) return;
      e.preventDefault();
      const footnoteId = button.getAttribute('data-footnote-id');
      if (!footnoteId) return;
      const content = document.getElementById(`${footnoteId}-content`);
      if (!content) return;
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        content.setAttribute('hidden', '');
        content.classList.remove('is-visible');
        button.setAttribute('aria-expanded', 'false');
      } else {
        closeAll(footnoteId);
        content.removeAttribute('hidden');
        void content.offsetWidth;
        content.classList.add('is-visible');
        button.setAttribute('aria-expanded', 'true');
      }
    });

    document.addEventListener('click', (e) => {
      const t = e.target;
      const el = t instanceof Element ? t : null;
      if (!el || !el.closest('.footnote-wrapper')) closeAll();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });
  }

  ready(function () {
    document.querySelectorAll('.cc').forEach((el) => initClaimCounter(el));
    document.querySelectorAll('.dialectic').forEach((el) => initDialectic(el));
    document.querySelectorAll('.def-popover-wrapper').forEach((el) => initDefinitionPopover(el));
    initFootnotes();
  });
})();
