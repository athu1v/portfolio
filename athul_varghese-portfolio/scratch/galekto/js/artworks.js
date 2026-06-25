/**
 * ARTWORKS PAGE — artworks.js
 * Background: glowing construction lines + giant hero arc
 * Layout: infinite vertical marquee (5 columns)
 * Lightbox: prev/next navigation with thumbnails
 */
(function () {
  'use strict';

  /* ================================================================
     DATA
     ================================================================ */
  let ARTWORKS = [];

  async function loadArtworks() {
    try {
      const result = await window.sanityFetch(
        `*[_type == "artwork"] | order(order desc) {
          "id": _id,
          title,
          medium,
          year,
          dimensions,
          price,
          "images": images[].asset->url,
          status,
          "buyUrl": buyLink
        }`
      );
      if (result && result.length) return result;
      return _getMockArtworks();
    } catch (e) {
      console.warn('Artworks fetch failed', e);
      return _getMockArtworks();
    }
  }

  function _getMockArtworks() {
    var p = function(seed) { return ['https://picsum.photos/seed/' + seed + '/700/1000']; };
    return [
      { id: 'a1',  title: 'Cool Guys',        medium: 'Digital Illustration', year: '2025', price: 150,  status: 'available', images: p('galekto1'),  buyUrl: '#' },
      { id: 'a2',  title: 'Neon Drift',        medium: 'Digital Painting',    year: '2025', price: 220,  status: 'available', images: p('galekto2'),  buyUrl: '#' },
      { id: 'a3',  title: 'Void Walker',       medium: 'Digital Illustration',year: '2024', price: null, status: 'sold',      images: p('galekto3'),  buyUrl: null },
      { id: 'a4',  title: 'Red Signal',        medium: 'Generative Art',      year: '2024', price: 180,  status: 'available', images: p('galekto4'),  buyUrl: '#' },
      { id: 'a5',  title: 'Ghost Protocol',    medium: 'Digital Painting',    year: '2024', price: null, status: 'sold',      images: p('galekto5'),  buyUrl: null },
      { id: 'a6',  title: 'Static Memory',     medium: 'Mixed Media',         year: '2023', price: 95,   status: 'available', images: p('galekto6'),  buyUrl: '#' },
      { id: 'a7',  title: 'Blue Frequency',    medium: 'Digital Illustration',year: '2023', price: 130,  status: 'available', images: p('galekto7'),  buyUrl: '#' },
      { id: 'a8',  title: 'Last Transmission', medium: 'Digital Painting',    year: '2023', price: null, status: 'sold',      images: p('galekto8'),  buyUrl: null },
      { id: 'a9',  title: 'The Operator',      medium: 'Digital Illustration',year: '2022', price: 200,  status: 'available', images: p('galekto9'),  buyUrl: '#' },
      { id: 'a10', title: 'Parallel City',     medium: 'Generative Art',      year: '2022', price: 160,  status: 'available', images: p('galekto10'), buyUrl: '#' },
      { id: 'a11', title: 'Signal Lost',       medium: 'Digital Painting',    year: '2022', price: null, status: 'sold',      images: p('galekto11'), buyUrl: null },
      { id: 'a12', title: 'Archive 001',       medium: 'Digital Illustration',year: '2021', price: 75,   status: 'available', images: p('galekto12'), buyUrl: '#' },
    ];
  }

  /* ================================================================
     DOM REFS
     ================================================================ */
  let bgCanvas, bgCtx, W, H;
  let lbBgCanvas, lbBgCtx;
  let artworksGrid, artworksHeader;
  let lightbox, lightboxImg, lightboxTitle, lightboxMedium, lightboxBuy, lightboxRef;
  let lbPrev, lbNext;
  let cursorDot, cursorRing;
  const _imx = parseFloat(sessionStorage.getItem('mx')||''), _imy = parseFloat(sessionStorage.getItem('my')||'');
  let rawX = (!isNaN(_imx)?_imx:-200), rawY = (!isNaN(_imy)?_imy:-200);
  let ringX = rawX, ringY = rawY;

  /* ================================================================
     LIGHTBOX STATE
     ================================================================ */
  let currentList = [];
  let currentIdx  = 0;
  let currentImgIdx = 0; // index within multi-image artwork
  let lastFocused = null; // focus return on lightbox close

  /* ── Helper: get images array for an artwork ───────────────── */
  function getImages(art) {
    const imgUrl = window.sanityImgUrl || (u => u);
    if (art.images && art.images.length) return art.images.map(u => imgUrl(u, 800));
    return [imgUrl(art.image, 800)];
  }

  /* ================================================================
     CANVAS STATE
     ================================================================ */
  let lines = [], arcs = [], ripples = [];
  let heroArc = null;
  let scanner = null;
  let lastTs  = 0;

  const ANGLES = [0, Math.PI/6, Math.PI/4, Math.PI/3, Math.PI*2/3, Math.PI*5/6, Math.PI/2];

  /* ================================================================
     RESIZE
     ================================================================ */
  function resizeBg() {
    W = bgCanvas.width  = window.innerWidth;
    H = bgCanvas.height = window.innerHeight;
    if (lbBgCanvas) {
      lbBgCanvas.width  = W;
      lbBgCanvas.height = H;
    }
    initLines();
    initArcs();
    initHeroArc();
    initScanner();
  }

  /* ================================================================
     CONSTRUCTION LINES — boosted opacity for visibility
     ================================================================ */
  function makeLine() {
    return {
      x:       Math.random() * W,
      y:       Math.random() * H,
      angle:   ANGLES[Math.floor(Math.random() * ANGLES.length)],
      len:     0,
      maxLen:  140 + Math.random() * 320,
      spd:     0.5 + Math.random() * 0.7,
      opacity: 0,
      phase:   'fadein',
      holdT:   0,
      maxHold: 70 + Math.random() * 120,
    };
  }

  function initLines() {
    lines = [];
    for (let i = 0; i < 10; i++) {
      const l = makeLine();
      l.len     = Math.random() * l.maxLen;
      l.opacity = 0.20 + Math.random() * 0.18;
      l.phase   = 'hold';
      lines.push(l);
    }
  }

  function updateLine(l, i) {
    if (l.phase === 'fadein') {
      l.opacity = Math.min(0.42, l.opacity + 0.005);
      l.len    += l.spd;
      if (l.len >= l.maxLen) l.phase = 'hold';
    } else if (l.phase === 'hold') {
      l.holdT++;
      if (l.holdT >= l.maxHold) l.phase = 'fadeout';
    } else {
      l.opacity -= 0.004;
      if (l.opacity <= 0) lines[i] = makeLine();
    }
  }

  function drawLines(ctx) {
    ctx.save();
    ctx.lineCap    = 'round';
    ctx.shadowBlur = 10;

    lines.forEach(l => {
      if (l.opacity <= 0) return;
      const ex = l.x + Math.cos(l.angle) * l.len;
      const ey = l.y + Math.sin(l.angle) * l.len;

      ctx.shadowColor = `rgba(255,255,255,${(l.opacity * 0.9).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = `rgba(255,255,255,${l.opacity.toFixed(3)})`;
      ctx.lineWidth   = 1.0;
      ctx.stroke();

      if (l.phase === 'hold') {
        const nx = -Math.sin(l.angle) * 7;
        const ny =  Math.cos(l.angle) * 7;
        ctx.beginPath();
        ctx.moveTo(ex - nx, ey - ny);
        ctx.lineTo(ex + nx, ey + ny);
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.60, l.opacity * 2).toFixed(3)})`;
        ctx.lineWidth   = 1.0;
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  /* ================================================================
     COMPASS ARCS — boosted opacity
     ================================================================ */
  function makeArc() {
    return {
      x:        Math.random() * W,
      y:        Math.random() * H,
      r:        40 + Math.random() * 120,
      startA:   Math.random() * Math.PI * 2,
      sweep:    0,
      maxSweep: Math.PI * (0.45 + Math.random() * 1.3),
      spd:      0.007 + Math.random() * 0.008,
      opacity:  0,
      phase:    'fadein',
      holdT:    0,
      maxHold:  90 + Math.random() * 120,
    };
  }

  function initArcs() {
    arcs = [];
    for (let i = 0; i < 6; i++) {
      const a = makeArc();
      a.sweep   = Math.random() * a.maxSweep;
      a.opacity = 0.18 + Math.random() * 0.14;
      a.phase   = 'hold';
      arcs.push(a);
    }
  }

  function updateArc(a, i) {
    if (a.phase === 'fadein') {
      a.opacity = Math.min(0.38, a.opacity + 0.004);
      a.sweep   = Math.min(a.maxSweep, a.sweep + a.spd);
      if (a.sweep >= a.maxSweep) a.phase = 'hold';
    } else if (a.phase === 'hold') {
      a.holdT++;
      if (a.holdT >= a.maxHold) a.phase = 'fadeout';
    } else {
      a.opacity -= 0.003;
      if (a.opacity <= 0) arcs[i] = makeArc();
    }
  }

  function drawArcs(ctx) {
    ctx.save();
    ctx.shadowBlur = 12;

    arcs.forEach(a => {
      if (a.opacity <= 0) return;
      ctx.shadowColor = `rgba(255,255,255,${(a.opacity * 0.8).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, a.startA, a.startA + a.sweep);
      ctx.strokeStyle = `rgba(255,255,255,${a.opacity.toFixed(3)})`;
      ctx.lineWidth   = 0.9;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(a.x, a.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.55, a.opacity * 2.5).toFixed(3)})`;
      ctx.fill();
    });

    ctx.restore();
  }

  /* ================================================================
     HERO ARC — main decorative arc
     ================================================================ */
  function initHeroArc() {
    heroArc = {
      cx:      -W * 0.08,
      cy:       H * 0.44,
      r1:       W * 0.74,
      r2:       W * 0.82,
      baseA:   -0.32,
      sweep:    0.05,
      maxSweep: 0.90,
      growing:  true,
      speed:    0.0010,
    };
  }

  function updateHeroArc() {
    const h = heroArc;
    if (h.growing) {
      h.sweep += h.speed;
      if (h.sweep >= h.maxSweep) h.growing = false;
    } else {
      h.sweep -= h.speed * 0.65;
      if (h.sweep <= 0.05) h.growing = true;
    }
  }

  function drawHeroArc(ctx) {
    const h = heroArc;
    if (!h) return;
    ctx.save();
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(h.cx, h.cy, h.r2, h.baseA + 0.06, h.baseA + h.sweep - 0.06);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth   = 0.6;
    ctx.shadowBlur  = 6;
    ctx.shadowColor = 'rgba(255,255,255,0.15)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(h.cx, h.cy, h.r1, h.baseA, h.baseA + h.sweep);
    ctx.strokeStyle = 'rgba(255,255,255,0.38)';
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 22;
    ctx.shadowColor = 'rgba(255,255,255,0.55)';
    ctx.stroke();

    const endX = h.cx + Math.cos(h.baseA + h.sweep) * h.r1;
    const endY = h.cy + Math.sin(h.baseA + h.sweep) * h.r1;
    ctx.beginPath();
    ctx.moveTo(h.cx, h.cy);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth   = 0.6;
    ctx.shadowBlur  = 0;
    ctx.stroke();

    const startX = h.cx + Math.cos(h.baseA) * h.r1;
    const startY = h.cy + Math.sin(h.baseA) * h.r1;
    ctx.beginPath();
    ctx.moveTo(h.cx, h.cy);
    ctx.lineTo(startX, startY);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth   = 0.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(h.cx, h.cy, 5, 0, Math.PI * 2);
    ctx.fillStyle   = 'rgba(255,255,255,0.38)';
    ctx.shadowBlur  = 18;
    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.fill();

    ctx.restore();
  }

  /* ================================================================
     SCANNER SWEEP
     ================================================================ */
  function initScanner() {
    scanner = {
      y:        -40,
      speed:    H / (60 * 8),
      paused:   true,
      pauseT:   0,
      pauseMax: 100,
    };
  }

  function updateScanner() {
    if (scanner.paused) {
      scanner.pauseT++;
      if (scanner.pauseT >= scanner.pauseMax) {
        scanner.paused = false;
        scanner.pauseT = 0;
      }
      return;
    }
    scanner.y += scanner.speed;
    if (scanner.y > H + 40) {
      scanner.y        = -40;
      scanner.paused   = true;
      scanner.pauseMax = 150;
    }
  }

  function drawScanner(ctx) {
    if (scanner.paused || scanner.y < 0) return;
    ctx.save();

    const grad = ctx.createLinearGradient(0, scanner.y - 50, 0, scanner.y);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(255,255,255,0.055)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanner.y - 50, W, 50);

    ctx.beginPath();
    ctx.moveTo(0, scanner.y);
    ctx.lineTo(W, scanner.y);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth   = 1.2;
    ctx.shadowBlur  = 22;
    ctx.shadowColor = 'rgba(255,255,255,0.55)';
    ctx.stroke();

    ctx.restore();
  }

  /* ================================================================
     INK RIPPLES
     ================================================================ */
  function addRipple(x, y) {
    ripples.push({ x, y, r: 0,  maxR: 55 + Math.random() * 35, opacity: 0.32 });
    ripples.push({ x, y, r: 10, maxR: 82 + Math.random() * 30, opacity: 0.12 });
  }

  function updateRipples() {
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].r       += 2.2;
      ripples[i].opacity -= 0.008;
      if (ripples[i].opacity <= 0) ripples.splice(i, 1);
    }
  }

  function drawRipples(ctx) {
    ctx.save();
    ripples.forEach(rp => {
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${rp.opacity.toFixed(3)})`;
      ctx.lineWidth   = 1;
      ctx.shadowBlur  = 6;
      ctx.shadowColor = `rgba(255,255,255,${(rp.opacity * 0.5).toFixed(3)})`;
      ctx.stroke();
    });
    ctx.restore();
  }

  /* ================================================================
     MAIN LOOP
     ================================================================ */
  function drawScene(ctx, includeScanner) {
    drawHeroArc(ctx);
    if (includeScanner) drawScanner(ctx);
    drawLines(ctx);
    drawArcs(ctx);
    drawRipples(ctx);
  }

  function loop(ts) {
    lastTs = ts;

    // Cursor ring lerp
    ringX += (rawX - ringX) * 0.12;
    ringY += (rawY - ringY) * 0.12;
    if (cursorRing) { cursorRing.style.left = ringX + 'px'; cursorRing.style.top = ringY + 'px'; }

    // Update state
    updateHeroArc();
    updateScanner();
    lines.forEach(updateLine);
    arcs.forEach(updateArc);
    updateRipples();

    // Draw to main background canvas (scanner included)
    bgCtx.clearRect(0, 0, W, H);
    drawScene(bgCtx, true);

    // Draw to lightbox canvas (no scanner)
    if (lbBgCtx && lightbox && lightbox.classList.contains('is-open')) {
      lbBgCtx.clearRect(0, 0, W, H);
      drawScene(lbBgCtx, false);
    }

    requestAnimationFrame(loop);
  }

  /* ================================================================
     MAKE CARD
     ================================================================ */
  function makeCard(art, idx) {
    const card = document.createElement('div');
    card.className   = 'artwork-card';
    card.dataset.id  = art.id;
    card.dataset.idx = idx;
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');

    const imgs   = getImages(art);
    const isSold   = art.status === 'sold';
    const hasBuy   = !!(art.buyUrl && art.buyUrl !== '#');
    const refNum = String(idx + 1).padStart(3, '0');
    const imgUrl2x = (window.sanityImgUrl || (u => u))(
      (art.images && art.images.length) ? art.images[0] : (art.image || ''), 1400
    );

    card.innerHTML = `
      <div class="artwork-img-wrap">
        <img
          class="artwork-img${isSold ? ' is-sold' : ''}"
          src="${imgs[0] || ''}"
          srcset="${imgs[0] || ''} 1x, ${imgUrl2x} 2x"
          alt="${[art.title, art.medium, art.year].filter(Boolean).join(', ') || 'Artwork'}"
          loading="lazy"
          draggable="false"
        >
        <div class="artwork-hover-overlay" aria-hidden="true">
          <span class="ahov-title">${art.title || ''}</span>
          <span class="ahov-meta">REF.${refNum}${art.medium ? ' · ' + art.medium : ''}</span>
          <span class="ahov-view">VIEW</span>
        </div>
        ${hasBuy && !isSold ? `<div class="artwork-status-badge is-available" aria-label="Available">AVAILABLE</div>` : ''}
        <div class="artwork-corners">
          <span class="corner tl"></span>
          <span class="corner tr"></span>
          <span class="corner bl"></span>
          <span class="corner br"></span>
        </div>
      </div>
      <div class="artwork-meta">
        <span class="artwork-ref">REF.${refNum}</span>
      </div>
    `;

    const open = () => {
      const rect = card.getBoundingClientRect();
      addRipple(rect.left + rect.width / 2, rect.top + rect.height / 2);
      openLightbox(idx);
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
    card.addEventListener('contextmenu', e => { e.preventDefault(); card.blur(); });

    return card;
  }

  /* ================================================================
     VERTICAL MARQUEE — 5 columns
     ================================================================ */
  const NUM_COLS   = 4;
  const COL_SPEEDS = [22, 34, 18, 28]; // seconds per column

  function renderGrid() {
    currentList = ARTWORKS;
    if (!ARTWORKS.length) return;
    artworksGrid.innerHTML = '';
    if (!ARTWORKS.length) return;

    const isLargeDesktop = window.matchMedia('(min-width: 1201px)').matches;

    if (isLargeDesktop) {
      renderMarquee();
    } else {
      renderStaticGrid();
    }

    applyHeaderOffset();
    setupFooterAnim();
  }

  /* ── Measure header and set top padding for static grid ─────── */
  function applyHeaderOffset() {
    if (!artworksHeader) return;
    const h = artworksHeader.getBoundingClientRect().height;

    if (artworksGrid.classList.contains('is-static')) {
      artworksGrid.style.paddingTop = (h + 24) + 'px';
    } else {
      artworksGrid.style.paddingTop = '';
    }
  }

  /* ── Static fallback ─────────────────────────────────────────── */
  function renderStaticGrid() {
    artworksGrid.className = 'artworks-grid is-static';
    ARTWORKS.forEach((art, i) => artworksGrid.appendChild(makeCard(art, i)));
  }

  /* ── Vertical column marquee ─────────────────────────────────── */
  function renderMarquee() {
    artworksGrid.className = 'artworks-grid';

    const colData = Array.from({ length: NUM_COLS }, () => []);
    ARTWORKS.forEach((art, i) => colData[i % NUM_COLS].push({ art, idx: i }));

    colData.forEach((rawItems, c) => {
      if (!rawItems.length) return;

      let items = [...rawItems];
      while (items.length < 3) items = [...items, ...rawItems];

      const colEl = document.createElement('div');
      colEl.className = 'marquee-col';

      const track = document.createElement('div');
      track.className = 'marquee-col-track';
      track.style.setProperty('--col-dur', COL_SPEEDS[c % COL_SPEEDS.length] + 's');

      items.forEach(({ art, idx }) => track.appendChild(makeCard(art, idx)));

      items.forEach(({ art, idx }) => {
        const clone = makeCard(art, idx);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });

      colEl.appendChild(track);
      artworksGrid.appendChild(colEl);
    });
  }

  /* ================================================================
     FOOTER ENTRANCE ANIMATION
     ================================================================ */
  function setupFooterAnim() {
    const wrap    = document.querySelector('.artworks-wrap');
    const targets = document.querySelectorAll(
      '.footer-nav-link, .footer-instagram, .footer-location, .footer-copy'
    );

    targets.forEach((el, i) => {
      el.classList.remove('is-visible');
      el.classList.add('footer-anim');
      el.style.transitionDelay = (i * 0.09) + 's';
    });

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { root: wrap, threshold: 0.1 });

    targets.forEach(el => obs.observe(el));
  }

  /* ================================================================
     LIGHTBOX
     ================================================================ */
  /* ── Screen reader live region announcer ──────────────────── */
  function announce(msg) {
    const el = document.getElementById('srAnnouncer');
    if (!el) return;
    el.textContent = '';
    setTimeout(() => { el.textContent = msg; }, 50);
  }

  function openLightbox(idx) {
    if (!lastFocused) lastFocused = document.activeElement;
    currentIdx    = idx;
    currentImgIdx = 0;
    const art     = currentList[idx];
    if (!art) return;

    const imgs    = getImages(art);
    const isSold  = art.status === 'sold';
    const total   = currentList.length;
    const refNum  = String(idx + 1).padStart(3, '0');
    lightboxImg.src           = imgs[0];
    lightboxImg.alt           = art.title || '';
    lightboxTitle.textContent = art.title || '';
    lightboxRef.textContent   = `REF.${refNum} · ${idx + 1} of ${total}`;
    const mediumParts = [art.medium, art.year].filter(Boolean);
    lightboxMedium.textContent = mediumParts.join(' · ') || '';
    const lbDim = document.getElementById('lightboxDimensions');
    if (lbDim) {
      lbDim.textContent = art.dimensions || '';
      lbDim.style.display = art.dimensions ? '' : 'none';
    }
    if (lightboxBuy) {
      const hasBuyUrl = !!(art.buyUrl && art.buyUrl !== '#');
      if (!hasBuyUrl || isSold) {
        lightboxBuy.style.display = 'none';
      } else {
        lightboxBuy.style.display = '';
        const priceStr = art.price ? ` - $${art.price}` : '';
        lightboxBuy.innerHTML = `<span>BUY ORIGINAL${priceStr}</span><span class="buy-arrow">↗&#xFE0E;</span>`;
        lightboxBuy.classList.remove('is-sold');
        lightboxBuy.href   = safeUrl(art.buyUrl);
        lightboxBuy.target = '_blank';
        lightboxBuy.rel    = 'noopener noreferrer';
        lightboxBuy.style.cursor = '';
      }
    }
    updateLightboxNav();
    updateImgUI(imgs);

    // Multi-image cursor hint
    const imgWrap = document.getElementById('lightboxImgWrap');
    if (imgWrap) imgWrap.classList.toggle('is-multi', imgs.length > 1);

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lb-open');
    lightbox.focus();

    announce(`Artwork ${idx + 1} of ${total}: ${art.title || ''}`);

    document.querySelectorAll('.marquee-col-track').forEach(t => t.style.animationPlayState = 'paused');
  }

  /* Update counter + dots for current image position */
  function updateImgUI(imgs) {
    const multi = imgs && imgs.length > 1;

    // Counter "2 / 3"
    const counter = document.getElementById('lbImgCounter');
    if (counter) {
      counter.style.display = multi ? 'block' : 'none';
      if (multi) counter.textContent = (currentImgIdx + 1) + ' / ' + imgs.length;
    }

    // Dots
    const dotsEl = document.getElementById('lbImgDots');
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    if (!multi) return;
    imgs.forEach(function (_, i) {
      const dot = document.createElement('span');
      dot.className = 'lb-img-dot' + (i === currentImgIdx ? ' is-active' : '');
      dot.setAttribute('role', 'button');
      (function (imgIdx) {
        dot.addEventListener('click', function (e) {
          e.stopPropagation();
          const art = currentList[currentIdx];
          const curImgs = getImages(art);
          currentImgIdx = imgIdx;
          lightboxImg.src = curImgs[currentImgIdx];
          lightboxImg.alt = art.title || '';
          updateImgUI(curImgs);
        });
      })(i);
      dotsEl.appendChild(dot);
    });
  }

  /* Click or tap image → advance to next (wraps to first) */
  function advanceImage() {
    const art  = currentList[currentIdx];
    const imgs = getImages(art);
    if (imgs.length <= 1) return;
    currentImgIdx = (currentImgIdx + 1) % imgs.length;
    lightboxImg.src = imgs[currentImgIdx];
    lightboxImg.alt = art.title || '';
    updateImgUI(imgs);
  }

  function updateLightboxNav() {
    lbPrev.classList.toggle('is-hidden', currentIdx <= 0);
    lbNext.classList.toggle('is-hidden', currentIdx >= currentList.length - 1);
  }

  function navigateLightbox(dir) {
    const newIdx = currentIdx + dir;
    if (newIdx < 0 || newIdx >= currentList.length) return;
    currentIdx = newIdx;
    openLightbox(currentIdx);
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lb-open');
    document.querySelectorAll('.marquee-col-track').forEach(t => t.style.animationPlayState = 'running');
    announce('Lightbox closed');
    if (lastFocused) { lastFocused.focus(); lastFocused = null; }
  }

  /* ================================================================
     CURSOR
     ================================================================ */
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  function setupCursor() {
    if (cursorDot)  { cursorDot.style.left  = rawX+'px'; cursorDot.style.top  = rawY+'px'; }
    if (cursorRing) { cursorRing.style.left = ringX+'px'; cursorRing.style.top = ringY+'px'; }
    document.addEventListener('mousemove', e => {
      if (isTouch) return;
      rawX = e.clientX; rawY = e.clientY;
      if (cursorDot) { cursorDot.style.left = e.clientX + 'px'; cursorDot.style.top = e.clientY + 'px'; }
    });
  }

  /* ================================================================
     EVENTS
     ================================================================ */
  function setupEvents() {
    document.addEventListener('click', e => {
      if (!e.target.closest('.artwork-card') &&
          !e.target.closest('.lightbox') &&
          !e.target.closest('.back-link')) {
        addRipple(e.clientX, e.clientY);
      }
    });

    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);

    lbPrev.addEventListener('click', (e) => { e.stopPropagation(); navigateLightbox(-1); });
    lbNext.addEventListener('click', (e) => { e.stopPropagation(); navigateLightbox(1); });

    // Click image → advance to next image within artwork
    const imgWrap = document.getElementById('lightboxImgWrap');
    if (imgWrap) {
      imgWrap.addEventListener('click', (e) => {
        if (e.target.closest('.lb-img-dots')) return;
        advanceImage();
      });
    }

    // Touch swipe on image → advance/retreat within artwork
    let _touchStartX = 0;
    if (imgWrap) {
      imgWrap.addEventListener('touchstart', (e) => {
        _touchStartX = e.touches[0].clientX;
      }, { passive: true });
      imgWrap.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - _touchStartX;
        if (Math.abs(dx) > 40) {
          const art  = currentList[currentIdx];
          const imgs = getImages(art);
          if (imgs.length <= 1) return;
          currentImgIdx = dx < 0
            ? (currentImgIdx + 1) % imgs.length
            : (currentImgIdx - 1 + imgs.length) % imgs.length;
          lightboxImg.src = imgs[currentImgIdx];
          lightboxImg.alt = art.title || '';
          updateImgUI(imgs);
        }
      }, { passive: true });
    }

    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'ArrowLeft')  navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
      if (e.key === 'Escape')     closeLightbox();
    });

    /* Focus trap */
    lightbox.addEventListener('keydown', e => {
      if (e.key !== 'Tab' || !lightbox.classList.contains('is-open')) return;
      const focusable = Array.from(lightbox.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });

    // Footer nav — page transitions
    const TX_COLORS = {
      '/':    '#1a1614',
      '/projects': '#ef4444',
      '/artworks': '#1d4ed8',
      '/contact':  '#1a1614',
    };
    document.querySelectorAll('.footer-nav-link:not([target="_blank"])').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const href  = link.getAttribute('href');
        const label = link.textContent.trim().toUpperCase().replace(/ ↗[\uFE0E\uFE0F]?/, '');
        const color = TX_COLORS[href] || '#1a1614';
        if (typeof window.TxOut === 'function') {
          window.TxOut(href, label, color);
        } else {
          window.location.href = href;
        }
      });
    });

    var _gridResizeTimer = null;
    window.addEventListener('resize', () => {
      resizeBg();
      clearTimeout(_gridResizeTimer);
      _gridResizeTimer = setTimeout(function () { renderGrid(); }, 150);
    });
  }

  /* ================================================================
     INIT
     ================================================================ */
  async function init() {
    bgCanvas       = document.getElementById('bgCanvas');
    bgCtx          = bgCanvas.getContext('2d');
    lbBgCanvas     = document.getElementById('lightboxBgCanvas');
    lbBgCtx        = lbBgCanvas ? lbBgCanvas.getContext('2d') : null;
    artworksGrid   = document.getElementById('artworksGrid');
    artworksHeader = document.querySelector('.artworks-header');
    lightbox       = document.getElementById('lightbox');
    lightboxImg    = document.getElementById('lightboxImg');
    lightboxTitle  = document.getElementById('lightboxTitle');
    lightboxMedium = document.getElementById('lightboxMedium');
    lightboxBuy    = document.getElementById('lightboxBuy');
    lightboxRef    = document.getElementById('lightboxRef');
    lbPrev         = document.getElementById('lbPrev');
    lbNext         = document.getElementById('lbNext');
    cursorDot  = document.getElementById('cursorDot');
    cursorRing = document.getElementById('cursorRing');

    resizeBg();
    setupCursor();
    setupEvents();

    if (typeof window.TxIn === 'function') window.TxIn();

    requestAnimationFrame(ts => { lastTs = ts; requestAnimationFrame(loop); });

    // Load artworks from Sanity then render
    ARTWORKS = await loadArtworks();
    renderGrid();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
