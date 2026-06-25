/**
 * PONG — pong.js
 * Artworks page mini-game. Triggered by 3× click on nav icons.
 * Desktop:  W/S or ↑↓ (vertical)  A/D or ←/→ (horizontal)  SPACE (pause)
 * Tablet:   Left panel ↑↓ · Right panel ←→ · HUD pause btn
 * Mobile:   disabled
 */
(function () {
  'use strict';

  /* ── TOUCH DETECTION ───────────────────────────────────────── */
  function isTouchDevice() {
    return ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }

  /* ── PALETTE ────────────────────────────────────────────────── */
  var C = {
    bg:         '#060c1a',
    overlayBg:  '#020408',  /* darker than canvas — field vs surround */
    line:       'rgba(255,255,255,0.06)',
    paddle:     '#ffffff',
    paddleGlow: 'rgba(255,255,255,0.3)',
    ball:       '#60a5fa',
    ballGlow:   'rgba(96,165,250,0.6)',
    textMain:   '#ffffff',
    textDim:    '#60a5fa',
    textFade:   'rgba(96,165,250,0.5)',
    overlay:    'rgba(6,12,26,0.88)',
    cpu:        'rgba(255,255,255,0.5)',
  };

  var LS_KEY = 'galekto_pong_best';

  /* ── MODE OPTIONS ───────────────────────────────────────────── */
  var MODES       = [5, 10, 0];
  var MODE_LABELS = ['5 PTS', '10 PTS', 'ENDLESS'];

  /* ── CONSTANTS ──────────────────────────────────────────────── */
  var PW = 10, PH = 80, BR = 7, PAD = 24;
  var isTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  var PLAYER_SPEED   = isTouch ? 9 : 6;
  var BALL_INIT_SPEED = isTouch ? 8 : 5;

  /* ── STATE ──────────────────────────────────────────────────── */
  var W, H;
  var playerY, playerX, playerXHome, playerXMax;
  var cpuY, cpuX, cpuXHome, cpuXMin;
  var ballX, ballY, ballVX, ballVY, ballSpeed;
  var playerScore, cpuScore, best;
  var running, waiting, paused, gameOver;
  var gameMode, modeIdx;
  var animId;
  var keys = {};

  /* ── ELEMENTS ───────────────────────────────────────────────── */
  var overlay, canvas, ctx;
  var elPlayerScore, elCpuScore, pauseBtn;
  var modeSelectEl, modeBtns;

  /* ── BUILD DOM ──────────────────────────────────────────────── */
  function build() {
    overlay = document.createElement('div');
    overlay.id = 'pongOverlay';
    overlay.className = 'game-overlay';
    overlay.style.setProperty('--game-bg',     C.overlayBg);
    overlay.style.setProperty('--game-fg',     C.textDim);
    overlay.style.setProperty('--game-fg-dim', C.textFade);
    overlay.style.setProperty('--game-accent', C.ball);
    overlay.style.setProperty('--game-head',   C.textMain);
    overlay.style.setProperty('--game-border', 'rgba(96,165,250,0.18)');
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML =
      /* HUD */
      '<div class="game-hud">' +
        '<div class="pong-hud-score">' +
          '<span class="pong-score-num" id="pongPlayerScore">0</span>' +
          '<span class="pong-score-lbl">YOU</span>' +
        '</div>' +
        '<span class="game-title-label">PONG</span>' +
        '<div class="game-hud-right">' +
          '<div class="pong-hud-score">' +
            '<span class="pong-score-num" id="pongCpuScore">0</span>' +
            '<span class="pong-score-lbl">CPU</span>' +
          '</div>' +
          '<button class="game-pause-btn" id="pongPause" aria-label="Pause">II</button>' +
          '<button class="game-close"     id="pongClose" aria-label="Close">\u2715</button>' +
        '</div>' +
      '</div>' +
      /* Body: side buttons + canvas */
      '<div class="game-body">' +
        '<div class="pong-side-btns pong-side-left">' +
          '<button class="pong-side-btn" data-key="ArrowUp">&#x25B2;</button>' +
          '<button class="pong-side-btn" data-key="ArrowDown">&#x25BC;</button>' +
        '</div>' +
        '<div class="game-canvas-wrap" id="pongCanvasWrap">' +
          '<canvas id="pongCanvas"></canvas>' +
          /* Mode select overlay */
          '<div class="pong-mode-select" id="pongModeSelect">' +
            '<p class="pong-mode-title">SELECT MODE</p>' +
            '<div class="pong-mode-options">' +
              '<button class="pong-mode-btn is-selected" data-idx="0">5 PTS</button>' +
              '<button class="pong-mode-btn"             data-idx="1">10 PTS</button>' +
              '<button class="pong-mode-btn"             data-idx="2">ENDLESS</button>' +
            '</div>' +
            '<p class="pong-mode-hint">\u2190 \u2192 SELECT \u00A0\u00A0 ENTER CONFIRM</p>' +
          '</div>' +
        '</div>' +
        '<div class="pong-side-btns pong-side-right">' +
          '<button class="pong-side-btn" data-key="ArrowLeft">&#x25C4;</button>' +
          '<button class="pong-side-btn" data-key="ArrowRight">&#x25BA;</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    canvas        = document.getElementById('pongCanvas');
    ctx           = canvas.getContext('2d');
    elPlayerScore = document.getElementById('pongPlayerScore');
    elCpuScore    = document.getElementById('pongCpuScore');
    pauseBtn      = document.getElementById('pongPause');
    modeSelectEl  = document.getElementById('pongModeSelect');
    modeBtns      = modeSelectEl.querySelectorAll('.pong-mode-btn');

    /* Touch-aware mode hint */
    if (isTouchDevice()) {
      var hintEl = modeSelectEl.querySelector('.pong-mode-hint');
      if (hintEl) hintEl.textContent = 'TAP TO SELECT';
    }
  }

  /* ── LAYOUT (CSS-driven) ────────────────────────────────────── */
  function layout() {
    var wrap = document.getElementById('pongCanvasWrap');
    W = Math.max(300, wrap.offsetWidth  || 300);
    H = Math.max(200, wrap.offsetHeight || 200);
    canvas.width  = W;
    canvas.height = H;
  }

  /* ── MODE SELECT ────────────────────────────────────────────── */
  function showModeSelect() {
    modeIdx = 0;
    updateModeBtns();
    modeSelectEl.style.display = 'flex';
  }

  function hideModeSelect() {
    modeSelectEl.style.display = 'none';
  }

  function updateModeBtns() {
    modeBtns.forEach(function (btn, i) {
      btn.classList.toggle('is-selected', i === modeIdx);
    });
  }

  function confirmMode() {
    gameMode = MODES[modeIdx];
    hideModeSelect();
    waiting = true;
    draw();
  }

  /* ── GAME INIT ──────────────────────────────────────────────── */
  function initGame() {
    playerXHome = PAD;
    playerXMax  = Math.floor(W / 2) - PW;
    cpuXHome    = W - PAD - PW;
    cpuXMin     = Math.ceil(W / 2);

    playerY = H / 2 - PH / 2;
    playerX = playerXHome;
    cpuY    = H / 2 - PH / 2;
    cpuX    = cpuXHome;

    playerScore = 0;
    cpuScore    = 0;
    gameMode    = 0;
    waiting     = false;
    gameOver    = false;
    paused      = false;
    running     = false;
    updateHUD();
    resetBall(1);
  }

  function resetBall(dir) {
    ballX     = W / 2;
    ballY     = H / 2;
    ballSpeed = BALL_INIT_SPEED;
    var angle = (Math.random() * 60 - 30) * (Math.PI / 180);
    ballVX    = ballSpeed * dir * Math.cos(angle);
    ballVY    = ballSpeed * Math.sin(angle);
  }

  function updateHUD() {
    if (elPlayerScore) elPlayerScore.textContent = playerScore;
    if (elCpuScore)    elCpuScore.textContent    = cpuScore;
  }

  /* ── GAME LOOP ──────────────────────────────────────────────── */
  function loop() {
    if (!running) return;
    animId = requestAnimationFrame(loop);
    if (!paused) update();
    draw();
  }

  function update() {
    /* Player — vertical */
    if (keys['ArrowUp']   || keys['w'] || keys['W']) playerY -= PLAYER_SPEED;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) playerY += PLAYER_SPEED;
    playerY = Math.max(0, Math.min(H - PH, playerY));

    /* Player — horizontal (own half only) */
    if (keys['ArrowRight'] || keys['d'] || keys['D']) playerX += PLAYER_SPEED;
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) playerX -= PLAYER_SPEED;
    playerX = Math.max(playerXHome, Math.min(playerXMax, playerX));

    /* CPU — vertical AI */
    var cpuCenter = cpuY + PH / 2;
    var cpuSpeed  = Math.min(ballSpeed * 0.72, 11);
    if (cpuCenter < ballY - 4) cpuY += cpuSpeed;
    else if (cpuCenter > ballY + 4) cpuY -= cpuSpeed;
    cpuY = Math.max(0, Math.min(H - PH, cpuY));

    /* CPU — horizontal AI */
    var cpuHorizSpeed = 3;
    if (ballVX > 0 && ballX > W / 2) {
      cpuX -= cpuHorizSpeed;
      if (cpuX < cpuXMin) cpuX = cpuXMin;
    } else {
      cpuX += cpuHorizSpeed;
      if (cpuX > cpuXHome) cpuX = cpuXHome;
    }

    /* Ball */
    ballX += ballVX;
    ballY += ballVY;

    if (ballY - BR <= 0) { ballY = BR;     ballVY =  Math.abs(ballVY); }
    if (ballY + BR >= H) { ballY = H - BR; ballVY = -Math.abs(ballVY); }

    /* Player paddle collision */
    if (
      ballX - BR <= playerX + PW &&
      ballX + BR >= playerX &&
      ballY + BR >= playerY &&
      ballY - BR <= playerY + PH &&
      ballVX < 0
    ) {
      var hit = (ballY - (playerY + PH / 2)) / (PH / 2);
      ballSpeed = Math.min(ballSpeed + 0.5, 22);
      ballVX = ballSpeed * Math.cos(hit * 0.9);
      ballVY = ballSpeed * Math.sin(hit * 0.9);
      ballX  = playerX + PW + BR + 1;
    }

    /* CPU paddle collision */
    if (
      ballX + BR >= cpuX &&
      ballX - BR <= cpuX + PW &&
      ballY + BR >= cpuY &&
      ballY - BR <= cpuY + PH &&
      ballVX > 0
    ) {
      var hitCpu = (ballY - (cpuY + PH / 2)) / (PH / 2);
      ballSpeed = Math.min(ballSpeed + 0.4, 22);
      ballVX    = -ballSpeed * Math.cos(hitCpu * 0.8);
      ballVY    =  ballSpeed * Math.sin(hitCpu * 0.8);
      ballX     = cpuX - BR - 1;
    }

    /* Scoring */
    if (ballX + BR < 0) {
      cpuScore++;
      updateHUD();
      if (gameMode > 0 && cpuScore >= gameMode) { running = false; gameOver = true; return; }
      running = false;
      playerY = H / 2 - PH / 2; playerX = playerXHome;
      cpuY    = H / 2 - PH / 2; cpuX    = cpuXHome;
      setTimeout(function () { resetBall(1);  startLoop(); }, 800);
    }
    if (ballX - BR > W) {
      playerScore++;
      if (playerScore > best) {
        best = playerScore;
        try { localStorage.setItem(LS_KEY, String(best)); } catch(e) {}
      }
      updateHUD();
      if (gameMode > 0 && playerScore >= gameMode) { running = false; gameOver = true; return; }
      running = false;
      playerY = H / 2 - PH / 2; playerX = playerXHome;
      cpuY    = H / 2 - PH / 2; cpuX    = cpuXHome;
      setTimeout(function () { resetBall(-1); startLoop(); }, 800);
    }
  }

  /* ── DRAW ───────────────────────────────────────────────────── */
  function draw() {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    /* Center line */
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = C.line;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Player paddle */
    ctx.shadowColor = C.paddleGlow;
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = C.paddle;
    ctx.fillRect(playerX, playerY, PW, PH);
    ctx.shadowBlur  = 0;

    /* CPU paddle */
    ctx.fillStyle = C.cpu;
    ctx.fillRect(cpuX, cpuY, PW, PH);

    /* Ball */
    ctx.shadowColor = C.ballGlow;
    ctx.shadowBlur  = 18;
    ctx.fillStyle   = C.ball;
    ctx.beginPath();
    ctx.arc(ballX, ballY, BR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (waiting)  { drawWaiting();  return; }
    if (paused)   { drawPaused();   return; }
    if (gameOver) { drawGameOver(); }
  }

  function drawWaiting() {
    ctx.fillStyle = C.overlay;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    ctx.font      = '9px "Press Start 2P", monospace';
    ctx.fillStyle = C.textDim;
    ctx.fillText('MODE: ' + (gameMode === 0 ? 'ENDLESS' : gameMode + ' PTS'), W / 2, H / 2 - 40);

    ctx.font      = '11px "Press Start 2P", monospace';
    ctx.fillStyle = C.textMain;
    ctx.fillText(isTouchDevice() ? 'TOUCH & DRAG TO PLAY' : 'PRESS ANY KEY TO START', W / 2, H / 2 - 6);

    ctx.font      = '9px "Press Start 2P", monospace';
    ctx.fillStyle = C.textDim;
    ctx.fillText(isTouchDevice() ? 'DRAG TO MOVE PADDLE' : 'SPACE: PAUSE', W / 2, H / 2 + 20);
  }

  function drawPaused() {
    ctx.fillStyle = C.overlay;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    ctx.font      = '16px "Press Start 2P", monospace';
    ctx.fillStyle = C.textMain;
    ctx.fillText('PAUSED', W / 2, H / 2 - 12);

    ctx.font      = '8px "Press Start 2P", monospace';
    ctx.fillStyle = C.textDim;
    ctx.fillText('SPACE TO RESUME', W / 2, H / 2 + 14);
  }

  function drawGameOver() {
    ctx.fillStyle = C.overlay;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    var won     = playerScore >= gameMode && playerScore > cpuScore;
    var bigWin  = won  && cpuScore    <= Math.floor(gameMode * 0.3);
    var bigLoss = !won && playerScore <= Math.floor(gameMode * 0.3);

    var winBig  = ["That wasn't a match.\nThat was a statement.", "Flawless.\nThe CPU needs therapy.", "Dominant.\nAlmost felt bad.\nAlmost."];
    var winNorm = ["The CPU is considering\na career change.", "Victory.\nDon't let it\ngo to your head.", "The algorithm\ndid not expect this."];
    var lossBig = ["It calculated\nyour every move. Rude.", "The CPU felt nothing.\nThat's the worst part.", "Total annihilation.\nRespect, almost."];
    var lossNorm= ["Beaten by math.\nThat stings.", "So close.\nSo very not close.", "The CPU says:\ntry again, human."];
    function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    var msg;
    if      (won  && bigWin)  msg = rnd(winBig);
    else if (won)             msg = rnd(winNorm);
    else if (bigLoss)         msg = rnd(lossBig);
    else                      msg = rnd(lossNorm);

    ctx.font      = '22px "Press Start 2P", monospace';
    ctx.fillStyle = won ? C.textMain : C.textDim;
    ctx.fillText(won ? 'YOU WIN!' : 'YOU LOSE', W / 2, H / 2 - 60);

    var msgLines = msg.split('\n');
    ctx.font      = '10px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(96,165,250,0.55)';
    msgLines.forEach(function (line, i) {
      ctx.fillText(line, W / 2, H / 2 - 24 + i * 18);
    });

    ctx.font      = '14px "Press Start 2P", monospace';
    ctx.fillStyle = C.textMain;
    ctx.fillText(playerScore + '  \u2014  ' + cpuScore, W / 2, H / 2 + 18);

    ctx.font      = '10px "Press Start 2P", monospace';
    ctx.fillStyle = C.textDim;
    ctx.fillText('R : PLAY AGAIN', W / 2, H / 2 + 44);
    ctx.fillStyle = C.textFade;
    ctx.fillText('ESC : EXIT',     W / 2, H / 2 + 64);
  }

  /* ── INPUT ──────────────────────────────────────────────────── */
  function onKey(e) {
    if (e.key === 'Escape') { closeGame(); return; }

    /* Game over */
    if (gameOver && e.type === 'keydown') {
      if (e.key === 'r' || e.key === 'R') restartGame();
      return;
    }

    /* Mode select — keyboard navigation */
    if (modeSelectEl.style.display !== 'none' && e.type === 'keydown') {
      var nav = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
      if (nav.indexOf(e.key) !== -1) e.preventDefault();
      if (e.key === 'ArrowLeft')  { modeIdx = (modeIdx + 2) % 3; updateModeBtns(); }
      if (e.key === 'ArrowRight') { modeIdx = (modeIdx + 1) % 3; updateModeBtns(); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); confirmMode(); }
      return;
    }

    /* Pause toggle */
    if (e.key === ' ' && e.type === 'keydown') {
      e.preventDefault();
      if (!waiting && !gameOver) togglePause();
      return;
    }

    keys[e.key] = (e.type === 'keydown');

    if (e.type === 'keydown') {
      var arrows = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
      if (arrows.indexOf(e.key) !== -1) e.preventDefault();
      if (waiting) { waiting = false; startLoop(); }
    }
  }

  function togglePause() {
    paused = !paused;
    if (!paused && !running) startLoop();
  }

  /* ── LOOP CONTROL ───────────────────────────────────────────── */
  function startLoop() {
    if (running) return;
    running = true;
    requestAnimationFrame(loop);
  }

  /* ── RESTART ────────────────────────────────────────────────── */
  function restartGame() {
    running = false;
    paused  = false;
    cancelAnimationFrame(animId);
    keys = {};
    initGame();
    showModeSelect();
    draw();
  }

  /* ── OPEN / CLOSE ───────────────────────────────────────────── */
  function openGame() {
    if (window.innerWidth < 768) return;
    layout();
    initGame();
    showModeSelect();
    draw();
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('game-open');
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup',   onKey);
  }

  function closeGame() {
    running = false;
    paused  = false;
    cancelAnimationFrame(animId);
    keys = {};
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('game-open');
    document.body.classList.remove('game-canvas-hover');
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup',   onKey);
  }

  /* ── TRIGGER ────────────────────────────────────────────────── */
  function attachLongPress() {
    var el = document.getElementById('navIcons');
    if (el) {
      el.style.pointerEvents = 'auto';
      el.style.cursor        = 'pointer';
      el.addEventListener('click', function () {
        if (window.innerWidth < 768) return;
        openGame();
      });
    }
    var launchBtn = document.getElementById('launchPongBtn');
    if (launchBtn) {
      launchBtn.addEventListener('click', function () {
        openGame();
      });
    }
  }

  /* ── INIT ───────────────────────────────────────────────────── */
  function init() {
    if (window.innerWidth < 768) return;
    best = parseInt(localStorage.getItem(LS_KEY) || '0', 10) || 0;
    build();

    /* Touch devices: hide side buttons — direct canvas touch used instead */
    if (isTouchDevice()) {
      overlay.querySelectorAll('.pong-side-btns').forEach(function (el) {
        el.style.display = 'none';
      });
    }

    /* Hide custom cursor when hovering over game canvas */
    var _touchId = null;
    var canvasWrap = document.getElementById('pongCanvasWrap');
    if (canvasWrap) {
      canvasWrap.addEventListener('mouseenter', function () {
        document.body.classList.add('game-canvas-hover');
      });
      canvasWrap.addEventListener('mouseleave', function () {
        document.body.classList.remove('game-canvas-hover');
      });

      canvasWrap.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (modeSelectEl.style.display !== 'none') return;
        var touch = e.changedTouches[0];
        _touchId = touch.identifier;
        var rect = canvas.getBoundingClientRect();
        var tx = touch.clientX - rect.left;
        var ty = touch.clientY - rect.top;
        if (waiting) { waiting = false; startLoop(); }
        /* Offset paddle above finger so it stays visible under the hand */
        playerY = Math.max(0, Math.min(H - PH, ty - PH - 12));
        playerX = Math.max(playerXHome, Math.min(playerXMax, tx - PW / 2));
      }, { passive: false });

      canvasWrap.addEventListener('touchmove', function (e) {
        e.preventDefault();
        var touch = null;
        for (var i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === _touchId) { touch = e.changedTouches[i]; break; }
        }
        if (!touch) return;
        var rect = canvas.getBoundingClientRect();
        playerY = Math.max(0, Math.min(H - PH, (touch.clientY - rect.top) - PH - 12));
        playerX = Math.max(playerXHome, Math.min(playerXMax, (touch.clientX - rect.left) - PW / 2));
      }, { passive: false });

      canvasWrap.addEventListener('touchend', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === _touchId) { _touchId = null; break; }
        }
      }, { passive: true });
    }

    /* Mode select buttons */
    modeBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        modeIdx = i;
        confirmMode();
      });
      btn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        modeIdx = i;
        confirmMode();
      }, {passive: false});
    });

    /* Side buttons — hold style */
    overlay.querySelectorAll('.pong-side-btn').forEach(function (btn) {
      var k = btn.getAttribute('data-key');

      btn.addEventListener('touchstart', function (e) {
        e.preventDefault();
        btn.classList.add('is-pressed');
        keys[k] = true;
        if (waiting) { waiting = false; startLoop(); }
      }, {passive: false});

      btn.addEventListener('touchend', function () {
        btn.classList.remove('is-pressed');
        keys[k] = false;
      }, {passive: true});

      btn.addEventListener('touchcancel', function () {
        btn.classList.remove('is-pressed');
        keys[k] = false;
      }, {passive: true});

      btn.addEventListener('mousedown',  function () { keys[k] = true;  if (waiting) { waiting = false; startLoop(); } });
      btn.addEventListener('mouseup',    function () { keys[k] = false; });
      btn.addEventListener('mouseleave', function () { keys[k] = false; });
    });

    /* Pause button */
    pauseBtn.addEventListener('click', function () {
      if (!waiting && !gameOver) togglePause();
    });

    /* Close */
    document.getElementById('pongClose').addEventListener('click', closeGame);

    /* Resize */
    window.addEventListener('resize', function () {
      if (!overlay.classList.contains('is-open')) return;
      if (window.innerWidth < 768) { closeGame(); return; }
      running = false;
      cancelAnimationFrame(animId);
      layout();
      initGame();
      showModeSelect();
      draw();
    });

    attachLongPress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
