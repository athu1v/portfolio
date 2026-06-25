/**
 * PROJECTS PAGE — projects.js
 */
(function () {
  'use strict';

  const PRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================================================================
     DATA LAYER
     ─────────────────────────────────────────────────────────────────
     Şu an statik veri kullanıyoruz.

     Sanity kurulunca loadProjects() fonksiyonunu şununla değiştir:

     async function loadProjects() {
       const query = encodeURIComponent(
         '*[_type=="uxProject" && visible==true] | order(order asc) { _id, title, category, client, year, tags, description, "image": image.asset->url }'
       );
       const res = await fetch(
         `https://YOUR_PROJECT_ID.api.sanity.io/v2021-10-21/data/query/production?query=${query}`
       );
       const { result } = await res.json();
       return result;
     }

     Sanity şeması (schemas/uxProject.js):
     {
       name: 'uxProject', title: 'UX/UI Project', type: 'document',
       fields: [
         { name: 'order',       title: 'Sıra',       type: 'number'  },
         { name: 'visible',     title: 'Görünür',    type: 'boolean' },
         { name: 'title',       title: 'Proje Adı',  type: 'string'  },
         { name: 'category',    title: 'Kategori',   type: 'string'  },
         { name: 'client',      title: 'Müşteri',    type: 'string'  },
         { name: 'year',        title: 'Yıl',        type: 'string'  },
         { name: 'image',       title: 'Görsel',     type: 'image'   },
         { name: 'tags',        title: 'Etiketler',  type: 'array',
           of: [{ type: 'string' }] },
         { name: 'description', title: 'Açıklama',   type: 'text'    },
       ]
     }
     ================================================================ */

  async function loadAllData() {
    try {
      const [projects, page, journey, skills, logos, settings] = await Promise.all([
        window.sanityFetch(
          `*[_type == "project" && published == true] | order(order asc) {
            "id": slug.current,
            title,
            "category": type,
            role,
            year,
            "image": heroImage.asset->url
          }`
        ),
        window.sanityFetch(`*[_type == "projectsPage"][0]{ introText, skills }`),
        window.sanityFetch(
          `*[_type == "journeyEntry"] | order(order asc) {
            _id, company, tag, role, description, period
          }`
        ),
        window.sanityFetch(`*[_type == "projectsPage"][0]{ skills }`),
        window.sanityFetch(
          `*[_type == "clientLogo"] | order(order asc) {
            _id, name, "logoUrl": logo.asset->url
          }`
        ),
        window.sanityFetch(
          `*[_type == "globalSettings"][0]{
            email, instagram, linkedin, cvEnabled, "cvUrl": cvFile.asset->url
          }`
        ),
      ]);
      var MOCK = _getMockData();
      return {
        projects: (projects && projects.length) ? projects : MOCK.projects,
        introText: (page && page.introText) ? page.introText : MOCK.introText,
        journey:  (journey  && journey.length)  ? journey  : MOCK.journey,
        skills:   ((page && page.skills && page.skills.length) ? page.skills : null) ||
                  ((skills && skills.skills && skills.skills.length) ? skills.skills : null) ||
                  MOCK.skills,
        logos:    logos    || [],
        settings: settings || {},
      };
    } catch (e) {
      console.warn('Sanity fetch failed, using fallback data', e);
      return _getMockData();
    }
  }

  function _getMockData() {
    return {
      projects: [
        { id: 'brand-identity',  title: 'Brand Identity System', category: 'Branding', year: '2025', image: '' },
        { id: 'fintech-app',     title: 'Fintech Mobile App',    category: 'UX/UI',    year: '2024', image: '' },
        { id: 'game-ui',         title: 'Game UI — Jollify',     category: 'Gaming',   year: '2023', image: '' },
        { id: 'design-system',   title: 'Paladium Design System',category: 'UX/UI',    year: '2024', image: '' },
      ],
      introText: "I'm Evren Yılmaz — UX/UI Designer & Project Lead. A few selected works from different eras — each one a different challenge, a different client, the same obsession with craft.",
      journey: [
        { _id: 'j1', company: 'Paladium Elektronik Para', tag: 'Fintech', role: 'Lead UX/UI Designer – Art Director',
          description: 'Reworked and redesigned missing or inconsistent product pages to create a more unified user experience across the platform. Redesigned key user journeys by structuring clearer UX flows and improving navigation between core features. Developed and documented a scalable design system to ensure consistency across the product.',
          period: '2024–2025' },
        { _id: 'j2', company: 'Jollify Games', tag: 'Gaming', role: 'Lead UX/UI Designer',
          description: 'Worked closely with art, game design, and development teams on multiple game projects. Contributed to the design of user interfaces and gameplay-related UX elements, ensuring visual clarity and cohesive interaction patterns within the games.',
          period: '2022–2023' },
        { _id: 'j3', company: 'Mudio Games', tag: 'Gaming', role: 'UX/UI Designer',
          description: 'Designed interfaces for mobile and PC game titles. Collaborated with cross-functional teams to deliver consistent and engaging user experiences across multiple game genres.',
          period: '2021–2022' },
        { _id: 'j4', company: 'Freelance', tag: 'Various', role: 'Product & Brand Designer',
          description: 'Worked with startups and agencies across fintech, e-commerce, and entertainment sectors. Delivered end-to-end design solutions from research and wireframing through to polished visual design and handoff.',
          period: '2019–2021' },
      ],
      skills: ['UX Research', 'UI Design', 'Figma', 'Design Systems', 'Prototyping', 'Motion Design', 'Art Direction', 'Brand Identity', 'Game UI'],
      logos: [],
      settings: { email: 'galekto@gmail.com', cvUrl: '#' },
    };
  }

  // ── Fluid config: no bg image, warm white dye on dark bg ──
  window.BgConfig = {
    GRAY_R: 225, GRAY_G: 222, GRAY_B: 218,
    EDGE_LOW: 0.08, EDGE_HIGH: 0.09,
  };

  const HOME_BG   = '#FBFBFB';
  const DETAIL_BG = '#272727';

  /* ── DOM ───────────────────────────────────────────────────── */
  let bgCanvas, bgCtx;
  let projectsList, magneticImg, magneticImgEl, magneticImgFrame;
  let cursorDot, cursorRing;
  let introTextEl, clientsLabelEl, heroTitleEl;
  let clientsSection, projectsWrap;
  let journeyHeroEl;
  let bgProgress = 0;

  /* ── CONSTANTS ─────────────────────────────────────────────── */
  const LERP = (a, b, t) => a + (b - a) * t;

  /* ── STATE ─────────────────────────────────────────────────── */
  let bgTime = 0;
  let _hGrid = null;

  // Cursor
  const _imx = parseFloat(sessionStorage.getItem('mx')||''), _imy = parseFloat(sessionStorage.getItem('my')||'');
  let rawX = (!isNaN(_imx)?_imx:-200), rawY = (!isNaN(_imy)?_imy:-200);
  let ringX = rawX, ringY = rawY;

  // Magnetic image
  let imgX = 0, imgY = 0;
  let imgTargetX = 0, imgTargetY = 0;
  let imgVelX = 0, imgPrevX = 0;
  let imgVelY = 0, imgPrevY = 0;
  let imgRotation = 0;
  let isOverList = false;

  // Menu morphing
  const MENU_FORMATIONS = [
    [[10,10],[21,10],[32,10],[10,21],[21,21],[32,21],[10,32],[21,32],[32,32]],
    [[21,8],[29,11],[34,19],[32,28],[25,33],[17,33],[9,28],[8,19],[11,11]],
    [[21,7],[21,13],[7,21],[13,21],[21,21],[29,21],[35,21],[21,29],[21,35]],
    [[5,4],[21,6],[37,4],[7,21],[21,21],[35,21],[5,37],[21,35],[37,37]],
  ];
  let _menuFormIdx = 0;

  // Idle fluid
  let idleT = 0, idleFluidTimer = 0;
  let prevMouseX = window.innerWidth / 2, prevMouseY = window.innerHeight / 2;

  /* ── BACKGROUND (topography) ───────────────────────────────── */
  function resizeBg() {
    bgCanvas.width  = window.innerWidth;
    bgCanvas.height = window.innerHeight;
  }

  function drawBackground(dt) {
    bgTime += dt;
    const W = bgCanvas.width, H = bgCanvas.height;
    bgCtx.clearRect(0, 0, W, H);

    const GW = 70, GH = 50;
    const GW1 = GW + 1, TOTAL = GW1 * (GH + 1);
    if (!_hGrid || _hGrid.length !== TOTAL) _hGrid = new Float32Array(TOTAL);

    const cellW = W / GW, cellH = H / GH;
    const PK = [
      [0.20,0.40,0.26,0.32,1.00],[0.72,0.28,0.28,0.32,1.00],
      [0.48,0.72,0.26,0.24,0.85],[0.05,0.60,0.20,0.26,0.75],
      [0.92,0.55,0.22,0.28,0.75],[0.38,0.05,0.24,0.20,0.65],
    ];
    const bs = bgTime * 0.5;

    for (let row = 0; row <= GH; row++) {
      const ny = row / GH, base = row * GW1;
      for (let col = 0; col <= GW; col++) {
        const nx = col / GW;
        let h = 0;
        for (let p = 0; p < PK.length; p++) {
          const pk = PK[p];
          const driftX = 0.014 * Math.sin(bs * 0.08 + p * 2.1);
          const driftY = 0.010 * Math.cos(bs * 0.10 + p * 1.7);
          const amp = pk[4] * (1.0 + 0.18 * Math.sin(bs * 0.28 + p * 0.9));
          const dx = (nx - pk[0] - driftX) / pk[2];
          const dy = (ny - pk[1] - driftY) / pk[3];
          h += amp * Math.exp(-0.5 * (dx*dx + dy*dy));
        }
        _hGrid[base + col] = h;
      }
    }

    const lv_min = 0.22, lv_max = 2.58, nL = 7;
    const spacing = (lv_max - lv_min) / (nL - 1);
    bgCtx.lineCap = 'round'; bgCtx.lineJoin = 'round';

    for (let li = 0; li < nL; li++) {
      const lv = lv_min + li * spacing;
      const isIdx = (li % 3 === 0);
      bgCtx.beginPath();
      bgCtx.lineWidth   = isIdx ? 1.0 : 0.5;
      // Interpolate line colour: white on red → dark on light gray
      const cLv = Math.round(255 * (1 - bgProgress));
      const loIdx = (0.18 * (1 - bgProgress) + 0.22 * bgProgress).toFixed(3);
      const loReg = (0.09 * (1 - bgProgress) + 0.12 * bgProgress).toFixed(3);
      bgCtx.strokeStyle = isIdx
        ? `rgba(${cLv},${cLv},${cLv},${loIdx})`
        : `rgba(${cLv},${cLv},${cLv},${loReg})`;

      for (let row = 0; row < GH; row++) {
        const r0 = row * GW1, r1 = (row + 1) * GW1;
        const y0 = row * cellH, y1 = y0 + cellH;
        for (let col = 0; col < GW; col++) {
          const h00 = _hGrid[r0+col], h10 = _hGrid[r0+col+1];
          const h11 = _hGrid[r1+col+1], h01 = _hGrid[r1+col];
          const b0 = h00>lv?1:0, b1 = h10>lv?1:0, b2 = h11>lv?1:0, b3 = h01>lv?1:0;
          const mc = b0|(b1<<1)|(b2<<2)|(b3<<3);
          if (mc===0||mc===15) continue;
          const x0 = col*cellW, x1 = x0+cellW;
          switch (mc) {
            case 1:case 14:{const tT=(lv-h00)/(h10-h00),tL=(lv-h00)/(h01-h00);bgCtx.moveTo(x0+tT*cellW,y0);bgCtx.lineTo(x0,y0+tL*cellH);break;}
            case 2:case 13:{const tT=(lv-h00)/(h10-h00),tR=(lv-h10)/(h11-h10);bgCtx.moveTo(x0+tT*cellW,y0);bgCtx.lineTo(x1,y0+tR*cellH);break;}
            case 3:case 12:{const tL=(lv-h00)/(h01-h00),tR=(lv-h10)/(h11-h10);bgCtx.moveTo(x0,y0+tL*cellH);bgCtx.lineTo(x1,y0+tR*cellH);break;}
            case 4:case 11:{const tR=(lv-h10)/(h11-h10),tB=(lv-h01)/(h11-h01);bgCtx.moveTo(x1,y0+tR*cellH);bgCtx.lineTo(x0+tB*cellW,y1);break;}
            case 5:{const tT=(lv-h00)/(h10-h00),tL=(lv-h00)/(h01-h00),tR=(lv-h10)/(h11-h10),tB=(lv-h01)/(h11-h01);bgCtx.moveTo(x0+tT*cellW,y0);bgCtx.lineTo(x0,y0+tL*cellH);bgCtx.moveTo(x1,y0+tR*cellH);bgCtx.lineTo(x0+tB*cellW,y1);break;}
            case 6:case 9:{const tT=(lv-h00)/(h10-h00),tB=(lv-h01)/(h11-h01);bgCtx.moveTo(x0+tT*cellW,y0);bgCtx.lineTo(x0+tB*cellW,y1);break;}
            case 7:case 8:{const tL=(lv-h00)/(h01-h00),tB=(lv-h01)/(h11-h01);bgCtx.moveTo(x0,y0+tL*cellH);bgCtx.lineTo(x0+tB*cellW,y1);break;}
            case 10:{const tT=(lv-h00)/(h10-h00),tR=(lv-h10)/(h11-h10),tL=(lv-h00)/(h01-h00),tB=(lv-h01)/(h11-h01);bgCtx.moveTo(x0+tT*cellW,y0);bgCtx.lineTo(x1,y0+tR*cellH);bgCtx.moveTo(x0,y0+tL*cellH);bgCtx.lineTo(x0+tB*cellW,y1);break;}
          }
        }
      }
      bgCtx.stroke();
    }
  }

  /* ── PROJECT LIST RENDER ───────────────────────────────────── */
  function renderProjects(projects) {
    projectsList.innerHTML = '';

    projects.forEach((p, i) => {
      const li = document.createElement('li');
      li.className = 'project-row';
      li.dataset.id = p.id;
      li.dataset.image = p.image || '';

      const href = `/projects/${p.id}`;
      const tagsHTML = (p.tags || [])
        .map(t => `<span class="project-tag">${t}</span>`)
        .join('');

      li.innerHTML = `
        <a href="${href}" class="project-row-link" aria-label="${p.title} project${p.category ? ', ' + p.category : ''}${p.role ? ', ' + p.role : ''}">
          <div class="project-row-head">
            <span class="project-row-title" data-orig="${p.title}">${p.title}</span>
            ${p.category ? `<span class="project-row-cat">${p.category}</span>` : ''}
            ${p.client   ? `<span class="project-row-client">${p.client}</span>` : ''}
            <span class="project-row-year">${p.year || ''}</span>
          </div>
        </a>
      `;

      // Click: use TxOut transition, prevent default href navigation
      const linkEl = li.querySelector('.project-row-link');
      linkEl.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.TxOut === 'function') {
          window.TxOut(href, p.title.toUpperCase());
        } else {
          window.location.href = href;
        }
      });

      // Mouse enter: activate row + update magnetic image + scramble title
      li.addEventListener('mouseenter', () => {
        if (isTouch) return;
        document.querySelectorAll('.project-row.is-active').forEach(r => r.classList.remove('is-active'));
        li.classList.add('is-active');
        isOverList = true;
        magneticImg.classList.add('is-visible');
        updateMagneticImage(p.image);
        // Scramble title on hover
        const titleEl = li.querySelector('.project-row-title');
        if (titleEl && !li.dataset.scrambling) {
          li.dataset.scrambling = '1';
          scrambleTitle(titleEl, titleEl.dataset.orig || titleEl.textContent.trim());
          setTimeout(() => delete li.dataset.scrambling, 700);
        }
      });

      li.addEventListener('mouseleave', () => {
        // Keep is-active on the last hovered row until another takes over
      });

      projectsList.appendChild(li);
    });

    // When leaving the entire list
    projectsList.addEventListener('mouseleave', () => {
      isOverList = false;
      magneticImg.classList.remove('is-visible');
      document.querySelectorAll('.project-row.is-active').forEach(r => r.classList.remove('is-active'));
      currentImgSrc = ''; // reset so returning to same project re-triggers the image
    });
  }

  /* ── MAGNETIC IMAGE UPDATE ─────────────────────────────────── */
  let currentImgSrc = '';

  function updateMagneticImage(src) {
    if (src === currentImgSrc) return;
    currentImgSrc = src;

    if (!src) {
      magneticImgEl.style.opacity = '0';
      return;
    }

    magneticImgEl.classList.add('is-changing');
    setTimeout(() => {
      magneticImgEl.src = (window.sanityImgUrl || (u => u))(src, 900);
      magneticImgEl.onload = () => {
        magneticImgEl.classList.remove('is-changing');
      };
      // Fallback if image doesn't exist yet
      magneticImgEl.onerror = () => {
        magneticImgEl.style.opacity = '0';
        magneticImgEl.classList.remove('is-changing');
      };
    }, 120);
  }

  /* ── SCRAMBLE TITLE ────────────────────────────────────────── */
  const _CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function scrambleTitle(el, original) {
    const dur = 650;
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      let result = '';
      for (let i = 0; i < original.length; i++) {
        if (original[i] === ' ') { result += ' '; continue; }
        if (t > i / original.length) { result += original[i]; }
        else { result += _CHARS[Math.floor(Math.random() * _CHARS.length)]; }
      }
      el.textContent = result;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = original;
    }
    requestAnimationFrame(tick);
  }

  /* ── MENU FORMATION ────────────────────────────────────────── */
  function applyMenuFormation(idx) {
    const spans = document.querySelectorAll('.menu-dots span');
    const f = MENU_FORMATIONS[idx];
    spans.forEach((s, i) => { s.style.left = f[i][0] + 'px'; s.style.top = f[i][1] + 'px'; });
  }

  /* ── FLUID TEXT GRADIENT ──────────────────────────────────── */
  /* ── FLUID TEXT MASK ──────────────────────────────────────── */
  function initFluidText(el) {
    if (!el) return;
    el.style.backgroundImage     = 'linear-gradient(rgba(255,255,255,0.85),rgba(255,255,255,0.85))';
    el.style.webkitBackgroundClip = 'text';
    el.style.backgroundClip      = 'text';
    el.style.webkitTextFillColor = 'transparent';
  }

  // Per-element offscreen canvases for 2D fluid mask
  const _maskCanvases = new Map();

  const _isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  function applyFluidTextMask(el) {
    if (!el || !window.FluidSim || !window.FluidSim.getRegionPixels) return;
    if (isTouch) return;
    if (_isSafari) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // ONE GPU read for the full element region
    const rw = Math.ceil(rect.width);
    const rh = Math.ceil(rect.height);

    // Canvas matches element exactly — no CSS scaling, no pixelation
    const CW = rw, CH = rh;
    const raw = window.FluidSim.getRegionPixels(rect.left, rect.top, rw, rh);
    // raw: RGBA, rows bottom-to-top (WebGL y-flip), size rw×rh

    // Reuse or create output canvas
    let canvas = _maskCanvases.get(el);
    if (!canvas) { canvas = document.createElement('canvas'); _maskCanvases.set(el, canvas); }
    if (canvas.width !== CW || canvas.height !== CH) { canvas.width = CW; canvas.height = CH; }
    const ctx     = canvas.getContext('2d');
    const imgData = ctx.createImageData(CW, CH);
    const data    = imgData.data;

    const THRESHOLD = 0.06;
    const EDGE      = 0.025; // antialias transition width

    for (let cy = 0; cy < CH; cy++) {
      // Map canvas row → raw row (y-flipped: cy=0 is top of element = last row in raw)
      const rawRow = rh - 1 - Math.round(cy / CH * (rh - 1));
      for (let cx = 0; cx < CW; cx++) {
        const rawCol = Math.round(cx / CW * (rw - 1));
        const rawIdx = (rawRow * rw + rawCol) * 4;
        const alpha  = raw[rawIdx + 3] / 255;

        // Smoothstep over a narrow band around threshold — crisp but antialiased edge
        const t      = Math.max(0, Math.min(1, (alpha - (THRESHOLD - EDGE)) / (EDGE * 2)));
        const smooth = t * t * (3 - 2 * t);

        const dstIdx = (cy * CW + cx) * 4;
        data[dstIdx]     = Math.round(255 - smooth * (255 - 42));
        data[dstIdx + 1] = Math.round(255 - smooth * (255 - 42));
        data[dstIdx + 2] = Math.round(255 - smooth * (255 - 42));
        data[dstIdx + 3] = Math.round(217 + smooth * (255 - 217));
      }
    }

    ctx.putImageData(imgData, 0, 0);
    el.style.backgroundImage = `url(${canvas.toDataURL()})`;
    el.style.backgroundSize  = '100% 100%';
  }

  /* ── MAIN LOOP ─────────────────────────────────────────────── */
  let lastTs = 0;

  function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    drawBackground(dt);

    // ── Fluid-over title scramble check ──────────────────────
    const activeRow = !isTouch && document.querySelector('.project-row.is-active');
    if (activeRow && window.FluidSim && window.FluidSim.getFluidAlpha) {
      const titleEl = activeRow.querySelector('.project-row-title');
      if (titleEl && !activeRow.dataset.scrambling && !activeRow.dataset.scrambleCd) {
        const rect  = titleEl.getBoundingClientRect();
        const alpha = window.FluidSim.getFluidAlpha(rect.left + rect.width * 0.25, rect.top + rect.height / 2);
        if (alpha > 0.15) {
          activeRow.dataset.scrambling = '1';
          scrambleTitle(titleEl, titleEl.dataset.orig || titleEl.textContent.trim());
          setTimeout(() => {
            delete activeRow.dataset.scrambling;
            activeRow.dataset.scrambleCd = '1';
            setTimeout(() => delete activeRow.dataset.scrambleCd, 3000);
          }, 700);
        }
      }
    }

    // Menu dots fluid-over detection
    const menuEl = document.getElementById('menuDots');
    if (menuEl && window.FluidSim && window.FluidSim.getFluidAlpha) {
      const mr  = menuEl.getBoundingClientRect();
      const alpha = window.FluidSim.getFluidAlpha((mr.left + mr.right) / 2, (mr.top + mr.bottom) / 2);
      menuEl.classList.toggle('fluid-over', alpha > 0.08);
    }

    // Fluid-paint mask on hero title, intro text, and clients label
    applyFluidTextMask(heroTitleEl);
    applyFluidTextMask(introTextEl);
    applyFluidTextMask(clientsLabelEl);

    // Cursor ring
    ringX = LERP(ringX, rawX, 0.12);
    ringY = LERP(ringY, rawY, 0.12);
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';

    // Magnetic image — appears to the RIGHT of cursor, vertically centered
    const imgW = magneticImg.offsetWidth;
    const imgH = magneticImg.offsetHeight;
    // If cursor is in the right half of the screen, flip to left side
    const sideOffset = rawX > window.innerWidth * 0.6 ? -(imgW + 32) : 32;
    imgTargetX = rawX + sideOffset;
    imgTargetY = rawY - imgH / 2;

    imgX = LERP(imgX, imgTargetX, 0.10);
    imgY = LERP(imgY, imgTargetY, 0.10);

    // Velocity-based rotation (2D) + velocity-based 3D tilt
    imgVelX = LERP(imgVelX, rawX - imgPrevX, 0.25);
    imgVelY = LERP(imgVelY, rawY - imgPrevY, 0.25);
    imgPrevX = rawX;
    imgPrevY = rawY;
    imgRotation = LERP(imgRotation, imgVelX * 5, 0.08);

    const tiltY =  imgVelX * 1.2;
    const tiltX = -imgVelY * 1.2;

    magneticImg.style.transform =
      `translate(${imgX.toFixed(1)}px, ${imgY.toFixed(1)}px) rotate(${imgRotation.toFixed(2)}deg) perspective(600px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;

    // Glare — velocity yönüne göre kayar
    const glare = document.getElementById('magneticImgGlare');
    if (glare) {
      const gx = Math.min(Math.max(imgVelX * 3 + 50, 10), 90);
      const gy = Math.min(Math.max(imgVelY * 3 + 50, 10), 90);
      glare.style.background = `radial-gradient(circle at ${gx.toFixed(0)}% ${gy.toFixed(0)}%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 45%, transparent 70%)`;
    }

    requestAnimationFrame(loop);
  }

  /* ── EVENTS ────────────────────────────────────────────────── */
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  function setupEvents() {
    /* Prevent native image drag/float on touch devices */
    if (isTouch) {
      document.addEventListener('dragstart', (e) => { e.preventDefault(); }, { passive: false });
      document.querySelectorAll('img').forEach((img) => { img.setAttribute('draggable', 'false'); });
    }

    document.addEventListener('mousemove', (e) => {
      // iOS touch cihazlarda mousemove sahte tetiklenir — splat ve cursor güncelleme atla
      if (isTouch) return;
      rawX = e.clientX;
      rawY = e.clientY;
      cursorDot.style.left = e.clientX + 'px';
      cursorDot.style.top  = e.clientY + 'px';

      // Fluid splat from mouse movement
      if (window.FluidSim) {
        const dx = (e.clientX - prevMouseX) / window.innerWidth;
        const dy = (e.clientY - prevMouseY) / window.innerHeight;
        window.FluidSim.splat(e.clientX, e.clientY, dx, dy);
      }
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('resize', resizeBg);

    // Footer nav — page transitions
    const FOOTER_COLORS = {
      '/':    '#1a1614',
      '/projects': '#ef4444',
      '/artworks': '#1d4ed8',
      '/contact':  '#1a1614',
    };
    document.querySelectorAll('.footer-nav-link:not(.footer-instagram):not([target="_blank"])').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const href  = link.getAttribute('href');
        const label = link.textContent.trim().toUpperCase();
        if (typeof window.TxOut === 'function') {
          window.TxOut(href, label, FOOTER_COLORS[href] || '#1a1614');
        } else {
          window.location.href = href;
        }
      });
    });
  }

  /* ── JOURNEY: scramble on hover ───────────────────────────── */
  function setupJourneyScramble() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.querySelectorAll('.journey-entry').forEach(entry => {
      const companyEl = entry.querySelector('.journey-company');
      if (!companyEl) return;
      entry.addEventListener('mouseenter', () => {
        if (entry.dataset.scrambling) return;
        const chars   = companyEl.querySelectorAll('.jc-inner');
        const origArr = (companyEl.dataset.orig || '').replace(/ /g, '').split('');
        entry.dataset.scrambling = '1';
        const dur   = 600;
        const start = performance.now();
        (function tick(now) {
          const t = Math.min((now - start) / dur, 1);
          chars.forEach((span, i) => {
            span.textContent = t > i / chars.length
              ? (origArr[i] || '')
              : _CHARS[Math.floor(Math.random() * _CHARS.length)];
          });
          if (t < 1) requestAnimationFrame(tick);
          else {
            chars.forEach((span, i) => { span.textContent = origArr[i] || ''; });
            delete entry.dataset.scrambling;
          }
        })(performance.now());
      });
    });
  }

  /* ── JOURNEY: char split ──────────────────────────────────── */
  function splitJourneyChars() {
    document.querySelectorAll('.journey-company, .journey-hero-title').forEach(el => {
      const text = el.textContent.trim();
      el.dataset.orig = text;
      el.innerHTML = '';
      let ci = 0;
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          el.appendChild(document.createTextNode('\u00A0'));
        } else {
          const wrap  = document.createElement('span');
          wrap.className = 'jc';
          const inner = document.createElement('span');
          inner.className = 'jc-inner';
          inner.style.setProperty('--ci', ci++);
          inner.textContent = text[i];
          wrap.appendChild(inner);
          el.appendChild(wrap);
        }
      }
    });
  }

  /* ── JOURNEY: scroll observer ─────────────────────────────── */
  function setupJourneyObserver() {
    const entries    = document.querySelectorAll('.journey-entry');
    const skillsWrap = document.getElementById('journeySkills');
    const hero       = document.querySelector('.journey-hero');

    const obs = new IntersectionObserver((recs) => {
      recs.forEach(rec => {
        if (rec.isIntersecting) {
          rec.target.classList.add('is-visible');
          obs.unobserve(rec.target);
        }
      });
    }, { threshold: 0.10 });

    if (hero)      obs.observe(hero);
    entries.forEach(e => obs.observe(e));
    if (skillsWrap) obs.observe(skillsWrap);
  }

  /* ── JOURNEY: background colour transition ─────────────────── */
  function setupBgTransition() {
    if (!projectsWrap) return;
    const journeySection = document.querySelector('.journey-section');
    if (!journeySection) return;

    // Red #ef4444 → Light gray #f4f2ee
    const FROM = { r: 239, g: 68,  b: 68  };
    const TO   = { r: 244, g: 242, b: 238 };

    projectsWrap.addEventListener('scroll', () => {
      const rect  = journeySection.getBoundingClientRect();
      const viewH = window.innerHeight;
      // Starts when journey section top reaches 50% down the viewport,
      // completes quickly over the next 20% of viewport height
      const triggerStart = viewH * 0.50;
      const transitionDistance = viewH * 0.35;
      const progress = Math.max(0, Math.min(1, (triggerStart - rect.top) / transitionDistance));
      bgProgress = progress;

      const r = Math.round(FROM.r + (TO.r - FROM.r) * progress);
      const g = Math.round(FROM.g + (TO.g - FROM.g) * progress);
      const b = Math.round(FROM.b + (TO.b - FROM.b) * progress);
      const bgStr = `rgb(${r},${g},${b})`;

      document.body.style.backgroundColor = bgStr;
      document.documentElement.style.setProperty('--page-bg', bgStr);
    }, { passive: true });
  }

  /* ── RENDER JOURNEY ───────────────────────────────────────── */
  function renderJourney(entries) {
    const list = document.getElementById('journeyList');
    if (!list) return;
    list.innerHTML = '';
    entries.forEach((entry, i) => {
      const nr = String(i + 1).padStart(2, '0');
      const art = document.createElement('article');
      art.className = 'journey-entry';
      art.innerHTML = `
        <div class="journey-entry-head">
          <span class="journey-nr">${nr}</span>
          <h3 class="journey-company">${entry.company || ''}</h3>
          ${entry.tag    ? `<span class="journey-cat">${entry.tag}</span>` : ''}
          ${entry.period ? `<span class="journey-period">${entry.period}</span>` : ''}
        </div>
        <div class="journey-entry-body">
          ${entry.role        ? `<span class="journey-role">${entry.role}</span>` : ''}
          ${entry.description ? `<p class="journey-desc">${entry.description}</p>` : ''}
        </div>
      `;
      list.appendChild(art);
    });
  }

  /* ── RENDER SKILLS ─────────────────────────────────────────── */
  function renderSkills(skills) {
    const wrap = document.getElementById('skillsList');
    if (!wrap) return;
    wrap.innerHTML = skills.map(s => `<span class="skill-tag">${s}</span>`).join('');
  }

  /* ── RENDER CLIENTS ────────────────────────────────────────── */
  function renderClients(logos) {
    const track = document.getElementById('clientsTrack');
    if (!track || !logos.length) return;

    // iOS Safari freezes off-screen animations — restart when visible
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            track.style.animationName = 'none';
            track.offsetWidth; // reflow
            track.style.animationName = '';
            io.disconnect();
          }
        });
      }, { threshold: 0.1 });
      io.observe(track.parentElement || track);
    }

    // Duplicate logos for seamless marquee (2 sets, animate -50%)
    let html = '';
    for (let s = 0; s < 2; s++) {
      logos.forEach(logo => {
        html += `<img src="${(window.sanityImgUrl||(u=>u))(logo.logoUrl,300)}" alt="${logo.name || ''}" class="client-logo">`;
      });
    }
    track.innerHTML = html;
  }

  /* ── APPLY GLOBAL SETTINGS ─────────────────────────────────── */
  function applySettings(settings) {
    if (!settings) return;
    // Email — all mailto links
    if (settings.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
        a.href = `mailto:${settings.email}`;
      });
    }
    // CV
    const cvBtn = document.getElementById('cvBtn');
    if (cvBtn) {
      if (settings.cvEnabled === false) {
        cvBtn.closest('.journey-footer') && (cvBtn.closest('.journey-footer').style.display = 'none');
      } else if (settings.cvUrl) {
        cvBtn.href = settings.cvUrl;
      }
    }
    // Social links in footer
    if (settings.instagram) {
      document.querySelectorAll('a.footer-instagram, a[href*="instagram.com"]').forEach(a => {
        a.href = safeUrl(settings.instagram);
      });
    }
    if (settings.linkedin) {
      document.querySelectorAll('a[href*="linkedin.com"]').forEach(a => {
        a.href = safeUrl(settings.linkedin);
      });
    }
  }

  /* ── INIT ──────────────────────────────────────────────────── */
  async function init() {
    bgCanvas      = document.getElementById('bgCanvas');
    bgCtx         = bgCanvas.getContext('2d');
    projectsList  = document.getElementById('projectsList');
    magneticImg   = document.getElementById('magneticImg');
    magneticImgEl = document.getElementById('magneticImgEl');
    magneticImgFrame = document.getElementById('magneticImgFrame');
    cursorDot     = document.getElementById('cursorDot');
    cursorRing    = document.getElementById('cursorRing');
    if (cursorDot)  { cursorDot.style.left  = rawX+'px'; cursorDot.style.top  = rawY+'px'; }
    if (cursorRing) { cursorRing.style.left = ringX+'px'; cursorRing.style.top = ringY+'px'; }
    introTextEl    = document.querySelector('.page-intro-text');
    clientsLabelEl = document.querySelector('.clients-label');
    heroTitleEl    = document.querySelector('.projects-hero-title');
    clientsSection = document.querySelector('.clients-section');
    projectsWrap   = document.querySelector('.projects-wrap');
    journeyHeroEl  = document.querySelector('.journey-hero');
    initFluidText(heroTitleEl);
    initFluidText(introTextEl);
    initFluidText(clientsLabelEl);

    resizeBg();
    setupEvents();
    setupBgTransition();

    // Menu morphing
    applyMenuFormation(0);
    setInterval(() => {
      _menuFormIdx = (_menuFormIdx + 1) % MENU_FORMATIONS.length;
      applyMenuFormation(_menuFormIdx);
    }, 3500);

    // Init magnetic image position off-screen
    imgX = -500; imgY = -500;
    imgTargetX = -500; imgTargetY = -500;

    // Back to top
    const topBtn = document.getElementById('footerTopBtn');
    if (topBtn && projectsWrap) {
      topBtn.addEventListener('click', () => {
        projectsWrap.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // ── TxIn: panels exit, reveal projects ──────────────────────
    if (typeof window.TxIn === 'function') window.TxIn();

    if (!PRM) requestAnimationFrame((ts) => { lastTs = ts; requestAnimationFrame(loop); });

    // ── Load data from Sanity ────────────────────────────────────
    const data = await loadAllData();

    // Intro text
    if (data.introText && introTextEl) {
      introTextEl.textContent = data.introText;
    }

    // Projects list
    renderProjects(data.projects);

    // Journey
    renderJourney(data.journey);
    setupJourneyObserver();

    // Skills
    renderSkills(data.skills);

    // Client logos
    renderClients(data.logos);

    // Global settings (email, cv, social)
    applySettings(data.settings);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
