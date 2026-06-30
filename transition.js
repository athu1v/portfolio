/**
 * TRANSITION.JS — 3-panel typographic page transition
 * Usage:
 *   window.TxOut('ux-ui.html', 'UX/UI DESIGN', '#ef4444')  → navigate away
 *   window.TxIn()                                           → reveal on new page load
 */
(function () {
  'use strict';

  var CFG = {
    textRepeat:    14,
    panelMs:       600,
    sideDelay:     120,
    fillDelay:     480,
    fillMs:        850,
    unfillDelay:   1410,   // fillDelay + fillMs + 80ms pause
    unfillMs:      650,
    navDelay:      2200,   // unfillDelay + unfillMs + 140ms buffer
    exitMs:        750,
  };

  /* ── Build overlay DOM ──────────────────────────────────── */
  function buildOverlay(text, color) {
    var old = document.getElementById('txOverlay');
    if (old) { old.remove(); }

    var panelColor = color || '#1a1614';

    var repeat = window.matchMedia('(max-width: 768px)').matches ? 8 : CFG.textRepeat;
    var words_o = '', words_f = '';
    for (var i = 0; i < repeat; i++) {
      words_o += '<span class="tx-word">' + text + '</span>';
      words_f += '<span class="tx-word">' + text + '</span>';
    }

    var el = document.createElement('div');
    el.id = 'txOverlay';
    el.setAttribute('aria-hidden', 'true');
    el.dataset.panelColor = panelColor;
    el.innerHTML =
      '<div class="tx-panels">' +
        '<div class="tx-p tx-p--l" style="background:' + panelColor + '"></div>' +
        '<div class="tx-p tx-p--c" style="background:' + panelColor + '"></div>' +
        '<div class="tx-p tx-p--r" style="background:' + panelColor + '"></div>' +
      '</div>' +
      '<div class="tx-text">' +
        '<div class="tx-words tx-words--o">' + words_o + '</div>' +
        '<div class="tx-words tx-words--f">' + words_f + '</div>' +
      '</div>';

    document.body.appendChild(el);
    return el;
  }

  /* ── ENTER: panels up → text fills → text empties → nav ── */
  function enter(el) {
    var center  = el.querySelector('.tx-p--c');
    var left    = el.querySelector('.tx-p--l');
    var right   = el.querySelector('.tx-p--r');
    var textEl  = el.querySelector('.tx-text');
    var filled  = el.querySelector('.tx-words--f');
    var outline = el.querySelector('.tx-words--o');

    // Panels start off-screen below
    [center, left, right].forEach(function (p) {
      p.style.transition = 'none';
      p.style.transform  = 'translateY(105%)';
    });
    filled.style.transition  = 'none';
    filled.style.clipPath    = 'inset(0 0 100% 0)';
    outline.style.opacity    = '0';
    textEl.style.opacity     = '1';

    // Panels carry their own background — overlay stays transparent to avoid a full-screen flash
    el.style.background = 'transparent';
    el.style.visibility = 'visible';
    el.offsetHeight;

    // Center rises first
    setTimeout(function () {
      center.style.transition = 'transform ' + CFG.panelMs + 'ms cubic-bezier(0.77,0,0.18,1)';
      center.style.transform  = 'translateY(0)';
    }, 10);

    // Sides follow
    setTimeout(function () {
      left.style.transition  = 'transform ' + CFG.panelMs + 'ms cubic-bezier(0.77,0,0.18,1)';
      right.style.transition = 'transform ' + CFG.panelMs + 'ms cubic-bezier(0.77,0,0.18,1)';
      left.style.transform   = 'translateY(0)';
      right.style.transform  = 'translateY(0)';
    }, CFG.sideDelay);

    // Fill text top-to-bottom
    setTimeout(function () {
      filled.style.transition = 'clip-path ' + CFG.fillMs + 'ms cubic-bezier(0.65,0,0.35,1)';
      filled.style.clipPath   = 'inset(0 0 0% 0)';
    }, CFG.fillDelay);

    // Un-fill: drain text back out bottom-to-top
    setTimeout(function () {
      filled.style.transition = 'clip-path ' + CFG.unfillMs + 'ms cubic-bezier(0.65,0,0.35,1)';
      filled.style.clipPath   = 'inset(100% 0 0 0)';
      // Fade outline at the same time so only solid panel remains
      outline.style.transition = 'opacity ' + CFG.unfillMs + 'ms ease';
      outline.style.opacity    = '0';
    }, CFG.unfillDelay);
  }

  /* ── EXIT: solid colored block slides down ──────────────── */
  function exit(el) {
    var panelColor = el.dataset.panelColor || '#1a1614';

    // Replace inner HTML with a single solid block for a clean slide-down
    el.innerHTML = '';
    el.style.background = panelColor;
    el.style.transform  = 'translateY(0)';
    el.style.transition = 'none';
    el.style.visibility = 'visible';
    el.offsetHeight;

    // Slide the whole block down to reveal new page
    setTimeout(function () {
      el.style.transition = 'transform ' + CFG.exitMs + 'ms ease';
      el.style.transform  = 'translateY(100%)';
    }, 60);

    setTimeout(function () {
      el.style.visibility = 'hidden';
    }, 60 + CFG.exitMs + 30);
  }

  var PRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── PUBLIC API ─────────────────────────────────────────── */
  window.TxOut = function (url, text, color) {
    if (PRM) { window.location.href = url; return; }
    // Hide scanner lines during transition (grain/vignette stay visible)
    var scanners = document.querySelector('.page-scanner-lines');
    if (scanners) scanners.style.visibility = 'hidden';
    // Hide UFO cursor + beam immediately when leaving contact page
    var ufo = document.querySelector('.ufo-cursor');
    if (ufo) { ufo.style.transition = 'none'; ufo.style.opacity = '0'; ufo.style.visibility = 'hidden'; }
    var beam = document.querySelector('.ufo-beam');
    if (beam) { beam.style.animation = 'none'; beam.style.opacity = '0'; beam.style.visibility = 'hidden'; }
    var cone = document.querySelector('.ct-beam-cone');
    if (cone) { cone.style.transition = 'none'; cone.style.opacity = '0'; cone.style.visibility = 'hidden'; }

    sessionStorage.setItem('txText',  text  || 'LOADING');
    sessionStorage.setItem('txColor', color || '');
    var el = buildOverlay(text || 'LOADING', color || null);
    enter(el);
    setTimeout(function () { window.location.href = url; }, CFG.navDelay);
  };

  window.TxIn = function () {
    var text  = sessionStorage.getItem('txText');
    var color = sessionStorage.getItem('txColor') || null;
    if (!text) return;
    sessionStorage.removeItem('txText');
    sessionStorage.removeItem('txColor');
    if (PRM) return;

    var panelColor = color || '#1a1614';

    // Hide scanner lines for duration of slide (grain/vignette stay visible)
    var scanners = document.querySelector('.page-scanner-lines');
    if (scanners) scanners.style.visibility = 'hidden';

    // Remove any stale overlay
    var old = document.getElementById('txOverlay');
    if (old) { old.remove(); }

    // Minimal solid block — no innerHTML, no panels, nothing that can flash
    var el = document.createElement('div');
    el.id = 'txOverlay';
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText =
      'position:fixed;inset:0;z-index:9900;background:' + panelColor +
      ';transform:translateY(0);visibility:visible;pointer-events:none;overflow:hidden;';
    document.body.appendChild(el);
    el.offsetHeight;

    setTimeout(function () {
      var cover = document.getElementById('txInitCover');
      if (cover) cover.remove();
      el.style.transition = 'transform ' + CFG.exitMs + 'ms ease';
      el.style.transform  = 'translateY(100%)';
    }, 400);
    setTimeout(function () {
      el.style.visibility = 'hidden';
      if (el.parentNode) el.parentNode.removeChild(el);
      // Restore scanner lines after slide completes
      var sc = document.querySelector('.page-scanner-lines');
      if (sc) sc.style.visibility = '';
    }, 400 + CFG.exitMs + 30);
  };

  // ── bfcache: geri/ileri navigasyonunda overlay kalıntılarını temizle ────
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    var overlay = document.getElementById('txOverlay');
    if (overlay) overlay.remove();
    var cover = document.getElementById('txInitCover');
    if (cover) cover.remove();
    var scanners = document.querySelector('.page-scanner-lines');
    if (scanners) scanners.style.visibility = '';
  });

  // ── Sürekli mouse pozisyonu takibi — her hareketle sessionStorage güncelle
  // Sayfa geçişleri sırasında eski sayfa hâlâ çalışır ve yazar;
  // yeni sayfa init'te okur → cursor anında doğru yerde başlar.
  document.addEventListener('mousemove', function(e) {
    sessionStorage.setItem('mx', e.clientX);
    sessionStorage.setItem('my', e.clientY);
  }, { passive: true });

})();
