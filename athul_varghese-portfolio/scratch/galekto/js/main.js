/**
 * PORTFOLIO — MAIN.JS
 * Topographic contour lines, original slot machine, and PERFECT SVG Liquid Mask.
 */
(function () {
  'use strict';

  /* ── DOM ───────────────────────────────────────────────── */
  let body, bgCanvas, bgCtx, nameDisplay, portraitIllus, portraitSection, slideGroup, cursorDot, cursorRing;
  let nameSection = null, portraitFrame = null;
  let illustrationCanvas = null, illustrationCtx = null;
  let portrecizimImg = null;
  let blobs = []; // SVG likit damlaları

  /* ── CONSTANTS ─────────────────────────────────────────── */
  const CHARS      = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const NAMES      = { left: 'EVREN', right: 'GALEKTO' };
  const MOUSE_EASE = 0.08;   
  const RING_EASE  = 0.12;    
  const SLIDE_EASE = 0.045;   
  const SLIDE_PX   = 250;     
  const MASK_EASE  = 0.012; // Lando/Inspira tarzı lastik gibi süzülme hızı

  /* ── STATE ─────────────────────────────────────────────── */
  let rawX = 0.5, rawY = 0.5;
  let smoothX = 0.5, smoothY = 0.5;
  let rawRingX = -200, rawRingY = -200;
  let mouseX = -200, mouseY = -200;
  // sessionStorage'dan başlangıç pozisyonu — transition sırasında sürekli yazılır
  { const _mx = parseFloat(sessionStorage.getItem('mx')||'');
    const _my = parseFloat(sessionStorage.getItem('my')||'');
    if (!isNaN(_mx) && !isNaN(_my)) { mouseX = _mx; mouseY = _my; rawRingX = _mx; rawRingY = _my; }
  }
  let currentSide = null, currentName = '', isAnimatingName = false;
  let idleTimer = null, isIdle = true, idleT = 0, bgTime = 0;
  let prevMouseX = 0, prevMouseY = 0;
  let idleFluidTimer = 0;
  let _hGrid = null; // marching-squares height field cache
  let _isMobile = window.innerWidth < 768;
  let _bgFrameSkip = 0;

  // Parallax + tilt
  let smoothTiltX = 0, smoothTiltY = 0;
  let smoothParaY = 0, smoothParaName = 0; // separate easing for depth
  let parallaxReady = false;

  // Menu morphing (positions for 6px dots in 48×48px button)
  const MENU_FORMATIONS = [
    // Grid 3×3 (center-to-center gap 11px)
    [[10,10],[21,10],[32,10],[10,21],[21,21],[32,21],[10,32],[21,32],[32,32]],
    // Ring (center 21,21 radius 13)
    [[21,8],[29,11],[34,19],[32,28],[25,33],[17,33],[9,28],[8,19],[11,11]],
    // Plus / Cross
    [[21,7],[21,13],[7,21],[13,21],[21,21],[29,21],[35,21],[21,29],[21,35]],
    // Diagonal scatter
    [[5,4],[21,6],[37,4],[7,21],[21,21],[35,21],[5,37],[21,35],[37,37]],
  ];
  let _menuFormIdx = 0;

  function applyMenuFormation(idx) {
    const spans = document.querySelectorAll('.menu-dots span');
    const f = MENU_FORMATIONS[idx];
    spans.forEach((s, i) => { s.style.left = f[i][0] + 'px'; s.style.top = f[i][1] + 'px'; });
  }

  // ── Canlı ayar objesi — fluid.js display shader okur ────
  window.BgConfig = {
    GRAY_R    : 194,   // gri renk R (0–255)
    GRAY_G    : 194,   // gri renk G (0–255)
    GRAY_B    : 194,   // gri renk B (0–255)
    EDGE_LOW  : 0.08,  // fluid sınır başlangıcı
    EDGE_HIGH : 0.09,  // sadece 0.01 aralık = kenar beyazlığı yok
  };
  let slideOffset = 0, targetSlide = 0, slideReady = false;
  let maskX = 0.5, maskY = 0.38, tgtMaskX = 0.5, tgtMaskY = 0.38;

  const lerp = (a, b, t) => a + (b - a) * t;

  /* ── 1. SLOT MACHINE (Senin Orijinal Kodun) ───────────── */
  function buildSlots(name, animate = false) {
    const existing = nameDisplay.querySelectorAll('.name-slot');
    const oldLen   = existing.length;

    if (oldLen > name.length) {
      for (let i = name.length; i < oldLen; i++) {
        const s = existing[i]; s.classList.add('exiting');
        setTimeout(() => s.remove(), 380);
      }
    }

    name.split('').forEach((targetChar, i) => {
      if (!animate) {
        let slot = existing[i] || makeSlot();
        if (!existing[i]) nameDisplay.appendChild(slot);
        const reel = makeReel(slot);
        reel.style.cssText = 'transform:translateY(0);transition:none';
        reel.appendChild(makeChar(targetChar));
        return;
      }

      const spinCount = 2 + Math.floor(Math.random() * 3);
      let slot = existing[i];
      if (!slot) {
        slot = makeSlot(); slot.style.cssText = 'width:0;opacity:0';
        nameDisplay.appendChild(slot);
        setTimeout(() => {
          slot.style.width = getCharWidth(targetChar) + 'px';
          slot.style.opacity = '1';
        }, i * 70 + Math.random() * 35);
      }

      const reel = makeReel(slot);
      reel.style.cssText = 'transform:translateY(0);transition:none';

      for (let s = 0; s < spinCount; s++) {
        reel.appendChild(makeChar(CHARS[Math.floor(Math.random() * CHARS.length)]));
      }
      reel.appendChild(makeChar(targetChar));

      const dur = 380 + spinCount * 130;
      setTimeout(() => {
        const h = getCharHeight();
        reel.style.transition = `transform ${dur}ms cubic-bezier(0.25,0.46,0.45,0.94)`;
        reel.style.transform  = `translateY(-${spinCount * h}px)`;
        setTimeout(() => {
          reel.style.cssText = 'transform:translateY(0);transition:none';
          reel.innerHTML = ''; reel.appendChild(makeChar(targetChar));
          if (i === name.length - 1) isAnimatingName = false;
        }, dur + 15);
      }, i * 70 + Math.random() * 35);
    });
  }

  const makeSlot = () => Object.assign(document.createElement('div'), { className: 'name-slot' });
  const makeChar = (ch) => Object.assign(document.createElement('span'), { className: 'name-char', textContent: ch });
  function makeReel(slot) {
    const old = slot.querySelector('.name-reel'); if (old) old.remove();
    const r = Object.assign(document.createElement('div'), { className: 'name-reel' });
    slot.appendChild(r); return r;
  }
  function getCharHeight() {
    const d = makeChar('A'); Object.assign(d.style, { visibility: 'hidden', position: 'absolute' });
    nameDisplay.appendChild(d); const h = d.getBoundingClientRect().height; d.remove(); return h;
  }
  function getCharWidth(ch) {
    const d = makeChar(ch); Object.assign(d.style, { visibility: 'hidden', position: 'absolute' });
    nameDisplay.appendChild(d); const w = d.getBoundingClientRect().width; d.remove(); return w;
  }
  function animateNameChange(newName) {
    if (isAnimatingName || currentName === newName) return;
    isAnimatingName = true; currentName = newName; buildSlots(newName, true);
  }

 
  /* ── 2. BACKGROUND ── */
  function resizeBgCanvas() {
    bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight;
  }

  let _mobileBgDrawn = false;
  function drawBackground(dt) {
    if (!bgCtx || !bgCanvas) return;
    if (_isMobile) {
      if (_mobileBgDrawn) return; // Mobile: draw once, never again
      _mobileBgDrawn = true;
    }

    bgTime += dt;
    window._bgTime = bgTime;

    const W = bgCanvas.width, H = bgCanvas.height;
    bgCtx.clearRect(0, 0, W, H);

    // Mobile: smaller grid to reduce CPU. Desktop: full resolution.
    const GW = _isMobile ? 60 : 140;
    const GH = _isMobile ? 40 : 100;
    const GW1 = GW + 1, TOTAL = GW1 * (GH + 1);
    if (!_hGrid || _hGrid.length !== TOTAL) _hGrid = new Float32Array(TOTAL);

    const cellW = W / GW, cellH = H / GH;

    // Peak data: [x, y, sx, sy, amplitude]
    const PK = [
      [0.20,0.40,0.22,0.28,1.00],
      [0.72,0.28,0.26,0.30,1.00],
      [0.48,0.72,0.24,0.20,0.90],
      [0.05,0.60,0.18,0.24,0.80],
      [0.92,0.55,0.20,0.26,0.80],
      [0.38,0.05,0.22,0.18,0.70],
      [0.75,0.90,0.20,0.22,0.70],
      [0.15,0.92,0.18,0.20,0.60],
      [0.46,0.34,0.14,0.18,0.50],
    ];
    const bs = bgTime * 0.5; // organic animation driver

    // Evaluate height field — peaks drift + breathe for organic movement
    for (let row = 0; row <= GH; row++) {
      const ny = row / GH, base = row * GW1;
      for (let col = 0; col <= GW; col++) {
        const nx = col / GW;
        let h = 0;
        for (let p = 0; p < PK.length; p++) {
          const pk = PK[p];
          // Slow position drift (each peak independent)
          const driftX = 0.014 * Math.sin(bs * 0.08 + p * 2.1);
          const driftY = 0.010 * Math.cos(bs * 0.10 + p * 1.7);
          // Slow amplitude oscillation
          const amp = pk[4] * (1.0 + 0.18 * Math.sin(bs * 0.28 + p * 0.9));
          const dx = (nx - pk[0] - driftX) / pk[2];
          const dy = (ny - pk[1] - driftY) / pk[3];
          h += amp * Math.exp(-0.5 * (dx*dx + dy*dy));
        }
        _hGrid[base + col] = h;
      }
    }

    // Fixed contour levels — no cyclic shift so lines never pop in/out
    const lv_min = 0.22, lv_max = 2.58, nL = 14;
    const spacing = (lv_max - lv_min) / (nL - 1);

    bgCtx.lineCap = 'round'; bgCtx.lineJoin = 'round';

    for (let li = 0; li < nL; li++) {
      const lv = lv_min + li * spacing;

      const isIdx = (li % 4 === 0);
      const bA   = isIdx ? 0.42 : 0.17;

      bgCtx.beginPath();
      bgCtx.lineWidth   = isIdx ? 1.4 : 0.65;
      bgCtx.strokeStyle = isIdx
        ? `rgba(160,115,20,${bA.toFixed(3)})`
        : `rgba(180,140,50,${bA.toFixed(3)})`;

      // Marching squares over the grid
      for (let row = 0; row < GH; row++) {
        const r0 = row * GW1, r1 = (row + 1) * GW1;
        const y0 = row * cellH, y1 = y0 + cellH;

        for (let col = 0; col < GW; col++) {
          const h00 = _hGrid[r0 + col], h10 = _hGrid[r0 + col + 1];
          const h11 = _hGrid[r1 + col + 1], h01 = _hGrid[r1 + col];

          const b0 = h00 > lv ? 1 : 0, b1 = h10 > lv ? 1 : 0;
          const b2 = h11 > lv ? 1 : 0, b3 = h01 > lv ? 1 : 0;
          const mc = b0 | (b1 << 1) | (b2 << 2) | (b3 << 3);
          if (mc === 0 || mc === 15) continue;

          const x0 = col * cellW, x1 = x0 + cellW;

          // Each case computes only the edge crossings it needs
          switch (mc) {
            case 1: case 14: {
              const tT=(lv-h00)/(h10-h00), tL=(lv-h00)/(h01-h00);
              bgCtx.moveTo(x0+tT*cellW,y0); bgCtx.lineTo(x0,y0+tL*cellH); break;
            }
            case 2: case 13: {
              const tT=(lv-h00)/(h10-h00), tR=(lv-h10)/(h11-h10);
              bgCtx.moveTo(x0+tT*cellW,y0); bgCtx.lineTo(x1,y0+tR*cellH); break;
            }
            case 3: case 12: {
              const tL=(lv-h00)/(h01-h00), tR=(lv-h10)/(h11-h10);
              bgCtx.moveTo(x0,y0+tL*cellH); bgCtx.lineTo(x1,y0+tR*cellH); break;
            }
            case 4: case 11: {
              const tR=(lv-h10)/(h11-h10), tB=(lv-h01)/(h11-h01);
              bgCtx.moveTo(x1,y0+tR*cellH); bgCtx.lineTo(x0+tB*cellW,y1); break;
            }
            case 5: {
              const tT=(lv-h00)/(h10-h00), tL=(lv-h00)/(h01-h00);
              const tR=(lv-h10)/(h11-h10), tB=(lv-h01)/(h11-h01);
              bgCtx.moveTo(x0+tT*cellW,y0); bgCtx.lineTo(x0,y0+tL*cellH);
              bgCtx.moveTo(x1,y0+tR*cellH); bgCtx.lineTo(x0+tB*cellW,y1); break;
            }
            case 6: case 9: {
              const tT=(lv-h00)/(h10-h00), tB=(lv-h01)/(h11-h01);
              bgCtx.moveTo(x0+tT*cellW,y0); bgCtx.lineTo(x0+tB*cellW,y1); break;
            }
            case 7: case 8: {
              const tL=(lv-h00)/(h01-h00), tB=(lv-h01)/(h11-h01);
              bgCtx.moveTo(x0,y0+tL*cellH); bgCtx.lineTo(x0+tB*cellW,y1); break;
            }
            case 10: {
              const tT=(lv-h00)/(h10-h00), tR=(lv-h10)/(h11-h10);
              const tL=(lv-h00)/(h01-h00), tB=(lv-h01)/(h11-h01);
              bgCtx.moveTo(x0+tT*cellW,y0); bgCtx.lineTo(x1,y0+tR*cellH);
              bgCtx.moveTo(x0,y0+tL*cellH); bgCtx.lineTo(x0+tB*cellW,y1); break;
            }
          }
        }
      }
      bgCtx.stroke();
    }
  }


  /* ── 3. SVG LİKİT MASKE MOTORU (Kopuk Halkaları Çözen Sistem) ── */
  function updateLiquidMask() {
    if (!portraitIllus || !blobs[0]) return;
    const rect = portraitIllus.getBoundingClientRect();
    if (rect.width === 0) return;

    const localX = (maskX * window.innerWidth) - rect.left;
    const localY = (maskY * window.innerHeight) - rect.top;
    const t = bgTime;

    const positions = [
      { x: localX,                                           y: localY },
      { x: localX + Math.sin(t * 2.8) * 140,                y: localY + Math.cos(t * 6.2) * 140 },
      { x: localX + Math.cos(t * 2.2) * 130,                y: localY + Math.sin(t * 2.8) * 150 },
      { x: localX - Math.sin(t * 3.1) * 120,                y: localY - Math.cos(t * 2.1) * 160 },
      { x: localX + Math.cos(t * 4.0) * 110,                y: localY - Math.sin(t * 3.5) * 130 },
      { x: localX - Math.cos(t * 1.9) * 135,                y: localY + Math.sin(t * 4.1) * 115 },
    ];

    blobs.forEach((blob, i) => {
      if (blob) {
        blob.setAttribute('cx', positions[i].x);
        blob.setAttribute('cy', positions[i].y);
      }
    });
  }

  /* ── 4. IDLE & LOOP ── */
  function getIdleMask(dt) {
    idleT += dt;
    return { x: 0.5 + Math.cos(idleT * 0.44) * 0.32, y: 0.38 + Math.sin(idleT * 0.63) * 0.30 };
  }

  let lastTs = 0;
  function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.05); lastTs = ts;

    smoothX = lerp(smoothX, rawX, MOUSE_EASE); smoothY = lerp(smoothY, rawY, MOUSE_EASE);

    if (isIdle) {
      const idle = getIdleMask(dt);
      tgtMaskX = idle.x; tgtMaskY = idle.y;

      // ── İNAKTİF: fluid portre etrafında orbital dolaşır ──
      if (window.FluidSim) {
        idleFluidTimer += dt;
        const IDLE_INTERVAL = 0.038; // ~26 Hz
        if (idleFluidTimer >= IDLE_INTERVAL) {
          idleFluidTimer = 0;
          const cx = window.innerWidth  * 0.50;
          const cy = window.innerHeight * 0.44;
          const baseR = Math.min(window.innerWidth, window.innerHeight) * 0.15;
          // 3 streamer farklı hız ve yarıçap — lissajous benzeri yörüngeler
          [
            { spd: 0.52, r: baseR * 1.00, ph: 0.00 },
            { spd: 0.33, r: baseR * 1.55, ph: Math.PI * 0.667 },
            { spd: 0.74, r: baseR * 0.72, ph: Math.PI * 1.333 },
          ].forEach(s => {
            const ang = idleT * s.spd + s.ph;
            const sx  = cx + Math.cos(ang) * s.r;
            const sy  = cy + Math.sin(ang) * s.r;
            // tanjansiyel hız → akışkan swirl hissi
            const vx  = -Math.sin(ang) * s.spd * 0.0018;
            const vy  =  Math.cos(ang) * s.spd * 0.0018;
            window.FluidSim.splat(sx, sy, vx, vy);
          });
        }
      }
    } else {
      tgtMaskX = rawX; tgtMaskY = rawY;
      idleFluidTimer = 0; // idle çıkınca sıfırla
    }

    // Maskenin fareyi bir sıvı gibi geriden takip etmesi
    maskX = lerp(maskX, tgtMaskX, MASK_EASE);
    maskY = lerp(maskY, tgtMaskY, MASK_EASE);

    drawBackground(dt);
    updateLiquidMask();

    if (slideReady) {
      slideOffset = lerp(slideOffset, targetSlide, SLIDE_EASE);
      slideGroup.style.transform = `translateX(${slideOffset.toFixed(2)}px)`;
    }

    // ── Cursor ring: lerp in RAF so ring smoothly follows dot ──
    rawRingX += (mouseX - rawRingX) * RING_EASE;
    rawRingY += (mouseY - rawRingY) * RING_EASE;
    cursorRing.style.left = rawRingX.toFixed(2) + 'px';
    cursorRing.style.top  = rawRingY.toFixed(2) + 'px';

    // ── Menu dots: fluid menü üzerindeyse beyaz ──
    {
      const menuEl = document.getElementById('menuDots');
      if (menuEl && window.FluidSim && window.FluidSim.getFluidAlpha) {
        const mr  = menuEl.getBoundingClientRect();
        const mcx = (mr.left + mr.right)  / 2;
        const mcy = (mr.top  + mr.bottom) / 2;
        const alpha = window.FluidSim.getFluidAlpha(mcx, mcy);
        menuEl.classList.toggle('fluid-over', alpha > 0.08);
      }
    }

    // ── Illustration canvas: fluid-masked portrecizim ──
    if (window.HomePageConfig && window.HomePageConfig.illustrationEnabled === false) {
      if (illustrationCanvas) illustrationCtx && illustrationCtx.clearRect(0, 0, illustrationCanvas.width, illustrationCanvas.height);
    } else if (illustrationCtx && portrecizimImg && portrecizimImg.complete && portrecizimImg.naturalWidth > 0) {
      const fluidEl = document.getElementById('fluidCanvas');
      const frameRect = portraitFrame ? portraitFrame.getBoundingClientRect() : null;
      if (fluidEl && frameRect && frameRect.width > 0) {
        const cw = Math.round(frameRect.width);
        const ch = Math.round(frameRect.height);
        if (illustrationCanvas.width !== cw || illustrationCanvas.height !== ch) {
          illustrationCanvas.width  = cw;
          illustrationCanvas.height = ch;
        }
        const imgAR  = portrecizimImg.naturalWidth / portrecizimImg.naturalHeight;
        const canAR  = cw / ch;
        let dw, dh, dx, dy;
        if (imgAR > canAR) {
          dw = cw; dh = cw / imgAR;
          dx = 0;  dy = ch - dh;
        } else {
          dh = ch; dw = ch * imgAR;
          dx = (cw - dw) / 2; dy = 0;
        }
        illustrationCtx.clearRect(0, 0, cw, ch);
        illustrationCtx.drawImage(portrecizimImg, dx, dy, dw, dh);
        illustrationCtx.globalCompositeOperation = 'destination-in';
        illustrationCtx.drawImage(
          fluidEl,
          frameRect.left, frameRect.top, frameRect.width, frameRect.height,
          0, 0, cw, ch
        );
        illustrationCtx.globalCompositeOperation = 'source-over';
      }
    }

    // 3D tilt kaldırıldı

    // ── Vertical parallax — portrait lags far behind, name snaps close ──
    if (parallaxReady) {
      const paraTarget = rawY - 0.5;
      smoothParaY    = lerp(smoothParaY,    paraTarget, 0.022); // slow = feels distant
      smoothParaName = lerp(smoothParaName, paraTarget, 0.09);  // fast = feels close
      portraitSection.style.transform =
        `translateX(-50%) translateY(${(smoothParaY * -45).toFixed(1)}px)`;
      if (nameSection) {
        nameSection.style.transform =
          `translateY(${(smoothParaName * -15).toFixed(1)}px)`;
      }
    }

    requestAnimationFrame(loop);
  }

  /* ── ETKİLEŞİMLER ── */
  function setupEvents() {
    document.addEventListener('mousemove', (e) => {
      // WebGL Fluid splat
      if (window.FluidSim) {
        const dx = (e.clientX - prevMouseX) / window.innerWidth;
        const dy = (e.clientY - prevMouseY) / window.innerHeight;
        window.FluidSim.splat(e.clientX, e.clientY, dx, dy);
      }
      prevMouseX = e.clientX; prevMouseY = e.clientY;

      rawX = e.clientX / window.innerWidth; rawY = e.clientY / window.innerHeight;

      let side;
      if (rawX < 0.4) side = 'left'; else if (rawX > 0.6) side = 'right'; else side = 'center';
      if (side !== currentSide) {
        currentSide = side;
        body.classList.remove('cursor-left', 'cursor-right');
        if (side === 'left') { body.classList.add('cursor-left'); targetSlide = SLIDE_PX; animateNameChange(NAMES.left); }
        else if (side === 'right') { body.classList.add('cursor-right'); targetSlide = -SLIDE_PX; animateNameChange(NAMES.right); }
        else targetSlide = 0;
      }

      isIdle = false; clearTimeout(idleTimer); idleTimer = setTimeout(() => { isIdle = true; }, 2200);

      cursorDot.style.left = e.clientX + 'px'; cursorDot.style.top = e.clientY + 'px';
      mouseX = e.clientX; mouseY = e.clientY;
    });

    document.addEventListener('mouseleave', () => { isIdle = true; });

    window.addEventListener('resize', () => {
      resizeBgCanvas();
      _isMobile = window.innerWidth < 768;
      _mobileBgDrawn = false; // canvas cleared by resize, allow redraw
    });
  }

  /* ── INIT (HATA ÇÖZÜLDÜ: SVG body yüklendikten sonra ekleniyor) ── */
  function init() {
    body = document.body;
    bgCanvas = document.getElementById('bgCanvas');
    bgCtx = bgCanvas.getContext('2d');
    nameDisplay = document.getElementById('nameDisplay');
    portraitIllus = document.getElementById('portraitIllustration');
    portraitSection = document.getElementById('portraitSection');
    portraitFrame = document.getElementById('portraitFrame');
    nameSection = document.getElementById('nameSection');
    illustrationCanvas = document.getElementById('illustrationCanvas');
    if (illustrationCanvas) illustrationCtx = illustrationCanvas.getContext('2d');
    portrecizimImg = new Image();
    portrecizimImg.src = 'assets/images/portrecizim.webp';

    // ── Load homePage settings from Sanity ──
    window.HomePageConfig = { illustrationEnabled: true };
    if (window.sanityFetch) {
      window.sanityFetch('*[_type=="homePage"][0]{portraitImage{asset->{url}},illustrationEnabled,illustrationImage{asset->{url}},fluidBgEnabled,fluidBgImage{asset->{url}},fluidBgColor}')
        .then(function(data) {
          if (!data) return;
          // Ana portre fotoğrafı
          if (data.portraitImage && data.portraitImage.asset && data.portraitImage.asset.url) {
            var portraitBaseEl = document.getElementById('portraitBase');
            if (portraitBaseEl) portraitBaseEl.src = data.portraitImage.asset.url;
          }
          // Portrait illustration (portrecizim) — mevcut ayarlar korunuyor
          if (data.illustrationEnabled === false) {
            window.HomePageConfig.illustrationEnabled = false;
          }
          if (data.illustrationImage && data.illustrationImage.asset && data.illustrationImage.asset.url) {
            portrecizimImg = new Image();
            portrecizimImg.src = data.illustrationImage.asset.url;
          }
          // Fluid background image — controlled entirely from Sanity
          if (window.FluidSim) {
            if (data.fluidBgEnabled === false) {
              // Disabled: no image, apply color if set
              window.FluidSim.setBgImage(null);
              if (data.fluidBgColor) {
                var hex = data.fluidBgColor.replace('#', '');
                window.BgConfig.GRAY_R = parseInt(hex.substring(0,2), 16);
                window.BgConfig.GRAY_G = parseInt(hex.substring(2,4), 16);
                window.BgConfig.GRAY_B = parseInt(hex.substring(4,6), 16);
              }
            } else if (data.fluidBgImage && data.fluidBgImage.asset && data.fluidBgImage.asset.url) {
              // Enabled with Sanity image
              window.FluidSim.setBgImage(data.fluidBgImage.asset.url);
            } else {
              // Enabled but no Sanity image — load static fallback
              window.FluidSim.loadStaticBg();
            }
          }
        })
        .catch(function() {});
    }

    slideGroup = document.getElementById('slideGroup');
    cursorDot = document.getElementById('cursorDot');
    cursorRing = document.getElementById('cursorRing');
    if (cursorDot)  { cursorDot.style.left  = mouseX+'px'; cursorDot.style.top  = mouseY+'px'; }
    if (cursorRing) { cursorRing.style.left = rawRingX+'px'; cursorRing.style.top = rawRingY+'px'; }

    // Gizli SVG Motorunu Sayfaya Enjekte Ediyoruz (Gooey Değerleri Artırıldı)
    const svgLiquidEngine = `
      <svg style="width: 0; height: 0; position: absolute; pointer-events: none; z-index: -1;">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="32" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -7" result="gooey" />
            <feBlend in="SourceGraphic" in2="gooey" />
          </filter>
          <mask id="liquidMask">
            <g filter="url(#gooey)">
              <circle id="blob1" cx="0" cy="0" r="180" fill="white" />
              <circle id="blob2" cx="0" cy="0" r="130" fill="white" />
              <circle id="blob3" cx="0" cy="0" r="100" fill="white" />
              <circle id="blob4" cx="0" cy="0" r="80"  fill="white" />
              <circle id="blob5" cx="0" cy="0" r="65"  fill="white" />
              <circle id="blob6" cx="0" cy="0" r="52"  fill="white" />
            </g>
          </mask>
        </defs>
      </svg>
    `;
    body.insertAdjacentHTML('afterbegin', svgLiquidEngine);

    // Enjekte edilen SVG damlalarını değişkene alıyoruz
    blobs = [
      document.getElementById('blob1'),
      document.getElementById('blob2'),
      document.getElementById('blob3'),
      document.getElementById('blob4'),
      document.getElementById('blob5'),
      document.getElementById('blob6'),
    ];

    resizeBgCanvas();
    setupEvents();
    
    buildSlots(NAMES.left, false);
    currentName = NAMES.left;
    idleTimer = setTimeout(() => { isIdle = true; }, 1800);
    setTimeout(() => { slideReady = true; }, 1800);
    prevMouseX = mouseX; prevMouseY = mouseY;
    
    // Menu formation cycling
    applyMenuFormation(0);
    setInterval(() => {
      _menuFormIdx = (_menuFormIdx + 1) % MENU_FORMATIONS.length;
      applyMenuFormation(_menuFormIdx);
    }, 3500);

    // Parallax + tilt ready after entrance animations settle
    setTimeout(() => { parallaxReady = true; }, 2600);

    body.classList.add('boot-pending');
    body.classList.add('js-ready');
    requestAnimationFrame((ts) => { lastTs = ts; requestAnimationFrame(loop); });

    // ── BARREL CRT SHAPE ─────────────────────────────────────
    function setCRTShape() {
      const outer = document.querySelector('.tv-outer');
      if (!outer) return;
      const W = outer.offsetWidth, H = outer.offsetHeight;
      if (!W || !H) return;
      // M = barrel bulge margin — sides bow outward this many px from corner boundary
      const M = window.innerWidth <= 768 ? 12 : 38;
      // Corner radius
      const R = Math.min(Math.max(40, W * 0.042), 70);
      // Path: corners at M offset, sides bow out to element edges
      const path = [
        `M ${M + R},${M}`,
        `Q ${W / 2},0 ${W - M - R},${M}`,
        `Q ${W - M},${M} ${W - M},${M + R}`,
        `Q ${W},${H / 2} ${W - M},${H - M - R}`,
        `Q ${W - M},${H - M} ${W - M - R},${H - M}`,
        `Q ${W / 2},${H} ${M + R},${H - M}`,
        `Q ${M},${H - M} ${M},${H - M - R}`,
        `Q 0,${H / 2} ${M},${M + R}`,
        `Q ${M},${M} ${M + R},${M}`,
        `Z`
      ].join(' ');
      outer.style.clipPath = `path('${path}')`;
    }
    requestAnimationFrame(() => requestAnimationFrame(setCRTShape));
    if (window.ResizeObserver) {
      new ResizeObserver(setCRTShape).observe(document.documentElement);
    }

    // ── PAGE TRANSITION ───────────────────────────────────────

    // Check before TxIn removes the key
    const isInternalNav = sessionStorage.getItem('txText') !== null;

    // Reveal: if arriving from a detail page, play TxIn
    if (typeof window.TxIn === 'function') window.TxIn();

    // Intercept side nav links
    const sideLeftEl  = document.getElementById('sideLeft');
    const sideRightEl = document.getElementById('sideRight');

    if (sideLeftEl) {
      sideLeftEl.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.TxOut === 'function') {
          window.TxOut(sideLeftEl.getAttribute('href'), 'PROJECTS', '#ef4444');
        } else {
          window.location.href = sideLeftEl.getAttribute('href');
        }
      });
    }
    if (sideRightEl) {
      sideRightEl.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.TxOut === 'function') {
          window.TxOut(sideRightEl.getAttribute('href'), 'ARTWORKS', '#1d4ed8');
        } else {
          window.location.href = sideRightEl.getAttribute('href');
        }
      });
    }

    // ── TV PRELOADER ──────────────────────────────────────────
    const preloader   = document.getElementById('preloader');
    const fluidCanvas = document.getElementById('fluidCanvas');
    const bgCanvasEl  = document.getElementById('bgCanvas');

    const illustCanvas = document.getElementById('illustrationCanvas');

    // Hide bg + fluid + illustration mask until boot sequence ends
    if (fluidCanvas)  { fluidCanvas.style.opacity  = '0'; fluidCanvas.style.transition  = 'none'; }
    if (bgCanvasEl)   { bgCanvasEl.style.opacity   = '0'; bgCanvasEl.style.transition   = 'none'; }
    if (illustCanvas) { illustCanvas.style.opacity = '0'; illustCanvas.style.transition = 'none'; }

    if (isInternalNav) {
      // Immediately hide preloader (no fade) so the txOverlay slide is the only transition
      if (preloader) { preloader.style.transition = 'none'; preloader.style.display = 'none'; }
      body.classList.remove('boot-pending');
      if (fluidCanvas)  { fluidCanvas.style.transition  = 'opacity 1s ease'; fluidCanvas.style.opacity  = '1'; }
      if (bgCanvasEl)   { bgCanvasEl.style.transition   = 'opacity 1s ease'; bgCanvasEl.style.opacity   = '1'; }
      if (illustCanvas) { illustCanvas.style.transition = 'opacity 1s ease'; illustCanvas.style.opacity = '1'; }
    } else {
      // Hoist RAF handles so BIOS trigger can cancel them early
      let _grainRaf = null, _glitchRaf = null, _shakeTimer = null;
      const tvInnerEl = document.getElementById('tvInner');

      // ── Grain canvas ──────────────────────────────────────────
      const grainCanvas = document.getElementById('tvGrainCanvas');
      if (grainCanvas) {
        grainCanvas.width  = 1600;
        grainCanvas.height = 900;
        const gc = grainCanvas.getContext('2d');
        let grainTick = 0;
        (function drawGrain() {
          grainTick++;
          if (grainTick % 5 === 0) {
            const img = gc.createImageData(1600, 900);
            const d   = img.data;
            for (let i = 0; i < d.length; i += 4) {
              const v = Math.random() * 255 | 0;
              d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255;
            }
            gc.putImageData(img, 0, 0);
          }
          _grainRaf = requestAnimationFrame(drawGrain);
        })();
      }

      // ── Glitch — 3 bursts ─────────────────────────────────────
      const glitchCanvas = document.getElementById('tvGlitchCanvas');
      if (glitchCanvas) {
        const GW = 320, GH = 200;
        glitchCanvas.width  = GW;
        glitchCanvas.height = GH;
        const gg = glitchCanvas.getContext('2d');

        const snowImg = gg.createImageData(GW, GH);
        const sd = snowImg.data;

        const STRIP_COLORS = [
          [191,191,191], [191,191,0], [0,191,191],
          [0,191,0], [191,0,191], [191,0,0], [0,0,191]
        ];
        const N_STRIPS = STRIP_COLORS.length;
        const stripOffsets  = new Float32Array(N_STRIPS);
        const stripTargets  = new Float32Array(N_STRIPS);
        const STRIP_H = Math.ceil(GH * 0.62);
        const STRIP_W = Math.ceil(GW / N_STRIPS);

        const BURST_AT  = [400, 1100];
        const BURST_DUR = 220;
        const glitchStart = Date.now();
        let burstActive = false, burstEnd = 0, nextBurst = 0;

        function stopShake() {
          if (_shakeTimer) { clearInterval(_shakeTimer); _shakeTimer = null; }
          if (tvInnerEl)   tvInnerEl.style.transform = '';
        }

        function startShake() {
          stopShake();
          let step = 0;
          _shakeTimer = setInterval(() => {
            step++;
            if (step >= 12 || !tvInnerEl) { stopShake(); return; }
            tvInnerEl.style.transform = `translateX(${(Math.random() - 0.5) * 28}px)`;
          }, BURST_DUR / 12);
        }

        function activateBurst() {
          burstActive = true;
          burstEnd    = Date.now() + BURST_DUR;
          for (let i = 0; i < N_STRIPS; i++) stripTargets[i] = (Math.random() - 0.5) * 36;
          startShake();
        }

        (function drawGlitch() {
          const now     = Date.now();
          const elapsed = now - glitchStart;

          if (!burstActive && nextBurst < BURST_AT.length && elapsed >= BURST_AT[nextBurst]) {
            activateBurst(); nextBurst++;
          }

          if (burstActive && now >= burstEnd) {
            burstActive = false;
            stopShake();
            gg.clearRect(0, 0, GW, GH);
            stripOffsets.fill(0);
          }

          if (burstActive) {
            for (let i = 0; i < sd.length; i += 4) {
              const v  = Math.random() * 255 | 0;
              sd[i] = sd[i+1] = sd[i+2] = v;
              sd[i+3] = (Math.random() * 180 + 55) | 0;
            }
            gg.putImageData(snowImg, 0, 0);
            for (let i = 0; i < N_STRIPS; i++) {
              stripOffsets[i] += (stripTargets[i] - stripOffsets[i]) * 0.35;
              if (Math.random() < 0.18) stripTargets[i] = (Math.random() - 0.5) * 36;
              const [r, g, b] = STRIP_COLORS[i];
              gg.fillStyle = `rgba(${r},${g},${b},0.72)`;
              gg.fillRect(i * STRIP_W + stripOffsets[i], 0, STRIP_W + 1, STRIP_H);
            }
          }

          _glitchRaf = requestAnimationFrame(drawGlitch);
        })();
      }

      // ── Loading bar ───────────────────────────────────────────
      const fillEl     = document.getElementById('tvProgressFill');
      const pctEl      = document.getElementById('tvPct');
      const progressEl = fillEl ? fillEl.parentElement : null;
      let loadN = 0;

      function updateLoadBar(n) {
        if (!fillEl || !progressEl) return;
        const barW = progressEl.offsetWidth;
        if (!barW) return;
        // Dynamic segment width: divide bar into equal segments based on ~14px target.
        // segW = barW / N ensures fill is always an exact multiple of segW → last segment same size.
        const N     = Math.max(1, Math.floor(barW / 14));
        const segW  = barW / N;
        const whiteW = segW * (10 / 14); // white:gap ratio preserved from original design
        const visN  = n >= 100 ? N : Math.floor(n * N / 100);
        fillEl.style.width      = n >= 100 ? '100%' : (visN * segW) + 'px';
        fillEl.style.background =
          'repeating-linear-gradient(to right,' +
          ' rgba(255,255,255,0.95) 0px,' +
          ' rgba(255,255,255,0.95) ' + whiteW + 'px,' +
          ' transparent ' + whiteW + 'px,' +
          ' transparent ' + segW + 'px)';
        if (pctEl) pctEl.textContent = n + '%';
      }
      updateLoadBar(0);

      const loadTimer = setInterval(() => {
        loadN += Math.random() > 0.4 ? 3 : 2;
        if (loadN >= 100) { loadN = 100; clearInterval(loadTimer); }
        updateLoadBar(loadN);
      }, 42);

      // ── Visit count + skip hint ───────────────────────────────
      const _SKIP_KEY = 'galekto_vc';
      let _vc = 0;
      try { _vc = parseInt(localStorage.getItem(_SKIP_KEY) || '0', 10) || 0; } catch(e) {}
      _vc++;
      try { localStorage.setItem(_SKIP_KEY, String(_vc)); } catch(e) {}
      const _showSkip = _vc >= 2;
      let _skipped = false;
      const _skipHintEl = document.getElementById('tvSkipHint');
      const _isMobilePtr = window.matchMedia('(pointer: coarse)').matches;

      // ── Reveal page (called by BIOS callback AND by skip) ─────
      function revealPage() {
        body.classList.remove('boot-pending');
        const pSection = document.getElementById('portraitSection');
        const nSection = document.getElementById('nameSection');
        const sLeft    = document.getElementById('sideLeft');
        const sRight   = document.getElementById('sideRight');
        if (nSection) { nSection.style.animation = 'none'; nSection.style.opacity = '0'; }
        if (sLeft)    { sLeft.style.animation    = 'none'; sLeft.style.opacity    = '0'; sLeft.style.transform  = 'translateY(-50%) translateX(-180%)'; }
        if (sRight)   { sRight.style.animation   = 'none'; sRight.style.opacity   = '0'; sRight.style.transform = 'translateY(-50%) translateX(180%)'; }
        if (pSection) {
          pSection.style.animation  = 'none';
          pSection.style.opacity    = '0';
          pSection.style.transform  = 'translateX(-50%) translateY(0)';
          pSection.style.transition = 'none';
          const blinks = [
            [50,'1'],[105,'0'],[160,'1'],[215,'0'],[270,'1'],[325,'0'],[380,'1'],[435,'0'],
            [555,'1'],[675,'0'],[855,'1'],[1035,'0'],[1285,'1'],[1535,'0'],
            [2135,'1'],[2600,'0'],[3300,'1'],
          ];
          blinks.forEach(([t, op]) => { setTimeout(() => { pSection.style.opacity = op; }, t); });
          setTimeout(() => {
            pSection.style.transition = 'opacity 0.6s ease';
            pSection.style.opacity    = '1';
          }, 3400);
        }
        setTimeout(() => {
          if (nSection) { nSection.style.transition = 'opacity 1.3s ease'; nSection.style.opacity = '1'; }
        }, 4000);
        setTimeout(() => {
          [sLeft, sRight].forEach(el => {
            if (!el) return;
            requestAnimationFrame(() => requestAnimationFrame(() => {
              el.style.transition = 'opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)';
              el.style.opacity    = '1';
              el.style.transform  = 'translateY(-50%) translateX(0)';
            }));
          });
        }, 4900);
        setTimeout(() => {
          if (bgCanvasEl)   { bgCanvasEl.style.transition   = 'opacity 1.4s ease'; bgCanvasEl.style.opacity   = '1'; }
          if (fluidCanvas)  { fluidCanvas.style.transition  = 'opacity 1.4s ease'; fluidCanvas.style.opacity  = '1'; }
          if (illustCanvas) { illustCanvas.style.transition = 'opacity 1.4s ease'; illustCanvas.style.opacity = '1'; }
        }, 6000);
      }

      // ── Skip function ─────────────────────────────────────────
      function _skipKeyHandler(e) {
        if (e.key === ' ' || e.key === 'Escape') { e.preventDefault(); skipPreloader(); }
      }
      function skipPreloader() {
        if (_skipped) return;
        _skipped = true;
        document.removeEventListener('keydown', _skipKeyHandler);
        if (preloader) preloader.removeEventListener('click', skipPreloader);
        clearInterval(loadTimer);
        clearTimeout(_biosTimer);
        if (_grainRaf)   cancelAnimationFrame(_grainRaf);
        if (_glitchRaf)  cancelAnimationFrame(_glitchRaf);
        if (_shakeTimer) { clearInterval(_shakeTimer); _shakeTimer = null; }
        if (tvInnerEl)   tvInnerEl.style.transform = '';
        if (preloader) {
          preloader.style.transition = 'opacity 0.3s ease';
          preloader.style.opacity    = '0';
          setTimeout(() => {
            if (preloader) preloader.style.visibility = 'hidden';
            revealPage();
          }, 320);
        } else {
          revealPage();
        }
      }

      if (_showSkip) {
        document.addEventListener('keydown', _skipKeyHandler);
        if (preloader) preloader.addEventListener('click', skipPreloader);
        const _hintDelay = _isMobilePtr ? 800 : 1100;
        setTimeout(() => {
          if (_skipped || !_skipHintEl) return;
          _skipHintEl.classList.add('is-visible');
          if (_isMobilePtr) {
            setTimeout(() => { if (!_skipped) _skipHintEl.classList.add('is-pulsing'); }, 700);
          }
        }, _hintDelay);
      }

      // ── BIOS sequence helper ──────────────────────────────────
      function runBiosSequence(container, onComplete) {
        const DSEP = '\u2550'.repeat(48); // ════
        const SSEP = '\u2500'.repeat(40); // ────

        // BIOS logo — sadece büyük text satırları, kutu/border yok
        [
          ['bios-line bios-line--empty', ''],
          ['bios-line bios-line--logo',  'G A L E K T O D R O M E'],
          ['bios-line bios-line--logo-tag', 'CREATIVE COMPUTING SYSTEM  \u25a0  v2026'],
          ['bios-line bios-line--empty', ''],
        ].forEach(([cls, txt]) => {
          const r = document.createElement('div');
          r.className = cls; r.textContent = txt;
          container.appendChild(r);
        });

        // Fixed header line + separator
        const hdrRow = document.createElement('div');
        hdrRow.className = 'bios-line bios-line--header';
        hdrRow.textContent = 'GALEKTODROME NEURAL BOOT SEQUENCE v1.3';
        container.appendChild(hdrRow);

        const sepRow = document.createElement('div');
        sepRow.className = 'bios-line bios-line--sep';
        sepRow.textContent = DSEP;
        container.appendChild(sepRow);

        // Terminal body — new lines append at bottom, old ones scroll off top
        const body = document.createElement('div');
        body.className = 'bios-terminal-body';
        container.appendChild(body);

        // [delay_ms, type, text, ok_text?]
        const lines = [
          [0,    'empty',   ''],
          [80,   'status',  'DEEP SIGNAL SCAN .......................', '[LOCKED]'],
          [240,  'status',  'COSMIC NETWORK LINK ....................', '[ESTABLISHED]'],
          [400,  'status',  'CREATIVE MATRIX ........................', '[ONLINE]'],
          [560,  'status',  'VISUAL CORTEX ..........................', '[SYNCHRONIZED]'],
          [720,  'status',  'NEURAL CANVAS ..........................', '[LOADED]'],
          [880,  'status',  'STYLE MATRIX ...........................', '[STABLE]'],
          [1040, 'status',  'ARTWORK ENGINE .........................', '[ACTIVE]'],
          [1200, 'status',  'PROJECT GRID ...........................', '[MOUNTED]'],
          [1360, 'empty',   ''],
          [1440, 'section', 'SYSTEM DIAGNOSTICS'],
          [1520, 'sep',     SSEP],
          [1640, 'status',  'MEMORY BANK ............................', '[CLEAR]'],
          [1790, 'status',  'ERROR TRACE ............................', '[NONE]'],
          [1940, 'plain',   'LATENCY ................................ 0.01ms'],
          [2090, 'plain',   'CREATIVE POWER ......................... 99%'],
          [2240, 'status',  'IMAGINATION CORE .......................', '[FLOWING]'],
          [2400, 'empty',   ''],
          [2480, 'section', 'SUBSYSTEM INITIALIZATION'],
          [2560, 'sep',     SSEP],
          [2680, 'status',  'INSPIRATION ENGINE .....................', '[ACTIVE]'],
          [2830, 'status',  'IDEA GENERATOR .........................', '[GENERATING]'],
          [2980, 'status',  'VISUAL LIBRARY .........................', '[INDEXED]'],
          [3130, 'status',  'CONCEPT ARCHIVE ........................', '[SYNCED]'],
          [3280, 'status',  'REALITY DISTORTION MODULE .............', '[ENABLED]'],
          [3440, 'empty',   ''],
          [3520, 'section', 'IDENTITY PROTOCOL'],
          [3600, 'sep',     SSEP],
          [3720, 'status',  'CREATOR SIGNATURE ......................', '[VERIFIED]'],
          [3870, 'status',  'ACCESS LEVEL ...........................', '[OMEGA PRIME]'],
          [4020, 'status',  'NEURAL LINK ............................', '[STABLE]'],
          [4180, 'empty',   ''],
          [4260, 'sep',     DSEP],
          [4380, 'empty',   ''],
          [4460, 'access',  'GALACTIC CREATIVE SYSTEM READY'],
          [4620, 'empty',   ''],
          [4700, 'welcome', 'WELCOME, FRIEND'],
          [4860, 'empty',   ''],
          [4940, 'welcome', "IT'S ALWAYS NICE TO SEE YOU"],
          [5100, 'welcome', 'HAVE A NICE DAY'],
          [5180, 'enter',   'ENTERING THE DROME...'],
          [5380, 'enter',   'EXPANDING CREATIVE UNIVERSE'],
        ];

        lines.forEach(([t, type, text, ok]) => {
          setTimeout(() => {
            const row = document.createElement('div');
            row.className = 'bios-line bios-line--' + (type === 'plain' ? 'status' : type);

            if (type === 'status') {
              const lbl = document.createElement('span');
              lbl.className = 'bl-label';
              lbl.textContent = text;
              const okSpan = document.createElement('span');
              okSpan.className = 'bl-ok';
              row.appendChild(lbl);
              row.appendChild(okSpan);
              body.appendChild(row);
              body.scrollTop = body.scrollHeight;
              setTimeout(() => { okSpan.textContent = ok; }, 200);

            } else if (type === 'enter' && text === 'EXPANDING CREATIVE UNIVERSE') {
              // Last line — typewriter + blink, no scroll so it stays in place
              body.appendChild(row);
              let i = 0;
              const cursor = document.createElement('span');
              cursor.className = 'bios-cursor';
              row.appendChild(cursor);
              const typeNext = () => {
                if (i < text.length) {
                  row.insertBefore(document.createTextNode(text[i++]), cursor);
                  setTimeout(typeNext, 48);
                } else {
                  cursor.remove();
                  row.classList.add('is-blinking');
                  setTimeout(onComplete, 1600);
                }
              };
              setTimeout(typeNext, 60);

            } else {
              row.textContent = text;
              body.appendChild(row);
              body.scrollTop = body.scrollHeight;
            }
          }, t);
        });
      }

      // ── At 3.3s — stop glitch ONLY, keep grain running for BIOS ─
      const _biosTimer = setTimeout(() => {
        if (_glitchRaf) cancelAnimationFrame(_glitchRaf);
        if (_shakeTimer) { clearInterval(_shakeTimer); _shakeTimer = null; }
        if (tvInnerEl)  tvInnerEl.style.transform = '';

        // Fade out tv-inner content
        if (tvInnerEl) {
          tvInnerEl.style.transition = 'opacity 0.28s ease';
          tvInnerEl.style.opacity    = '0';
        }

        // Show BIOS screen
        const biosEl = document.getElementById('tvBios');
        if (biosEl) {
          biosEl.classList.add('is-visible');
          runBiosSequence(biosEl, () => {
            if (_skipped) return;
            // ── Fade preloader ──────────────────────────────────
            if (preloader) {
              preloader.style.transition = 'opacity 0.5s ease';
              preloader.style.opacity    = '0';
              setTimeout(() => { if (preloader) preloader.style.visibility = 'hidden'; }, 530);
            }
            // ── Boot sequence ───────────────────────────────────
            setTimeout(revealPage, 700);
          });
        }
      }, 3300);
    }
  }

  // Sayfa elementleri tamamen hazır olduğunda sistemi başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();