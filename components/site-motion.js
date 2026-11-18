/* Site motion — restrained page-level affordances only.
   Reading progress bar + nav current-section marker. Ordinary content is
   NEVER hidden pending reveal: no opacity-0 arrivals on prose or panels
   (root quality decision — delayed reveals created white holes on fast
   scroll). Scenes own their own animation; this file touches none of it. */
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
})();
