/* ================================================================
   CONTACT PAGE — contact.js
   ================================================================ */

(function () {
  'use strict';

  var PRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var hero      = document.getElementById('ctHero');
  var lines     = document.querySelectorAll('.contact-title');
  var ctRight   = document.getElementById('ctRight');
  var ufo       = document.getElementById('ufoCursor');

  var emailWrap = document.getElementById('ctEmailWrap');
  var emailEl   = document.getElementById('ctEmail');
  var beamText  = document.getElementById('ctBeamText');

  var isTouchDevice = window.matchMedia('(hover: none)').matches;

  /* ── 1. UFO cursor + tilt ────────────────────────────────────── */
  if (ufo && !isTouchDevice && !PRM) {
    var ufoW    = 80;
    var ufoH    = 40;
    var prevX   = window.innerWidth / 2;
    var tiltTween = null;

    document.addEventListener('mousemove', function (e) {
      /* Smooth position follow */
      gsap.to(ufo, {
        x: e.clientX - ufoW / 2,
        y: e.clientY - ufoH / 2 - 10,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto'
      });

      /* Tilt based on horizontal velocity */
      var dx    = e.clientX - prevX;
      var tilt  = Math.max(-14, Math.min(14, dx * 1.4));
      prevX     = e.clientX;

      if (tiltTween) tiltTween.kill();
      tiltTween = gsap.to(ufo, {
        rotateZ: tilt,
        duration: 0.18,
        ease: 'power1.out',
        onComplete: function () {
          gsap.to(ufo, { rotateZ: 0, duration: 0.55, ease: 'power2.out' });
        }
      });
    }, { passive: true });
  }

  /* ── 2. Mouse-tracking glow on hero ─────────────────────────── */
  if (hero && !isTouchDevice) {
    document.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(2) + '%';
      var y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(2) + '%';
      hero.style.setProperty('--mouse-x', x);
      hero.style.setProperty('--mouse-y', y);
    }, { passive: true });
  }

  /* ── 3. Title lines — scaleY grow on hover ───────────────────── */
  if (!isTouchDevice) {
    lines.forEach(function (el) {

      el.addEventListener('mouseenter', function () {
        gsap.to(el, { color: '#ffffff', duration: 0.40, ease: 'power2.out', overwrite: 'auto' });
        el.style.webkitTextStroke = '1.5px rgba(255,255,255,0)';
      });

      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var dy   = Math.abs(e.clientY - (rect.top + rect.height * 0.5)) / (rect.height * 0.5);
        dy       = Math.min(1, dy);
        var sy   = 1.00 + (1 - dy) * 0.20; /* max 1.20 — gentle growth */
        gsap.to(el, { scaleY: sy, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
      }, { passive: true });

      el.addEventListener('mouseleave', function () {
        gsap.to(el, { color: 'transparent', duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
        el.style.webkitTextStroke = '1.5px rgba(255,255,255,0.20)';
        gsap.to(el, { scaleY: 1, duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
      });

    });
  }

  /* ── 4. Right side hover — background + titles glow ─────────── */
  if (ctRight && !isTouchDevice) {
    ctRight.addEventListener('mouseenter', function () {
      hero.classList.add('is-right-hover');
      lines.forEach(function (el) {
        gsap.to(el, { color: 'rgba(180,160,255,0.22)', duration: 0.55, ease: 'power2.out', overwrite: 'auto' });
        el.style.webkitTextStroke = '1.5px rgba(255,255,255,0.38)';
      });
    });
    ctRight.addEventListener('mouseleave', function () {
      hero.classList.remove('is-right-hover');
      lines.forEach(function (el) {
        gsap.to(el, { color: 'transparent', duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        el.style.webkitTextStroke = '1.5px rgba(255,255,255,0.20)';
      });
    });
  }

  /* ── 5. Tractor beam cone + typewriter ──────────────────────── */
  var beamCone      = null;
  var typeRunning   = false;
  var typeTimer     = null;
  var typeIndex     = 0;
  var TRUTH_MSG     = 'The truth is out there... but a collaboration starts here.';

  /* Create cone element */
  beamCone = document.createElement('div');
  beamCone.className = 'ct-beam-cone';
  document.body.appendChild(beamCone);

  function updateConePosition() {
    if (!ufo || !emailEl) return;
    var ufoRect   = ufo.getBoundingClientRect();
    var emailRect = emailEl.getBoundingClientRect();

    var startX = ufoRect.left  + ufoRect.width  / 2;
    var startY = ufoRect.top   + ufoRect.height * 0.85;
    var endX   = emailRect.left + emailRect.width  / 2;
    var endY   = emailRect.top  + emailRect.height / 2;

    var dx     = endX - startX;
    var dy     = endY - startY;
    var length = Math.sqrt(dx * dx + dy * dy);
    var angle  = Math.atan2(dy, dx) * (180 / Math.PI) - 90;

    var coneW  = 60;
    beamCone.style.left      = (startX - coneW / 2) + 'px';
    beamCone.style.top       = startY + 'px';
    beamCone.style.width     = coneW + 'px';
    beamCone.style.height    = length + 'px';
    beamCone.style.transform = 'rotate(' + angle + 'deg)';
  }

  /* Typewriter — types once, stays visible until beam disconnects */
  function startTypewriter() {
    if (typeRunning) return;
    typeRunning = true;
    typeIndex   = 0;
    beamText.textContent = '';
    beamText.classList.add('is-visible');
    beamText.style.maxWidth = '9999px';
    gsap.set(beamText, { opacity: 1 });
    typeTick();
  }

  function typeTick() {
    if (!typeRunning) return;
    beamText.textContent = TRUTH_MSG.slice(0, typeIndex + 1);
    typeIndex++;
    if (typeIndex < TRUTH_MSG.length) {
      typeTimer = setTimeout(typeTick, 38);
    }
    /* done — stays static until stopTypewriter() is called */
  }

  function stopTypewriter() {
    typeRunning = false;
    clearTimeout(typeTimer);
    gsap.to(beamText, {
      opacity: 0, duration: 0.35, ease: 'power2.in',
      onComplete: function () {
        beamText.textContent = '';
        beamText.classList.remove('is-visible');
        beamText.style.maxWidth = '0';
        gsap.set(beamText, { opacity: 1 }); /* reset for next entry */
      }
    });
  }

  /* Proximity — gradual beam strength based on distance (0→600px) */
  if (emailEl && !isTouchDevice) {
    document.addEventListener('mousemove', function (e) {
      var rect = emailEl.getBoundingClientRect();
      var cx   = rect.left + rect.width  / 2;
      var cy   = rect.top  + rect.height / 2;
      var dx   = e.clientX - cx;
      var dy   = e.clientY - cy;
      var dist = Math.sqrt(dx * dx + dy * dy);

      /* t: 0 at 600px, 1 at 0px — power curve for soft start */
      var t        = Math.max(0, 1 - dist / 600);
      var strength = Math.pow(t, 1.8);

      /* Update cone geometry whenever visible */
      if (strength > 0) updateConePosition();

      /* Beam — direct style, instant distance response */
      beamCone.style.opacity = strength.toFixed(3);

      /* Background glow — linear from 600px, fully open before arrival */
      if (hero) {
        hero.style.setProperty('--hero-glow', t.toFixed(3));
      }

      /* Email glow — scales with strength */
      if (strength > 0.08) {
        emailEl.classList.add('is-beamed');
      } else {
        emailEl.classList.remove('is-beamed');
      }

      /* Typewriter — start/stop based on visibility threshold */
      if (strength > 0.05 && !typeRunning) {
        startTypewriter();
      } else if (strength <= 0.02 && typeRunning) {
        stopTypewriter();
      }
    }, { passive: true });
  }

  /* ── 6. Footer nav transitions ──────────────────────────────── */
  var TX_COLORS = {
    'index.html':    '#1a1614',
    'projects.html': '#ef4444',
    'artworks.html': '#1d4ed8',
    'contact.html':  '#131316',
  };

  document.querySelectorAll('.footer-nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto')) return;
      e.preventDefault();
      var label = link.textContent.trim().toUpperCase().replace(' ↗', '');
      if (typeof window.TxOut === 'function') {
        window.TxOut(href, label, TX_COLORS[href] || '#1a1614');
      } else {
        window.location.href = href;
      }
    });
  });

  /* ── 7. Stars background ────────────────────────────────────── */
  (function () {
    var sc = document.getElementById('starsCanvas');
    if (!sc || PRM) return;
    var ctx = sc.getContext('2d');
    var stars = [];

    function resize() {
      sc.width  = window.innerWidth;
      sc.height = window.innerHeight;
    }

    function init() {
      resize();
      stars = [];
      var n = Math.floor((sc.width * sc.height) / 7000);
      for (var i = 0; i < n; i++) {
        stars.push({
          x:     Math.random() * sc.width,
          y:     Math.random() * sc.height,
          r:     Math.random() * 0.9 + 0.2,
          phase: Math.random() * Math.PI * 2,
          spd:   Math.random() * 0.012 + 0.004
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, sc.width, sc.height);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.phase += s.spd;
        var a = (Math.sin(s.phase) * 0.4 + 0.5) * 0.50 + 0.04;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener('resize', init, { passive: true });
  })();

  /* ── 9. Mobile: show typewriter text statically ─────────────── */
  if (beamText && window.innerWidth <= 680) {
    beamText.textContent = TRUTH_MSG;
    beamText.classList.add('is-visible');
    beamText.style.cssText += ';max-width:9999px!important;opacity:1!important;overflow:visible!important;';
  }

  /* ── 9.5. Tablet touch: UFO auto-positioned above email ─────── */
  if (isTouchDevice && window.innerWidth >= 768 && ufo && emailEl && beamText) {
    /* Hide the static mobile-UFO section to avoid duplicate */
    var mobileUfoSection = document.querySelector('.ct-mobile-ufo-section');
    if (mobileUfoSection) mobileUfoSection.style.display = 'none';

    var ctInfoEl   = document.querySelector('.ct-info');
    var touchLine  = document.getElementById('ctLine1');
    var infoLinks  = document.querySelector('.ct-info-links');

    var posTabletUfo = function () {
      /* Landscape (row layout, >1024px): align social links bottom with GET IN TOUCH bottom */
      if (ctInfoEl) ctInfoEl.style.transform = '';  /* reset first for accurate measurement */

      if (window.innerWidth > 1024 && touchLine && infoLinks && ctInfoEl) {
        var titleBottom = touchLine.getBoundingClientRect().bottom;
        var linksBottom = infoLinks.getBoundingClientRect().bottom;
        var diff = titleBottom - linksBottom;
        if (diff > 0) {
          ctInfoEl.style.transform = 'translateY(' + diff + 'px)';
        }
      }

      /* Position UFO above email (after layout adjustment above) */
      var emailRect = emailEl.getBoundingClientRect();
      var ux = emailRect.left + emailRect.width / 2 - 40; /* 40 = ufo half-width */
      /* nav sits at top:58px height:46px → bottom ~104px; clamp to 120 to be safe */
      var uy = Math.max(120, emailRect.top - 160);
      ufo.style.left = ux + 'px';
      ufo.style.top  = uy + 'px';
      updateConePosition();
      beamCone.style.opacity = '0.75';
    };

    requestAnimationFrame(function () {
      /* Force UFO visible — below nav (9000) and CRT (10000) */
      ufo.style.display       = 'block';
      ufo.style.position      = 'fixed';
      ufo.style.transform     = 'none';
      ufo.style.pointerEvents = 'none';
      ufo.style.zIndex        = '8000';

      posTabletUfo();

      /* Beam cone — z-index below nav/CRT, override !important */
      beamCone.style.setProperty('display', 'block', 'important');
      beamCone.style.zIndex = '8000';
      emailEl.classList.add('is-beamed');

      /* Show text statically */
      beamText.textContent = TRUTH_MSG;
      beamText.classList.add('is-visible');
      beamText.style.cssText += ';max-width:9999px!important;opacity:1!important;overflow:visible!important;';

      /* Keep UFO + beam in sync when page scrolls or resizes */
      window.addEventListener('scroll', posTabletUfo, { passive: true });
      window.addEventListener('resize', posTabletUfo, { passive: true });
    });
  }

  /* ── 10. Apply global settings (email) from Sanity ─────────── */
  if (typeof window.sanityFetch === 'function' && emailEl) {
    window.sanityFetch(`*[_type == "globalSettings"][0]{ email }`)
      .then(function (s) {
        if (s && s.email) {
          emailEl.href        = 'mailto:' + s.email;
          emailEl.textContent = s.email;
        }
      })
      .catch(function () { /* silently fall back to hardcoded value */ });
  }

  /* ── 11. Page-in transition ─────────────────────────────────── */
  if (typeof window.TxIn === 'function') {
    window.TxIn();
  }

  /* ── 12. Contact overlay ─────────────────────────────────────── */
  (function () {
    var overlay      = document.getElementById('ctOverlay');
    var closeBtn     = document.getElementById('ctOverlayClose');
    var form         = document.getElementById('ctOverlayForm');
    var successEl    = document.getElementById('ctOverlaySuccess');
    var errorEl      = document.getElementById('ctOverlayError');
    var submitBtn    = document.getElementById('ctOverlaySubmit');
    var submitLabel  = document.getElementById('ctOverlaySubmitLabel');
    var emailLink    = document.getElementById('ctEmail');
    var starsCanvas  = document.getElementById('starsCanvas');

    if (!overlay || !emailLink) return;

    /* find beam cone (created dynamically in section 5) */
    function getBeamCone() {
      return document.querySelector('.ct-beam-cone');
    }

    function openOverlay() {
      /* reset state */
      if (form)          { form.style.display = ''; form.reset(); submitBtn.disabled = false; if (submitLabel) submitLabel.textContent = 'Send message'; }
      if (overlayHeader) overlayHeader.style.display = '';
      if (successEl)     successEl.style.display = 'none';
      if (errorEl)       errorEl.style.display   = 'none';

      overlay.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(function () {
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('ct-overlay-open');
        if (starsCanvas) gsap.to(starsCanvas, { opacity: 0, duration: 0.4 });
        setTimeout(function () {
          var firstInput = overlay.querySelector('input[type="text"], input[type="email"], textarea');
          if (firstInput) firstInput.focus();
        }, 350);
      });
    }

    function closeOverlay() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.body.classList.remove('ct-overlay-open');
      if (starsCanvas) gsap.to(starsCanvas, { opacity: 0.85, duration: 0.5 });
    }

    /* open on email click */
    emailLink.addEventListener('click', function (e) {
      e.preventDefault();
      openOverlay();
    });

    /* close button */
    closeBtn.addEventListener('click', closeOverlay);

    /* ESC key */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeOverlay();
    });

    /* Focus trap */
    overlay.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !overlay.classList.contains('is-open')) return;
      var focusable = Array.from(overlay.querySelectorAll(
        'a[href], button:not([disabled]), input:not([name="bot-field"]), textarea, select, [tabindex]:not([tabindex="-1"])'
      )).filter(function (el) { return !el.closest('[aria-hidden="true"]'); });
      if (!focusable.length) return;
      var first = focusable[0];
      var last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });

    /* click outside inner panel */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeOverlay();
    });

    /* form submission */
    function encode(data) {
      return Object.keys(data)
        .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]); })
        .join('&');
    }

    var overlayHeader = overlay.querySelector('.ct-overlay-header');

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        /* stricter email check — requires x@x.xx format */
        var emailInput = form.elements['email'];
        if (emailInput) {
          var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailInput.value.trim());
          if (!emailOk) {
            emailInput.setCustomValidity('Please enter a valid email address.');
            emailInput.reportValidity();
            emailInput.setCustomValidity('');
            return;
          }
        }

        if (!form.checkValidity()) { form.reportValidity(); return; }

        submitBtn.disabled = true;
        if (submitLabel) submitLabel.textContent = 'Sending…';

        var data = {
          'form-name': 'contact',
          name:    (form.elements['name']    || {}).value || '',
          email:   (form.elements['email']   || {}).value || '',
          message: (form.elements['message'] || {}).value || ''
        };

        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encode(data)
        })
          .then(function (res) {
            if (!res.ok) throw new Error(res.status);
            form.style.display = 'none';
            if (overlayHeader) overlayHeader.style.display = 'none';
            if (successEl) { successEl.style.display = 'block'; successEl.removeAttribute('hidden'); }
            if (errorEl)   errorEl.style.display = 'none';
          })
          .catch(function () {
            submitBtn.disabled = false;
            if (submitLabel) submitLabel.textContent = 'Send message';
            if (errorEl) { errorEl.style.display = 'block'; errorEl.removeAttribute('hidden'); }
          });
      });
    }
  })();

})();
