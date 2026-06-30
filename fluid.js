/**
 * FLUID.JS — WebGL Fluid Simulation
 * Reference: PavelDoGreat/WebGL-Fluid-Simulation (MIT)
 *
 * Gray blob overlay on bgCanvas sepia-topo background.
 * Public API: window.FluidSim.splat(x, y, dx, dy)
 */
(function () {
  'use strict';

  /* ── CONFIG ── */
  var CFG = {
    SIM_RESOLUTION      : 128,
    DYE_RESOLUTION      : 512,
    DENSITY_DISSIPATION : 0.980,
    VELOCITY_DISSIPATION: 0.995,
    PRESSURE            : 0.80,
    PRESSURE_ITERATIONS : 20,
    CURL                : 25,
    SPLAT_RADIUS        : 0.25,
    SPLAT_FORCE         : 6000,
  };
  // Allow per-page overrides (set window.FluidSimOverride before loading fluid.js)
  var _over = window.FluidSimOverride;
  if (_over) { Object.keys(_over).forEach(function(k){ if(Object.prototype.hasOwnProperty.call(CFG,k)) CFG[k]=_over[k]; }); }
  window.FluidSimConfig = CFG;

  /* ── SHADERS ── */
  var VS = [
    'precision highp float;',
    'attribute vec2 aPosition;',
    'varying vec2 vUv;',
    'varying vec2 vL; varying vec2 vR;',
    'varying vec2 vT; varying vec2 vB;',
    'uniform vec2 texelSize;',
    'void main(){',
    '  vUv=aPosition*0.5+0.5;',
    '  vL=vUv-vec2(texelSize.x,0.0);',
    '  vR=vUv+vec2(texelSize.x,0.0);',
    '  vT=vUv+vec2(0.0,texelSize.y);',
    '  vB=vUv-vec2(0.0,texelSize.y);',
    '  gl_Position=vec4(aPosition,0.0,1.0);',
    '}'
  ].join('\n');

  var FS_CLEAR = [
    'precision highp float;',
    'precision highp sampler2D;',
    'varying vec2 vUv;',
    'uniform sampler2D uTexture;',
    'uniform float value;',
    'void main(){gl_FragColor=value*texture2D(uTexture,vUv);}'
  ].join('\n');

  /* Display: fluid density as mask that reveals background image */
  var FS_DISPLAY = [
    'precision highp float;',
    'precision highp sampler2D;',
    'varying vec2 vUv;',
    'uniform sampler2D uTexture;',
    'uniform sampler2D uBgImage;',
    'uniform float uEdgeLow;',
    'uniform float uEdgeHigh;',
    'uniform float uGrayR;',
    'uniform float uGrayG;',
    'uniform float uGrayB;',
    'uniform float uHasBgImage;',
    'uniform float uBgAspect;',
    'uniform float uCanvasAspect;',
    '',
    'void main(){',
    '  vec3  dye     = texture2D(uTexture, vUv).rgb;',
    '  float density = max(dye.r, max(dye.g, dye.b));',
    '',
    '  float alpha = smoothstep(uEdgeLow, uEdgeHigh, density);',
    '  if(alpha < 0.004){ gl_FragColor = vec4(0.0); return; }',
    '',
    '  vec3 col;',
    '  if(uHasBgImage > 0.5){',
    '    // Cover-scale UVs so image fills canvas without distortion',
    '    vec2 uv = vUv;',
    '    if(uCanvasAspect > uBgAspect){',
    '      float s = uCanvasAspect / uBgAspect;',
    '      uv.y = (uv.y - 0.5) / s + 0.5;',
    '    } else {',
    '      float s = uBgAspect / uCanvasAspect;',
    '      uv.x = (uv.x - 0.5) / s + 0.5;',
    '    }',
    '    uv = clamp(uv, 0.0, 1.0);',
    '    col = texture2D(uBgImage, uv).rgb;',
    '  } else {',
    '    col = vec3(uGrayR/255.0, uGrayG/255.0, uGrayB/255.0);',
    '  }',
    '  gl_FragColor = vec4(col, alpha);',
    '}'
  ].join('\n');

  var FS_SPLAT = [
    'precision highp float;',
    'precision highp sampler2D;',
    'varying vec2 vUv;',
    'uniform sampler2D uTarget;',
    'uniform float aspectRatio;',
    'uniform vec3 color;',
    'uniform vec2 point;',
    'uniform float radius;',
    'void main(){',
    '  vec2 p=vUv-point;',
    '  p.x*=aspectRatio;',
    '  float s=exp(-dot(p,p)/radius);',
    '  vec3 base=texture2D(uTarget,vUv).xyz;',
    '  gl_FragColor=vec4(base+s*color,1.0);',
    '}'
  ].join('\n');

  var FS_ADVECTION_LINEAR = [
    'precision highp float;',
    'precision highp sampler2D;',
    'varying vec2 vUv;',
    'uniform sampler2D uVelocity;',
    'uniform sampler2D uSource;',
    'uniform vec2 texelSize;',
    'uniform float dt;',
    'uniform float dissipation;',
    'void main(){',
    '  vec2 coord=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize;',
    '  gl_FragColor=dissipation*texture2D(uSource,coord);',
    '  gl_FragColor.a=1.0;',
    '}'
  ].join('\n');

  var FS_ADVECTION_BILERP = [
    'precision highp float;',
    'precision highp sampler2D;',
    'varying vec2 vUv;',
    'uniform sampler2D uVelocity;',
    'uniform sampler2D uSource;',
    'uniform vec2 texelSize;',
    'uniform vec2 dyeTexelSize;',
    'uniform float dt;',
    'uniform float dissipation;',
    'vec4 bilerp(sampler2D sam,vec2 uv,vec2 ts){',
    '  vec2 st=uv/ts-0.5;',
    '  vec2 iuv=floor(st);vec2 fuv=fract(st);',
    '  vec4 a=texture2D(sam,(iuv+vec2(0.5,0.5))*ts);',
    '  vec4 b=texture2D(sam,(iuv+vec2(1.5,0.5))*ts);',
    '  vec4 c=texture2D(sam,(iuv+vec2(0.5,1.5))*ts);',
    '  vec4 d=texture2D(sam,(iuv+vec2(1.5,1.5))*ts);',
    '  return mix(mix(a,b,fuv.x),mix(c,d,fuv.x),fuv.y);',
    '}',
    'void main(){',
    '  vec2 coord=vUv-dt*bilerp(uVelocity,vUv,texelSize).xy*texelSize;',
    '  gl_FragColor=dissipation*bilerp(uSource,coord,dyeTexelSize);',
    '  gl_FragColor.a=1.0;',
    '}'
  ].join('\n');

  var FS_DIVERGENCE = [
    'precision highp float;',
    'precision highp sampler2D;',
    'varying vec2 vUv;',
    'varying vec2 vL;varying vec2 vR;',
    'varying vec2 vT;varying vec2 vB;',
    'uniform sampler2D uVelocity;',
    'void main(){',
    '  float L=texture2D(uVelocity,vL).x;',
    '  float R=texture2D(uVelocity,vR).x;',
    '  float T=texture2D(uVelocity,vT).y;',
    '  float B=texture2D(uVelocity,vB).y;',
    '  vec2 C=texture2D(uVelocity,vUv).xy;',
    '  if(vL.x<0.0)L=-C.x;',
    '  if(vR.x>1.0)R=-C.x;',
    '  if(vT.y>1.0)T=-C.y;',
    '  if(vB.y<0.0)B=-C.y;',
    '  gl_FragColor=vec4(0.5*(R-L+T-B),0.0,0.0,1.0);',
    '}'
  ].join('\n');

  var FS_CURL = [
    'precision highp float;',
    'precision highp sampler2D;',
    'varying vec2 vUv;',
    'varying vec2 vL;varying vec2 vR;',
    'varying vec2 vT;varying vec2 vB;',
    'uniform sampler2D uVelocity;',
    'void main(){',
    '  float L=texture2D(uVelocity,vL).y;',
    '  float R=texture2D(uVelocity,vR).y;',
    '  float T=texture2D(uVelocity,vT).x;',
    '  float B=texture2D(uVelocity,vB).x;',
    '  gl_FragColor=vec4(0.5*(R-L-T+B),0.0,0.0,1.0);',
    '}'
  ].join('\n');

  var FS_VORTICITY = [
    'precision highp float;',
    'precision highp sampler2D;',
    'varying vec2 vUv;',
    'varying vec2 vL;varying vec2 vR;',
    'varying vec2 vT;varying vec2 vB;',
    'uniform sampler2D uVelocity;',
    'uniform sampler2D uCurl;',
    'uniform float curl;',
    'uniform float dt;',
    'void main(){',
    '  float L=texture2D(uCurl,vL).x;',
    '  float R=texture2D(uCurl,vR).x;',
    '  float T=texture2D(uCurl,vT).x;',
    '  float B=texture2D(uCurl,vB).x;',
    '  float C=texture2D(uCurl,vUv).x;',
    '  vec2 force=0.5*vec2(abs(T)-abs(B),abs(R)-abs(L));',
    '  force/=length(force)+0.0001;',
    '  force*=curl*C;',
    '  force.y*=-1.0;',
    '  vec2 vel=texture2D(uVelocity,vUv).xy+force*dt;',
    '  gl_FragColor=vec4(clamp(vel,-1000.0,1000.0),0.0,1.0);',
    '}'
  ].join('\n');

  var FS_PRESSURE = [
    'precision highp float;',
    'precision highp sampler2D;',
    'varying vec2 vUv;',
    'varying vec2 vL;varying vec2 vR;',
    'varying vec2 vT;varying vec2 vB;',
    'uniform sampler2D uPressure;',
    'uniform sampler2D uDivergence;',
    'void main(){',
    '  float L=texture2D(uPressure,vL).x;',
    '  float R=texture2D(uPressure,vR).x;',
    '  float T=texture2D(uPressure,vT).x;',
    '  float B=texture2D(uPressure,vB).x;',
    '  float div=texture2D(uDivergence,vUv).x;',
    '  gl_FragColor=vec4((L+R+B+T-div)*0.25,0.0,0.0,1.0);',
    '}'
  ].join('\n');

  var FS_GRAD_SUBTRACT = [
    'precision highp float;',
    'precision highp sampler2D;',
    'varying vec2 vUv;',
    'varying vec2 vL;varying vec2 vR;',
    'varying vec2 vT;varying vec2 vB;',
    'uniform sampler2D uPressure;',
    'uniform sampler2D uVelocity;',
    'void main(){',
    '  float L=texture2D(uPressure,vL).x;',
    '  float R=texture2D(uPressure,vR).x;',
    '  float T=texture2D(uPressure,vT).x;',
    '  float B=texture2D(uPressure,vB).x;',
    '  vec2 vel=texture2D(uVelocity,vUv).xy-vec2(R-L,T-B);',
    '  gl_FragColor=vec4(vel,0.0,1.0);',
    '}'
  ].join('\n');

  /* ── WEBGL STATE ── */
  var canvas, gl, ext;
  var programs = {};
  var velocity, dye, divergence, curl, pressure;
  var blit;
  var lastTime = Date.now();
  var bgImageTex = null;
  var bgImageAspect = 1.0;

  /* ── HELPERS ── */
  function compileShader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      console.error('[FluidSim] Shader:', gl.getShaderInfoLog(s));
    return s;
  }

  function Program(fsSrc) {
    var prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fsSrc));
    gl.bindAttribLocation(prog, 0, 'aPosition');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      console.error('[FluidSim] Link:', gl.getProgramInfoLog(prog));
    var uniforms = {};
    var n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) {
      var info = gl.getActiveUniform(prog, i);
      uniforms[info.name] = gl.getUniformLocation(prog, info.name);
    }
    this.prog = prog;
    this.uniforms = uniforms;
    this.bind = function () { gl.useProgram(prog); };
  }

  function createFBO(w, h, internalFormat, format, type, filter) {
    gl.activeTexture(gl.TEXTURE0);
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return {
      texture: tex, fbo: fbo, width: w, height: h,
      texelSizeX: 1.0 / w, texelSizeY: 1.0 / h,
      attach: function (unit) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        return unit;
      }
    };
  }

  function createDoubleFBO(w, h, internalFormat, format, type, filter) {
    var fbo1 = createFBO(w, h, internalFormat, format, type, filter);
    var fbo2 = createFBO(w, h, internalFormat, format, type, filter);
    return {
      width: w, height: h,
      texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
      _a: fbo1, _b: fbo2,
      get read()  { return this._a; },
      get write() { return this._b; },
      swap: function () { var t = this._a; this._a = this._b; this._b = t; }
    };
  }

  function getResolution(res) {
    var ar = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (ar < 1) ar = 1.0 / ar;
    var mn = Math.round(res), mx = Math.round(res * ar);
    return (gl.drawingBufferWidth > gl.drawingBufferHeight)
      ? { width: mx, height: mn } : { width: mn, height: mx };
  }

  /* ── INIT ── */
  function setupWebGL() {
    canvas = document.getElementById('fluidCanvas');
    if (!canvas) { console.error('[FluidSim] fluidCanvas not found'); return false; }
    var opts = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: true };
    gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    if (!gl) { console.error('[FluidSim] WebGL not supported'); return false; }
    gl.clearColor(0, 0, 0, 0);
    var hf  = gl.getExtension('OES_texture_half_float');
    var hfl = gl.getExtension('OES_texture_half_float_linear');
    ext = {
      halfFloat      : hf  ? hf.HALF_FLOAT_OES : gl.UNSIGNED_BYTE,
      linearFiltering: !!hfl,
      internalFormat : gl.RGBA,
      format         : gl.RGBA,
    };
    return true;
  }

  function initPrograms() {
    var advFS = ext.linearFiltering ? FS_ADVECTION_LINEAR : FS_ADVECTION_BILERP;
    programs.clear        = new Program(FS_CLEAR);
    programs.display      = new Program(FS_DISPLAY);
    programs.splat        = new Program(FS_SPLAT);
    programs.advection    = new Program(advFS);
    programs.divergence   = new Program(FS_DIVERGENCE);
    programs.curl         = new Program(FS_CURL);
    programs.vorticity    = new Program(FS_VORTICITY);
    programs.pressure     = new Program(FS_PRESSURE);
    programs.gradSubtract = new Program(FS_GRAD_SUBTRACT);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, -1,1, 1,1, -1,-1, 1,1, 1,-1]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    blit = function (target) {
      if (target == null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
  }

  function initFramebuffers() {
    var simRes = getResolution(CFG.SIM_RESOLUTION);
    var dyeRes = getResolution(CFG.DYE_RESOLUTION);
    var filter = ext.linearFiltering ? gl.LINEAR : gl.NEAREST;
    var IF = ext.internalFormat, F = ext.format, T = ext.halfFloat;
    gl.disable(gl.BLEND);
    velocity   = createDoubleFBO(simRes.width, simRes.height, IF, F, T, filter);
    dye        = createDoubleFBO(dyeRes.width, dyeRes.height, IF, F, T, filter);
    divergence = createFBO(simRes.width, simRes.height, IF, F, T, gl.NEAREST);
    curl       = createFBO(simRes.width, simRes.height, IF, F, T, gl.NEAREST);
    pressure   = createDoubleFBO(simRes.width, simRes.height, IF, F, T, gl.NEAREST);
  }

  function resizeCanvas() {
    var w = window.innerWidth, h = window.innerHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      initFramebuffers();
    }
  }

  /* ── SIMULATION STEP ── */
  function step(dt) {
    gl.disable(gl.BLEND);
    var p = programs;

    p.curl.bind();
    gl.uniform2f(p.curl.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(p.curl.uniforms.uVelocity, velocity.read.attach(0));
    blit(curl);

    p.vorticity.bind();
    gl.uniform2f(p.vorticity.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(p.vorticity.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(p.vorticity.uniforms.uCurl,     curl.attach(1));
    gl.uniform1f(p.vorticity.uniforms.curl, CFG.CURL);
    gl.uniform1f(p.vorticity.uniforms.dt, dt);
    blit(velocity.write); velocity.swap();

    p.divergence.bind();
    gl.uniform2f(p.divergence.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(p.divergence.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence);

    p.clear.bind();
    gl.uniform1i(p.clear.uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(p.clear.uniforms.value, CFG.PRESSURE);
    blit(pressure.write); pressure.swap();

    p.pressure.bind();
    gl.uniform2f(p.pressure.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(p.pressure.uniforms.uDivergence, divergence.attach(0));
    for (var i = 0; i < CFG.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(p.pressure.uniforms.uPressure, pressure.read.attach(1));
      blit(pressure.write); pressure.swap();
    }

    p.gradSubtract.bind();
    gl.uniform2f(p.gradSubtract.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(p.gradSubtract.uniforms.uPressure, pressure.read.attach(0));
    gl.uniform1i(p.gradSubtract.uniforms.uVelocity, velocity.read.attach(1));
    blit(velocity.write); velocity.swap();

    p.advection.bind();
    gl.uniform2f(p.advection.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    if (!ext.linearFiltering)
      gl.uniform2f(p.advection.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(p.advection.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(p.advection.uniforms.uSource,   velocity.read.attach(0));
    gl.uniform1f(p.advection.uniforms.dt, dt);
    gl.uniform1f(p.advection.uniforms.dissipation, CFG.VELOCITY_DISSIPATION);
    blit(velocity.write); velocity.swap();

    if (!ext.linearFiltering)
      gl.uniform2f(p.advection.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
    gl.uniform1i(p.advection.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(p.advection.uniforms.uSource,   dye.read.attach(1));
    gl.uniform1f(p.advection.uniforms.dissipation, CFG.DENSITY_DISSIPATION);
    blit(dye.write); dye.swap();
  }

  /* ── RENDER ── */
  function render() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var p   = programs.display;
    var cfg = window.BgConfig || {};
    p.bind();
    gl.uniform1i(p.uniforms.uTexture,  dye.read.attach(0));
    gl.uniform1f(p.uniforms.uEdgeLow,  cfg.EDGE_LOW  !== undefined ? cfg.EDGE_LOW  : 0.08);
    gl.uniform1f(p.uniforms.uEdgeHigh, cfg.EDGE_HIGH !== undefined ? cfg.EDGE_HIGH : 0.09);
    gl.uniform1f(p.uniforms.uGrayR,    cfg.GRAY_R    !== undefined ? cfg.GRAY_R    : 194);
    gl.uniform1f(p.uniforms.uGrayG,    cfg.GRAY_G    !== undefined ? cfg.GRAY_G    : 194);
    gl.uniform1f(p.uniforms.uGrayB,    cfg.GRAY_B    !== undefined ? cfg.GRAY_B    : 194);

    if (bgImageTex) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bgImageTex);
      gl.uniform1i(p.uniforms.uBgImage,       1);
      gl.uniform1f(p.uniforms.uHasBgImage,    1.0);
      gl.uniform1f(p.uniforms.uBgAspect,      bgImageAspect);
      gl.uniform1f(p.uniforms.uCanvasAspect,  canvas.width / canvas.height);
    } else {
      gl.uniform1f(p.uniforms.uHasBgImage, 0.0);
    }

    blit(null);
  }

  /* ── SPLAT ── */
  function doSplat(x, y, dx, dy, color) {
    var p  = programs.splat;
    var ar = canvas.width / canvas.height;
    var radius = (CFG.SPLAT_RADIUS / 100) * (ar > 1 ? ar : 1);
    p.bind();

    gl.uniform1i(p.uniforms.uTarget, velocity.read.attach(0));
    gl.uniform1f(p.uniforms.aspectRatio, ar);
    gl.uniform2f(p.uniforms.point, x / canvas.width, 1.0 - y / canvas.height);
    gl.uniform3f(p.uniforms.color, dx, -dy, 0.0);
    gl.uniform1f(p.uniforms.radius, radius);
    blit(velocity.write); velocity.swap();

    gl.uniform1i(p.uniforms.uTarget, dye.read.attach(0));
    gl.uniform3f(p.uniforms.color, color.r, color.g, color.b);
    blit(dye.write); dye.swap();
  }

  /* ── MAIN LOOP ── */
  function update() {
    var now = Date.now();
    var dt  = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    resizeCanvas();
    step(dt);
    render();
    requestAnimationFrame(update);
  }

  /* ── PUBLIC API ── */
  var _readPixelBuf = new Uint8Array(4);
  window.FluidSim = {
    splat: function (x, y, dx, dy, color) {
      var c = color || { r: 0.76, g: 0.76, b: 0.76 };
      gl.disable(gl.BLEND);
      doSplat(x, y, dx * CFG.SPLAT_FORCE, dy * CFG.SPLAT_FORCE, c);
    },
    getFluidAlpha: function (screenX, screenY) {
      var px = Math.round(screenX);
      var py = Math.round(canvas.height - screenY); // WebGL y is flipped
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, _readPixelBuf);
      return _readPixelBuf[3] / 255;
    },
    // Read a screen region in ONE gl.readPixels call.
    // Returns Uint8Array (RGBA), rows are bottom-to-top (WebGL y-flip).
    getRegionPixels: function (screenX, screenY, w, h) {
      var glX = Math.round(screenX);
      var glY = Math.round(canvas.height - screenY - h);
      var safeX = Math.max(0, glX);
      var safeY = Math.max(0, glY);
      var safeW = Math.min(w, canvas.width  - safeX);
      var safeH = Math.min(h, canvas.height - safeY);
      var buf = new Uint8Array(w * h * 4); // zeroed by default
      if (safeW > 0 && safeH > 0) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.readPixels(safeX, safeY, safeW, safeH, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      }
      return buf;
    },
    setBgImage: function (url) {
      if (!url) {
        bgImageTex = null;
        return;
      }
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        bgImageAspect = img.naturalWidth / img.naturalHeight;
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        bgImageTex = tex;
      };
      img.src = url;
    },
    loadStaticBg: function () { loadBgImage(); }
  };

  /* ── BACKGROUND IMAGE LOADER (static fallback) ── */
  function loadBgImage() {
    var img = new Image();
    img.onload = function () {
      bgImageAspect = img.naturalWidth / img.naturalHeight;
      bgImageTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, bgImageTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    };
    img.onerror = function () {
      console.warn('[FluidSim] fluid-bg.webp not found — using gray fallback');
    };
    img.src = 'assets/images/fluid-bg.webp';
  }

  /* ── AUTO-START ── */
  function start() {
    if (!setupWebGL()) return;
    initPrograms();
    initFramebuffers();
    resizeCanvas();
    /* Image loading deferred to Sanity fetch in main.js — no default load */
    requestAnimationFrame(update);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
