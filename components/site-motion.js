/* Site motion — restrained page-level affordances only.
   Reading progress bar, nav current-section marker and a soft section
   reveal. Reveal is JS-gated: this file adds .js-motion + .reveal and
   then .visible via IntersectionObserver, so without JS, without
   IntersectionObserver, or under prefers-reduced-motion nothing is
   ever hidden. Reveal never targets scene roots or their ancestors
   (.google-story, .chatgpt-story, .hero-visual, main.shell, .hero);
   scenes own their own animation and this file touches none of it. */
(() => {
  'use strict';
  const root = document.documentElement;

  /* --- Reading progress -------------------------------------------- */
  const bar = document.createElement('div');
  bar.className = 'sm-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  let ticking = false;
  function paintProgress() {
    ticking = false;
    if (document.hidden) return;
    const max = root.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
  }
  function queueProgress() {
    if (!ticking) { ticking = true; requestAnimationFrame(paintProgress); }
  }
  window.addEventListener('scroll', queueProgress, { passive: true });
  window.addEventListener('resize', queueProgress, { passive: true });
  paintProgress();

  /* --- Nav orientation --------------------------------------------- */
  const navLinks = new Map();
  for (const a of document.querySelectorAll('.nav a[href^="#"]')) {
    navLinks.set(a.getAttribute('href').slice(1), a);
  }
  if (navLinks.size && 'IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const [id, a] of navLinks) {
          const on = id === entry.target.id;
          a.classList.toggle('sm-current', on);
          if (on) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        }
      }
    }, { rootMargin: '-40% 0px -55% 0px' });
    for (const id of navLinks.keys()) {
      const section = document.getElementById(id);
      if (section) navObserver.observe(section);
    }
  }

  /* --- Soft section reveal ------------------------------------------
     Candidates are ordinary sections/cards outside the animated scenes.
     Anything already near the viewport is revealed in the same frame,
     so fast scrolling never leaves blank holes. */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    const candidates = document.querySelectorAll(
      'main > section.letter, main > section.services, main > section.work, ' +
      'main > section.selection, main > section#method, main > section.contact'
    );
    const targets = [...candidates].filter(el =>
      !el.closest('.google-story, .chatgpt-story, .hero, .hero-visual') &&
      !el.classList.contains('google-story') &&
      !el.classList.contains('chatgpt-story')
    );
    if (targets.length) {
      root.classList.add('js-motion');
      for (const el of targets) el.classList.add('reveal');
      const revealObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      for (const el of targets) revealObserver.observe(el);
    }
  }
})();
