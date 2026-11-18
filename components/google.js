(function () {
  'use strict';
  var section = document.getElementById('google-story');
  if (!section) return;
  var phone = section.querySelector('.gs-phone');
  var stage = section.querySelector('.gs-stage');
  var organic = section.querySelector('.gs-organic h4');
  var competitors = section.querySelector('.gs-competitor-list');
  var selected = section.querySelector('.gs-competitor-b');
  var caption = section.querySelector('.gs-mobile-focus');
  var toggle = section.querySelector('[data-gs-toggle]');
  var replay = section.querySelector('[data-gs-replay]');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var annotations = [section.querySelector('.gs-callout-ai'), section.querySelector('.gs-callout-web'), section.querySelector('.gs-callout-here')];
  var PHASES = [
    'Zákazník hľadá právnika. Váš web je prvý medzi odkazmi.',
    'Nad vaším odkazom sa objavia tri konkurenčné firmy.',
    'Všíma si kanceláriu, ktorá rieši zmluvy.',
    'Váš web je prvý medzi odkazmi. V odpovedi AI však chýba.',
    'Váš web je prvý medzi odkazmi. V odpovedi AI však chýba.'
  ];
  var duration = 10500;
  var enabled = false, started = false, paused = false, finished = false, visible = false;
  var elapsed = 0, previousTime = 0, frameId = 0, phase = -1, geometryTime = -100;
  function clamp(x) { return Math.max(0, Math.min(1, x)); }
  function progress(t, a, b) { var p = clamp((t-a)/(b-a)); return p*p*(3-2*p); }
  function set(name, value) { section.style.setProperty('--gs-' + name, value.toFixed(4)); }
  function positionAnnotations(nav) {
    if (!enabled || !stage || !phone) return;
    var base = stage.getBoundingClientRect();

    var desktop = window.innerWidth >= 1200;

    var targets = [competitors, organic, selected];
    annotations.forEach(function (label, i) {
      if (!label || !targets[i]) return;
      var r = targets[i].getBoundingClientRect();
      label.style.left = (r.right - base.left + (desktop ? 42 : 17)).toFixed(2) + 'px';
      label.style.top = (r.top - base.top + r.height/2 - label.offsetHeight/2).toFixed(2) + 'px';
    });
  }
  function buttons() {
    if (!toggle) return;
    toggle.textContent = paused ? 'Pokračovať' : 'Pozastaviť';
    toggle.disabled = finished;
    toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
  }
  function paint(ms) {
    var t = ms/1000;
    var expand = progress(t, 2, 2.65), a = progress(t, 2.65, 3.35), b = progress(t, 3.35, 4.05), c = progress(t, 4.05, 4.75);
    var choose = progress(t, 5, 5.55), nav = 0;
    set('progress', ms/duration); set('expanded', expand);
    set('card-a', a); set('card-b', b); set('card-c', c);
    set('sel', choose); set('pointer', progress(t, 5, 5.9)); set('ripple', progress(t, 6, 6.85));
    set('nav', nav); set('organic', 1-choose);
    set('call-ai', c*(1-choose)); set('call-web', 1-nav); set('call-here', choose);
    var next = t < 2 ? 0 : t < 5 ? 1 : t < 7 ? 2 : t < 9 ? 3 : 4;
    if (next !== phase) {
      phase = next;
      if (caption) caption.textContent = PHASES[phase];
      section.dataset.gsPhase = String(phase);
    }
    section.dataset.gsTime = t.toFixed(2);
    section.dataset.gsState = finished ? 'finished' : paused ? 'paused' : started && visible && !document.hidden ? 'playing' : 'waiting';
    if (ms - geometryTime >= 50 || ms < geometryTime) { positionAnnotations(nav); geometryTime = ms; }
  }
  function frame(now) {
    frameId = 0;
    if (!enabled || !started || paused || finished || !visible || document.hidden) { previousTime = 0; return; }
    if (previousTime) elapsed += Math.min(100, now - previousTime) * 2;
    previousTime = now;
    if (elapsed >= duration) { elapsed = duration; finished = true; }
    paint(elapsed);
    if (finished) { buttons(); previousTime = 0; return; }
    frameId = requestAnimationFrame(frame);
  }
  function kick() {
    if (enabled && started && !paused && !finished && visible && !document.hidden && !frameId) {
      previousTime = 0;
      frameId = requestAnimationFrame(frame);
    }
  }
  function configure() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0; previousTime = 0; elapsed = 0; geometryTime = -100;
    phase = -1; started = false; paused = false; finished = false;
    enabled = !motion.matches && 'IntersectionObserver' in window;
    section.classList.toggle('is-animated', enabled);
    if (!enabled) {
      section.removeAttribute('style');
      ['gsPhase','gsTime','gsState'].forEach(function (key) { delete section.dataset[key]; });
    } else {
      paint(0); buttons();
      if (visible) { started = true; kick(); }
    }
  }
  if ('IntersectionObserver' in window && phone) {
    new IntersectionObserver(function (entries) {
      var ratio = entries[0].intersectionRatio;
      visible = ratio >= .25;
      if (enabled && ratio >= .75) started = true;
      if (!visible) previousTime = 0;
      kick();
    }, {threshold:[0,.25,.75]}).observe(phone);
  }
  if (toggle) toggle.addEventListener('click', function () {
    if (!enabled || finished) return;
    paused = !paused; started = true; previousTime = 0;
    buttons(); paint(elapsed); kick();
  });
  if (replay) replay.addEventListener('click', function () {
    elapsed = 0; finished = false; paused = false; started = true; phase = -1; previousTime = 0; geometryTime = -100;
    paint(0); buttons(); kick();
  });
  document.addEventListener('visibilitychange', function () { previousTime = 0; kick(); });
  window.addEventListener('resize', function () { positionAnnotations(progress(elapsed/1000,7,8.2)); }, {passive:true});
  if (document.fonts) document.fonts.ready.then(function () { positionAnnotations(progress(elapsed/1000,7,8.2)); });
  if (motion.addEventListener) motion.addEventListener('change', configure);
  else if (motion.addListener) motion.addListener(configure);
  configure();
})();
