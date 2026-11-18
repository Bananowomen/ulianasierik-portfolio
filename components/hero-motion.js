/* Progressive enhancement: the portrait/cards remain static without JavaScript.
   JS only drives pointer parallax (CSS custom properties), the one-shot
   arrival class, and play/pause state. All float/arrival motion lives in CSS. */
(() => {
  const visual = document.querySelector('.hero-visual');
  if (!visual) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const layers = [...visual.querySelectorAll('.floating-ui, .hero-query, .hero-mark')];
  let onscreen = false;
  let frame = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0;

  function paint() {
    const px = `${x.toFixed(2)}px`;
    const py = `${y.toFixed(2)}px`;
    visual.style.setProperty('--hero-px', px);
    visual.style.setProperty('--hero-py', py);
    visual.style.setProperty('--hero-nx', (x / 5).toFixed(3));
    visual.style.setProperty('--hero-ny', (y / 4).toFixed(3));
    for (const layer of layers) {
      layer.style.setProperty('--hero-px', px);
      layer.style.setProperty('--hero-py', py);
    }
  }
  function stopParallax() {
    cancelAnimationFrame(frame);
    frame = 0;
    x = y = targetX = targetY = 0;
    paint();
  }
  function active() { return onscreen && !document.hidden && !reduce.matches; }
  function sync() {
    const run = active();
    visual.classList.toggle('hero-motion-active', run);
    visual.dataset.heroMotion = run ? 'running' : 'paused';
    if (!run || !fine.matches) stopParallax();
  }
  function tick() {
    frame = 0;
    if (!active() || !fine.matches) return;
    x += (targetX - x) * .085;
    y += (targetY - y) * .085;
    paint();
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > .04) frame = requestAnimationFrame(tick);
  }
  function queue() { if (!frame) frame = requestAnimationFrame(tick); }
  visual.addEventListener('pointermove', event => {
    if (!active() || !fine.matches || event.pointerType === 'touch') return;
    const rect = visual.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - .5) * 10;
    targetY = ((event.clientY - rect.top) / rect.height - .5) * 8;
    queue();
  }, {passive: true});
  visual.addEventListener('pointerleave', () => {
    targetX = targetY = 0;
    if (active() && fine.matches) queue();
  }, {passive: true});

  /* Arrival choreography plays once via CSS; skipped entirely when the
     visitor prefers reduced motion (CSS also kills it as a backstop). */
  if (!reduce.matches) visual.classList.add('hero-enter');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      onscreen = entries[0].isIntersecting;
      sync();
    }, {threshold: .04});
    observer.observe(visual);
  } else {
    onscreen = true;
    sync();
  }
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', sync);
  fine.addEventListener('change', sync);
  paint();
  sync();
})();
