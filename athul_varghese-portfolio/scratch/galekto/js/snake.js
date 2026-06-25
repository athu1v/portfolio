/**
 * SNAKE — snake.js  v3
 * Projects page mini-game. Triggered by 3× click on nav icons.
 * Desktop : ↑↓←→ / WASD  |  SPACE pause  |  R restart  |  ESC exit
 * Tablet  : swipe on canvas to change direction
 * Features: Player vs CPU snake, multi-cell wall shapes, stun mechanic,
 *           funny game-over messages, 10 / 20 / Endless modes.
 */
(function () {
  'use strict';

  function isTouchDevice() {
    return ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }

  /* ── PALETTE ─────────────────────────────────────────────────── */
  var C = {
    bg:         '#0a0606',
    overlayBg:  '#060303',
    playerBody: '#ef4444',
    playerHead: '#ffffff',
    cpuBody:    'rgba(255,255,255,0.30)',
    cpuHead:    'rgba(255,255,255,0.76)',
    food:       '#ef4444',
    foodGlow:   'rgba(239,68,68,0.75)',
    /* Walls: dark amber — distinct from bright-red snake */
    wallFill:   'rgba(90,48,4,0.88)',
    wallStroke: 'rgba(180,100,20,0.90)',
    textMain:   '#ffffff',
    textDim:    '#ef4444',
    textFade:   'rgba(239,68,68,0.42)',
    gridLine:   'rgba(255,255,255,0.020)',
    overlay:    'rgba(6,2,2,0.91)',
  };

  /* ── CONSTANTS ───────────────────────────────────────────────── */
  var CELL        = 20;
  var TICK_MS     = 140;  /* slower tick → more reaction time for player */
  var STUN_TICKS  = 5;
  var N_SHAPES    = 8;    /* wall shapes spawned per food           */
  var SAFE_DIST   = 5;    /* manhattan cells protected near head    */
  var MODES       = [10, 20, 0];
  var LS_KEY      = 'galekto_snake_best';

  /* ── WALL SHAPE TEMPLATES [dx, dy] offsets from anchor ──────── */
  /* All shapes are 6–11 cells — large enough to force real detours.  */
  var SHAPE_TEMPLATES = [
    /* I-bars — horizontal (7-9 cells) */
    [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0]],
    [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0]],
    [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0]],
    /* I-bars — vertical (7-9 cells) */
    [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6]],
    [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7]],
    [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8]],
    /* L shapes — big (7 cells) */
    [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[1,5]],
    [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[5,1]],
    [[0,0],[1,0],[0,1],[0,2],[0,3],[0,4],[0,5]],   /* reversed L vert  */
    [[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[5,0]],   /* reversed L horiz */
    /* L shapes — 8+ cells */
    [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,6]],
    [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[6,1]],
    /* T shapes — long (7-9 cells) */
    [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[3,1]],     /* T 7 horiz */
    [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[3,-1]],    /* T upside  */
    [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[-1,3]],    /* T 7 vert  */
    [[2,0],[0,1],[1,1],[2,1],[3,1],[4,1],[6,1],[2,2]],     /* fat T     */
    /* + cross — large */
    [[3,0],[3,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[3,3],[3,4]],  /* big + */
    [[2,0],[2,1],[0,2],[1,2],[2,2],[3,2],[4,2],[2,3],[2,4]],              /* + 9   */
    [[3,0],[3,1],[3,2],[0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[3,4],[3,5]], /* tall + */
    /* Z / S — wide (6 cells) */
    [[0,0],[1,0],[2,0],[3,0],[3,1],[4,1],[5,1]],           /* long Z    */
    [[3,0],[4,0],[5,0],[0,1],[1,1],[2,1],[3,1]],           /* long S    */
    [[0,0],[1,0],[2,0],[3,0],[2,1],[3,1],[4,1],[5,1]],     /* extra Z   */
    [[4,0],[5,0],[6,0],[7,0],[0,1],[1,1],[2,1],[3,1]],     /* max S     */
    /* U shapes — wide (7-9 cells) */
    [[0,0],[5,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1]],     /* U 8 wide  */
    [[0,0],[6,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1]],/* U 9 wide */
    [[0,0],[0,1],[2,1],[0,2],[0,3],[1,3],[2,3]],           /* C shape   */
    /* Thick blocks (8-10 cells) */
    [[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1]],     /* 4×2       */
    [[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[1,1],[2,1],[3,1],[4,1]], /* 5×2 */
    [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]], /* 3×3      */
    [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2],[0,3],[1,3],[0,4],[1,4]], /* 2×5 */
    [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2],[0,3],[1,3],[0,4],[1,4],[0,5],[1,5]], /* 2×6 */
    /* Staircase (6-8 cells) */
    [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3]],           /* stair ↘   */
    [[3,0],[2,0],[2,1],[1,1],[1,2],[0,2],[0,3]],           /* stair ↙   */
    [[0,3],[1,3],[1,2],[2,2],[2,1],[3,1],[3,0],[4,0]],     /* long stair*/
  ];

  /* ── STATE ───────────────────────────────────────────────────── */
  var W, H, COLS, ROWS;
  var playerSnake, cpuSnake;
  var playerDir, cpuDir, nextPlayerDir;
  var food, walls, prevFood;
  var playerScore, cpuScore, best;
  var playerStun, cpuStun;
  var playerAlive, cpuAlive;
  var playerDeathCause, cpuDeathCause; /* 'border' | 'self' | 'opponent' */
  var running, waiting, paused, gameOver;
  var gameMode, modeIdx;
  var tickTimer, animId;

  /* ── ELEMENTS ────────────────────────────────────────────────── */
  var overlay, canvas, ctx;
  var elPS, elCS, pauseBtn;
  var modeSelectEl, modeBtns;

  /* ─────────────────────────────────────────────────────────────
     BUILD DOM
  ───────────────────────────────────────────────────────────── */
  function build() {
    overlay = document.createElement('div');
    overlay.id        = 'snakeOverlay';
    overlay.className = 'game-overlay';
    overlay.style.setProperty('--game-bg',     C.overlayBg);
    overlay.style.setProperty('--game-fg',     C.textDim);
    overlay.style.setProperty('--game-fg-dim', C.textFade);
    overlay.style.setProperty('--game-accent', C.food);
    overlay.style.setProperty('--game-head',   C.textMain);
    overlay.style.setProperty('--game-border', 'rgba(239,68,68,0.22)');
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML =
      '<div class="game-hud">' +
        '<div class="pong-hud-score">' +
          '<span class="pong-score-num" id="snkPS">0</span>' +
          '<span class="pong-score-lbl">YOU</span>' +
        '</div>' +
        '<span class="game-title-label">SNAKE</span>' +
        '<div class="game-hud-right">' +
          '<div class="pong-hud-score">' +
            '<span class="pong-score-num" id="snkCS">0</span>' +
            '<span class="pong-score-lbl">CPU</span>' +
          '</div>' +
          '<button class="game-pause-btn" id="snkPause" aria-label="Pause">II</button>' +
          '<button class="game-close"     id="snkClose" aria-label="Close">\u2715</button>' +
        '</div>' +
      '</div>' +
      '<div class="game-body">' +
        '<div class="game-canvas-wrap" id="snkWrap">' +
          '<canvas id="snkCanvas"></canvas>' +
          '<div class="pong-mode-select" id="snkMode">' +
            '<p class="pong-mode-title">SELECT MODE</p>' +
            '<div class="pong-mode-options">' +
              '<button class="pong-mode-btn is-selected" data-idx="0">10 PTS</button>' +
              '<button class="pong-mode-btn"             data-idx="1">20 PTS</button>' +
              '<button class="pong-mode-btn"             data-idx="2">ENDLESS</button>' +
            '</div>' +
            '<p class="pong-mode-hint">\u2190 \u2192 SELECT \u00A0\u00A0 ENTER CONFIRM</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    var wrap = overlay.querySelector('.game-canvas-wrap');
    if (wrap) wrap.style.borderColor = 'rgba(239,68,68,0.18)';

    canvas       = document.getElementById('snkCanvas');
    ctx          = canvas.getContext('2d');
    elPS         = document.getElementById('snkPS');
    elCS         = document.getElementById('snkCS');
    pauseBtn     = document.getElementById('snkPause');
    modeSelectEl = document.getElementById('snkMode');
    modeBtns     = modeSelectEl.querySelectorAll('.pong-mode-btn');

    if (isTouchDevice()) {
      var hint = modeSelectEl.querySelector('.pong-mode-hint');
      if (hint) hint.textContent = 'TAP TO SELECT';
    }
  }

  /* ─────────────────────────────────────────────────────────────
     LAYOUT
  ───────────────────────────────────────────────────────────── */
  function layout() {
    var wrap = document.getElementById('snkWrap');
    var rw = Math.max(300, wrap.offsetWidth  || 300);
    var rh = Math.max(200, wrap.offsetHeight || 200);
    COLS = Math.floor(rw / CELL);
    ROWS = Math.floor(rh / CELL);
    W    = COLS * CELL;
    H    = ROWS * CELL;
    canvas.width  = W;
    canvas.height = H;
  }

  /* ─────────────────────────────────────────────────────────────
     MODE SELECT
  ───────────────────────────────────────────────────────────── */
  function showModeSelect() { modeIdx = 0; syncModeBtns(); modeSelectEl.style.display = 'flex'; }
  function hideModeSelect()  { modeSelectEl.style.display = 'none'; }
  function syncModeBtns() {
    modeBtns.forEach(function (b, i) { b.classList.toggle('is-selected', i === modeIdx); });
  }
  function confirmMode() { gameMode = MODES[modeIdx]; hideModeSelect(); waiting = true; }

  /* ─────────────────────────────────────────────────────────────
     INIT GAME
  ───────────────────────────────────────────────────────────── */
  function initGame() {
    var midY = Math.floor(ROWS / 2);
    playerSnake = [
      { x: Math.floor(COLS * 0.25),     y: midY },
      { x: Math.floor(COLS * 0.25) - 1, y: midY },
      { x: Math.floor(COLS * 0.25) - 2, y: midY },
    ];
    cpuSnake = [
      { x: Math.floor(COLS * 0.75),     y: midY },
      { x: Math.floor(COLS * 0.75) + 1, y: midY },
      { x: Math.floor(COLS * 0.75) + 2, y: midY },
    ];
    playerDir       = { x:  1, y: 0 };
    cpuDir          = { x: -1, y: 0 };
    nextPlayerDir   = { x:  1, y: 0 };
    walls           = [];
    prevFood        = null;
    playerScore     = 0;
    cpuScore        = 0;
    playerStun      = 0;
    cpuStun         = 3;  /* head start: CPU waits ~345ms before moving */
    playerAlive     = true;
    cpuAlive        = true;
    playerDeathCause = '';
    cpuDeathCause    = '';
    waiting         = false;
    paused          = false;
    gameOver        = false;
    running         = false;
    spawnFood();
    updateHUD();
  }

  /* ─────────────────────────────────────────────────────────────
     FOOD — equidistant from both snakes
  ───────────────────────────────────────────────────────────── */
  function spawnFood() {
    /* Goal: food in the middle third of the map, slightly player-side.
       Target dc - dp = 2 (CPU is only 2 cells further — not dramatically closer to player).
       Both heads must be at least 5 cells away so neither grabs it trivially.
       We score how close the advantage is to TARGET_ADV; ties broken by centrality. */
    /* Min manhattan from previous food — scales with grid size */
    var minFromPrev = Math.min(60, Math.floor((COLS + ROWS) * 1.5));
    var best = null;

    for (var i = 0; i < 600; i++) {
      var fx = 1 + Math.floor(Math.random() * (COLS - 2));
      var fy = 1 + Math.floor(Math.random() * (ROWS - 2));
      if (cellBlocked(fx, fy)) continue;
      var dp = Math.abs(playerSnake[0].x - fx) + Math.abs(playerSnake[0].y - fy);
      var dc = Math.abs(cpuSnake[0].x    - fx) + Math.abs(cpuSnake[0].y    - fy);
      if (dp < 8 || dc < 8) continue;                           /* too close to a head */
      if (prevFood) {
        var df = Math.abs(prevFood.x - fx) + Math.abs(prevFood.y - fy);
        if (df < minFromPrev) continue;                          /* too close to last food */
      }
      best = { x: fx, y: fy };
      break;
    }

    /* Fallback without prevFood constraint */
    if (!best) {
      for (var j = 0; j < 300; j++) {
        var fx2 = 1 + Math.floor(Math.random() * (COLS - 2));
        var fy2 = 1 + Math.floor(Math.random() * (ROWS - 2));
        var dp2 = Math.abs(playerSnake[0].x - fx2) + Math.abs(playerSnake[0].y - fy2);
        var dc2 = Math.abs(cpuSnake[0].x    - fx2) + Math.abs(cpuSnake[0].y    - fy2);
        if (!cellBlocked(fx2, fy2) && dp2 >= 4 && dc2 >= 4) { best = { x: fx2, y: fy2 }; break; }
      }
    }

    prevFood = food;
    food = best || { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };
  }

  /* ─────────────────────────────────────────────────────────────
     WALLS — multi-cell shapes
  ───────────────────────────────────────────────────────────── */
  function spawnWalls() {
    walls = [];
    if (!food) return;

    /* Safe zones — protect snake heads so walls don't trap them */
    var safe = {};
    function protect(cx, cy, dist) {
      for (var dy = -dist; dy <= dist; dy++) {
        for (var dx = -dist; dx <= dist; dx++) {
          if (Math.abs(dx) + Math.abs(dy) <= dist) {
            safe[(cx + dx) + ',' + (cy + dy)] = true;
          }
        }
      }
    }
    if (playerAlive) protect(playerSnake[0].x, playerSnake[0].y, SAFE_DIST);
    if (cpuAlive)    protect(cpuSnake[0].x,    cpuSnake[0].y,    SAFE_DIST);
    protect(food.x, food.y, 2); /* keep 2 cells around food clear */

    function tryAdd(x, y) {
      if (x < 1 || x >= COLS - 1 || y < 1 || y >= ROWS - 1) return;
      if (safe[x + ',' + y]) return;
      for (var ii = 0; ii < walls.length;       ii++) { if (walls[ii].x       === x && walls[ii].y       === y) return; }
      for (var ii = 0; ii < playerSnake.length; ii++) { if (playerSnake[ii].x === x && playerSnake[ii].y === y) return; }
      for (var ii = 0; ii < cpuSnake.length;    ii++) { if (cpuSnake[ii].x    === x && cpuSnake[ii].y    === y) return; }
      walls.push({ x: x, y: y });
    }

    /* ── LABYRINTH: broken rectangle ring around food ─────────────
       4 sides, each with a 3-cell gap. Gaps are staggered (not aligned
       across opposing sides) so both snakes must turn to reach food.
       Ring radius 6-8 → interior is 12-16 cells wide — plenty of room
       for two snakes to manoeuvre inside.                           */
    var R   = 6 + Math.floor(Math.random() * 3);  /* 6, 7 or 8      */
    var GAP = 3;                                    /* gap width      */
    var hg  = Math.floor(GAP / 2);

    /* Randomise gap centres on each side; offset opposing sides so they don't align */
    var shift  = 2 + Math.floor(Math.random() * (R - 2));
    var gapTop    = food.x - shift;
    var gapBottom = food.x + shift;                /* mirrored → not aligned */
    var gapLeft   = food.y - shift;
    var gapRight  = food.y + shift;

    for (var x = food.x - R; x <= food.x + R; x++) {
      if (Math.abs(x - gapTop)    > hg) tryAdd(x, food.y - R);
      if (Math.abs(x - gapBottom) > hg) tryAdd(x, food.y + R);
    }
    for (var y = food.y - R + 1; y <= food.y + R - 1; y++) {
      if (Math.abs(y - gapLeft)  > hg) tryAdd(food.x - R, y);
      if (Math.abs(y - gapRight) > hg) tryAdd(food.x + R, y);
    }

    /* ── EXTRA: 3-4 large random shapes outside the ring ─────────*/
    var extra = 3 + Math.floor(Math.random() * 2);
    var placed = 0, tries = 0;
    while (placed < extra && tries < 600) {
      tries++;
      var tmpl = SHAPE_TEMPLATES[Math.floor(Math.random() * SHAPE_TEMPLATES.length)];
      var ax   = 1 + Math.floor(Math.random() * (COLS - 10));
      var ay   = 1 + Math.floor(Math.random() * (ROWS - 6));
      var ok   = true;
      var cells = [];
      for (var k = 0; k < tmpl.length; k++) {
        var cx = ax + tmpl[k][0];
        var cy = ay + tmpl[k][1];
        if (cx < 1 || cx >= COLS - 1 || cy < 1 || cy >= ROWS - 1) { ok = false; break; }
        if (Math.abs(cx - food.x) <= R + 2 && Math.abs(cy - food.y) <= R + 2) { ok = false; break; }
        if (safe[cx + ',' + cy]) { ok = false; break; }
        var dup = false;
        for (var w = 0; w < walls.length; w++) { if (walls[w].x === cx && walls[w].y === cy) { dup = true; break; } }
        if (dup) { ok = false; break; }
        cells.push({ x: cx, y: cy });
      }
      if (!ok) continue;
      cells.forEach(function (c) { walls.push(c); });
      placed++;
    }
  }

  /* ─────────────────────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────────────────────── */
  function cellBlocked(x, y) {
    var i;
    for (i = 0; i < playerSnake.length; i++) { if (playerSnake[i].x === x && playerSnake[i].y === y) return true; }
    for (i = 0; i < cpuSnake.length;    i++) { if (cpuSnake[i].x    === x && cpuSnake[i].y    === y) return true; }
    for (i = 0; i < walls.length;       i++) { if (walls[i].x        === x && walls[i].y        === y) return true; }
    if (food && food.x === x && food.y === y) return true;
    return false;
  }

  function isWall(x, y) {
    for (var i = 0; i < walls.length; i++) { if (walls[i].x === x && walls[i].y === y) return true; }
    return false;
  }

  function removeWall(x, y) {
    walls = walls.filter(function (w) { return !(w.x === x && w.y === y); });
  }

  function isOnSnake(x, y, snake) {
    for (var i = 0; i < snake.length; i++) { if (snake[i].x === x && snake[i].y === y) return true; }
    return false;
  }

  function updateHUD() {
    if (elPS) elPS.textContent = playerScore;
    if (elCS) elCS.textContent = cpuScore;
  }

  /* ─────────────────────────────────────────────────────────────
     CPU AI — greedy + wall-avoidance with 2-step lookahead
  ───────────────────────────────────────────────────────────── */
  function computeCpuDir() {
    if (!cpuAlive || cpuStun > 0) return cpuDir;
    var head = cpuSnake[0];
    /* BFS to find shortest path to food, avoiding walls and snake bodies.
       Returns the first step direction. Falls back to greedy if no path found. */
    function bfsDir() {
      var start = head.x + ',' + head.y;
      var goal  = food.x + ',' + food.y;
      var queue = [{ x: head.x, y: head.y, first: null }];
      var visited = {}; visited[start] = true;
      var DIRS4 = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

      while (queue.length) {
        var cur = queue.shift();
        if (cur.x === food.x && cur.y === food.y) return cur.first;
        for (var di = 0; di < 4; di++) {
          var d  = DIRS4[di];
          var nx = cur.x + d.x, ny = cur.y + d.y;
          var key = nx + ',' + ny;
          if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
          if (visited[key]) continue;
          if (isOnSnake(nx, ny, cpuSnake))    continue;
          if (isOnSnake(nx, ny, playerSnake)) continue;
          if (isWall(nx, ny))                 continue; /* treat walls as solid for pathfinding */
          visited[key] = true;
          queue.push({ x: nx, y: ny, first: cur.first || d });
        }
      }
      return null; /* no path found */
    }

    var bfsFirst = bfsDir();
    if (bfsFirst) {
      /* Respect no-180 rule */
      if (!(bfsFirst.x === -cpuDir.x && bfsFirst.y === -cpuDir.y)) return bfsFirst;
    }

    /* Fallback greedy — used when BFS finds no route (food unreachable) */
    var dirs = [
      { x:  0, y: -1 }, { x:  0, y:  1 },
      { x: -1, y:  0 }, { x:  1, y:  0 },
    ].filter(function (d) { return !(d.x === -cpuDir.x && d.y === -cpuDir.y); });

    function scoreDir(d) {
      var nx = head.x + d.x, ny = head.y + d.y;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return -1000;
      if (isOnSnake(nx, ny, cpuSnake))    return -950;
      if (isOnSnake(nx, ny, playerSnake)) return -900;
      if (isWall(nx, ny)) return -300;
      return -(Math.abs(food.x - nx) + Math.abs(food.y - ny));
    }

    var best = dirs[0] || cpuDir, bestS = -Infinity;
    dirs.forEach(function (d) { var s = scoreDir(d); if (s > bestS) { bestS = s; best = d; } });
    return best;
  }

  /* ─────────────────────────────────────────────────────────────
     MOVE ONE SNAKE
  ───────────────────────────────────────────────────────────── */
  function moveSnake(snake, dir, who) {
    var nx = snake[0].x + dir.x;
    var ny = snake[0].y + dir.y;
    var i;

    /* Border = death */
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
      if (who === 'player') { playerAlive = false; playerDeathCause = 'border'; }
      else                  { cpuAlive    = false; cpuDeathCause    = 'border'; }
      return;
    }

    /* Wall hit = stun + wall removed + −1 pt */
    if (isWall(nx, ny)) {
      removeWall(nx, ny);
      if (who === 'player') { playerStun = STUN_TICKS; if (playerScore > 0) { playerScore--; updateHUD(); } }
      else                  { cpuStun    = STUN_TICKS; if (cpuScore    > 0) { cpuScore--;    updateHUD(); } }
      return;
    }

    /* Self collision = death */
    for (i = 1; i < snake.length; i++) {
      if (snake[i].x === nx && snake[i].y === ny) {
        if (who === 'player') { playerAlive = false; playerDeathCause = 'self'; }
        else                  { cpuAlive    = false; cpuDeathCause    = 'self'; }
        return;
      }
    }

    /* Opponent body = death */
    var opp = (who === 'player') ? cpuSnake : playerSnake;
    for (i = 0; i < opp.length; i++) {
      if (opp[i].x === nx && opp[i].y === ny) {
        if (who === 'player') { playerAlive = false; playerDeathCause = 'opponent'; }
        else                  { cpuAlive    = false; cpuDeathCause    = 'opponent'; }
        return;
      }
    }

    /* Advance */
    snake.unshift({ x: nx, y: ny });

    if (nx === food.x && ny === food.y) {
      if (who === 'player') {
        playerScore++;
        if (playerScore > best) { best = playerScore; try { localStorage.setItem(LS_KEY, String(best)); } catch (e) {} }
        /* Stun CPU for 2 ticks (~280ms) — simulates human reaction-time lag */
        cpuStun = Math.max(cpuStun, 2);
      } else { cpuScore++; }
      updateHUD();
      spawnFood();
      spawnWalls();
    } else {
      snake.pop();
    }
  }

  /* ─────────────────────────────────────────────────────────────
     TICK
  ───────────────────────────────────────────────────────────── */
  function tick() {
    if (!running || paused || gameOver) return;

    if (playerAlive && playerStun <= 0) {
      if (!(nextPlayerDir.x === -playerDir.x && nextPlayerDir.y === -playerDir.y)) {
        playerDir = nextPlayerDir;
      }
    }

    var cpuNext = computeCpuDir();

    if (playerAlive) { if (playerStun > 0) playerStun--; else moveSnake(playerSnake, playerDir, 'player'); }
    if (cpuAlive)    { if (cpuStun    > 0) cpuStun--;    else { cpuDir = cpuNext; moveSnake(cpuSnake, cpuDir, 'cpu'); } }

    if (gameMode > 0 && (playerScore >= gameMode || cpuScore >= gameMode)) {
      running = false; gameOver = true;
    } else if (!playerAlive || !cpuAlive) {
      running = false; gameOver = true;
    }
  }

  /* ─────────────────────────────────────────────────────────────
     DRAW
  ───────────────────────────────────────────────────────────── */
  function draw() {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    /* Grid */
    ctx.strokeStyle = C.gridLine; ctx.lineWidth = 0.5;
    var g;
    for (g = 0; g <= COLS; g++) { ctx.beginPath(); ctx.moveTo(g * CELL, 0); ctx.lineTo(g * CELL, H); ctx.stroke(); }
    for (g = 0; g <= ROWS; g++) { ctx.beginPath(); ctx.moveTo(0, g * CELL); ctx.lineTo(W, g * CELL); ctx.stroke(); }

    /* Walls */
    walls.forEach(function (w) {
      ctx.fillStyle   = C.wallFill;
      ctx.fillRect(w.x * CELL + 1, w.y * CELL + 1, CELL - 2, CELL - 2);
      ctx.strokeStyle = C.wallStroke;
      ctx.lineWidth   = 1;
      ctx.strokeRect(w.x * CELL + 1.5, w.y * CELL + 1.5, CELL - 3, CELL - 3);
    });

    /* Food */
    if (food) {
      ctx.shadowColor = C.foodGlow; ctx.shadowBlur = 16;
      ctx.fillStyle   = C.food;
      ctx.beginPath();
      ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    /* CPU snake */
    drawSnake(cpuSnake, C.cpuBody, C.cpuHead,
              'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.20)', cpuAlive);

    /* Player snake */
    var pFlash = playerStun > 0 && (Date.now() % 220) < 110;
    drawSnake(playerSnake,
              pFlash ? 'rgba(239,68,68,0.25)' : C.playerBody,
              pFlash ? 'rgba(255,255,255,0.35)' : C.playerHead,
              'rgba(239,68,68,0.12)', 'rgba(239,68,68,0.22)', playerAlive);

    if (waiting)  drawWaiting();
    if (paused)   drawPaused();
    if (gameOver) drawGameOver();
  }

  function drawSnake(snake, bodyCol, headCol, deadBodyCol, deadHeadCol, alive) {
    snake.forEach(function (cell, i) {
      var isHead = (i === 0);
      ctx.fillStyle = alive ? (isHead ? headCol : bodyCol) : (isHead ? deadHeadCol : deadBodyCol);
      if (isHead && alive) { ctx.shadowColor = 'rgba(255,255,255,0.28)'; ctx.shadowBlur = 6; }
      ctx.fillRect(cell.x * CELL + 2, cell.y * CELL + 2, CELL - 4, CELL - 4);
      ctx.shadowBlur = 0;
    });
  }

  function t(text, size, color, y) {
    ctx.font = size + 'px "Press Start 2P", monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, y);
  }

  function drawWaiting() {
    ctx.fillStyle = C.overlay; ctx.fillRect(0, 0, W, H);
    t('MODE: ' + (gameMode === 0 ? 'ENDLESS' : gameMode + ' PTS'), 9,  C.textDim,  H / 2 - 50);
    t(isTouchDevice() ? 'SWIPE TO PLAY' : 'PRESS ANY KEY TO START',  11, C.textMain, H / 2 - 14);
    t(isTouchDevice() ? 'SWIPE TO STEER' : 'WASD / ARROWS  |  SPACE: PAUSE', 9, C.textDim, H / 2 + 14);
    t('WALL: STUN \u22121PT', 9, C.textFade, H / 2 + 38);
    t('BORDER / BODY: DEATH', 9, C.textFade, H / 2 + 56);
  }

  function drawPaused() {
    ctx.fillStyle = C.overlay; ctx.fillRect(0, 0, W, H);
    t('PAUSED', 16, C.textMain, H / 2 - 12);
    t('SPACE TO RESUME', 8, C.textDim, H / 2 + 14);
  }

  function drawGameOver() {
    ctx.fillStyle = C.overlay; ctx.fillRect(0, 0, W, H);

    var title, msg, titleCol;

    /* Score-based win (mode reached) */
    if (gameMode > 0 && playerScore >= gameMode) {
      title    = 'YOU WIN!';
      titleCol = C.textMain;
      msg      = 'Flawless.\nThe CPU needs a moment.';
    } else if (gameMode > 0 && cpuScore >= gameMode) {
      title    = 'OPPONENT WINS';
      titleCol = C.textDim;
      msg      = 'The machine wins\nthis round. Suspicious.';

    /* Both dead simultaneously */
    } else if (!playerAlive && !cpuAlive) {
      title    = 'DRAW';
      titleCol = C.textDim;
      msg      = 'A perfectly synchronized\ndisaster.';

    /* Player died */
    } else if (!playerAlive) {
      titleCol = C.textDim;
      if (playerDeathCause === 'border') {
        title = 'GAME OVER';
        msg   = 'You found the edge\nof the universe.';
      } else if (playerDeathCause === 'self') {
        title = 'GAME OVER';
        msg   = 'You got tangled\nin your own ambition.';
      } else {
        /* opponent */
        title = 'GAME OVER';
        msg   = 'You went for the hug.\nThey didn\'t survive.';
      }

    /* CPU died */
    } else {
      title    = 'YOU WIN!';
      titleCol = C.textMain;
      if (cpuDeathCause === 'border') {
        msg = 'Your opponent forgot\nthe world had walls.';
      } else if (cpuDeathCause === 'self') {
        msg = 'The AI outsmarted\nitself. Classic.';
      } else {
        /* opponent — CPU ran into player */
        msg = 'They came at you\nlike a moth to a flame.';
      }
    }

    t(title, 13, titleCol, H / 2 - 58);

    var lines = msg.split('\n');
    lines.forEach(function (line, i) {
      t(line, 9, 'rgba(255,255,255,0.82)', H / 2 - 26 + i * 20);
    });

    t(playerScore + '  \u2014  ' + cpuScore, 10, C.textMain, H / 2 + 20);
    t('R: PLAY AGAIN', 9, C.textDim,  H / 2 + 44);
    t('ESC: EXIT',     9, C.textFade, H / 2 + 64);
  }

  /* ─────────────────────────────────────────────────────────────
     INPUT
  ───────────────────────────────────────────────────────────── */
  var DIR_MAP = {
    ArrowUp:    { x:  0, y: -1 }, w: { x:  0, y: -1 }, W: { x:  0, y: -1 },
    ArrowDown:  { x:  0, y:  1 }, s: { x:  0, y:  1 }, S: { x:  0, y:  1 },
    ArrowLeft:  { x: -1, y:  0 }, a: { x: -1, y:  0 }, A: { x: -1, y:  0 },
    ArrowRight: { x:  1, y:  0 }, d: { x:  1, y:  0 }, D: { x:  1, y:  0 },
  };

  function onKey(e) {
    if (e.key === 'Escape') { closeGame(); return; }
    if (gameOver && e.type === 'keydown') { if (e.key === 'r' || e.key === 'R') restartGame(); return; }

    if (modeSelectEl.style.display !== 'none' && e.type === 'keydown') {
      if (e.key === 'ArrowLeft')              { modeIdx = (modeIdx + 2) % 3; syncModeBtns(); e.preventDefault(); }
      if (e.key === 'ArrowRight')             { modeIdx = (modeIdx + 1) % 3; syncModeBtns(); e.preventDefault(); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); confirmMode(); }
      return;
    }

    if (e.key === ' ' && e.type === 'keydown') { e.preventDefault(); if (!waiting && !gameOver) togglePause(); return; }

    if (e.type === 'keydown' && DIR_MAP[e.key]) {
      var arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (arrows.indexOf(e.key) !== -1) e.preventDefault();
      var nd = DIR_MAP[e.key];
      if (!(nd.x === -playerDir.x && nd.y === -playerDir.y)) nextPlayerDir = nd;
      if (waiting) { waiting = false; startLoop(); }
    }
  }

  function togglePause() { paused = !paused; if (!paused && !running) startLoop(); }

  /* ─────────────────────────────────────────────────────────────
     LOOP CONTROL
  ───────────────────────────────────────────────────────────── */
  function startLoop() {
    if (running) return;
    running = true;
    clearInterval(tickTimer);
    tickTimer = setInterval(tick, TICK_MS);
  }

  function stopLoop() { running = false; clearInterval(tickTimer); }

  function startRender() {
    cancelAnimationFrame(animId);
    (function frame() {
      if (!overlay.classList.contains('is-open')) return;
      draw();
      animId = requestAnimationFrame(frame);
    })();
  }

  function stopRender() { cancelAnimationFrame(animId); }

  /* ─────────────────────────────────────────────────────────────
     RESTART / OPEN / CLOSE
  ───────────────────────────────────────────────────────────── */
  function restartGame() { stopLoop(); initGame(); showModeSelect(); }

  function openGame() {
    if (window.innerWidth < 768) return;
    layout(); initGame(); showModeSelect();
    if (ctx) ctx.clearRect(0, 0, W, H);
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('game-open');
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup',   onKey);
    startRender();
  }

  function closeGame() {
    stopLoop(); stopRender();
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('game-open');
    document.body.classList.remove('game-canvas-hover');
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup',   onKey);
  }

  /* ─────────────────────────────────────────────────────────────
     TOUCH — SWIPE
  ───────────────────────────────────────────────────────────── */
  function attachTouch() {
    var wrap = document.getElementById('snkWrap');
    if (!wrap) return;

    var sx = 0, sy = 0, MIN = 28;

    wrap.addEventListener('touchstart', function (e) {
      e.preventDefault();
      sx = e.changedTouches[0].clientX;
      sy = e.changedTouches[0].clientY;
      if (modeSelectEl.style.display !== 'none') return;
      if (waiting) { waiting = false; startLoop(); }
    }, { passive: false });

    wrap.addEventListener('touchend', function (e) {
      e.preventDefault();
      if (modeSelectEl.style.display !== 'none' || gameOver) return;
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < MIN && Math.abs(dy) < MIN) return;
      var nd = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 })
        : (dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
      if (!(nd.x === -playerDir.x && nd.y === -playerDir.y)) nextPlayerDir = nd;
    }, { passive: false });
  }

  /* ─────────────────────────────────────────────────────────────
     TRIGGER — nav icons 3× click
  ───────────────────────────────────────────────────────────── */
  function attachTrigger() {
    var el = document.getElementById('navIcons');
    if (!el) return;
    el.style.pointerEvents = 'auto';
    el.style.cursor        = 'pointer';
    el.addEventListener('click', function () {
      if (window.innerWidth < 768) return;
      openGame();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────── */
  function init() {
    if (window.innerWidth < 768) return;
    best = parseInt(localStorage.getItem(LS_KEY) || '0', 10) || 0;
    build();

    modeBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () { modeIdx = i; confirmMode(); });
      btn.addEventListener('touchstart', function (e) { e.preventDefault(); modeIdx = i; confirmMode(); }, { passive: false });
    });

    pauseBtn.addEventListener('click', function () { if (!waiting && !gameOver) togglePause(); });
    document.getElementById('snkClose').addEventListener('click', closeGame);

    var snkWrap = document.getElementById('snkWrap');
    if (snkWrap) {
      snkWrap.addEventListener('mouseenter', function () { document.body.classList.add('game-canvas-hover'); });
      snkWrap.addEventListener('mouseleave', function () { document.body.classList.remove('game-canvas-hover'); });
    }

    window.addEventListener('resize', function () {
      if (!overlay.classList.contains('is-open')) return;
      if (window.innerWidth < 768) { closeGame(); return; }
      stopLoop(); layout(); initGame(); showModeSelect();
    });

    if (isTouchDevice()) attachTouch();
    attachTrigger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
