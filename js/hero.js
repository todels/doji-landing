// Mounts the live Doji Portal behind the hero and frames it exactly like the PNG in the Figma design:
// the hole sits under the dashboard's top edge and the falling line runs up the middle of the page.
// js/portal-core.js is copied from github.com/todels/doji-portal (5633c78, the scattered cursor lens) with one
// addition: an optional Flow cursor (`mflow: 1`, `malong`), a disc the streams flow around instead of the lens.
// Keep it if you copy the file again.
(() => {
  // Read straight out of the exported PNG the design uses (doji-portal-4180x4020-20261114-184559.png).
  // It is the "Side" preset in the tool. Camera (zoom, cx, cy) and cursor mass are set below.
  const S = {
    lw: 0.41, spread: 0.0004, dens: 1, stretch: 0, smode: 0, front: 1.43, corebend: 0.63,
    halo: 0, fill: 0.1, reach: 0.5, speed: 0.02, off: 0,
    layers: 8, depth: 0.4, loff: 0.01, tails: 1, breathe: 0, bspeed: 0.01, hotamt: 0, hotpos: 0.98,
    mass: 0.16, hor: 0.3, warp: 1.57, wfall: 0.46, inner: 0, twist: 0, turb: 0,
    zoom: 1, rot: 0, cx: 0, cy: 0,
    fine: 0, // dots keep their size in the scene, as in the export, whatever the camera zoom
    bright: 8, grain: 0.03, cBlue: '#2c3ad6', cHot: '#ffc49a',
    time: 1,
    // Cursor, as in the tool's Mouse section: mass is set below, scatter roughs the arcs up (0 = clean bullseye),
    // lag is how slowly it follows the pointer.
    mmass: 0, mscat: 0.6, mlag: 0.15,
    mflow: 0, malong: 1, // mflow 1 swaps the lens for the Flow cursor (a disc the streams flow around)
    // The two edge glows above the dashboard (Figma "Ellipse 20" and "Ellipse 21"), placed below.
    glow: 1, glowx: 0, glowy: 0, g1a: 0, g1b: 0, g1s: 0, g2a: 0, g2b: 0, g2s: 0,
    transparent: false,
    maxPixelRatio: 2
  };

  // Where the hole sits in the 1440 design, measured from the dashboard's top-left corner,
  // and how many CSS px one scene unit (the export's height) covers there.
  const HOLE_X = 678.4, HOLE_Y = 418.0, UNIT = 2392.9, DESIGN_W = 1360;
  // Edge glows, from Figma: both centred 680px in and 2px down from the dashboard's top-left corner.
  // [half width, half height, blur deviation] in design px.
  const GLOW_X = 680, GLOW_Y = 2, GLOW_WIDE = [187, 25, 24.35], GLOW_CORE = [99, 13, 18.75];

  // Cursor mass in the tool's units: a fraction of the window height, so 0.02 looks the same size here as the
  // tool's Mass 0.02 does in the same window. It works anywhere across the portal; its strength fades linearly
  // from full at the dashboard's top edge to nothing at the top of the page, and it is off within TEXT_PAD px
  // of the text, buttons and nav.
  const CURSOR_MASS = 0.02;
  const TEXT_PAD = 32;

  const el = document.querySelector('.portal');
  const dash = document.querySelector('.showcase');
  const root = document.documentElement;
  const noWarp = [...document.querySelectorAll('.nav .logo, .nav .menu, .hero h1, .hero-side p, .ctas')];
  let portal = null, k = 1, canvasH = 1, fadeTop = 0, fadeBottom = 1;

  function layout(){
    k = Math.min(1, dash.clientWidth / DESIGN_W);
    root.style.setProperty('--k', k);
    // The canvas only needs to reach the dashboard's top edge (plus a little under its corners).
    const er = el.getBoundingClientRect();
    const d = dash.getBoundingClientRect();
    const h = Math.ceil(d.top - er.top + 48 * k);
    el.style.height = h + 'px';
    canvasH = h;
    const w = el.clientWidth;
    const hx = d.left - er.left + HOLE_X * k;
    const hy = d.top - er.top + HOLE_Y * k;
    const unit = UNIT * k;
    fadeTop = er.top; fadeBottom = d.top;
    // Shader camera: 1 scene unit = `unit` CSS px, hole at (hx, hy) inside the canvas.
    S.zoom = unit / h;
    S.cx = -(hx - w / 2) / unit;
    S.cy = (hy - h / 2) / unit;
    // Edge glows in canvas heights, origin at the canvas centre, y up (the shader's screen units).
    S.glowx = (d.left - er.left + GLOW_X * k - w / 2) / h;
    S.glowy = (h / 2 - (d.top - er.top + GLOW_Y * k)) / h;
    [S.g1a, S.g1b, S.g1s] = GLOW_WIDE.map(v => v * k / h);
    [S.g2a, S.g2b, S.g2s] = GLOW_CORE.map(v => v * k / h);
    applyMass();
    if (el.classList.contains('is-static')) {
      // No WebGL 2: show the same frame as a still image.
      const bw = 2487.45 * k, bh = 2392.9 * k;
      el.style.backgroundSize = bw + 'px ' + bh + 'px';
      el.style.backgroundPosition = (hx - 0.36882 * bw) + 'px ' + (hy - 0.5002 * bh) + 'px';
    }
  }

  // ---- Where the cursor may warp ----
  // The strength is a function of where the pointer is: a straight vertical fade (full at the dashboard, none at
  // the top of the page), times a short fade to nothing near the text, buttons and nav. So it never pops.
  let gate = 0;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function applyMass(){ S.mmass = CURSOR_MASS * window.innerHeight / canvasH * gate; }
  window.addEventListener('pointermove', e => {
    let g = Math.min(1, Math.max(0, (e.clientY - fadeTop) / (fadeBottom - fadeTop)));
    for (const n of noWarp) {
      if (g <= 0) break;
      const r = n.getBoundingClientRect();
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right), dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      g *= smooth(0, TEXT_PAD, Math.hypot(dx, dy));
    }
    gate = g; applyMass();
  }, { passive: true });

  // Live settings, for tuning from the browser console: dojiPortal.settings.mscat = 0.8 etc.
  window.dojiPortal = { settings: S, get gate(){ return gate; } };
  portal = dojiPortalMount(el, S, dojiPortalCore());
  if (!portal) el.classList.add('is-static');
  layout();
  new ResizeObserver(layout).observe(document.body);
  if (document.fonts) document.fonts.ready.then(layout);
})();
