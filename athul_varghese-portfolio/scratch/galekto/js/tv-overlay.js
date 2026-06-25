/**
 * tv-overlay.js — Page-level CRT effects v3
 * 1. Grain canvas animation
 * 2. Barrel clip-path on .page-tv-frame (dark bezel, evenodd)
 * 3. Barrel clip-path on .page-crt-bevel (glass bevel, inner path)
 * 4. Scanner lines: always from top, occasional group bursts
 */
(function () {
  'use strict';

  /* ── 1. GRAIN ─────────────────────────────────────────────── */
  function initPageGrain() {
    var canvas = document.getElementById('pageGrainCanvas');
    if (!canvas) return;

    var W = 800, H = 600;
    canvas.width  = W;
    canvas.height = H;

    var ctx  = canvas.getContext('2d');
    var img  = ctx.createImageData(W, H);
    var data = img.data;
    var tick = 0;

    function draw() {
      tick++;
      if (tick % 2 === 0) {
        for (var i = 0; i < data.length; i += 4) {
          var v = (Math.random() * 255) | 0;
          data[i]     = v;
          data[i + 1] = v;
          data[i + 2] = v;
          data[i + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ── 2 & 3. BARREL CRT FRAME + BEVEL ─────────────────────── */
  function computeBarrelPaths() {
    var vv = window.visualViewport;
    var W = vv ? Math.round(vv.width)  : window.innerWidth;
    var H = vv ? Math.round(vv.height) : window.innerHeight;
    var isMobile = W <= 768;

    var M_CORNER = isMobile ? 12 : 38;
    var M_MID    = isMobile ? 4  : 8;
    var R        = isMobile
      ? Math.min(Math.max(18, W * 0.030), 28)
      : Math.min(Math.max(40, W * 0.042), 70);

    var inner = [
      'M ' + (M_CORNER + R) + ',' + M_CORNER,
      'Q ' + (W / 2) + ',' + M_MID + ' ' + (W - M_CORNER - R) + ',' + M_CORNER,
      'Q ' + (W - M_CORNER) + ',' + M_CORNER + ' ' + (W - M_CORNER) + ',' + (M_CORNER + R),
      'Q ' + (W - M_MID) + ',' + (H / 2) + ' ' + (W - M_CORNER) + ',' + (H - M_CORNER - R),
      'Q ' + (W - M_CORNER) + ',' + (H - M_CORNER) + ' ' + (W - M_CORNER - R) + ',' + (H - M_CORNER),
      'Q ' + (W / 2) + ',' + (H - M_MID) + ' ' + (M_CORNER + R) + ',' + (H - M_CORNER),
      'Q ' + M_CORNER + ',' + (H - M_CORNER) + ' ' + M_CORNER + ',' + (H - M_CORNER - R),
      'Q ' + M_MID + ',' + (H / 2) + ' ' + M_CORNER + ',' + (M_CORNER + R),
      'Q ' + M_CORNER + ',' + M_CORNER + ' ' + (M_CORNER + R) + ',' + M_CORNER,
      'Z'
    ].join(' ');

    var outer = 'M 0,0 L ' + W + ',0 L ' + W + ',' + H + ' L 0,' + H + ' Z';

    return { inner: inner, outer: outer };
  }

  function setPageCRTShape() {
    var paths = computeBarrelPaths();
    var W = window.innerWidth, H = window.innerHeight;

    var frame = document.querySelector('.page-tv-frame');
    if (frame) {
      frame.style.clipPath = "path(evenodd, '" + paths.outer + ' ' + paths.inner + "')";
    }

    var bevel = document.querySelector('.page-crt-bevel');
    if (bevel) {
      bevel.style.clipPath = "path('" + paths.inner + "')";
    }

    // Update SVG stroke path on resize
    var sv = document.querySelector('.page-tv-stroke');
    if (sv) {
      sv.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      sv.style.clipPath = "path('" + paths.inner + "')";
      var p = sv.querySelector('path');
      if (!p) {
        p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', 'rgba(30,28,26,0.10)');
        p.setAttribute('stroke-width', '6');
        sv.appendChild(p);
      }
      p.setAttribute('d', paths.inner);
    }
  }

  /* ── 4. SCANNER LINES ─────────────────────────────────────── */
  function initScanners() {
    var container = document.querySelector('.page-scanner-lines');
    if (!container) return;
    var spans = container.querySelectorAll('span');
    if (!spans.length) return;

    // Helper: restart a span's animation from top immediately
    // delay: seconds before the line appears (small value = almost instant from top)
    function restartFromTop(span, delayS) {
      span.style.setProperty('--del', (delayS || 0).toFixed(3) + 's');
      span.style.animationName = 'none';
      span.offsetWidth; // reflow forces animation reset
      span.style.animationName = '';
    }

    // Random show/hide of span[2] — changes line count between sweeps
    function randomizeCount() {
      if (spans[2]) {
        spans[2].style.visibility = Math.random() > 0.45 ? 'visible' : 'hidden';
      }
      setTimeout(randomizeCount, 10000 + Math.random() * 12000);
    }

    // Group burst: 2 or 3 lines restart together from top with tiny stagger
    function triggerGroupBurst() {
      var count = Math.random() > 0.45 ? 3 : 2;
      for (var i = 0; i < count && i < spans.length; i++) {
        (function (span, offsetS) {
          setTimeout(function () {
            span.style.visibility = 'visible';
            restartFromTop(span, offsetS);
          }, offsetS * 1000);
        })(spans[i], i * 0.07); // 70ms stagger between lines in group
      }
      setTimeout(triggerGroupBurst, 14000 + Math.random() * 16000);
    }

    // Stagger initial start so they don't all sweep at once on load
    for (var i = 0; i < spans.length; i++) {
      restartFromTop(spans[i], i * 0.25);
    }

    setTimeout(randomizeCount,      2000 + Math.random() * 3000);
    setTimeout(triggerGroupBurst,   7000 + Math.random() * 8000);
  }

  /* ── INIT ─────────────────────────────────────────────────── */
  function init() {
    initPageGrain();

    // Delay clip-path by one frame so txOverlay is painted first.
    // Without this, barrel window opens before txOverlay is rendered → 1-frame flash.
    requestAnimationFrame(function () {
      setPageCRTShape();
      initScanners();
    });

    var resizeTimer;
    function onViewportChange() {
      cancelAnimationFrame(resizeTimer);
      resizeTimer = requestAnimationFrame(setPageCRTShape);
    }
    window.addEventListener('resize', onViewportChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onViewportChange);
      window.visualViewport.addEventListener('scroll', onViewportChange);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
