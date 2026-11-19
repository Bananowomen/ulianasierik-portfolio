(function () {
  'use strict';
  var section = document.getElementById('chatgpt-story');
  if (!section) return;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var TOTAL = 11500;
  var RANGES = {
    'intro': [0.170, 0.222],
    'firm1-title': [0.222, 0.245],
    'firm1-body': [0.245, 0.289],
    'firm2-title': [0.293, 0.316],
    'firm2-body': [0.316, 0.359],
    'firm3-title': [0.363, 0.386],
    'firm3-body': [0.386, 0.430],
    'followup': [0.474, 0.540],
    'reply': [0.563, 0.600]
  };
  var PHASES = ['question', 'offer', 'choose', 'web', 'intent'];
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function phaseFor(p) {
    return p >= 0.700 ? 'intent' : p >= 0.585 ? 'web' : p >= 0.430 ? 'choose' : p >= 0.222 ? 'offer' : 'question';
  }

  function splitElement(el) {
    var original = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!original) return null;
    var words = original.split(' ');
    el.textContent = '';
    var sr = document.createElement('span');
    sr.className = 'cs-sr-only';
    sr.textContent = original;
    el.appendChild(sr);
    var visual = document.createElement('span');
    visual.className = 'cs-stream-visual';
    visual.setAttribute('aria-hidden', 'true');
    var wordEls = [];
    words.forEach(function (word, i) {
      var w = document.createElement('span');
      w.className = 'cs-word';
      w.textContent = word;
      visual.appendChild(w);
      wordEls.push(w);
      if (i < words.length - 1) visual.appendChild(document.createTextNode(' '));
    });
    el.appendChild(visual);
    var range = RANGES[el.getAttribute('data-cs-stream')] || [0.5, 0.6];
    return { el: el, words: wordEls, start: range[0], end: range[1], lastCount: -1 };
  }

  var streams = [];
  var firmEls = [section.querySelector('.cs-firm-one'), section.querySelector('.cs-firm-two'), section.querySelector('.cs-firm-three')];
  var countEl = section.querySelector('.cs-phase-count');
  var conv = section.querySelector('.cs-conversation');
  var pauseBtn = section.querySelector('.cs-pause');
  var replayBtn = section.querySelector('.cs-replay');
  var prepared = false;
  function prepare() {
    if (prepared) return; prepared = true;
    var nodes = section.querySelectorAll('[data-cs-stream]');
    for (var i = 0; i < nodes.length; i++) { var s = splitElement(nodes[i]); if (s) streams.push(s); }
  }

  function setStream(stream, p, snap) {
    var local = clamp((p - stream.start) / (stream.end - stream.start));
    var count = Math.round(local * stream.words.length);
    if (!snap && stream.lastCount >= 0) {
      var delta = count - stream.lastCount;
      if (delta > 2) count = stream.lastCount + 2;
      else if (delta < -2) count = stream.lastCount - 2;
    }
    if (count !== stream.lastCount) {
      stream.lastCount = count;
      for (var i = 0; i < stream.words.length; i++) stream.words[i].classList.toggle('is-on', i < count);
    }
    var streaming = local > 0 && local < 1;
    stream.el.classList.toggle('cs-streaming', streaming);
    for (var c = 0; c < stream.words.length; c++) stream.words[c].classList.toggle('cs-caret', streaming && c === count - 1);
  }

  var SHOW_CLASSES = ['cs-show-thinking', 'cs-show-answer', 'cs-show-first', 'cs-show-second', 'cs-show-third', 'cs-show-draft', 'cs-show-followup', 'cs-show-reply', 'cs-show-link', 'cs-show-tap', 'cs-link-pressed', 'cs-show-browser', 'cs-show-intent', 'cs-is-generating'];
  var lastPhase = '';
  var rootArrow = section.querySelector('.cs-explain-arrow');
  var rootArrowLabel = section.querySelector('.cs-callout-text');
  var rootColumn = section.querySelector('.cs-device-column');
  var rootPhone = section.querySelector('.cs-device');
  function placeRootArrow(p) {
    if (!rootArrow || !rootColumn || !rootPhone) return;
    var target = p >= .585 ? section.querySelector('.cs-link-card') : p >= .474 ? section.querySelector('.cs-followup-bubble') : firmEls[1];
    var base = rootColumn.getBoundingClientRect();
    if (!target) return;
    var r = target.getBoundingClientRect();
    rootArrow.style.opacity = p >= .363 ? '1' : '0';
    rootArrow.style.left = (r.right - base.left + (innerWidth >= 1200 ? 42 : 17)).toFixed(2) + 'px';
    rootArrow.style.top = (r.top - base.top + r.height/2 - rootArrow.offsetHeight/2).toFixed(2) + 'px';
    if (rootArrowLabel) rootArrowLabel.textContent = p >= .585 ? 'Kontakt na konkurenta.' : p >= .474 ? 'Pýta sa na kontakt.' : 'Kontrola zmlúv.';
  }
  function render(p, snap) {
    section.style.setProperty('--cs-progress', p.toFixed(4));
    section.classList.toggle('cs-show-thinking', p >= 0.104 && p < 0.170);
    section.classList.toggle('cs-show-answer', p >= 0.170);
    section.classList.toggle('cs-show-first', p >= 0.222);
    section.classList.toggle('cs-show-second', p >= 0.293);
    section.classList.toggle('cs-show-third', p >= 0.363);
    section.classList.toggle('cs-show-draft', p >= 0.430 && p < 0.474);
    section.classList.toggle('cs-show-followup', p >= 0.474);
    section.classList.toggle('cs-show-reply', p >= 0.563);
    section.classList.toggle('cs-show-link', p >= 0.585);
    section.classList.toggle('cs-show-intent', p >= 0.700);
    section.classList.toggle('cs-is-generating', (p >= 0.170 && p < 0.430) || (p >= 0.563 && p < 0.600));
    var phase = phaseFor(p);
    if (phase !== lastPhase) {
      lastPhase = phase;
      section.dataset.csPhase = phase;
      if (countEl) countEl.textContent = (PHASES.indexOf(phase) + 1) + ' / 5';
    }
    for (var i = 0; i < streams.length; i++) setStream(streams[i], p, snap);
    var activeAt = [0.245, 0.316, 0.386];
    for (var f = 0; f < 3; f++) if (firmEls[f]) firmEls[f].classList.toggle('cs-firm-active', p >= activeAt[f]);
    if (firmEls[1]) firmEls[1].classList.toggle('cs-selected', p >= 0.540);
    if (conv && conv.scrollHeight > conv.clientHeight + 2) {
      conv.scrollTop = (conv.scrollHeight - conv.clientHeight) * clamp((p - 0.430) / 0.237);
    }
    placeRootArrow(p);
  }

  /* Time-driven player. Scroll is never read. */
  var mode = 'idle';
  var elapsedBase = 0, segStart = 0, elapsedNow = 0, raf = 0, autoPaused = false, started = false, deviceVisible = false;

  function setPauseLabel() {
    if (!pauseBtn) return;
    var paused = mode === 'paused';
    pauseBtn.disabled = mode === 'done';
    pauseBtn.textContent = paused ? 'Pokračovať' : 'Pozastaviť';
    pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
  }
  function tick(now) {
    raf = 0;
    if (mode !== 'playing') return;
    elapsedNow = elapsedBase + (now - segStart) * 2;
    if (elapsedNow >= TOTAL) {
      elapsedNow = TOTAL;
      elapsedBase = TOTAL;
      mode = 'done';
      render(1, true);
      setPauseLabel();
      return;
    }
    render(elapsedNow / TOTAL, false);
    raf = window.requestAnimationFrame(tick);
  }
  function play(fromElapsed) {
    elapsedBase = fromElapsed || 0;
    elapsedNow = elapsedBase;
    segStart = performance.now();
    mode = 'playing';
    started = true;
    autoPaused = false;
    render(elapsedBase / TOTAL, true);
    setPauseLabel();
    if (!raf) raf = window.requestAnimationFrame(tick);
  }
  function pause(auto) {
    if (mode !== 'playing') return;
    elapsedBase = elapsedNow;
    mode = 'paused';
    autoPaused = !!auto;
    if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
    setPauseLabel();
  }
  function resume() {
    if (mode !== 'paused') return;
    segStart = performance.now();
    mode = 'playing';
    autoPaused = false;
    setPauseLabel();
    if (!raf) raf = window.requestAnimationFrame(tick);
  }

  function setStatic() {
    if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
    mode = 'idle'; started = false;
    section.removeAttribute('data-cs-phase');
    section.classList.remove('is-animated');
    for (var i = 0; i < SHOW_CLASSES.length; i++) section.classList.remove(SHOW_CLASSES[i]);
    section.style.removeProperty('--cs-progress');
    for (var s = 0; s < streams.length; s++) {
      for (var j = 0; j < streams[s].words.length; j++) streams[s].words[j].classList.add('is-on');
      streams[s].el.classList.remove('cs-streaming');
      streams[s].lastCount = streams[s].words.length;
    }
    if (firmEls[1]) firmEls[1].classList.remove('cs-selected');
    setPauseLabel();
  }
  function setAnimated() {
    prepare();
    section.classList.add('is-animated');
    elapsedBase = 0; elapsedNow = 0; mode = 'idle'; started = false; lastPhase = '';
    render(0, true);
    setPauseLabel();
    if (device && !document.hidden) {
      var rect = device.getBoundingClientRect();
      var visibleHeight = Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top);
      if (rect.height > 0 && visibleHeight >= rect.height * 0.75) play(0);
    }
  }
  function configure() {
    if (motion.matches || !('IntersectionObserver' in window)) { setStatic(); return; }
    setAnimated();
  }

  if (pauseBtn) pauseBtn.addEventListener('click', function () {
    if (motion.matches) return;
    if (mode === 'playing') pause(false);
    else if (mode === 'paused') resume();
    else if (mode === 'done') play(0);
    else if (!started) play(0);
  });
  if (replayBtn) replayBtn.addEventListener('click', function () {
    if (motion.matches) return;
    play(0);
  });

  if ('IntersectionObserver' in window) {
    var device = section.querySelector('.cs-device') || section;
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      deviceVisible = e.intersectionRatio >= 0.25;
      if (motion.matches) return;
      if (e.intersectionRatio >= 0.75) {
        if (!started && mode === 'idle') play(0);
        else if (mode === 'paused' && autoPaused) resume();
      } else if (e.intersectionRatio < 0.25) {
        if (mode === 'playing') pause(true);
      }
    }, { threshold: [0, 0.25, 0.75] }).observe(device);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (mode === 'playing') pause(true); }
    else if (mode === 'paused' && autoPaused && deviceVisible) resume();
  });
  if (motion.addEventListener) motion.addEventListener('change', configure);
  else if (motion.addListener) motion.addListener(configure);
  configure();
  section._csPlayer = { play: function () { play(0); }, pause: function () { pause(false); }, resume: resume, state: function () { return { mode: mode, elapsed: elapsedNow }; } };
})();
