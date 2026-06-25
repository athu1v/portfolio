/* ================================================================
   GLOBAL NAV — nav.js
   ================================================================ */

(function () {
  'use strict';

  /* ── Page transition map ───────────────────────────────────── */
  var TX_COLORS = {
    '/':          '#1c1c22',
    '/projects':       '#ef4444',
    '/artworks':       '#1d4ed8',
    '/contact':        '#1c1c22',
    '/project-detail': '#1a1614',
  };
  var TX_LABELS = {
    '/':          'HOME',
    '/projects':       'PROJECTS',
    '/artworks':       'ARTWORKS',
    '/contact':        'CONTACT',
    '/project-detail': 'PROJECT',
  };

  function navigate(href) {
    var color = TX_COLORS[href] || '#1a1614';
    var label = TX_LABELS[href] || href.replace('.html','').toUpperCase();
    if (typeof window.TxOut === 'function') {
      window.TxOut(href, label, color);
    } else {
      window.location.href = href;
    }
  }

  /* ── SVG ICON LIBRARY ──────────────────────────────────────── */
  var ICONS = {
    eye:           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="10" ry="5.5"/><circle cx="12" cy="12" r="2.5"/></svg>',
    diamond:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 22,12 12,22 2,12"/></svg>',
    triangle:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,3 22,21 2,21"/></svg>',
    hexagon:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 21,7 21,17 12,22 3,17 3,7"/></svg>',
    grid:          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="2" x2="8" y2="22"/><line x1="16" y1="2" x2="16" y2="22"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="2" y1="16" x2="22" y2="16"/></svg>',
    compass:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"/></svg>',
    frame:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>',
    circle:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>',
    moon:          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    cross:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
    wave:          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12 Q5 6 8 12 Q11 18 14 12 Q17 6 20 12 Q21.5 15 22 12"/></svg>',
    spiral:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 12 Q16 8 16 12 Q16 17 11 17 Q6 17 6 11 Q6 5 13 5 Q20 5 20 12 Q20 19 12 19"/></svg>',
    ufo:           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="13" rx="10" ry="4"/><path d="M8 13 Q9 9 12 8 Q15 9 16 13"/><ellipse cx="12" cy="8" rx="3" ry="2.5"/><line x1="5" y1="16" x2="3" y2="19"/><line x1="12" y1="17" x2="12" y2="20"/><line x1="19" y1="16" x2="21" y2="19"/></svg>',
    alien:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="10" rx="7" ry="9"/><ellipse cx="9.5" cy="9" rx="2" ry="2.5"/><ellipse cx="14.5" cy="9" rx="2" ry="2.5"/><path d="M9 15 Q12 17 15 15"/></svg>',
    planet:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-20 12 12)"/></svg>',
    signal:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12.5 Q8 6 12 6 Q16 6 19 12.5"/><path d="M7 14 Q9.5 9.5 12 9.5 Q14.5 9.5 17 14"/><circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/></svg>',
    constellation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="5" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="7" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="13" r="1.5" fill="currentColor" stroke="none"/><circle cx="7" cy="19" r="1.5" fill="currentColor" stroke="none"/><circle cx="18" cy="18" r="1.5" fill="currentColor" stroke="none"/><line x1="5" y1="5" x2="19" y2="7"/><line x1="19" y1="7" x2="12" y2="13"/><line x1="12" y1="13" x2="7" y2="19"/><line x1="12" y1="13" x2="18" y2="18"/></svg>',
  };

  /* ── Icon pools per page ───────────────────────────────────── */
  var POOLS = {
    index:    ['eye', 'diamond', 'circle', 'hexagon', 'compass', 'spiral', 'frame', 'moon'],
    projects: ['diamond', 'grid', 'frame', 'hexagon', 'compass', 'triangle', 'cross', 'wave'],
    artworks: ['eye', 'frame', 'circle', 'moon', 'spiral', 'wave', 'constellation', 'diamond'],
    detail:   ['frame', 'triangle', 'hexagon', 'cross', 'circle', 'compass', 'grid', 'diamond'],
    contact:  ['ufo', 'alien', 'planet', 'signal', 'constellation', 'moon', 'ufo', 'alien'],
  };

  /* ── Detect current page ───────────────────────────────────── */
  function getPageKey() {
    var cl = document.body.classList;
    if (cl.contains('page-uxui'))     return 'projects';
    if (cl.contains('page-artworks')) return 'artworks';
    if (cl.contains('page-detail'))   return 'detail';
    if (cl.contains('page-contact'))  return 'contact';
    return 'index';
  }

  /* ── Build nav HTML ────────────────────────────────────────── */
  function buildNav() {
    var pageKey = getPageKey();
    var pool    = POOLS[pageKey];
    var active  = { projects: 'projects', artworks: 'artworks', detail: '', contact: 'contact' }[pageKey] || '';

    // Left content
    var leftHTML;
    if (pageKey === 'projects' || pageKey === 'artworks') {
      leftHTML = '<a href="/" class="nav-left-text" data-nav-home>HOME</a>';
    } else if (pageKey === 'detail') {
      leftHTML = '<a href="/projects" class="nav-left-text" data-nav-back="/projects">\u2190 BACK TO THE PROJECTS</a>';
    } else if (pageKey === 'contact') {
      leftHTML = '<a href="/" class="nav-left-text" data-nav-home>I WANT TO BELIEVE</a>';
    } else {
      // index — starts with EVREN, swaps on mouse side
      leftHTML = '<span class="nav-left-text" id="navIndexLabel">EVREN</span>';
    }

    function lc(name) {
      return 'nav-link' + (active === name ? ' is-active' : '');
    }

    var icons = [pool[0], pool[1], pool[2]];
    var iconsHTML = (pageKey === 'detail' || pageKey === 'index') ? '' : icons.map(function (k) {
      return '<span class="nav-icon">' + ICONS[k] + '</span>';
    }).join('');

    var burgerHTML = pageKey !== 'index'
      ? '<button class="nav-burger" id="navBurger" aria-label="Open menu"><span></span><span></span><span></span></button>'
      : '';

    var nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'Site navigation');
    nav.innerHTML =
      '<div class="nav-left">' + leftHTML + '</div>' +
      (pageKey !== 'detail' && pageKey !== 'index' ? '<div class="nav-icons" id="navIcons">' + iconsHTML + '</div>' : '') +
      '<div class="nav-links">' +
        '<a href="/projects" class="' + lc('projects') + '" data-nav-link="/projects">Projects</a>' +
        '<a href="/artworks" class="' + lc('artworks') + '" data-nav-link="/artworks">Artworks</a>' +
        '<a href="/contact"  class="' + lc('contact')  + '" data-nav-link="/contact">Contact</a>' +
      '</div>' +
      burgerHTML;

    return nav;
  }

  /* ── Wire up link clicks with transitions ──────────────────── */
  function wireLinks(nav) {
    nav.querySelectorAll('[data-nav-link]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        navigate(a.getAttribute('data-nav-link'));
      });
    });

    nav.querySelectorAll('[data-nav-home]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        navigate('/');
      });
    });

    // Quick back — no panel transition, just a fast dark cover
    nav.querySelectorAll('[data-nav-back]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var href = a.getAttribute('data-nav-back');
        var cover = document.createElement('div');
        cover.style.cssText = 'position:fixed;inset:0;z-index:9900;background:#1a1614;opacity:0;transition:opacity 220ms ease;pointer-events:none;';
        document.body.appendChild(cover);
        cover.offsetHeight;
        cover.style.opacity = '1';
        setTimeout(function () { window.location.href = href; }, 260);
      });
    });
  }

  /* ── Index left label: EVREN ↔ GALEKTO on mouse side ──────── */
  function initIndexLabel() {
    var label = document.getElementById('navIndexLabel');
    if (!label) return;
    var current = 'EVREN';
    document.addEventListener('mousemove', function (e) {
      var half   = window.innerWidth / 2;
      var next   = e.clientX < half ? 'EVREN' : 'GALEKTO';
      if (next !== current) {
        current = next;
        label.textContent = next;
      }
    }, { passive: true });
  }

  /* ── Scroll-reactive background ────────────────────────────── */
  function initScrollReactive(nav, scrollEl) {
    var threshold = 50;
    function onScroll() {
      var sy = (scrollEl === window)
        ? (window.scrollY || window.pageYOffset)
        : scrollEl.scrollTop;
      nav.classList.toggle('is-scrolled', sy > threshold);
    }
    var target = (scrollEl === window) ? window : scrollEl;
    target.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Sequential icon cycling ────────────────────────────────── */
  function initIconCycle(nav, pool, scrollEl) {
    var container  = nav.querySelector('#navIcons');
    var offset     = 0;
    var busy       = false;
    var OUT_MS     = 150;
    var IN_MS      = 200;
    var STAGGER    = 100;

    function cycleIcons(dir) {
      if (busy || !container) return;
      busy = true;

      var iconEls    = Array.from(container.querySelectorAll('.nav-icon'));
      var nextOffset = (offset + dir + pool.length) % pool.length;
      var nextKeys   = [
        pool[nextOffset % pool.length],
        pool[(nextOffset + 1) % pool.length],
        pool[(nextOffset + 2) % pool.length],
      ];

      iconEls.forEach(function (el, i) {
        setTimeout(function () {
          el.classList.add('is-out');
          setTimeout(function () {
            el.classList.remove('is-out');
            el.innerHTML = ICONS[nextKeys[i]];
            el.classList.add('is-in');
            setTimeout(function () { el.classList.remove('is-in'); }, IN_MS);
          }, OUT_MS);
        }, i * STAGGER);
      });

      setTimeout(function () {
        offset = nextOffset;
        busy   = false;
      }, iconEls.length * STAGGER + OUT_MS + IN_MS + 50);
    }

    // Scroll trigger
    var scrollStep = 90;
    var lastSY     = -1;
    function onScroll() {
      var sy = (scrollEl === window)
        ? (window.scrollY || window.pageYOffset)
        : scrollEl.scrollTop;
      if (lastSY === -1) { lastSY = sy; return; }
      var delta = sy - lastSY;
      if (Math.abs(delta) >= scrollStep) {
        cycleIcons(delta > 0 ? 1 : -1);
        lastSY = sy;
      }
    }
    var scrollTarget = (scrollEl === window) ? window : scrollEl;
    scrollTarget.addEventListener('scroll', onScroll, { passive: true });

    // Mouse-move trigger — cumulative movement
    var mouseAccum = 0;
    var mouseStep  = 80;
    document.addEventListener('mousemove', function (e) {
      mouseAccum += Math.abs(e.movementX) + Math.abs(e.movementY) * 0.4;
      if (mouseAccum >= mouseStep) {
        var dir = e.movementX >= 0 ? 1 : -1;
        cycleIcons(dir);
        mouseAccum = 0;
      }
    }, { passive: true });

    // Idle auto-cycle for pages with no scroll
    var pageKey = getPageKey();
    if (pageKey === 'index' || pageKey === 'contact') {
      setInterval(function () { cycleIcons(1); }, 2800);
    }
  }

  /* ── Mobile menu overlay ────────────────────────────────────── */
  function buildMobileMenu(pageKey) {
    var activeMap = { projects: 'projects', artworks: 'artworks', detail: '', contact: 'contact' };
    var active = activeMap[pageKey] || '';

    function ml(name, href, label) {
      return '<a href="' + href + '" class="mob-menu-link' + (active === name ? ' is-active' : '') + '" data-mob-link="' + href + '" data-text="' + label + '" tabindex="-1">' + label + '</a>';
    }

    var overlay = document.createElement('div');
    overlay.className = 'mob-menu';
    overlay.id = 'mobMenu';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Navigation menu');
    overlay.innerHTML =
      '<button class="mob-menu-close" id="mobMenuClose" aria-label="Close menu" tabindex="-1">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
      '<nav class="mob-menu-links">' +
        ml('', '/', 'HOME') +
        ml('projects', '/projects', 'PROJECTS') +
        ml('artworks', '/artworks', 'ARTWORKS') +
        ml('contact', '/contact', 'CONTACT') +
      '</nav>' +
      '<div class="mob-menu-social">' +
        '<a href="https://www.linkedin.com/in/evrenyilmaz/" class="mob-menu-social-link" tabindex="-1" target="_blank" rel="noopener noreferrer">LinkedIn</a>' +
        '<a href="https://instagram.com/galekto" class="mob-menu-social-link" tabindex="-1" target="_blank" rel="noopener noreferrer">Instagram</a>' +
      '</div>';

    document.body.appendChild(overlay);
    return overlay;
  }

  function typewriterLinks(overlay) {
    var links = overlay.querySelectorAll('.mob-menu-link');
    links.forEach(function (link, i) {
      var fullText = link.getAttribute('data-text') || link.textContent;
      link.textContent = '';
      setTimeout(function () {
        var j = 0;
        var iv = setInterval(function () {
          link.textContent = fullText.slice(0, j + 1);
          j++;
          if (j >= fullText.length) clearInterval(iv);
        }, 48);
      }, i * 190);
    });
  }

  function initMobileMenu(nav, pageKey) {
    var overlay  = buildMobileMenu(pageKey);
    var burger   = nav.querySelector('#navBurger');
    var closeBtn = overlay.querySelector('#mobMenuClose');

    function getFocusable() {
      return overlay.querySelectorAll('button, a, [tabindex]');
    }

    function openMenu() {
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('mob-menu-open');
      getFocusable().forEach(function (el) { el.setAttribute('tabindex', '0'); });
      typewriterLinks(overlay);
      if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 50);
    }

    function closeMenu() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('mob-menu-open');
      getFocusable().forEach(function (el) { el.setAttribute('tabindex', '-1'); });
      // Reset texts for next open
      overlay.querySelectorAll('.mob-menu-link').forEach(function (link) {
        link.textContent = link.getAttribute('data-text') || link.textContent;
      });
      if (burger) burger.focus();
    }

    // Escape key closes menu
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeMenu();
    });

    // Focus trap: Tab cycles within the overlay when open
    overlay.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !overlay.classList.contains('is-open')) return;
      var focusable = Array.from(overlay.querySelectorAll('button, a')).filter(function (el) {
        return el.getAttribute('tabindex') !== '-1';
      });
      if (!focusable.length) return;
      var first = focusable[0];
      var last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });

    if (burger)   burger.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    overlay.querySelectorAll('[data-mob-link]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        document.body.classList.remove('mob-menu-open');
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        getFocusable().forEach(function (el) { el.setAttribute('tabindex', '-1'); });
        setTimeout(function () {
          navigate(a.getAttribute('data-mob-link'));
        }, 300);
      });
    });
  }

  /* ── Init ──────────────────────────────────────────────────── */
  function init() {
    var nav     = buildNav();
    var pageKey = getPageKey();

    document.body.insertBefore(nav, document.body.firstChild);

    wireLinks(nav);

    // Determine scroll container
    var scrollEl;
    if (pageKey === 'projects')  scrollEl = document.querySelector('.projects-wrap') || window;
    else if (pageKey === 'artworks') scrollEl = document.querySelector('.artworks-wrap') || window;
    else scrollEl = window;

    initScrollReactive(nav, scrollEl);
    initIconCycle(nav, POOLS[pageKey], scrollEl);
    if (pageKey === 'index') initIndexLabel();
    if (pageKey !== 'index') initMobileMenu(nav, pageKey);
  }

  /* ── Document-level delegation for footer / off-nav links ─── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-nav-link]');
    if (!a) return;
    // Skip if already handled by site-nav wireLinks
    if (a.closest('.site-nav')) return;
    e.preventDefault();
    navigate(a.getAttribute('data-nav-link'));
  });

  /* ── Touch → fluid splat (mobil) ──────────────────────────── */
  var prevTouchX = 0, prevTouchY = 0;
  document.addEventListener('touchstart', function(e) {
    if (!window.FluidSim) return;
    var t = e.changedTouches[0];
    prevTouchX = t.clientX; prevTouchY = t.clientY;
    window.FluidSim.splat(t.clientX, t.clientY, 0.08, 0.08);
  }, { passive: true });
  document.addEventListener('touchmove', function(e) {
    if (!window.FluidSim) return;
    var t = e.changedTouches[0];
    var dx = (t.clientX - prevTouchX) / window.innerWidth;
    var dy = (t.clientY - prevTouchY) / window.innerHeight;
    window.FluidSim.splat(t.clientX, t.clientY, dx, dy);
    prevTouchX = t.clientX; prevTouchY = t.clientY;
  }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
