/**
 * SPACE INVADERS — spaceinvaders.js  v9
 * Contact page · Nav icons 3× click
 *
 * LANDSCAPE: Ship (left) → shoots RIGHT | Enemies from all directions → shoot LEFT/aimed
 * Desktop : Arrows/WASD move · SPACE fire (hold) · P pause · R restart · ESC exit
 * Tablet  : Left-half drag = move · Right-half hold = fire (no visual buttons)
 */
(function () {
  'use strict';

  var IS_TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  /* ── PALETTE ─────────────────────────────────────────────────── */
  var C = {
    bg:       '#000000',
    ship:     '#00ff88',
    shipEng:  '#00aaff',
    bullet:   '#aaffcc',
    triB:     '#ffff44',
    fighter:  '#ff3355',
    bomber:   '#ffaa00',
    elite:    '#cc55ff',
    drone:    '#ff7700',
    boss:     '#ff1144',
    bossP2:   '#ff6600',
    bossP3:   '#ff0000',
    shield:   '#4499ff',
    shelter:  '#00cc44',
    laser:    '#ff0055',
    block:    '#3355cc',
    bhInner:  '#110022',
    pwRapid:  '#ffff00',
    pwTriple: '#00ffff',
    pwShield: '#4499ff',
    pwBomb:   '#ff4400',
    pwLaser:  '#ff44ff',
    pwLife:   '#ff6688',
    laserBeam:'#ff88ff',
    textMain: '#ffffff',
    textDim:  '#00ff88',
    textFade: 'rgba(0,255,136,0.35)',
    overlay:  'rgba(0,0,0,0.90)',
  };

  /* ── DIFFICULTY ──────────────────────────────────────────────── */
  var DIFFS = [
    { label:'EASY',   eSpdMul:0.60, eFirCD:4.5, bossHPM:0.50 },
    { label:'NORMAL', eSpdMul:1.00, eFirCD:2.8, bossHPM:1.00 },
    { label:'HARD',   eSpdMul:1.35, eFirCD:1.6, bossHPM:1.50 },
  ];

  /* ── CONSTANTS ───────────────────────────────────────────────── */
  var SHIP_SPD    = 230;
  var PBUL_SPD    = 580;
  var BASE_FCD    = 0.22;   /* fire cooldown base (RAPID = ×0.22) */
  var LIVES_MAX   = 3;
  var INV_TIME    = 1.2;
  var GAUNT_DUR   = 30;
  var LS_KEY      = 'galekto_invaders_hi';

  /* ── RESPONSIVE (computed after layout) ─────────────────────── */
  var W, H, SS, SE, SB, MAX_ENE, GATE_GAP;

  function computeScale() {
    var sc  = Math.min(1, W / 960, H / 520);
    SS      = Math.max(3, Math.round(5 * sc));   /* ship sprite px */
    SE      = Math.max(3, Math.round(4 * sc));   /* enemy sprite px — bigger */
    SB      = Math.max(5, Math.round(8 * sc));   /* boss sprite px — bigger */
    MAX_ENE = Math.max(5, Math.floor(W / 100));
    GATE_GAP = Math.max(H * 0.28, 85);
  }

  /* ── SPRITES ─────────────────────────────────────────────────── */
  /* Swept-wing fighter — 8 cols × 7 rows (smaller + distinctive) */
  var SPR_SHIP = [
    '  ##    ',   /* engine pods at back (left) */
    '  ######',   /* upper wing sweeps forward */
    '########',   /* full body */
    '##  ####',   /* cockpit gap near engine bay */
    '########',   /* full body */
    '  ######',   /* lower wing */
    '  ##    ',   /* engine pods at back */
  ];

  var SPR_FIGHTER = [
    '  # #  ',
    ' ##### ',
    '#######',
    '## # ##',
    ' ##### ',
    '  # #  ',
  ];

  var SPR_BOMBER = [
    '    #    ',
    '   ###   ',
    '  #####  ',
    '#########',
    '###   ###',
    '#########',
    '  #####  ',
    '   ###   ',
  ];

  var SPR_ELITE = [
    '## ### ##',
    '#########',
    '##     ##',
    '#########',
    '## ### ##',
  ];

  var SPR_DRONE = [
    ' ## ',
    '####',
    ' ## ',
  ];

  /* Four boss designs — selected by (level-1) % 4 */
  var BOSS_SPRITES = [
    [ /* Lv1 — Imperial Battleship: elongated warship with gun ports */
      '         ####         ',
      '       ########       ',
      '   ################## ',
      ' #################### ',
      '######################',
      '##  ##  ##    ##  ##  ',
      '######################',
      '######################',
      '##  ##  ##    ##  ##  ',
      '######################',
      ' #################### ',
      '   ################## ',
      '       ########       ',
      '         ####         ',
    ],
    [ /* Lv2 — Wedge Destroyer: asymmetric triangular blade */
      '                   ###',
      '               #######',
      '           ###########',
      '       ###############',
      '   ###################',
      '######################',
      '######################',
      '   ###################',
      '       ###############',
      '           ###########',
      '               #######',
      '                   ###',
    ],
    [ /* Lv3 — Ring Station: hollow ring with docking arms */
      '      ##########      ',
      '    ##          ##    ',
      '  ##   ########   ##  ',
      ' ##   ##########   ## ',
      '##   ############   ##',
      '##   ##        ##   ##',
      '##   ##        ##   ##',
      '##   ############   ##',
      ' ##   ##########   ## ',
      '  ##   ########   ##  ',
      '    ##          ##    ',
      '      ##########      ',
    ],
    [ /* Lv4 — Carrier: wide flat deck with fighter bays */
      '##                      ##',
      '####  ################  ##',
      '##########################',
      '##  ####  ######  ####  ##',
      '##                      ##',
      '##  ####  ######  ####  ##',
      '##########################',
      '####  ################  ##',
      '##                      ##',
    ],
    [ /* Lv5 — Stealth Hunter: narrow diamond blade */
      '          ##          ',
      '        ######        ',
      '      ##########      ',
      '    ##############    ',
      '  ##################  ',
      '######################',
      '  ##################  ',
      '    ##############    ',
      '      ##########      ',
      '        ######        ',
      '          ##          ',
    ],
    [ /* Lv6 — Siege Tank: wide low profile with cannon mounts */
      '##########################',
      '##  ##  ##  ##  ##  ##  ##',
      '##########################',
      '####                  ####',
      '######  ############  ####',
      '######  ############  ####',
      '####                  ####',
      '##########################',
      '##  ##  ##  ##  ##  ##  ##',
      '##########################',
    ],
    [ /* Lv7 — Twin Core: two engine pods joined by bridge */
      '  ######        ######  ',
      ' ########      ######## ',
      '##########    ##########',
      '##########    ##########',
      '########################',
      '########################',
      '##########    ##########',
      '##########    ##########',
      ' ########      ######## ',
      '  ######        ######  ',
    ],
    [ /* Lv8 — Mothership: massive multi-section capital ship */
      '   ####            ####   ',
      ' ########        ######## ',
      ' ########        ######## ',
      '##########################',
      '##  ##  ####  ##  ##  ####',
      '##########################',
      '########################  ',
      '##  ####  ######  ####  ##',
      '########################  ',
      '##########################',
      '##  ##  ####  ##  ##  ####',
      '##########################',
      ' ########        ######## ',
      ' ########        ######## ',
      '   ####            ####   ',
    ],
  ];
  var currentBossSpr = BOSS_SPRITES[0];

  /* derived sizes (updated after layout) */
  var SHIP_W, SHIP_H, FTR_W, FTR_H, BMB_W, BMB_H, ELT_W, ELT_H, DRN_W, DRN_H, BOSS_W, BOSS_H;
  function computeSizes() {
    SHIP_W = SPR_SHIP[0].length  * SS; SHIP_H = SPR_SHIP.length  * SS;
    FTR_W  = SPR_FIGHTER[0].length * SE; FTR_H  = SPR_FIGHTER.length * SE;
    BMB_W  = SPR_BOMBER[0].length  * SE; BMB_H  = SPR_BOMBER.length  * SE;
    ELT_W  = SPR_ELITE[0].length   * SE; ELT_H  = SPR_ELITE.length   * SE;
    DRN_W  = SPR_DRONE[0].length   * SE; DRN_H  = SPR_DRONE.length   * SE;
    BOSS_W = currentBossSpr[0].length * SB; BOSS_H = currentBossSpr.length * SB;
  }

  /* ── STATE ───────────────────────────────────────────────────── */
  var phase;
  var score, hiScore, lives, level;
  var diff, diffIdx;

  /* Ship */
  var ship, pBuls, fireCd, fireHeld, touchFireActive;
  var pows;           /* stacking powers: { rapid:t, triple:t, laser:t } — time remaining */
  var shieldHP;       /* 0 = no shield, 1 = shield power-up active */
  var respawnShield;  /* 0-10: multi-hit respawn shield after each death */
  var laserBeam;      /* null or { t: remaining_display_time } */
  var laserCd;        /* cooldown between laser shots */

  /* Combat */
  var enemies, alBuls, powerups, blackholes, bhTimer, waveT, wavesLeft;

  /* Gauntlet */
  var gauntletT, gauntletEnding, gauntletEndT;
  var asteroids, astSpawnT;

  /* Boss */
  var boss, bossBuls, bossFireT, bossMoveDir, bossPhase, bossEsc;
  var bossShields;      /* shield turrets orbiting boss */
  var bossPowSpawnT;    /* timer for random power-up drops in boss phase */

  /* ── BOSS DEFINITIONS (8 types, cycles) ─────────────────────── */
  /* shieldCount: turrets that must die before boss is vulnerable    */
  var BOSS_DEFS = [
    /* 0 — Dreadnought */ { hpM:1.0, shields:0, move:'figure8',  fireCD:1.2, escort:'fighter', escMax:2, canAdv:false },
    /* 1 — Wedge */       { hpM:1.2, shields:0, move:'charge',   fireCD:1.0, escort:'drone',   escMax:4, canAdv:true  },
    /* 2 — Ring Stn */    { hpM:1.4, shields:4, move:'orbit',    fireCD:1.3, escort:'elite',   escMax:2, canAdv:false },
    /* 3 — Carrier */     { hpM:1.5, shields:2, move:'strafe',   fireCD:1.1, escort:'fighter', escMax:4, canAdv:false },
    /* 4 — Stealth */     { hpM:1.6, shields:0, move:'blink',    fireCD:0.8, escort:'drone',   escMax:5, canAdv:true  },
    /* 5 — Siege Tank */  { hpM:1.8, shields:2, move:'advance',  fireCD:1.0, escort:'bomber',  escMax:2, canAdv:true  },
    /* 6 — Twin Core */   { hpM:2.0, shields:0, move:'zigzag',   fireCD:0.9, escort:'elite',   escMax:3, canAdv:true  },
    /* 7 — Mothership */  { hpM:2.2, shields:4, move:'sineX',    fireCD:0.7, escort:'elite',   escMax:4, canAdv:false },
  ];

  /* Phase message overlay (non-blocking) */
  var phaseMsg, phaseMsgT;

  /* Respawn shield decay timer */
  var respawnShieldDecayT;

  /* Smooth combat→asteroid pre-spawn flag */
  var combatPreAst;

  /* Boss-defeated smooth-clear timer (counts down then begins next combat) */
  var stageClearT;

  /* Gauntlet power-up spawn timer */
  var gauntPowT;

  /* Asteroid explosion particles */
  var astParticles;

  /* Common */
  var invTimer, running, paused, waiting;
  var transTimer, transMsg, transNext;
  var animId, prevT, keys;

  /* ── DOM ─────────────────────────────────────────────────────── */
  var overlay, canvas, ctx;
  var elScore, elHi, elLives, elPow, pauseBtn, modeSelectEl, modeBtns;

  /* ═══════════════════════════════════════════════════════════════
     BUILD DOM
  ═══════════════════════════════════════════════════════════════ */
  function build() {
    overlay = document.createElement('div');
    overlay.id = 'siOverlay';
    overlay.className = 'game-overlay';
    overlay.style.setProperty('--game-bg',     '#010101');
    overlay.style.setProperty('--game-fg',     C.textDim);
    overlay.style.setProperty('--game-fg-dim', C.textFade);
    overlay.style.setProperty('--game-accent', C.fighter);
    overlay.style.setProperty('--game-head',   C.textMain);
    overlay.style.setProperty('--game-border', 'rgba(0,255,136,0.22)');
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML =
      '<div class="game-hud">' +
        '<div class="game-hud-scores">' +
          '<div class="game-score-block"><span class="game-label">SCORE</span><span class="game-value" id="siScore">0</span></div>' +
          '<div class="game-score-block"><span class="game-label">BEST</span><span class="game-value" id="siHi">0</span></div>' +
          '<div class="game-score-block"><span class="game-label">POWER</span><span class="game-value" id="siPow" style="font-size:9px">—</span></div>' +
        '</div>' +
        '<span class="game-title-label">INVADERS</span>' +
        '<div class="game-hud-right">' +
          '<div class="game-score-block" style="align-items:flex-end"><span class="game-label">LIVES</span><span class="game-value" id="siLives" style="font-size:22px;letter-spacing:3px">\u2665\u2665\u2665</span></div>' +
          '<button class="game-pause-btn" id="siPause">II</button>' +
          '<button class="game-close"     id="siClose">\u2715</button>' +
        '</div>' +
      '</div>' +
      '<div class="game-body">' +
        '<div class="game-canvas-wrap" id="siWrap">' +
          '<canvas id="siCanvas"></canvas>' +
          '<div class="pong-mode-select" id="siMode">' +
            '<p class="pong-mode-title">DIFFICULTY</p>' +
            '<div class="pong-mode-options">' +
              '<button class="pong-mode-btn" data-idx="0">EASY</button>' +
              '<button class="pong-mode-btn is-selected" data-idx="1">NORMAL</button>' +
              '<button class="pong-mode-btn" data-idx="2">HARD</button>' +
            '</div>' +
            '<p class="pong-mode-hint" id="siHint">\u2190\u2192 SELECT \u00a0 ENTER START</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    var wrap = overlay.querySelector('.game-canvas-wrap');
    if (wrap) wrap.style.borderColor = 'rgba(0,255,136,0.18)';

    canvas       = document.getElementById('siCanvas');
    ctx          = canvas.getContext('2d');
    elScore      = document.getElementById('siScore');
    elHi         = document.getElementById('siHi');
    elLives      = document.getElementById('siLives');
    elPow        = document.getElementById('siPow');
    pauseBtn     = document.getElementById('siPause');
    modeSelectEl = document.getElementById('siMode');
    modeBtns     = modeSelectEl.querySelectorAll('.pong-mode-btn');

    canvas.style.touchAction = 'none';
    canvas.style.userSelect  = 'none';
    if (IS_TOUCH) { var h = document.getElementById('siHint'); if (h) h.textContent = 'TAP TO SELECT'; }
  }

  /* ── LAYOUT ──────────────────────────────────────────────────── */
  function layout() {
    var wrap = document.getElementById('siWrap');
    W = Math.max(480, wrap.offsetWidth  || 480);
    H = Math.max(280, wrap.offsetHeight || 280);
    canvas.width = W; canvas.height = H;
    computeScale(); computeSizes();
  }

  /* ── MODE SELECT ─────────────────────────────────────────────── */
  function showMode() { diffIdx = 1; syncBtns(); modeSelectEl.style.display = 'flex'; }
  function hideMode() { modeSelectEl.style.display = 'none'; }
  function syncBtns() { modeBtns.forEach(function(b,i){ b.classList.toggle('is-selected', i===diffIdx); }); }
  function confirmMode() { diff = DIFFS[diffIdx]; hideMode(); waiting = true; phase = 'waiting'; }

  /* ── HUD ─────────────────────────────────────────────────────── */
  function updateHUD() {
    if (elScore) elScore.textContent = score;
    if (elHi)   elHi.textContent   = hiScore;
    if (elLives) { var s=''; for(var i=0;i<lives;i++) s+='\u2665'; elLives.textContent=s||'\u2620'; }
    if (elPow) {
      var active=[];
      if (pows&&pows.rapid>0)  active.push('RPD');
      if (pows&&pows.triple>0) active.push('TRI');
      if (pows&&pows.laser>0)  active.push('LZR');
      if (shieldHP)            active.push('PWR\u25C6');
      if (respawnShield>0)     active.push('\u25C6'+respawnShield);
      elPow.textContent = active.length ? active.join(' ') : '\u2014';
      elPow.style.color = respawnShield>0 ? (respawnShield>=8?'#44aaff':respawnShield>=4?'#ffdd00':'#ff4455') :
                          active.length   ? C.pwRapid : C.textFade;
    }
  }

  /* ── SPRITE DRAW ─────────────────────────────────────────────── */
  function drawSpr(grid, ox, oy, col, ps) {
    ctx.fillStyle = col;
    for (var r=0; r<grid.length; r++)
      for (var c=0; c<grid[r].length; c++)
        if (grid[r][c]==='#') ctx.fillRect(Math.round(ox+c*ps), Math.round(oy+r*ps), ps, ps);
  }

  /* ── TEXT ────────────────────────────────────────────────────── */
  function t(s, size, col, x, y, align) {
    ctx.font = size+'px "Press Start 2P",monospace';
    ctx.fillStyle = col; ctx.textAlign = align||'center';
    ctx.fillText(s, x, y); ctx.textAlign='center';
  }

  /* ═══════════════════════════════════════════════════════════════
     GAME INIT
  ═══════════════════════════════════════════════════════════════ */
  function initGame() {
    score=0; lives=LIVES_MAX; level=1;
    paused=false; invTimer=0; keys={};
    pows={rapid:0,triple:0,laser:0}; shieldHP=0; respawnShield=0; respawnShieldDecayT=3;
    phaseMsg=''; phaseMsgT=0; combatPreAst=false;
    stageClearT=0; gauntPowT=22+Math.random()*8; astParticles=[];
    updateHUD(); beginCombat();
  }

  function resetShip() {
    ship = { x:18, y:H/2-SHIP_H/2, w:SHIP_W, h:SHIP_H };
    pBuls=[]; fireCd=0; fireHeld=false; touchFireActive=false;
  }

  function addScore(pts) {
    score += pts;
    if (score>hiScore) { hiScore=score; try{localStorage.setItem(LS_KEY,String(hiScore));}catch(e){} }
    updateHUD();
  }

  function transition(msg, dur, next) {
    phase=('trans'); transMsg=msg; transTimer=dur; transNext=next; running=false;
  }

  /* ═══════════════════════════════════════════════════════════════
     ENEMY FACTORIES
  ═══════════════════════════════════════════════════════════════ */
  function makeEnemy(type, x, y, vx, vy, path, opts) {
    var spd = (diff.eSpdMul || 1);
    var e = { type:type, x:x, y:y, vx:vx*spd, vy:vy*spd,
              path:path||'march', pathT:0, baseX:x, baseY:y,
              fireCD: (diff.eFirCD||1.6) + Math.random()*0.8,
              fireT:  0.5 + Math.random()*2,
              alive:true };
    if (type==='fighter') { e.w=FTR_W; e.h=FTR_H; e.hp=1; e.pts=20;  e.spd=120*spd; }
    if (type==='bomber')  { e.w=BMB_W; e.h=BMB_H; e.hp=4; e.pts=50;  e.spd=55*spd;  }
    if (type==='elite')   { e.w=ELT_W; e.h=ELT_H; e.hp=(diff&&diff.label==='EASY'?2:3); e.pts=80; e.spd=85*spd; }
    if (type==='drone')   { e.w=DRN_W; e.h=DRN_H; e.hp=1; e.pts=10;  e.spd=160*spd; }
    if (opts) Object.keys(opts).forEach(function(k){ e[k]=opts[k]; });
    return e;
  }

  /* ═══════════════════════════════════════════════════════════════
     WAVE PATTERNS
  ═══════════════════════════════════════════════════════════════ */
  function spawnWave() {
    var n   = Math.max(3, Math.min(MAX_ENE, 4 + level));
    var pat = Math.floor(Math.random() * 7);

    if (pat === 0) {
      /* Horizontal march row */
      var rowY = H * 0.15 + Math.random() * H * 0.70;
      for (var i=0; i<n; i++)
        enemies.push(makeEnemy('fighter', W+20+i*40, rowY, -110, 0, 'march'));

    } else if (pat === 1) {
      /* V-formation from right */
      var cy = H/2;
      for (var i=0; i<n; i++) {
        var off = (i - Math.floor(n/2)) * 28;
        enemies.push(makeEnemy('fighter', W+20+Math.abs(off)*0.6, cy+off, -105, 0, 'march'));
      }

    } else if (pat === 2) {
      /* Pincer — top AND bottom simultaneously */
      var half = Math.ceil(n/2);
      for (var i=0; i<half; i++)
        enemies.push(makeEnemy('fighter', W+20+i*50, H*0.08+i*18, -95, 30, 'dive', {targetY:H*0.25+i*20}));
      for (var i=0; i<half; i++)
        enemies.push(makeEnemy('fighter', W+20+i*50, H*0.92-i*18, -95,-30, 'dive', {targetY:H*0.75-i*20}));

    } else if (pat === 3) {
      /* Sine-wave sweep */
      for (var i=0; i<n; i++)
        enemies.push(makeEnemy('fighter', W+20+i*55, H/2, -90, 0, 'sine', {amp:H*0.30, freq:1.8+i*0.2}));

    } else if (pat === 4) {
      /* Kamikaze drones — aimed at ship */
      for (var i=0; i<n+2; i++) {
        var sx = W + Math.random()*120;
        var sy = Math.random()*H;
        enemies.push(makeEnemy('drone', sx, sy, -140, 0, 'kamikaze'));
      }

    } else if (pat === 5) {
      /* Bomber squadron — slow, lots of HP */
      var count = Math.max(2, Math.floor(n/2));
      for (var i=0; i<count; i++) {
        var by = H*0.15 + (i/(count-1||1))*H*0.70;
        enemies.push(makeEnemy('bomber', W+30+i*70, by, -55, 0, 'march'));
      }

    } else {
      /* Elite ambush — from top and bottom edges */
      for (var i=0; i<Math.ceil(n/2); i++) {
        enemies.push(makeEnemy('elite', W*0.4+Math.random()*W*0.5, -ELT_H-10, -40, 70+Math.random()*40, 'fall'));
        enemies.push(makeEnemy('elite', W*0.4+Math.random()*W*0.5, H+10,      -40,-(70+Math.random()*40),'fall'));
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     COMBAT
  ═══════════════════════════════════════════════════════════════ */
  function beginCombat() {
    phase='combat'; resetShip();
    enemies=[]; alBuls=[]; powerups=[]; blackholes=[];
    bhTimer = 18 + Math.random()*12;
    waveT   = 0.8;
    wavesLeft = 13 + level * 3;   /* longer combat phase */
    phaseMsg=''; phaseMsgT=0;
    running=true;
  }

  function updateCombat(dt) {
    if (!running) return;
    if (invTimer>0) invTimer-=dt;
    if (phaseMsgT>0) phaseMsgT-=dt;
    tickShieldDecay(dt);

    /* Ship movement — full canvas */
    moveShip(dt, 4, H-SHIP_H-4, 4, W-SHIP_W-4);

    /* Fire */
    fireCd -= dt; laserCd -= dt;
    if (laserBeam) { laserBeam.t-=dt; if(laserBeam.t<=0) laserBeam=null; }
    if ((fireHeld || touchFireActive) && fireCd<=0) fireBullet();
    if ((fireHeld || touchFireActive)) fireLaser();

    /* Player bullets → right */
    pBuls = pBuls.filter(function(b){ b.x+=PBUL_SPD*dt; return b.x<W+20; });

    /* Alien bullets → left (aimed) */
    alBuls = alBuls.filter(function(b){
      b.x+=b.vx*dt; b.y+=b.vy*dt;
      return b.x>-20 && b.y>-20 && b.y<H+20;
    });

    /* Power timers */
    if (pows) { ['rapid','triple','laser'].forEach(function(k){ if(pows[k]>0){pows[k]-=dt; if(pows[k]<0)pows[k]=0; updateHUD();} }); }

    /* Wave spawner */
    if (wavesLeft>0) {
      waveT-=dt;
      if (waveT<=0 && enemies.filter(function(e){return e.alive;}).length < MAX_ENE) {
        spawnWave(); wavesLeft--; waveT = Math.max(1.2, 2.2 - level*0.15);
      }
    } else {
      var skipGauntlet = (level % 3 === 0);
      /* No more waves — if gauntlet level, pre-spawn asteroids while enemies die */
      if (!skipGauntlet) {
        if (!combatPreAst) {
          combatPreAst=true; astSpawnT=1.8;
          phaseMsg='APPROACHING ASTEROID FIELD'; phaseMsgT=3.5;
        }
        astSpawnT-=dt;
        if (astSpawnT<=0) {
          spawnAsteroidCluster();
          astSpawnT = Math.max(1.2, 2.8 - level*0.1);
        }
        /* Move pre-spawned asteroids */
        asteroids.forEach(function(a){
          a.timeAlive+=dt; a.x-=a.spd*dt; a.y+=a.vy*dt;
          if (a.sineAmp) a.y=(a.baseY+a.vy*a.timeAlive)+Math.sin(a.timeAlive*a.sineFreq)*a.sineAmp;
          a.rot+=a.rotSpd*dt;
        });
        asteroids=asteroids.filter(function(a){ return a.alive&&a.x+a.r>-20&&a.y>-a.r*3&&a.y<H+a.r*3; });
        /* Player bullets → pre-spawned asteroids */
        pBuls.forEach(function(b){
          asteroids.forEach(function(a){
            if (!a.alive) return;
            var dx=b.x-a.x, dy=(b.y+b.h/2)-a.y;
            if (Math.sqrt(dx*dx+dy*dy)<a.r+4){ b.x=W+999; a.hp--; spawnAstParticle(a.x,a.y,a.r); if(a.hp<=0){a.alive=false;addScore(5);splitAst(a);} }
          });
        });
        /* Ship → pre-spawned asteroids */
        if (invTimer<=0) asteroids.forEach(function(a){
          if (!a.alive) return;
          var sx=ship.x+SHIP_W/2, sy=ship.y+SHIP_H/2;
          if (Math.sqrt((sx-a.x)*(sx-a.x)+(sy-a.y)*(sy-a.y))<a.r+Math.min(SHIP_W,SHIP_H)*0.4) hitShip();
        });
        updateAstParticles(dt);
      }
      /* All enemies dead → next phase */
      if (enemies.filter(function(e){return e.alive;}).length===0) {
        if (skipGauntlet) { phaseMsg='BOSS INCOMING'; phaseMsgT=3.0; beginBoss(); } else { beginGauntlet(); }
        return;
      }
    }

    /* Enemy update */
    enemies.forEach(function(e){ if(e.alive) updateEnemy(e, dt); });

    /* Black holes */
    bhTimer-=dt;
    if (bhTimer<=0) {
      blackholes.push({ x:W*0.25+Math.random()*W*0.55, y:H*0.1+Math.random()*H*0.8,
                        r:18+Math.random()*14, life:7+Math.random()*5, spin:0 });
      bhTimer = 16+Math.random()*12;
    }
    blackholes.forEach(function(bh){ bh.life-=dt; bh.spin+=dt*2.2; });
    blackholes = blackholes.filter(function(bh){ return bh.life>0; });

    /* Power-ups float left toward ship */
    powerups.forEach(function(p){ p.x-=55*dt; });
    powerups = powerups.filter(function(p){ return p.x>-30; });

    checkCombatCollisions();
  }

  function updateEnemy(e, dt) {
    e.pathT += dt;

    if (e.path==='march') {
      e.x += e.vx*dt; e.y += e.vy*dt;
    } else if (e.path==='sine') {
      e.x += e.vx*dt;
      e.y = e.baseY + Math.sin(e.pathT * e.freq) * e.amp;
    } else if (e.path==='dive') {
      e.x += e.vx*dt;
      var dy = (e.targetY||H/2) - e.y;
      e.y += Math.sign(dy) * Math.min(Math.abs(dy), Math.abs(e.vy)*dt + e.spd*0.5*dt);
    } else if (e.path==='kamikaze') {
      /* Aim at ship */
      var dx=ship.x-e.x, dy=ship.y-e.y, len=Math.sqrt(dx*dx+dy*dy)||1;
      e.x += dx/len * e.spd * dt;
      e.y += dy/len * e.spd * dt;
    } else if (e.path==='fall') {
      e.x += e.vx*dt; e.y += e.vy*dt;
      if (e.vy>0 && e.y>=H*0.1 && e.y<=H*0.9) e.vy*=0.92; /* slow down in mid-field */
      if (e.vy<0 && e.y<=H*0.9 && e.y>=H*0.1) e.vy*=0.92;
    }

    /* Kill if far off screen */
    if (e.x < -BMB_W-10 || e.y < -BMB_H-10 || e.y > H+BMB_H+10) { e.alive=false; return; }

    /* Enemy fire — aimed at ship */
    e.fireT-=dt;
    if (e.fireT<=0 && e.type!=='drone') {
      e.fireT = e.fireCD;
      var dx2=ship.x+SHIP_W/2-e.x, dy2=ship.y+SHIP_H/2-(e.y+e.h/2), len2=Math.sqrt(dx2*dx2+dy2*dy2)||1;
      var spd2 = (e.type==='bomber' ? 140 : e.type==='elite' ? 200 : 170) * diff.eSpdMul;
      alBuls.push({ x:e.x, y:e.y+e.h/2, vx:dx2/len2*spd2, vy:dy2/len2*spd2, w:7, h:4 });
      if (e.type==='elite') { /* Elite: 3-way */
        alBuls.push({ x:e.x, y:e.y+e.h/2, vx:dx2/len2*spd2, vy:dy2/len2*spd2-60, w:7, h:4 });
        alBuls.push({ x:e.x, y:e.y+e.h/2, vx:dx2/len2*spd2, vy:dy2/len2*spd2+60, w:7, h:4 });
      }
    }
  }

  function checkCombatCollisions() {
    /* Player bullets → enemies */
    pBuls.forEach(function(b){
      enemies.forEach(function(e){
        if (!e.alive||!ovlp(b,e)) return;
        b.x=W+999; e.hp--;
        if (e.hp<=0) { e.alive=false; addScore(e.pts); tryDropPow(e); }
      });
    });

    /* Player bullets → black holes (swallowed) */
    pBuls.forEach(function(b){
      blackholes.forEach(function(bh){
        if (ptDist(b.x,b.y,bh.x,bh.y)<bh.r) b.x=W+999;
      });
    });

    /* Alien bullets → ship */
    if (invTimer<=0) {
      alBuls.forEach(function(b){
        if (!ovlp(b,ship)) return;
        b.x=-999; hitShip();
      });

      /* Enemies touch ship */
      enemies.forEach(function(e){
        if (!e.alive||!ovlp(e,ship)) return;
        e.alive=false; if(invTimer<=0) hitShip(); else addScore(e.pts);
      });

      /* Black holes — teleport ship, swallow enemies */
      blackholes.forEach(function(bh){
        enemies.forEach(function(e){ if(e.alive && rcDist(e,bh)<bh.r+4){ e.alive=false; addScore(3); } });
        if (rcDist(ship,bh)<bh.r) {
          /* Teleport to random position */
          ship.x = SHIP_W + Math.random()*(W-SHIP_W*3);
          ship.y = SHIP_H + Math.random()*(H-SHIP_H*3);
          invTimer = 0.8; /* brief grace after teleport */
          bh.life = 0;   /* consume the black hole */
        }
      });
    }

    /* Player picks up power-ups */
    powerups.forEach(function(p){
      if (!ovlp(p,ship)) return;
      p.x=-999;
      if (p.type==='bomb') {
        enemies.forEach(function(e){ if(e.alive){ addScore(Math.floor(e.pts*0.5)); e.alive=false; } });
        /* alBuls kept — only enemies cleared */
      } else if (p.type==='shield') {
        shieldHP=1;
      } else if (p.type==='life') {
        lives=Math.min(lives+1,5);
      } else if (p.type==='rapid') {
        pows.rapid=Math.max(pows.rapid,0)+10;
      } else if (p.type==='triple') {
        pows.triple=Math.max(pows.triple,0)+12;
      } else if (p.type==='laser') {
        pows.laser=Math.max(pows.laser,0)+15;
      }
      updateHUD();
    });
    powerups = powerups.filter(function(p){ return p.x>-30; });

    alBuls = alBuls.filter(function(b){ return b.x>-20; });
    pBuls  = pBuls.filter(function(b){  return b.x<W+20; });
  }

  /* Shared respawn-shield decay — call every update frame */
  function tickShieldDecay(dt) {
    if (respawnShield>0) {
      respawnShieldDecayT-=dt;
      if (respawnShieldDecayT<=0) {
        respawnShield--; respawnShieldDecayT=3.0; updateHUD();
        if (respawnShield===0) { phaseMsg='SHIELD DOWN!'; phaseMsgT=1.5; }
      }
    }
  }

  function tryDropPow(e) {
    if (Math.random()>0.08) return; /* low drop rate */
    var types   = ['rapid','triple','shield','bomb','laser','life'];
    var weights = [0.30,   0.24,    0.20,    0.04,  0.14,   0.08]; /* bomb 0.08→0.04 */
    var rng = Math.random(), acc=0, chosen='rapid';
    for (var i=0;i<types.length;i++) { acc+=weights[i]; if(rng<acc){ chosen=types[i]; break; } }
    powerups.push({ x:e.x, y:e.y+e.h/2-12, w:24, h:24, type:chosen });
  }

  /* ═══════════════════════════════════════════════════════════════
     GAUNTLET — ASTEROID FIELD
     Asteroids fly right→left in clusters with navigable gaps.
     Player can shoot them to destroy them.
  ═══════════════════════════════════════════════════════════════ */
  function beginGauntlet() {
    phase='gauntlet'; combatPreAst=false;
    /* No resetShip — ship persists. Keep pre-spawned asteroids if any. */
    gauntletT = GAUNT_DUR; gauntletEnding=false; gauntletEndT=0;
    if (!asteroids) asteroids=[];
    astSpawnT = 3.5;   /* start sparse — first cluster after 3.5s */
    /* Message already shown during combat pre-spawn phase */
    running = true;
  }

  function spawnAsteroidCluster() {
    var count    = 3 + Math.floor(Math.random() * 4);
    var baseSpd  = 90 + level * 12;
    var edge     = Math.floor(Math.random() * 3); /* 0=right 1=top 2=bottom */

    for (var i = 0; i < count; i++) {
      var radius   = 9 + Math.random() * 14;
      var spd      = baseSpd + Math.random() * 55;
      /* Sine drift: some asteroids wobble, some go straight */
      var sineAmp  = Math.random() < 0.55 ? H * (0.08 + Math.random() * 0.15) : 0;
      var sineFreq = 0.5 + Math.random() * 1.2;
      var ax, ay, vy;

      if (edge === 0) {
        /* From right — main direction */
        ax = W + 12 + i * (radius * 1.6 + Math.random() * 30);
        ay = radius + Math.random() * (H - radius * 2);
        vy = (Math.random() - 0.5) * spd * 0.5;
      } else if (edge === 1) {
        /* From top edge — diagonal down-left */
        ax = W * 0.3 + Math.random() * W * 0.8 + i * 35;
        ay = -radius - Math.random() * 30;
        vy = spd * (0.4 + Math.random() * 0.4);
        spd *= 0.75; /* slightly slower since traveling diagonally */
      } else {
        /* From bottom edge — diagonal up-left */
        ax = W * 0.3 + Math.random() * W * 0.8 + i * 35;
        ay = H + radius + Math.random() * 30;
        vy = -spd * (0.4 + Math.random() * 0.4);
        spd *= 0.75;
      }
      asteroids.push(makeAst(ax, ay, radius, spd, vy, sineAmp, sineFreq));
    }
  }

  function makeAst(x, y, r, spd, vy, sineAmp, sineFreq) {
    /* Random polygon points for rocky look */
    var pts = [];
    var sides = 7 + Math.floor(Math.random() * 4);
    for (var i = 0; i < sides; i++) {
      var ang = (i / sides) * Math.PI * 2;
      var rr  = r * (0.65 + Math.random() * 0.40);
      pts.push([Math.cos(ang) * rr, Math.sin(ang) * rr]);
    }
    return { x:x, y:y, r:r, pts:pts, spd:spd,
             vy: vy || 0,
             sineAmp: sineAmp || 0,
             sineFreq: sineFreq || 0,
             baseY: y,
             timeAlive: 0,
             hp: Math.max(1, Math.floor(r / 6)),
             rot:Math.random()*Math.PI*2, rotSpd:(Math.random()-0.5)*2.0,
             alive:true };
  }

  /* ── ASTEROID SPLIT & PARTICLES ─────────────────────────────────── */
  /* Large asteroids (r>=16) split into 2-3 smaller ones (rare: ~30%) */
  function splitAst(a) {
    if (a.r < 16 || Math.random() > 0.30) return;
    var count = 2 + (Math.random()<0.25 ? 1 : 0);
    for (var i=0; i<count; i++) {
      var newR = a.r * (0.35 + Math.random()*0.25);
      var angle = Math.random()*Math.PI*2;
      var newSpd = a.spd * (1.4 + Math.random()*0.8);
      var nx = a.x + Math.cos(angle)*a.r*0.6;
      var ny = a.y + Math.sin(angle)*a.r*0.6;
      var frag = makeAst(nx, ny, newR, newSpd, Math.sin(angle)*newSpd*0.5, 0, 0);
      frag.vx = Math.cos(angle)*newSpd; /* override: diagonal burst */
      /* Fragments use their own spd for leftward travel + angle offset */
      frag.spd = newSpd * 0.85;
      frag.vy  = Math.sin(angle) * newSpd * 0.6;
      asteroids.push(frag);
    }
  }

  /* Flash particle on asteroid hit */
  function spawnAstParticle(x, y, r) {
    var n = Math.min(6, Math.round(r / 4));
    for (var i=0; i<n; i++) {
      var ang = Math.random()*Math.PI*2;
      var spd = 60 + Math.random()*80;
      astParticles.push({ x:x, y:y,
        vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd,
        t:0.35+Math.random()*0.2, maxT:0.55,
        r: 2+Math.random()*2 });
    }
  }

  function updateAstParticles(dt) {
    astParticles.forEach(function(p){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.t-=dt; });
    astParticles = astParticles.filter(function(p){ return p.t>0; });
  }

  function drawAstParticles() {
    astParticles.forEach(function(p){
      var alpha = p.t / p.maxT;
      ctx.fillStyle = 'rgba(255,'+(Math.round(160+alpha*80))+',80,'+alpha+')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    });
  }

  function updateGauntlet(dt) {
    if (!running) return;
    if (invTimer>0) invTimer-=dt;
    if (phaseMsgT>0) phaseMsgT-=dt;
    tickShieldDecay(dt);
    moveShip(dt, 4, H-SHIP_H-4, 4, W-SHIP_W-4);
    fireCd-=dt; laserCd-=dt;
    if (laserBeam) { laserBeam.t-=dt; if(laserBeam.t<=0) laserBeam=null; }
    if ((fireHeld||touchFireActive)&&fireCd<=0) fireBullet();
    if (fireHeld||touchFireActive) fireLaser();

    /* Player bullets move right */
    pBuls = pBuls.filter(function(b){ b.x+=PBUL_SPD*dt; return b.x<W+20; });

    /* Power timers */
    if (pows) { ['rapid','triple','laser'].forEach(function(k){ if(pows[k]>0){pows[k]-=dt;if(pows[k]<0)pows[k]=0;updateHUD();} }); }

    /* Countdown — when timer ends, warn player then transition */
    if (!gauntletEnding) {
      gauntletT -= dt;
      if (gauntletT <= 0) {
        gauntletEnding = true;
        gauntletEndT = 3.0;
        astSpawnT = 9999;
        phaseMsg = 'BOSS INCOMING'; phaseMsgT = 3.5;
      }
    } else {
      gauntletEndT -= dt;
      if (gauntletEndT <= 0) {
        beginBoss();
        return;
      }
    }

    /* Spawn scattered asteroids */
    if (!gauntletEnding) {
      astSpawnT -= dt;
      if (astSpawnT <= 0) {
        spawnAsteroidCluster();
        var elapsed = GAUNT_DUR - gauntletT;
        astSpawnT = Math.max(0.9, 3.5 - elapsed*0.08 - level*0.08); /* ramps up over time */
      }
    }

    /* Move + rotate + drift */
    asteroids.forEach(function(a){
      a.timeAlive += dt;
      a.x -= a.spd * dt;
      a.y += a.vy  * dt;
      /* Sine drift overlaid on Y */
      if (a.sineAmp) a.y = (a.baseY + a.vy * a.timeAlive) + Math.sin(a.timeAlive * a.sineFreq) * a.sineAmp;
      a.rot += a.rotSpd * dt;
    });
    asteroids = asteroids.filter(function(a){ return a.alive && a.x+a.r > -20 && a.y > -a.r*3 && a.y < H+a.r*3; });

    /* Laser beam → asteroids */
    if (laserBeam) {
      var beamY = ship.y + SHIP_H/2;
      asteroids.forEach(function(a){
        if (!a.alive) return;
        if (Math.abs(a.y - beamY) < a.r + 6 && a.x > ship.x) {
          a.hp-=3; spawnAstParticle(a.x,a.y,a.r);
          if(a.hp<=0){ a.alive=false; addScore(5); splitAst(a); }
        }
      });
    }
    updateAstParticles(dt);

    /* Gauntlet power-up spawn */
    gauntPowT-=dt;
    if (gauntPowT<=0) {
      gauntPowT=20+Math.random()*10;
      var gpt=['rapid','triple','shield','life','laser'];
      var gw=[0.30,0.25,0.20,0.12,0.13]; var gr2=Math.random(),ga=0,gc='rapid';
      for(var gi=0;gi<gpt.length;gi++){ga+=gw[gi];if(gr2<ga){gc=gpt[gi];break;}}
      powerups.push({x:W+5, y:H*0.15+Math.random()*H*0.70, w:24, h:24, type:gc});
    }

    /* Player bullets → asteroids */
    pBuls.forEach(function(b){
      asteroids.forEach(function(a){
        if (!a.alive) return;
        var dx=b.x-a.x, dy=(b.y+b.h/2)-a.y;
        if (Math.sqrt(dx*dx+dy*dy) < a.r+4) {
          b.x=W+999; a.hp--; spawnAstParticle(a.x,a.y,a.r);
          if (a.hp<=0) { a.alive=false; addScore(5); splitAst(a); }
        }
      });
    });

    /* Ship → asteroid */
    if (invTimer<=0) {
      asteroids.forEach(function(a){
        if (!a.alive) return;
        var sx=ship.x+SHIP_W/2, sy=ship.y+SHIP_H/2;
        if (Math.sqrt((sx-a.x)*(sx-a.x)+(sy-a.y)*(sy-a.y)) < a.r+Math.min(SHIP_W,SHIP_H)*0.4) hitShip();
      });
    }

    /* Remaining combat enemies drift off naturally — no new spawns, just keep moving */
    enemies.forEach(function(e){ if(e.alive) updateEnemy(e,dt); });
    enemies = enemies.filter(function(e){ return e.alive && e.x > -(BMB_W+20); });

    /* Their bullets keep moving too */
    alBuls = alBuls.filter(function(b){
      b.x+=b.vx*dt; b.y+=b.vy*dt;
      return b.x>-20 && b.y>-20 && b.y<H+20;
    });
    /* Enemy bullets still dangerous */
    if (invTimer<=0) {
      alBuls.forEach(function(b){ if(!ovlp(b,ship)) return; b.x=-999; hitShip(); });
      enemies.forEach(function(e){ if(e.alive&&ovlp(e,ship)){ e.alive=false; hitShip(); } });
    }
    /* Power-ups from remaining enemies float left */
    powerups.forEach(function(p){ p.x-=55*dt; });
    powerups = powerups.filter(function(p){ return p.x>-30; });
    powerups.forEach(function(p){
      if(!ovlp(p,ship)) return; p.x=-999;
      if(p.type==='life'){lives=Math.min(lives+1,5);}
      else if(p.type==='shield'){shieldHP=1;}
      else if(p.type==='rapid'){pows.rapid=Math.max(pows.rapid,0)+10;}
      else if(p.type==='triple'){pows.triple=Math.max(pows.triple,0)+12;}
      else if(p.type==='laser'){pows.laser=Math.max(pows.laser,0)+15;}
      updateHUD();
    });
    powerups = powerups.filter(function(p){ return p.x>-30; });
  }

  /* ═══════════════════════════════════════════════════════════════
     BOSS
  ═══════════════════════════════════════════════════════════════ */
  function beginBoss() {
    phase='boss';
    /* No resetShip — ship and powers persist. Asteroids drift off naturally. */
    var btype    = (level-1) % 8;
    var def      = BOSS_DEFS[btype];
    currentBossSpr = BOSS_SPRITES[btype % BOSS_SPRITES.length];
    BOSS_W = currentBossSpr[0].length * SB;
    BOSS_H = currentBossSpr.length    * SB;
    var maxHp = Math.round((55 + level*15) * def.hpM * diff.bossHPM);
    boss = { x:W+BOSS_W, y:H/2-BOSS_H/2, w:BOSS_W, h:BOSS_H,
             hp:maxHp, maxHp:maxHp,
             entered:false, vulnerable:false, vulnerableT:0,
             entryFlashT:1.0,   /* entry-only white flash, independent of vulnerability */
             type:btype, def:def, t0:null,
             /* per-move state */
             chargeState:'wait', chargeTimer:0,
             blinkTimer:0, zigDir:1, spiralAngle:0 };
    stageClearT=0;
    /* Create shield turrets for bosses that need them */
    bossShields=[];
    if (def.shields>0) {
      var sHP = Math.round((12+level*3)*diff.bossHPM);
      for (var i=0;i<def.shields;i++) {
        bossShields.push({ angle:(i/def.shields)*Math.PI*2, orbitR:0, orbitSpd:0.9+i*0.15,
                           hp:sHP, maxHp:sHP, alive:true, r:12, x:0, y:0, w:24, h:24 });
      }
    }
    bossBuls=[]; bossFireT=2.0; bossPhase=0;
    bossEsc=[];
    bossPowSpawnT = 15 + Math.random()*10;
    running=true;
  }

  /* ── BOSS MOVEMENT ───────────────────────────────────────────── */
  function updateBossMovement(dt) {
    if (!boss) return;
    var def = boss.def;
    boss.t0 = boss.t0 || Date.now();
    var tt = (Date.now()-boss.t0)/1000;
    var hpr = boss.hp/boss.maxHp;

    if (def.move==='figure8') {
      boss.y = H/2-BOSS_H/2 + Math.sin(tt*0.9)*H*0.30 + Math.sin(tt*1.8)*H*0.11;
    } else if (def.move==='charge') {
      /* Charges at player, then retreats to right side */
      boss.chargeTimer+=dt;
      if (boss.chargeState==='wait' && boss.chargeTimer>2.5) { boss.chargeState='charging'; boss.chargeTimer=0; }
      else if (boss.chargeState==='charging') {
        boss.x-=220*dt;
        if (boss.x<W*0.28) { boss.chargeState='retreating'; }
      } else if (boss.chargeState==='retreating') {
        boss.x+=120*dt;
        if (boss.x>=W-boss.w-60) { boss.chargeState='wait'; boss.chargeTimer=0; }
      }
      boss.y = H/2-BOSS_H/2 + Math.sin(tt*1.1)*H*0.28;
    } else if (def.move==='orbit') {
      boss.x = W*0.68 + Math.cos(tt*0.55)*W*0.10;
      boss.y = H/2-BOSS_H/2 + Math.sin(tt*0.55)*H*0.35;
    } else if (def.move==='strafe') {
      boss.y = H/2-BOSS_H/2 + Math.sin(tt*1.8)*H*0.38;
    } else if (def.move==='blink') {
      boss.blinkTimer+=dt;
      if (boss.blinkTimer>1.8+Math.random()) {
        boss.blinkTimer=0;
        boss.y = H*0.08 + Math.random()*(H*0.76);
      }
      boss.x = W-boss.w-55 + Math.sin(tt*1.3)*35;
    } else if (def.move==='advance') {
      var targetX = Math.max(W*0.32, ship.x+SHIP_W+100);
      if (boss.x>targetX) boss.x -= 28*dt;
      boss.y = H/2-BOSS_H/2 + Math.sin(tt*1.0)*H*0.26;
    } else if (def.move==='zigzag') {
      boss.y += boss.zigDir*200*dt;
      if (boss.y<8) { boss.zigDir=1; }
      if (boss.y>H-BOSS_H-8) { boss.zigDir=-1; }
      if (boss.x>W*0.40) boss.x-=18*dt;
    } else if (def.move==='sineX') {
      boss.x = W*0.58 + Math.cos(tt*0.5)*W*0.14;
      boss.y = H/2-BOSS_H/2 + Math.sin(tt*0.8)*H*0.36 + Math.sin(tt*1.6)*H*0.08;
    }

    /* Clamp */
    boss.x = Math.max(W*0.22, Math.min(W-boss.w-8, boss.x));
    boss.y = Math.max(8,      Math.min(H-BOSS_H-8, boss.y));
  }

  /* ── BOSS SHIELDS (turrets) ──────────────────────────────────── */
  function updateBossShields(dt) {
    if (!boss || !bossShields.length) return;
    var cx = boss.x+boss.w/2, cy = boss.y+boss.h/2;
    var orbitR = Math.max(boss.w, boss.h)*0.62 + 18;
    var anyAlive=false;
    bossShields.forEach(function(s){
      if (!s.alive) return;
      anyAlive=true;
      s.angle+=s.orbitSpd*dt;
      s.x = cx + Math.cos(s.angle)*orbitR - s.r;
      s.y = cy + Math.sin(s.angle)*orbitR - s.r;
      s.w = s.r*2; s.h = s.r*2;
    });
    /* Boss only vulnerable when all shields destroyed */
    if (bossShields.length>0 && boss.entered) {
      boss.vulnerable = !anyAlive;
    }
  }

  function drawBossShields() {
    bossShields.forEach(function(s){
      if (!s.alive) return;
      var hpr = s.hp/s.maxHp;
      var col = hpr>0.6 ? '#44ccff' : hpr>0.3 ? '#ffdd22' : '#ff4455';
      var cx=s.x+s.r, cy=s.y+s.r;
      /* Glow */
      ctx.beginPath(); ctx.arc(cx,cy,s.r+4,0,Math.PI*2);
      ctx.fillStyle=col.replace('#','rgba(').replace(/(..)(..)(..)/, function(_,r,g,b){
        return parseInt(r,16)+','+parseInt(g,16)+','+parseInt(b,16)+',0.22)'; });
      ctx.fill();
      /* Turret body */
      ctx.beginPath(); ctx.arc(cx,cy,s.r,0,Math.PI*2);
      ctx.fillStyle='#111'; ctx.fill();
      ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.stroke();
      /* HP bar — taller and clearly readable */
      ctx.fillStyle='#222'; ctx.fillRect(cx-s.r, cy+s.r+3, s.r*2, 5);
      ctx.fillStyle=col;    ctx.fillRect(cx-s.r, cy+s.r+3, s.r*2*hpr, 5);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1; ctx.strokeRect(cx-s.r, cy+s.r+3, s.r*2, 5);
    });
  }

  /* ── BOSS FIRE ───────────────────────────────────────────────── */
  function fireBossType(btype) {
    if (!boss) return;
    var BW=9, BH=6;
    var spd = 230+level*20;
    var cx = boss.x, cy = boss.y+boss.h/2;
    var dx = ship.x+SHIP_W/2-cx, dy = ship.y+SHIP_H/2-cy;
    var len = Math.sqrt(dx*dx+dy*dy)||1;
    var hpr = boss.hp/boss.maxHp;

    function pushB(vx,vy,w,h){
      bossBuls.push({x:boss.x-(w||BW), y:boss.y+boss.h/2-(h||BH)/2, vx:vx, vy:vy, w:w||BW, h:h||BH});
    }
    function aimed(mul){ pushB(dx/len*spd*(mul||1), dy/len*spd*(mul||1)); }
    function spread(angles) {
      angles.forEach(function(ang){
        var a=ang*Math.PI/180;
        pushB(dx/len*spd*Math.cos(a)-dy/len*spd*Math.sin(a),
              dx/len*spd*Math.sin(a)+dy/len*spd*Math.cos(a));
      });
    }
    function spiral(arms) {
      boss.spiralAngle=(boss.spiralAngle||0)+(Math.PI*2/arms)*0.4;
      for(var i=0;i<arms;i++) {
        var a=boss.spiralAngle+i*(Math.PI*2/arms);
        pushB(Math.cos(a)*spd*0.85, Math.sin(a)*spd*0.85);
      }
    }
    function rand(n){ for(var i=0;i<n;i++){ var a=Math.random()*Math.PI*2; pushB(Math.cos(a)*spd*0.7,Math.sin(a)*spd*0.7,7,5); } }

    /* Phase 0=full HP, 1=mid, 2=low */
    var ph = hpr>0.65?0:hpr>0.30?1:2;
    bossPhase = ph;

    if (btype===0) { /* Dreadnought: spread, widens with phase */
      if(ph===0) spread([-20,0,20]);
      else if(ph===1) spread([-35,-15,0,15,35]);
      else { spread([-50,-25,0,25,50]); rand(2); }

    } else if (btype===1) { /* Wedge: diagonal + aimed bursts */
      if(ph===0) { aimed(); spread([-60,60]); }
      else if(ph===1) { aimed(); spread([-45,45,-90,90]); }
      else { spread([-30,-15,0,15,30]); rand(3); }

    } else if (btype===2) { /* Ring: spiral, more arms with phase */
      if(ph===0) spiral(3);
      else if(ph===1) { spiral(3); aimed(0.7); }
      else { spiral(4); rand(2); }

    } else if (btype===3) { /* Carrier: twin parallel + burst */
      var off=boss.h*0.3;
      bossBuls.push({x:boss.x-BW,y:boss.y+boss.h/2-off-BH/2,vx:dx/len*spd,vy:dy/len*spd,w:BW,h:BH});
      bossBuls.push({x:boss.x-BW,y:boss.y+boss.h/2+off-BH/2,vx:dx/len*spd,vy:dy/len*spd,w:BW,h:BH});
      if(ph>=1) { spread([-25,25]); }
      if(ph>=2) rand(3);

    } else if (btype===4) { /* Stealth: fast aimed + random */
      aimed(1.3); aimed(1.3);
      if(ph>=1) { rand(2); spread([-40,40]); }
      if(ph>=2) { rand(4); }

    } else if (btype===5) { /* Siege: rain from top+bottom edges + aimed */
      var ys=[boss.y+4, boss.y+boss.h-4];
      ys.forEach(function(by){
        var dy2=ship.y+SHIP_H/2-by, dx2=ship.x-boss.x, l2=Math.sqrt(dx2*dx2+dy2*dy2)||1;
        bossBuls.push({x:boss.x,y:by,vx:dx2/l2*spd,vy:dy2/l2*spd,w:BW,h:BH});
      });
      if(ph>=1) { aimed(); spread([-20,20]); }
      if(ph>=2) { for(var i=0;i<3;i++) bossBuls.push({x:boss.x,y:boss.y+Math.random()*boss.h,vx:-spd*0.9,vy:(Math.random()-0.5)*spd*0.5,w:BW,h:BH}); }

    } else if (btype===6) { /* Twin Core: zigzag fast spread */
      spread([-15,0,15]);
      if(ph>=1) { spread([-45,45]); aimed(0.8); }
      if(ph>=2) { spiral(3); rand(3); }

    } else { /* Mothership: combo everything */
      spiral(4);
      spread([-30,0,30]);
      if(ph>=1) { aimed(); rand(3); }
      if(ph>=2) { spread([-60,-30,0,30,60]); rand(4); }
    }
  }

  /* ── UPDATE BOSS ─────────────────────────────────────────────── */
  function updateBoss(dt) {
    if (!running) return;
    if (invTimer>0) invTimer-=dt;
    if (phaseMsgT>0) phaseMsgT-=dt;
    tickShieldDecay(dt);
    /* Stage-clear countdown after boss defeated */
    if (stageClearT>0) {
      stageClearT-=dt;
      if (stageClearT<=0) { beginCombat(); return; }
    }
    moveShip(dt, 4, H-SHIP_H-4, 4, W-SHIP_W-4);
    fireCd-=dt; laserCd-=dt;
    if (laserBeam) { laserBeam.t-=dt; if(laserBeam.t<=0) laserBeam=null; }
    if ((fireHeld||touchFireActive)&&fireCd<=0) fireBullet();
    if (fireHeld||touchFireActive) fireLaser();
    pBuls=pBuls.filter(function(b){ b.x+=PBUL_SPD*dt; return b.x<W+20; });
    if (pows) { ['rapid','triple','laser'].forEach(function(k){ if(pows[k]>0){pows[k]-=dt;if(pows[k]<0)pows[k]=0;updateHUD();} }); }

    /* Remaining asteroids drift — fully interactive */
    if (asteroids && asteroids.length>0) {
      asteroids.forEach(function(a){ a.timeAlive+=dt; a.x-=a.spd*dt; a.y+=a.vy*dt; if(a.sineAmp) a.y=(a.baseY+a.vy*a.timeAlive)+Math.sin(a.timeAlive*a.sineFreq)*a.sineAmp; a.rot+=a.rotSpd*dt; });
      asteroids=asteroids.filter(function(a){ return a.alive&&a.x+a.r>-20&&a.y>-a.r*3&&a.y<H+a.r*3; });
      /* Player bullets → asteroids */
      pBuls.forEach(function(b){
        asteroids.forEach(function(a){
          if (!a.alive) return;
          var dx=b.x-a.x, dy=(b.y+b.h/2)-a.y;
          if (Math.sqrt(dx*dx+dy*dy)<a.r+4){ b.x=W+999; a.hp--; spawnAstParticle(a.x,a.y,a.r); if(a.hp<=0){a.alive=false;addScore(5);splitAst(a);} }
        });
      });
      if (invTimer<=0) asteroids.forEach(function(a){ if(!a.alive)return; var sx=ship.x+SHIP_W/2,sy=ship.y+SHIP_H/2; if(Math.sqrt((sx-a.x)*(sx-a.x)+(sy-a.y)*(sy-a.y))<a.r+Math.min(SHIP_W,SHIP_H)*0.4) hitShip(); });
    }
    /* Particle update */
    updateAstParticles(dt);

    /* Random power-up drift in from right */
    bossPowSpawnT-=dt;
    if (bossPowSpawnT<=0) {
      bossPowSpawnT = 16+Math.random()*12;
      var bpt=['rapid','triple','shield','life'];
      powerups.push({x:W+5, y:H*0.15+Math.random()*H*0.70, w:24, h:24, type:bpt[Math.floor(Math.random()*bpt.length)]});
    }
    /* Power-ups drift left */
    powerups.forEach(function(p){ p.x-=55*dt; });
    powerups=powerups.filter(function(p){ return p.x>-30; });

    if (!boss) return;

    /* Boss entrance */
    if (boss.entryFlashT>0) boss.entryFlashT-=dt;
    if (!boss.entered) {
      boss.x -= 85*dt;
      if (boss.x<=W-boss.w-55) {
        boss.entered=true; boss.vulnerableT=0.7;
        if (boss.def.shields===0) boss.vulnerable=false;
      }
    } else {
      if (!boss.vulnerable && boss.def.shields===0) {
        boss.vulnerableT-=dt;
        if (boss.vulnerableT<=0) boss.vulnerable=true;
      }
      updateBossMovement(dt);
      updateBossShields(dt);
    }

    /* Boss fire */
    var hpr=boss.hp/boss.maxHp;
    bossFireT-=dt;
    var cd=Math.max(0.20, boss.def.fireCD-(1-hpr)*boss.def.fireCD*0.55);
    if (bossFireT<=0 && boss.entered && boss.vulnerable) {
      bossFireT=cd; fireBossType(boss.type);
    }

    /* Escorts — type and count from def, appear from phase 0 */
    var escType=boss.def.escort, escMax=boss.def.escMax+(bossPhase>=1?1:0);
    if (bossEsc.length<escMax && Math.random()<dt*(0.35+bossPhase*0.2)) {
      bossEsc.push(makeEnemy(escType, boss.x, boss.y+Math.random()*boss.h,
                             escType==='bomber'?-50:-80, 0, 'sine',
                             {amp:H*0.20, freq:1.2+Math.random()*0.8}));
    }
    bossEsc.forEach(function(e){ if(e.alive) updateEnemy(e,dt); });
    bossEsc=bossEsc.filter(function(e){ return e.alive&&e.x>-(ELT_W+20); });

    /* Lingering combat/gauntlet enemies drift off — no new spawns, no new fire */
    if (enemies && enemies.length>0) {
      enemies.forEach(function(e){ if(e.alive){ e.x+=e.vx*dt; e.y+=e.vy*dt; } });
      enemies=enemies.filter(function(e){ return e.alive&&e.x>-(BMB_W+20)&&e.y>-BMB_H-20&&e.y<H+BMB_H+20; });
    }

    /* Move all alien bullets (escorts + lingering) */
    alBuls=alBuls.filter(function(b){ b.x+=b.vx*dt; b.y+=b.vy*dt; return b.x>-20&&b.y>-20&&b.y<H+20; });

    /* Boss bullets */
    bossBuls=bossBuls.filter(function(b){ b.x+=b.vx*dt; b.y+=b.vy*dt; return b.x>-20&&b.y>-20&&b.y<H+20; });

    /* Collisions */
    if (invTimer<=0) {
      bossBuls.forEach(function(b){ if(!ovlp(b,ship))return; b.x=-9999; hitShip(); });
      alBuls.forEach(function(b){ if(!ovlp(b,ship))return; b.x=-9999; hitShip(); });
      bossEsc.forEach(function(e){ if(e.alive&&ovlp(e,ship)){e.alive=false;hitShip();} });
      if (boss && ovlp(boss,ship)) hitShip(); /* boss collision damage */
    }

    /* Player bullets → shield turrets */
    pBuls.forEach(function(b){
      bossShields.forEach(function(s){
        if(!s.alive)return;
        var dx=b.x-(s.x+s.r),dy=(b.y+b.h/2)-(s.y+s.r);
        if(Math.sqrt(dx*dx+dy*dy)<s.r+4){ b.x=W+999; s.hp--; if(s.hp<=0){s.alive=false;addScore(80);} }
      });
    });

    /* Player bullets → escorts */
    pBuls.forEach(function(b){
      bossEsc.forEach(function(e){ if(e.alive&&ovlp(b,e)){b.x=W+999;e.hp--;if(e.hp<=0){e.alive=false;addScore(40);}} });
    });

    /* Player/laser → boss (only when vulnerable) */
    pBuls.forEach(function(b){
      if(!boss||!boss.vulnerable||!ovlp(b,boss))return;
      b.x=W+999; boss.hp--; addScore(18);
      if(boss.hp<=0) bossDefeated();
    });
    pBuls=pBuls.filter(function(b){ return b.x<W; });

    /* Power-up pickup */
    powerups.forEach(function(p){
      if(!ovlp(p,ship))return; p.x=-999;
      if(p.type==='life'){lives=Math.min(lives+1,5);}
      else if(p.type==='shield'){shieldHP=1;}
      else if(p.type==='rapid'){pows.rapid=Math.max(pows.rapid,0)+10;}
      else if(p.type==='triple'){pows.triple=Math.max(pows.triple,0)+12;}
      else if(p.type==='laser'){pows.laser=Math.max(pows.laser,0)+15;}
      updateHUD();
    });
    powerups=powerups.filter(function(p){return p.x>-30;});
  }

  function bossDefeated() {
    addScore(800+level*200); lives=Math.min(lives+1,5); updateHUD();
    level++; boss=null; bossShields=[]; bossBuls=[];
    stageClearT=3.2;
    phaseMsg='BOSS DEFEATED!|STAGE '+level+'   +1 LIFE';
    phaseMsgT=3.2;
  }

  /* ═══════════════════════════════════════════════════════════════
     TRANSITION
  ═══════════════════════════════════════════════════════════════ */
  function updateTrans(dt) { transTimer-=dt; if(transTimer<=0){running=true;transNext();} }

  /* ═══════════════════════════════════════════════════════════════
     SHIP HELPERS
  ═══════════════════════════════════════════════════════════════ */
  function moveShip(dt, yMin, yMax, xMin, xMax) {
    var spd=SHIP_SPD;
    if (keys['ArrowLeft'] ||keys['a']) ship.x-=spd*dt;
    if (keys['ArrowRight']||keys['d']) ship.x+=spd*dt;
    if (keys['ArrowUp']   ||keys['w']) ship.y-=spd*dt;
    if (keys['ArrowDown'] ||keys['s']) ship.y+=spd*dt;
    ship.x=Math.max(xMin,Math.min(xMax,ship.x));
    ship.y=Math.max(yMin,Math.min(yMax,ship.y));
  }

  function fireBullet() {
    var isRapid  = pows && pows.rapid>0;
    var isTriple = pows && pows.triple>0;
    var cd = isRapid ? BASE_FCD*0.22 : BASE_FCD;
    if (fireCd>0) return;
    fireCd=cd;
    var bx=ship.x+SHIP_W, by=ship.y+SHIP_H/2-2;
    pBuls.push({x:bx,y:by,w:14,h:4});
    if (isTriple) {
      pBuls.push({x:bx,y:by-10,w:12,h:3,vyOff:-30});
      pBuls.push({x:bx,y:by+10,w:12,h:3,vyOff:30});
    }
  }

  function fireLaser() {
    if (!pows || pows.laser<=0) return;
    if (laserCd>0) return;
    laserCd = 1.8;
    laserBeam = { t: 0.22 };
    /* Instant damage to all enemies in beam path */
    var beamY = ship.y + SHIP_H/2;
    var beamX = ship.x + SHIP_W;
    enemies.forEach(function(e){
      if (!e.alive) return;
      if (Math.abs(e.y + e.h/2 - beamY) < e.h/2 + 6) {
        e.hp -= 3; addScore(2);
        if (e.hp<=0) { e.alive=false; addScore(e.pts); tryDropPow(e); }
      }
    });
    if (bossEsc) bossEsc.forEach(function(e){
      if (!e.alive) return;
      if (Math.abs(e.y + e.h/2 - beamY) < e.h/2 + 6) { e.hp-=3; if(e.hp<=0){e.alive=false;addScore(25);} }
    });
    if (boss && boss.vulnerable && boss.x < W) {
      if (Math.abs(boss.y + boss.h/2 - beamY) < boss.h/2 + 8) { boss.hp-=2; addScore(10); }
    }
  }

  function hitShip() {
    if (invTimer>0) return;
    /* Priority: power-up shield → respawn shield → lose life */
    if (shieldHP>0) {
      shieldHP=0; invTimer=0.5; updateHUD(); return;
    }
    if (respawnShield>0) {
      respawnShield--; invTimer=0.3; updateHUD();
      if (respawnShield===0) { phaseMsg='SHIELD DOWN!'; phaseMsgT=1.5; }
      return;
    }
    lives--; invTimer=INV_TIME; updateHUD();
    if (lives>0) {
      respawnShield=10;
      phaseMsg=lives+' LIFE'+(lives===1?'':'S')+' LEFT'; phaseMsgT=2.2;
    }
    if (lives<=0) { running=false; phase='gameover'; }
  }

  /* ═══════════════════════════════════════════════════════════════
     MAIN LOOP
  ═══════════════════════════════════════════════════════════════ */
  function loop(now) {
    if (!overlay.classList.contains('is-open')) return;
    animId=requestAnimationFrame(loop);
    var dt=Math.min((now-prevT)/1000, 0.05); prevT=now;
    if (!paused) {
      if (phase==='combat')   updateCombat(dt);
      if (phase==='gauntlet') updateGauntlet(dt);
      if (phase==='boss')     updateBoss(dt);
      if (phase==='trans')    updateTrans(dt);
    }
    /* Triple bullets also need vy offset applied */
    if (pBuls) pBuls.forEach(function(b){ if(b.vyOff){ b.y+=b.vyOff*0.016; } });
    draw();
  }

  /* ═══════════════════════════════════════════════════════════════
     DRAW
  ═══════════════════════════════════════════════════════════════ */
  function draw() {
    ctx.fillStyle=C.bg; ctx.fillRect(0,0,W,H);
    if (phase==='combat')   drawCombat();
    if (phase==='gauntlet') drawGauntlet();
    if (phase==='boss')     drawBoss();
    if (phase==='trans')    drawTrans();
    if (phase==='waiting')  drawWaiting();
    if (phase==='gameover') drawGameOver();
    if (paused&&phase!=='gameover') drawPaused();
  }

  function drawShip() {
    var flash = invTimer>0 && Math.floor(Date.now()/80)%2===0;
    if (flash) return;

    /* Respawn shield ring — color shifts by HP */
    if (respawnShield>0) {
      var rCol = respawnShield>=8 ? '#44aaff' : respawnShield>=4 ? '#ffdd00' : '#ff4455';
      var rAlpha = 0.55 + 0.25*Math.sin(Date.now()/160);
      var rr = Math.max(SHIP_W, SHIP_H) * 0.7;
      ctx.beginPath();
      ctx.arc(ship.x+SHIP_W/2, ship.y+SHIP_H/2, rr, 0, Math.PI*2);
      ctx.strokeStyle = rCol.replace('#','rgba(').replace(/(..)(..)(..)/, function(_,r,g,b){
        return parseInt(r,16)+','+parseInt(g,16)+','+parseInt(b,16)+','+rAlpha+')';
      });
      /* Simpler: just set rgba directly */
      ctx.strokeStyle = respawnShield>=8 ? 'rgba(68,170,255,'+rAlpha+')' :
                        respawnShield>=4 ? 'rgba(255,221,0,'+rAlpha+')' :
                                          'rgba(255,68,85,'+rAlpha+')';
      ctx.lineWidth = 2.5; ctx.stroke();
      /* HP number above ship */
      ctx.fillStyle = respawnShield>=8 ? '#44aaff' : respawnShield>=4 ? '#ffdd00' : '#ff4455';
      ctx.font = 'bold 8px "Press Start 2P",monospace';
      ctx.textAlign = 'center';
      ctx.fillText(respawnShield, ship.x+SHIP_W/2, ship.y-5);
      ctx.textAlign = 'center';
    }

    /* Power-up shield ring */
    if (shieldHP>0) {
      ctx.beginPath();
      ctx.arc(ship.x+SHIP_W/2, ship.y+SHIP_H/2, Math.max(SHIP_W,SHIP_H)*0.85, 0, Math.PI*2);
      ctx.strokeStyle='rgba(68,153,255,0.8)'; ctx.lineWidth=3; ctx.stroke();
    }

    drawSpr(SPR_SHIP, ship.x, ship.y, C.ship, SS);
    /* Engine glow — two pods at left edge (back) */
    ctx.fillStyle=C.shipEng;
    ctx.fillRect(ship.x, ship.y+Math.floor(SHIP_H*0.1), SS, SS);
    ctx.fillRect(ship.x, ship.y+Math.floor(SHIP_H*0.75), SS, SS);
    /* Cockpit highlight */
    ctx.fillStyle='rgba(0,220,255,0.65)';
    ctx.fillRect(ship.x+Math.floor(SHIP_W*0.55), ship.y+Math.floor(SHIP_H*0.38), SS, SS);
  }

  function drawBullets() {
    pBuls.forEach(function(b){
      ctx.fillStyle = (pows&&pows.triple>0) ? C.triB : C.bullet;
      ctx.fillRect(b.x,b.y,b.w,b.h);
    });
  }

  function drawEnemies(list) {
    list.forEach(function(e){
      if (!e.alive) return;
      var col, spr;
      if (e.type==='fighter'){ col=C.fighter; spr=SPR_FIGHTER; }
      else if(e.type==='bomber'){col=C.bomber;spr=SPR_BOMBER;}
      else if(e.type==='elite'){col=C.elite;spr=SPR_ELITE;}
      else{col=C.drone;spr=SPR_DRONE;}
      drawSpr(spr, e.x, e.y, col, SE);
      /* HP bar for bombers/elites */
      if (e.maxHp>1) {
        ctx.fillStyle='#333'; ctx.fillRect(e.x,e.y-5,e.w,3);
        ctx.fillStyle=col;    ctx.fillRect(e.x,e.y-5,e.w*(e.hp/e.maxHp),3);
      }
    });
  }

  function drawAlBuls() {
    ctx.fillStyle='#ff4455';
    alBuls.forEach(function(b){ ctx.fillRect(b.x,b.y,b.w,b.h); });
  }

  function drawBlackholes() {
    blackholes.forEach(function(bh){
      /* Core */
      ctx.beginPath(); ctx.arc(bh.x,bh.y,bh.r*0.32,0,Math.PI*2);
      ctx.fillStyle=C.bhInner; ctx.fill();
      /* Rings */
      for(var i=3;i>=0;i--){
        var rr=bh.r*(0.32+i*0.20), alpha=0.8-i*0.16;
        ctx.beginPath(); ctx.arc(bh.x,bh.y,rr,0,Math.PI*2);
        ctx.strokeStyle='rgba('+(170-i*35)+',0,'+(255-i*25)+','+alpha+')';
        ctx.lineWidth=2.5-i*0.4; ctx.stroke();
      }
      /* Rotating accretion disk line */
      ctx.save(); ctx.translate(bh.x,bh.y); ctx.rotate(bh.spin);
      ctx.strokeStyle='rgba(180,0,255,0.35)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.ellipse(0,0,bh.r*1.3,bh.r*0.45,0,0,Math.PI*2);
      ctx.stroke(); ctx.restore();
    });
  }

  function drawPowerups() {
    var pw=p_W||24, ph=p_H||24;
    powerups.forEach(function(p){
      var col = p.type==='rapid' ? C.pwRapid  :
                p.type==='triple'? C.pwTriple :
                p.type==='shield'? C.pwShield :
                p.type==='laser' ? C.pwLaser  :
                p.type==='life'  ? C.pwLife   : C.pwBomb;
      var lbl = p.type==='rapid' ?'RPD':p.type==='triple'?'TRI':
                p.type==='shield'?'SHD':p.type==='laser' ?'LZR':
                p.type==='life'  ?'\u2665\u2665' :'BOM';
      var pulse = 0.6 + 0.4*Math.sin(Date.now()/200);
      /* Glow halo */
      ctx.fillStyle = col+'44';
      ctx.fillRect(p.x-4, p.y-4, p.w+8, p.h+8);
      /* Dark background */
      ctx.fillStyle = '#000';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      /* Bright border */
      ctx.strokeStyle = col;
      ctx.lineWidth = 2 + pulse*0.8;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      /* Label */
      ctx.fillStyle = col;
      ctx.font = 'bold 7px "Press Start 2P",monospace';
      ctx.textAlign = 'center';
      ctx.fillText(lbl, p.x+p.w/2, p.y+p.h*0.67);
      ctx.textAlign = 'center';
    });
  }
  var p_W = 24, p_H = 24; /* power-up draw size (collision box set in tryDropPow) */

  function drawLabel(lbl) { t(lbl,7,C.textFade,W-6,14,'right'); }

  function drawAsteroids() {
    if (!asteroids) return;
    asteroids.forEach(function(a){
      if (!a.alive) return;
      var maxHp = Math.max(1, Math.floor(a.r / 6));
      var dmgRatio = 1 - (a.hp / maxHp);
      var gr = Math.round(150 - dmgRatio * 100);
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      ctx.beginPath();
      ctx.moveTo(a.pts[0][0], a.pts[0][1]);
      for (var i=1; i<a.pts.length; i++) ctx.lineTo(a.pts[i][0], a.pts[i][1]);
      ctx.closePath();
      ctx.fillStyle = 'rgb('+gr+','+Math.round(gr*0.75)+','+Math.round(gr*0.55)+')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,160,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    });
  }

  /* Non-blocking phase message overlay — supports 2 lines with "|" separator */
  function drawPhaseMsg() {
    if (!phaseMsgT || phaseMsgT <= 0) return;
    var alpha = Math.min(1.0, phaseMsgT > 0.5 ? 1.0 : phaseMsgT / 0.5);
    ctx.fillStyle = 'rgba(0,0,0,'+(alpha*0.50)+')';
    ctx.fillRect(0, 0, W, H);
    var pulse = 0.78 + 0.22*Math.sin(Date.now()/150);
    var parts = phaseMsg.split('|');
    if (parts.length > 1) {
      t(parts[0], 16, 'rgba(255,80,80,'+(alpha*pulse)+')', W/2, H/2-12);
      t(parts[1],  9, 'rgba(255,255,255,'+alpha+')',       W/2, H/2+14);
    } else {
      t(phaseMsg, 14, 'rgba(255,80,80,'+(alpha*pulse)+')', W/2, H/2);
    }
  }

  function drawCombat() {
    if (combatPreAst) { drawAsteroids(); drawAstParticles(); }
    drawBlackholes(); drawAlBuls(); drawPowerups();
    drawEnemies(enemies); drawBullets(); drawLaserBeam(); drawShip();
    drawLabel('STAGE '+level+'  '+diff.label);
    drawPhaseMsg();
  }

  function drawGauntlet() {
    drawAsteroids(); drawAstParticles();
    drawAlBuls(); drawPowerups();
    drawEnemies(enemies);
    drawBullets(); drawLaserBeam(); drawShip();

    drawLabel('STAGE '+level+'  ASTEROID FIELD  ' + (gauntletEnding ? '' : Math.ceil(Math.max(0, gauntletT)) + 's'));
    drawPhaseMsg();
  }

  function drawBoss() {
    /* Remaining asteroids still visible in background */
    drawAsteroids(); drawAstParticles();
    drawAlBuls(); drawPowerups();
    drawEnemies(enemies);   /* lingering enemies drift off */
    drawEnemies(bossEsc);

    if (boss) {
      var hpr=boss.hp/boss.maxHp;
      var col=hpr>0.65?C.boss:hpr>0.30?C.bossP2:C.bossP3;
      /* Entry flash — white only during first ~1s, then real color always */
      var drawCol = (boss.entryFlashT>0) ? 'rgba(255,255,255,'+(boss.entryFlashT/1.0*0.7)+')' : col;
      drawSpr(currentBossSpr, boss.x, boss.y, drawCol, SB);
      /* Phase 3 glow */
      if (bossPhase>=2 && Math.floor(Date.now()/100)%2===0) {
        drawSpr(currentBossSpr, boss.x, boss.y, 'rgba(255,0,0,0.25)', SB);
      }
      /* HP bar — when vulnerable */
      if (boss.vulnerable) {
        ctx.fillStyle='#220008'; ctx.fillRect(boss.x,boss.y-14,boss.w,7);
        ctx.fillStyle=col; ctx.fillRect(boss.x,boss.y-14,boss.w*hpr,7);
        ctx.strokeStyle='rgba(255,100,100,0.6)'; ctx.lineWidth=1; ctx.strokeRect(boss.x,boss.y-14,boss.w,7);
      }
      /* Shield count — shown while any shields alive */
      var aliveShields = bossShields.filter(function(s){ return s.alive; }).length;
      if (aliveShields>0) {
        t('SHIELDS: '+aliveShields, 8, '#44ccff', boss.x+boss.w/2, boss.y-20);
      }
    }

    ctx.fillStyle='#ff3344';
    bossBuls.forEach(function(b){ ctx.fillRect(b.x,b.y,b.w,b.h); });
    drawBullets(); drawLaserBeam(); drawShip();
    drawLabel('STAGE '+level+' ['+(bossPhase===0?'I':bossPhase===1?'II':'III')+']');
    drawPhaseMsg();
  }

  /* ── SCREENS ─────────────────────────────────────────────────── */
  function drawWaiting() {
    ctx.fillStyle='rgba(0,0,0,0.88)'; ctx.fillRect(0,0,W,H);
    t('SPACE INVADERS',                    18, C.textDim,  W/2, H/2-60);
    t((diff?diff.label:'NORMAL')+' MODE', 10, C.textFade, W/2, H/2-32);
    if (IS_TOUCH) {
      t('DRAG LEFT : MOVE',   11, C.textMain, W/2, H/2+4);
      t('HOLD RIGHT: FIRE',   11, C.textMain, W/2, H/2+24);
      t('TAP TO START',       14, C.textDim,  W/2, H/2+56);
    } else {
      t('ARROWS / WASD : MOVE', 10, C.textMain, W/2, H/2+4);
      t('SPACE HOLD    : FIRE', 10, C.textMain, W/2, H/2+24);
      t('P: PAUSE   ESC: EXIT',  8, C.textFade, W/2, H/2+44);
      t('PRESS ANY KEY',         14, C.textDim,  W/2, H/2+68);
    }
  }
  function drawTrans() {
    ctx.fillStyle='rgba(0,0,0,0.84)'; ctx.fillRect(0,0,W,H);
    t(transMsg, 12, C.textDim, W/2, H/2);
  }
  function drawPaused() {
    ctx.fillStyle='rgba(0,0,0,0.80)'; ctx.fillRect(0,0,W,H);
    t('PAUSED',      14, C.textMain, W/2, H/2-10);
    t('P TO RESUME',  9, C.textDim,  W/2, H/2+16);
  }
  function drawGameOver() {
    ctx.fillStyle=C.overlay; ctx.fillRect(0,0,W,H);
    t('GAME OVER',      20, C.fighter,  W/2, H/2-52);
    t('SCORE  '+score,  12, C.textMain, W/2, H/2-16);
    t('BEST   '+hiScore, 9, C.textFade, W/2, H/2+8);
    t('R : PLAY AGAIN', 11, C.textDim,  W/2, H/2+36);
    t('ESC : EXIT',      9, C.textFade, W/2, H/2+58);
  }

  function drawLaserBeam() {
    if (!laserBeam) return;
    var bx = ship.x + SHIP_W;
    var by = ship.y + SHIP_H/2;
    var alpha = laserBeam.t / 0.22;
    /* Glow */
    ctx.strokeStyle = 'rgba(255,100,255,'+(alpha*0.4)+')';
    ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(W,by); ctx.stroke();
    /* Core */
    ctx.strokeStyle = 'rgba(255,200,255,'+(alpha*0.9)+')';
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(W,by); ctx.stroke();
    /* Bright center */
    ctx.strokeStyle = 'rgba(255,255,255,'+alpha+')';
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(W,by); ctx.stroke();
  }

  /* ═══════════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════════ */
  function ovlp(a,b) {
    return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
  }
  function rcDist(r,c) { return ptDist(r.x+r.w/2,r.y+r.h/2,c.x,c.y); }
  function ptDist(ax,ay,bx,by) { return Math.sqrt((ax-bx)*(ax-bx)+(ay-by)*(ay-by)); }
  function ptSegDist(px,py,ax,ay,bx,by) {
    var dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy;
    if(!len2) return ptDist(px,py,ax,ay);
    var t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/len2));
    return ptDist(px,py,ax+t*dx,ay+t*dy);
  }

  /* ═══════════════════════════════════════════════════════════════
     INPUT — KEYBOARD
  ═══════════════════════════════════════════════════════════════ */
  function onKey(e) {
    var down = e.type==='keydown';
    if (e.key==='Escape') { closeGame(); return; }

    if (modeSelectEl.style.display!=='none' && down) {
      if (e.key==='ArrowLeft' ||e.key==='a'||e.key==='A') { diffIdx=(diffIdx+2)%3; syncBtns(); e.preventDefault(); return; }
      if (e.key==='ArrowRight'||e.key==='d'||e.key==='D') { diffIdx=(diffIdx+1)%3; syncBtns(); e.preventDefault(); return; }
      if (e.key==='Enter'||e.key===' ')                   { e.preventDefault(); confirmMode(); return; }
      return;
    }
    if (phase==='waiting'&&down)           { phase='combat'; waiting=false; running=true; beginCombat(); return; }
    if (phase==='gameover'&&down&&(e.key==='r'||e.key==='R')) { initGame(); return; }
    if ((e.key==='p'||e.key==='P')&&down&&phase!=='gameover'&&phase!=='waiting') { e.preventDefault(); togglePause(); return; }

    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key)!==-1) e.preventDefault();
    if (e.key===' ') { fireHeld=down; return; }
    keys[e.key]=down;
  }

  function togglePause() { paused=!paused; if(!paused) prevT=performance.now(); }

  /* ═══════════════════════════════════════════════════════════════
     INPUT — TOUCH
  ═══════════════════════════════════════════════════════════════ */
  function attachTouch() {
    var rect, leftId=null, lastTX=0, lastTY=0;
    function gr() { return canvas.getBoundingClientRect(); }

    canvas.addEventListener('touchstart', function(e){
      e.preventDefault();
      rect=gr(); var scX=W/rect.width, scY=H/rect.height;
      if (phase==='waiting'){phase='combat';waiting=false;running=true;beginCombat();return;}
      if (phase==='gameover'){initGame();return;}
      Array.from(e.changedTouches).forEach(function(tc){
        var cx=(tc.clientX-rect.left)*scX, cy=(tc.clientY-rect.top)*scY;
        if (cx<W/2) { leftId=tc.identifier; lastTX=cx; lastTY=cy; }
        else { touchFireActive=true; }
      });
    }, {passive:false});

    canvas.addEventListener('touchmove', function(e){
      e.preventDefault();
      rect=gr(); var scX=W/rect.width, scY=H/rect.height;
      Array.from(e.changedTouches).forEach(function(tc){
        if (tc.identifier!==leftId) return;
        var cx=(tc.clientX-rect.left)*scX, cy=(tc.clientY-rect.top)*scY;
        var dx=(cx-lastTX)*1.3, dy=(cy-lastTY)*1.3;
        ship.x=Math.max(4,Math.min(W-SHIP_W-4, ship.x+dx));
        ship.y=Math.max(4,Math.min(H-SHIP_H-4, ship.y+dy));
        lastTX=cx; lastTY=cy;
      });
    }, {passive:false});

    canvas.addEventListener('touchend', function(e){
      e.preventDefault();
      Array.from(e.changedTouches).forEach(function(tc){
        if (tc.identifier===leftId) leftId=null;
        /* Check if right half was released */
        var rect2=gr(), cx=(tc.clientX-rect2.left)*(W/rect2.width);
        if (cx>=W/2) touchFireActive=false;
      });
    }, {passive:false});

    canvas.addEventListener('touchcancel', function(e){
      e.preventDefault(); leftId=null; touchFireActive=false;
    }, {passive:false});
  }

  /* ═══════════════════════════════════════════════════════════════
     OPEN / CLOSE
  ═══════════════════════════════════════════════════════════════ */
  function openGame() {
    if (window.innerWidth<768) return;
    layout();
    /* Init all state so loop never crashes on undefined vars */
    score=0; lives=LIVES_MAX; level=1; paused=false;
    phase='';
    invTimer=0; pows={rapid:0,triple:0,laser:0}; shieldHP=0; respawnShield=0; respawnShieldDecayT=3;
    laserBeam=null; laserCd=0;
    phaseMsg=''; phaseMsgT=0; combatPreAst=false;
    stageClearT=0; gauntPowT=22+Math.random()*8; astParticles=[];
    bossShields=[]; bossPowSpawnT=18;
    currentBossSpr=BOSS_SPRITES[0];
    pBuls=[]; alBuls=[]; enemies=[]; powerups=[]; blackholes=[]; asteroids=[];
    boss=null; bossBuls=[]; bossEsc=[];
    keys={}; fireHeld=false; touchFireActive=false;
    if (ctx) ctx.clearRect(0, 0, W, H);
    hiScore=parseInt(localStorage.getItem(LS_KEY)||'0',10)||0;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('game-open');
    document.addEventListener('keydown',onKey);
    document.addEventListener('keyup',  onKey);
    if (IS_TOUCH) attachTouch();
    showMode();
    prevT=performance.now();
    requestAnimationFrame(loop);
  }

  function closeGame() {
    running=false; cancelAnimationFrame(animId);
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('game-open');
    document.body.classList.remove('game-canvas-hover');
    document.removeEventListener('keydown',onKey);
    document.removeEventListener('keyup',  onKey);
    keys={}; fireHeld=false; touchFireActive=false;
  }

  /* ── TRIGGER ─────────────────────────────────────────────────── */
  function attachTrigger() {
    var el=document.getElementById('navIcons');
    if (!el) return;
    el.style.pointerEvents='auto'; el.style.cursor='pointer';
    el.addEventListener('click', function(){
      if (window.innerWidth<768) return;
      openGame();
    });
  }

  /* ── INIT ────────────────────────────────────────────────────── */
  function init() {
    if (window.innerWidth<768) return;
    keys={}; build();
    modeBtns.forEach(function(btn,i){
      btn.addEventListener('click', function(){diffIdx=i;confirmMode();});
      btn.addEventListener('touchstart',function(e){e.preventDefault();diffIdx=i;confirmMode();},{passive:false});
    });
    pauseBtn.addEventListener('click', function(){ if(phase!=='gameover'&&phase!=='waiting') togglePause(); });
    var siWrap = document.getElementById('siWrap');
    if (siWrap) {
      siWrap.addEventListener('mouseenter', function(){ document.body.classList.add('game-canvas-hover'); });
      siWrap.addEventListener('mouseleave', function(){ document.body.classList.remove('game-canvas-hover'); });
    }
    document.getElementById('siClose').addEventListener('click', closeGame);
    window.addEventListener('resize', function(){
      if(!overlay.classList.contains('is-open')) return;
      if(window.innerWidth<768){closeGame();return;}
      layout();
    });
    attachTrigger();
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();

})();
