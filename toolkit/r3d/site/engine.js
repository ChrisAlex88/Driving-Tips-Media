import * as THREE from 'three';
import { RoundedBoxGeometry } from './lib/RoundedBoxGeometry.js';
export { THREE };

export const W = 1080, H = 1920;
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const easeIO = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
export const easeOut = k => 1 - Math.pow(1 - k, 3);
export const easeIn = k => k * k * k;
export const smooth = k => k * k * (3 - 2 * k);
export function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- renderer / scene
export const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
const RS = +(new URLSearchParams(location.search).get('rs') || 1);
renderer.setPixelRatio(RS); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
document.body.prepend(renderer.domElement);
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 900);
scene.fog = new THREE.Fog(0x9fb6cc, 60, 260);

const matCache = {};
export function mat(col, o = {}) {
  const key = col + JSON.stringify(o);
  if (matCache[key] && !o.unique) return matCache[key];
  const m = new THREE.MeshStandardMaterial({ color: col, roughness: o.r ?? 0.75, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: !!o.op, opacity: o.op ?? 1, flatShading: !!o.flat, side: o.ds ? THREE.DoubleSide : THREE.FrontSide });
  if (!o.unique) matCache[key] = m; return m;
}
export function mesh(geo, m, p, parent, o = {}) {
  const x = new THREE.Mesh(geo, m); if (p) x.position.copy(p);
  if (o.rot) x.rotation.set(...o.rot);
  x.castShadow = o.cast ?? true; x.receiveShadow = o.recv ?? true;
  (parent || scene).add(x); return x;
}
export const box = (w, h, d, m, p, parent, o) => mesh(new THREE.BoxGeometry(w, h, d), m, p, parent, o);
export const rbox = (w, h, d, r, m, p, parent, o) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), m, p, parent, o);
export const cyl = (rt, rb, h, m, p, parent, o = {}) => mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg || 20), m, p, parent, o);
export const sph = (r, m, p, parent, o = {}) => mesh(new THREE.SphereGeometry(r, o.seg || 20, o.seg2 || 14), m, p, parent, o);

export function canvasTex(w, h, draw, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...o.repeat); }
  return t;
}

// ---------------------------------------------------------------- lighting presets
export const L = {};
export function lights(mode = 'day') {
  L.hemi = new THREE.HemisphereLight(0xcfe3ff, 0x5a5040, 1.0); scene.add(L.hemi);
  L.sun = new THREE.DirectionalLight(0xfff1dc, 2.6); L.sun.castShadow = true;
  L.sun.shadow.mapSize.set(2048, 2048); const s = L.sun.shadow.camera; s.left = -40; s.right = 40; s.top = 40; s.bottom = -40; s.near = 1; s.far = 200;
  L.sun.shadow.bias = -0.0004; L.sun.shadow.normalBias = 0.03;
  scene.add(L.sun); scene.add(L.sun.target);
  L.fill = new THREE.DirectionalLight(0x9db4ff, 0.9); L.fill.position.set(10, 12, -30); scene.add(L.fill);
  setMood(mode);
}
let skyTex = {};
function skyGrad(top, bot, stars) {
  return canvasTex(64, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
}
export function setMood(mode, focus = V(0, 0, 0)) {
  if (mode === 'night') {
    skyTex.n = skyTex.n || skyGrad('#060a1c', '#1b2550');
    scene.background = skyTex.n; scene.fog.color.set(0x141c38); scene.fog.near = 40; scene.fog.far = 170;
    L.hemi.color.set(0x7d8fd0); L.hemi.groundColor.set(0x2a2a36); L.hemi.intensity = 1.05; if (L.fill) L.fill.intensity = 0.9;
    L.sun.color.set(0x9fb2ff); L.sun.intensity = 0.55; L.sun.position.copy(focus).add(V(-30, 50, 20));
    renderer.toneMappingExposure = 1.3;
  } else if (mode === 'dawn') {
    skyTex.d = skyTex.d || skyGrad('#6f8fc2', '#f6c58e');
    scene.background = skyTex.d; scene.fog.color.set(0xe8c7a6); scene.fog.near = 50; scene.fog.far = 230;
    L.hemi.color.set(0xffe2c4); L.hemi.groundColor.set(0x6a5a4a); L.hemi.intensity = 0.95;
    L.sun.color.set(0xffc78a); L.sun.intensity = 2.4; L.sun.position.copy(focus).add(V(30, 25, -40)); if (L.fill) L.fill.intensity = 0.25;
    renderer.toneMappingExposure = 1.0;
  } else {
    skyTex.day = skyTex.day || skyGrad('#6fa6dc', '#dbe9f3');
    scene.background = skyTex.day; scene.fog.color.set(0xc9dbe8); scene.fog.near = 70; scene.fog.far = 260;
    L.hemi.color.set(0xd8e8ff); L.hemi.groundColor.set(0x6b6150); L.hemi.intensity = 1.05;
    L.sun.color.set(0xfff1dc); L.sun.intensity = 2.6; L.sun.position.copy(focus).add(V(-25, 45, 18)); if (L.fill) L.fill.intensity = 0.2;
    renderer.toneMappingExposure = 1.0;
  }
  L.sun.target.position.copy(focus);
}

// ---------------------------------------------------------------- ground (canvas-painted)
export class Ground {
  constructor(size = 160, px = 4096, cx = 0, cz = 0) {
    this.size = size; this.cx = cx; this.cz = cz; this.k = px / size;
    this.c = document.createElement('canvas'); this.c.width = this.c.height = px; this.g = this.c.getContext('2d');
    this.rand = mulberry(7);
  }
  X(x) { return (x - this.cx + this.size / 2) * this.k; }
  Z(z) { return (z - this.cz + this.size / 2) * this.k; }
  rect(x0, z0, x1, z1, col) { this.g.fillStyle = col; this.g.fillRect(this.X(x0), this.Z(z0), (x1 - x0) * this.k, (z1 - z0) * this.k); }
  grass(col = '#6ea455') { this.rect(this.cx - this.size / 2, this.cz - this.size / 2, this.cx + this.size / 2, this.cz + this.size / 2, col); }
  asphalt(x0, z0, x1, z1, col = '#3d4148') {
    this.rect(x0, z0, x1, z1, col); const g = this.g;
    const n = Math.floor((x1 - x0) * (z1 - z0) * 6);
    for (let i = 0; i < n; i++) { const x = lerp(x0, x1, this.rand()), z = lerp(z0, z1, this.rand()); g.fillStyle = this.rand() < .5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.13)'; g.fillRect(this.X(x), this.Z(z), 2.5, 2.5); }
  }
  pavement(x0, z0, x1, z1, col = '#c9c5bd') {
    this.rect(x0, z0, x1, z1, col); const g = this.g; g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 2;
    for (let x = x0; x <= x1; x += 0.9) { g.beginPath(); g.moveTo(this.X(x), this.Z(z0)); g.lineTo(this.X(x), this.Z(z1)); g.stroke(); }
    for (let z = z0; z <= z1; z += 0.9) { g.beginPath(); g.moveTo(this.X(x0), this.Z(z)); g.lineTo(this.X(x1), this.Z(z)); g.stroke(); }
  }
  line(x0, z0, x1, z1, w = 0.12, col = '#f2f2ee', dash, gap) {
    const g = this.g; g.strokeStyle = col; g.lineWidth = w * this.k; g.lineCap = 'butt';
    g.setLineDash(dash ? [dash * this.k, gap * this.k] : []); g.beginPath(); g.moveTo(this.X(x0), this.Z(z0)); g.lineTo(this.X(x1), this.Z(z1)); g.stroke(); g.setLineDash([]);
  }
  build(y = 0) {
    const t = new THREE.CanvasTexture(this.c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(this.size, this.size), new THREE.MeshStandardMaterial({ map: t, roughness: 0.93 }));
    m.rotation.x = -Math.PI / 2; m.position.set(this.cx, y, this.cz); m.receiveShadow = true; scene.add(m); return m;
  }
}
export function kerb(x0, z0, x1, z1, h = 0.13, w = 0.22, col = '#d8d4cc') {
  const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz);
  const m = box(len, h, w, mat(col, { r: .85 }), V((x0 + x1) / 2, h / 2, (z0 + z1) / 2)); m.rotation.y = -Math.atan2(dz, dx); return m;
}
export function slab(x0, z0, x1, z1, h, col) { return box(x1 - x0, h, z1 - z0, mat(col, { r: .9 }), V((x0 + x1) / 2, h / 2, (z0 + z1) / 2), null, { cast: false }); }

// ---------------------------------------------------------------- scenery
const R = mulberry(31);
export function tree(x, z, s = 1, col) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  cyl(0.13 * s, 0.17 * s, 2.0 * s, mat('#7a5232'), V(0, 1.0 * s, 0), g, { seg: 8 });
  const cols = ['#5aa641', '#4f9a3a', '#68b34a'];
  const n = 3;
  for (let i = 0; i < n; i++) {
    const r = (0.95 + R() * 0.4) * s; const m = mat(col || cols[i % 3], { flat: true, r: .9 });
    mesh(new THREE.IcosahedronGeometry(r, 1), m, V((R() - .5) * 0.9 * s, (2.5 + R() * 0.8) * s, (R() - .5) * 0.9 * s), g);
  }
  return g;
}
export function bush(x, z, s = 1) { mesh(new THREE.IcosahedronGeometry(0.6 * s, 1), mat('#4f9a3a', { flat: true }), V(x, 0.45 * s, z)); }
const winTex = {};
function windowMat(night, lit) {
  if (night) return lit ? mat('#ffb85c', { e: 0xff9a2e, ei: 1.25, r: .4 }) : mat('#1d2233', { r: .3 });
  return mat('#9fb8cc', { r: .2, m: .1 });
}
// house: front faces +z in local space; rotY to orient
export function house(x, z, rotY = 0, o = {}) {
  const w = o.w || 7, d = o.d || 6, h = o.h || 5.6, col = o.col || '#e2c9a6', roof = o.roof || '#a65a46', night = !!o.night;
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
  box(w, h, d, mat(col, { r: .9 }), V(0, h / 2, 0), g);
  const rg = new THREE.BufferGeometry();
  const hw = w / 2 + 0.25, hd = d / 2 + 0.3, rh = o.rh || 2.2;
  const v = [-hw, 0, hd, hw, 0, hd, hw, rh, 0, -hw, rh, 0, -hw, 0, -hd, hw, 0, -hd];
  const idx = [0, 1, 2, 0, 2, 3, 5, 4, 3, 5, 3, 2, 1, 5, 2, 4, 0, 3];
  rg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); rg.setIndex(idx); rg.computeVertexNormals();
  mesh(rg, mat(roof, { flat: true, r: .85, ds: true }), V(0, h, 0), g);
  if (o.chimney !== false) box(0.6, 1.4, 0.6, mat('#8d5a48'), V(w * 0.28, h + 1.4, -0.6), g);
  const rr = mulberry(Math.floor(x * 13 + z * 7 + 99));
  const cols = o.cols || 3;
  for (let fl = 0; fl < 2; fl++) for (let i = 0; i < cols; i++) {
    const wx = (i - (cols - 1) / 2) * (w / cols);
    if (fl === 0 && i === Math.floor(cols / 2)) { // door
      box(1.0, 2.0, 0.08, mat(o.door || '#2f5d46'), V(wx, 1.0, d / 2 + 0.04), g);
      if (night) box(0.5, 0.25, 0.05, mat('#ffd98a', { e: 0xffc766, ei: 1.4 }), V(wx, 2.15, d / 2 + 0.08), g);
      continue;
    }
    const wy = fl === 0 ? 1.6 : h - 1.5;
    box(1.25, 1.35, 0.06, mat(night ? '#3a3330' : '#f3efe6'), V(wx, wy, d / 2 + 0.03), g, { cast: false });
    box(1.05, 1.15, 0.06, windowMat(night, rr() < (o.litP ?? 0.6)), V(wx, wy, d / 2 + 0.06), g, { cast: false });
  }
  if (o.awning) {
    box(w * 0.9, 0.12, 1.4, mat(o.awning), V(0, 3.0, d / 2 + 0.7), g);
    if (o.sign) { const t = canvasTex(512, 96, (gg, ww, hh) => { gg.fillStyle = '#20302a'; gg.fillRect(0, 0, ww, hh); gg.fillStyle = '#f3e3b5'; gg.font = '800 54px "Inter Display",sans-serif'; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.fillText(o.sign, ww / 2, hh / 2 + 3); });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.42, w * 0.42 * 96 / 512), new THREE.MeshStandardMaterial({ map: t, emissive: night ? 0x222222 : 0, emissiveMap: night ? t : null }));
      m.position.set(0, 3.7, d / 2 + 0.05); g.add(m); }
  }
  return g;
}
export function lamp(x, z, rotY = 0, night = false, light = false) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
  const pm = mat('#2c3036', { r: .5, m: .4 });
  cyl(0.07, 0.09, 5.6, pm, V(0, 2.8, 0), g, { seg: 10 });
  box(0.08, 0.08, 1.2, pm, V(0, 5.55, 0.55), g);
  box(0.3, 0.14, 0.55, pm, V(0, 5.48, 1.1), g);
  box(0.24, 0.04, 0.45, night ? mat('#ffe2a0', { e: 0xffd27a, ei: 3 }) : mat('#e8e4d8'), V(0, 5.39, 1.1), g, { cast: false });
  if (light) { const pl = new THREE.PointLight(0xffc979, 26, 22, 1.6); pl.position.set(0, 5.1, 1.1); g.add(pl);
    if (o_glow) { const s = new THREE.Sprite(glowMat()); s.scale.set(3.2, 3.2, 1); s.position.set(0, 5.3, 1.1); g.add(s); } }
  return g;
}
const o_glow = true; let _glow;
export function glowMat(col = 'rgba(255,214,140,') { if (_glow) return _glow; const t = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, col + '0.9)'); gr.addColorStop(0.3, col + '0.35)'); gr.addColorStop(1, col + '0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); _glow = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }); return _glow; }
export function stars(n = 500) {
  const pos = []; const r = mulberry(5);
  for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, el = 0.12 + r() * 1.2; const R0 = 400; pos.push(Math.cos(a) * Math.cos(el) * R0, Math.sin(el) * R0, Math.sin(a) * Math.cos(el) * R0); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: .85 })); scene.add(p); return p;
}
export function moon(dir) { const m = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff6d8, fog: false })); m.position.copy(dir.clone().normalize().multiplyScalar(380)); scene.add(m);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMat().map, color: 0xfff1c8, transparent: true, depthWrite: false, fog: false, opacity: .5 })); s.scale.set(70, 70, 1); s.position.copy(m.position); scene.add(s); return m; }

// ---------------------------------------------------------------- the car (our blue L-plate car)
export const HERO = '#1f6bff';
function plateTex(txt, bg) { return canvasTex(256, 64, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = '#222'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); g.fillStyle = '#111'; g.font = 'bold 44px "DejaVu Sans Mono",monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 2); }); }
let _lTex; function lTex() { return _lTex || (_lTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#e0202e'; g.fillRect(34, 18, 22, 92); g.fillRect(34, 88, 62, 22); })); }
export class Car {
  constructor(col = HERO, o = {}) {
    this.g = new THREE.Group(); scene.add(this.g); this.col = col; const g = this.g;
    const body = mat(col, { r: .38, m: .15 }); const dark = mat('#15171b', { r: .6 }); const trim = mat('#0e1013', { r: .5 });
    // lower body as a shell (bonnet, boot, sides) so the cabin is open inside
    rbox(1.82, 0.6, 1.5, 0.14, body, V(0, 0.66, 1.45), g);
    rbox(1.82, 0.6, 0.9, 0.14, body, V(0, 0.66, -1.7), g);
    for (const sx of [-1, 1]) rbox(0.14, 0.6, 2.4, 0.06, body, V(sx * 0.84, 0.66, -0.3), g);
    box(1.6, 0.06, 2.3, dark, V(0, 0.42, -0.3), g, { cast: false });
    // cabin: pillars + roof + glass
    this.glass = new THREE.MeshStandardMaterial({ color: 0x0b0e14, roughness: 0.12, metalness: 0.3, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false });
    const gl = mesh(new THREE.BoxGeometry(1.6, 0.56, 2.04), this.glass, V(0, 1.24, -0.3), g, { cast: false, recv: false }); gl.renderOrder = 2;
    rbox(1.7, 0.1, 2.14, 0.04, body, V(0, 1.55, -0.3), g);               // roof
    for (const sx of [-1, 1]) for (const z of [0.72, -1.33]) box(0.09, 0.58, 0.1, body, V(sx * 0.8, 1.24, z), g);
    for (const sx of [-1, 1]) box(0.06, 0.58, 0.07, body, V(sx * 0.81, 1.24, -0.3), g);  // B pillar
    box(1.6, 0.06, 0.06, body, V(0, 0.98, 0.73), g, { cast: false }); box(1.6, 0.06, 0.06, body, V(0, 0.98, -1.33), g, { cast: false });
    // bumpers, arches
    rbox(1.88, 0.22, 0.18, 0.05, trim, V(0, 0.43, 2.12), g); rbox(1.88, 0.22, 0.18, 0.05, trim, V(0, 0.43, -2.12), g);
    box(1.7, 0.18, 3.6, dark, V(0, 0.32, 0), g);
    // lights
    this.head = mat('#f4f6ff', { e: 0xffffff, ei: 0.2, r: .2, unique: true });
    for (const sx of [-1, 1]) {
      box(0.36, 0.14, 0.06, this.head, V(sx * 0.6, 0.78, 2.09), g, { cast: false });
      box(0.12, 0.1, 0.06, mat('#ff9a1f', { e: 0xff8a00, ei: 0.2 }), V(sx * 0.86, 0.78, 2.06), g, { cast: false });
    }
    this.tail = mat('#c4121f', { e: 0xff1020, ei: 0.25, r: .3, unique: true });
    for (const sx of [-1, 1]) box(0.38, 0.16, 0.06, this.tail, V(sx * 0.58, 0.8, -2.09), g, { cast: false });
    // plates
    const pf = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.13), new THREE.MeshStandardMaterial({ map: plateTex(o.plate || 'LR26 TIP', '#f4f4f0') })); pf.position.set(0, 0.45, 2.215); g.add(pf);
    const pr = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.13), new THREE.MeshStandardMaterial({ map: plateTex(o.plate || 'LR26 TIP', '#f5c518') })); pr.position.set(0, 0.45, -2.215); pr.rotation.y = Math.PI; g.add(pr);
    // L plates
    if (o.lplate !== false && col === HERO) {
      const lm = new THREE.MeshStandardMaterial({ map: lTex(), roughness: .5 });
      const a = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), lm); a.position.set(-0.55, 0.62, 2.23); g.add(a);
      const b = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), lm); b.position.set(-0.55, 0.65, -2.23); b.rotation.y = Math.PI; g.add(b);
      const c = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), lm); c.position.set(0, 1.61, -0.2); c.rotation.x = -Math.PI / 2; g.add(c);
    }
    // mirrors
    for (const sx of [-1, 1]) box(0.16, 0.12, 0.1, body, V(sx * 0.98, 1.02, 0.62), g);
    // wheels
    this.wheels = [];
    const tyre = mat('#141414', { r: .9 }); const rim = mat('#c9ced6', { r: .3, m: .7 });
    for (const sx of [-1, 1]) for (const z of [1.33, -1.33]) {
      const wg = new THREE.Group(); wg.position.set(sx * 0.82, 0.34, z); g.add(wg);
      cyl(0.34, 0.34, 0.24, tyre, V(0, 0, 0), wg, { rot: [0, 0, Math.PI / 2], seg: 24 });
      const hub = new THREE.Group(); hub.position.x = sx * 0.125; wg.add(hub);
      cyl(0.2, 0.2, 0.02, rim, V(0, 0, 0), hub, { rot: [0, 0, Math.PI / 2], seg: 20 });
      for (let k = 0; k < 5; k++) { const s = box(0.03, 0.36, 0.06, mat('#9aa1ab', { m: .6, r: .35 }), V(sx * 0.012, 0, 0), hub); s.rotation.x = k * Math.PI * 2 / 5; }
      this.wheels.push(hub);
    }
    if (o.interior) this.buildInterior();
    this.x = 0; this.z = 0; this.h = 0; this.dist = 0;
  }
  buildInterior() {
    const g = this.g; const d = mat('#454a52', { r: .8 }), seat = mat('#3a3e46', { r: .9 });
    box(1.62, 0.28, 0.42, d, V(0, 0.94, 0.55), g);                       // dashboard
    box(1.5, 0.05, 0.2, mat('#1b1d21'), V(0, 1.09, 0.64), g);
    // steering wheel (driver on right = -x)
    this.wheelG = new THREE.Group(); this.wheelG.position.set(-0.4, 0.97, 0.3); this.wheelG.rotation.x = -0.5; g.add(this.wheelG);
    mesh(new THREE.TorusGeometry(0.19, 0.03, 10, 32), mat('#2b2e34', { r: .45 }), V(0, 0, 0), this.wheelG);
    box(0.36, 0.035, 0.03, mat('#111317'), V(0, 0, 0), this.wheelG); cyl(0.06, 0.06, 0.05, mat('#1b1d21'), V(0, 0, 0), this.wheelG, { rot: [Math.PI / 2, 0, 0] });
    cyl(0.04, 0.05, 0.3, d, V(-0.4, 0.88, 0.45), g, { rot: [Math.PI / 2 - 0.5, 0, 0] });
    // ignition key
    this.keys = new THREE.Group(); this.keys.position.set(-0.7, 0.93, 0.42); g.add(this.keys);
    box(0.03, 0.09, 0.02, mat('#c7cbd2', { m: .8, r: .3 }), V(0, -0.05, -0.02), this.keys);
    mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 16), mat('#c7cbd2', { m: .8, r: .3 }), V(0, -0.11, -0.02), this.keys);
    box(0.05, 0.07, 0.03, mat('#15171b'), V(0, -0.15, -0.02), this.keys);
    // seats
    for (const sx of [-0.4, 0.4]) {
      rbox(0.54, 0.14, 0.52, 0.05, seat, V(sx, 0.66, -0.25), g);
      const back = rbox(0.54, 0.7, 0.14, 0.05, seat, V(sx, 1.0, -0.58), g); back.rotation.x = -0.18;
      rbox(0.3, 0.16, 0.1, 0.04, seat, V(sx, 1.38, -0.66), g);
    }
    rbox(1.4, 0.16, 0.5, 0.05, seat, V(0, 0.68, -1.05), g); rbox(1.4, 0.6, 0.14, 0.05, seat, V(0, 1.0, -1.32), g);
    box(1.62, 0.04, 2.0, mat('#1f2126'), V(0, 0.5, -0.3), g, { cast: false });
    box(0.06, 0.32, 1.9, mat('#2e3138'), V(0.78, 0.86, -0.3), g); box(0.06, 0.32, 1.9, mat('#2e3138'), V(-0.78, 0.86, -0.3), g); // door cards
    box(0.2, 0.25, 0.6, d, V(0, 0.7, 0.1), g);                         // centre console
    box(0.3, 0.06, 0.02, mat('#0f1114'), V(0, 1.48, 0.62), g);         // mirror
    box(1.56, 0.03, 2.0, mat('#a3a7ae', { r: .95 }), V(0, 1.485, -0.3), g, { cast: false }); // headliner
    this.cabin = new THREE.PointLight(0xfff2e0, 0, 3.2, 1.5); this.cabin.position.set(-0.1, 1.42, -0.1); g.add(this.cabin);
  }
  set(x, z, h, moving = true) {
    if (moving) { const dd = Math.hypot(x - this.x, z - this.z); this.dist += dd; }
    this.x = x; this.z = z; this.h = h; this.g.position.set(x, 0, z); this.g.rotation.y = h;
    for (const w of this.wheels) w.rotation.x = this.dist / 0.34;
    return this;
  }
  place(x, z, h, dist) { this.x = x; this.z = z; this.h = h; this.dist = dist ?? this.dist; this.g.position.set(x, 0, z); this.g.rotation.y = h; for (const w of this.wheels) w.rotation.x = this.dist / 0.34; return this; }
  brake(on) { this.tail.emissiveIntensity = on ? 2.2 : 0.25; }
  lightsOn(on) { this.head.emissiveIntensity = on ? 2.5 : 0.2; }
  glassClear(on) { this.glass.opacity = on ? 0.12 : 0.92; }
  world(lx, ly, lz) { return this.g.localToWorld(V(lx, ly, lz)); }
}
// pick a heading so the car faces direction (dx,dz)
export const heading = (dx, dz) => Math.atan2(dx, dz);

// ---------------------------------------------------------------- people
export class Person {
  constructor(o = {}) {
    const g = this.g = new THREE.Group(); scene.add(g);
    const skin = mat(o.skin || '#f0c08a', { r: .7 }), shirt = mat(o.shirt || '#f2a516', { r: .8 }), pants = mat(o.pants || '#2c3550', { r: .85 }), shoe = mat('#1d1d22');
    this.hipL = new THREE.Group(); this.hipR = new THREE.Group(); this.hipL.position.set(0.11, 0.9, 0); this.hipR.position.set(-0.11, 0.9, 0); g.add(this.hipL, this.hipR);
    for (const hp of [this.hipL, this.hipR]) { rbox(0.16, 0.86, 0.18, 0.06, pants, V(0, -0.43, 0), hp); rbox(0.17, 0.1, 0.28, 0.04, shoe, V(0, -0.88, 0.05), hp); }
    this.torso = new THREE.Group(); this.torso.position.set(0, 0.9, 0); g.add(this.torso);
    rbox(0.44, 0.62, 0.26, 0.1, shirt, V(0, 0.33, 0), this.torso);
    this.shL = new THREE.Group(); this.shR = new THREE.Group(); this.shL.position.set(0.28, 0.58, 0); this.shR.position.set(-0.28, 0.58, 0); this.torso.add(this.shL, this.shR);
    for (const s of [this.shL, this.shR]) { rbox(0.12, 0.56, 0.13, 0.05, shirt, V(0, -0.27, 0), s); sph(0.065, skin, V(0, -0.58, 0), s, { seg: 10, seg2: 8 }); }
    this.headG = new THREE.Group(); this.headG.position.set(0, 0.68, 0); this.torso.add(this.headG);
    sph(0.17, skin, V(0, 0.16, 0), this.headG);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.178, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(o.hair || '#4a3424')); hair.position.set(0, 0.17, -0.01); hair.rotation.x = -0.25; this.headG.add(hair); hair.castShadow = true;
    const eye = mat('#1b1b1b');
    this.eyes = [];
    for (const sx of [-0.06, 0.06]) { const e = box(0.05, o.closed ? 0.012 : 0.035, 0.02, eye, V(sx, 0.17, 0.162), this.headG, { cast: false }); this.eyes.push(e); }
    this.phase = 0;
  }
  at(x, z, h) { this.g.position.set(x, 0, z); this.g.rotation.y = h; return this; }
  walk(ph, amp = 0.55) {
    const s = Math.sin(ph);
    this.hipL.rotation.x = s * amp; this.hipR.rotation.x = -s * amp; this.shL.rotation.x = -s * amp * 0.8; this.shR.rotation.x = s * amp * 0.8;
    this.torso.position.y = 0.9 + Math.abs(Math.cos(ph)) * 0.03; return this;
  }
  stand() { return this.walk(0, 0); }
  sit(lean = 0) { // seated in a car seat: hips at seat height
    this.hipL.position.y = this.hipR.position.y = 0.0; this.torso.position.y = 0.0;
    this.hipL.rotation.x = this.hipR.rotation.x = -1.35; this.torso.rotation.x = -lean; return this;
  }
  eyesClosed(c) { for (const e of this.eyes) e.scale.y = c ? 0.3 : 1; }
}

// ---------------------------------------------------------------- belisha beacon, traffic light
let _stripe;
export function belisha(x, z, night = false) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  _stripe = _stripe || canvasTex(32, 256, (gg, w, h) => { for (let i = 0; i < 8; i++) { gg.fillStyle = i % 2 ? '#111' : '#f4f4f4'; gg.fillRect(0, i * h / 8, w, h / 8); } });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.9, 12), new THREE.MeshStandardMaterial({ map: _stripe, roughness: .5 })); pole.position.y = 1.45; pole.castShadow = true; g.add(pole);
  const gm = new THREE.MeshStandardMaterial({ color: 0xffa21a, emissive: 0xff8a00, emissiveIntensity: 1.2, roughness: .3 });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), gm); globe.position.y = 3.05; globe.castShadow = true; g.add(globe);
  return { g, flash(t) { gm.emissiveIntensity = (Math.floor(t * 1.4) % 2) ? 0.25 : 1.6; } };
}
export function trafficLight(x, z, rotY = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
  const pm = mat('#26292e', { r: .5, m: .3 });
  cyl(0.06, 0.07, 2.8, pm, V(0, 1.4, 0), g, { seg: 10 });
  box(0.34, 0.95, 0.22, pm, V(0, 3.2, 0), g); box(0.5, 1.1, 0.04, mat('#111'), V(0, 3.2, -0.12), g);
  const cols = [0xff2a2a, 0xffb21a, 0x1ee06a]; const ms = cols.map(c => new THREE.MeshStandardMaterial({ color: 0x222222, emissive: c, emissiveIntensity: 0.05 }));
  ms.forEach((m, i) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16), m); s.rotation.x = Math.PI / 2; s.position.set(0, 3.5 - i * 0.3, 0.12); g.add(s); });
  return { g, set(s) { ms.forEach((m, i) => m.emissiveIntensity = (s === 'red' && i === 0) || (s === 'amber' && i === 1) || (s === 'green' && i === 2) || (s === 'redamber' && i < 2) ? 2.4 : 0.05); } };
}

// ---------------------------------------------------------------- camera helpers
export function cam(p, l, fov = 40, roll = 0) { camera.position.copy(p); camera.fov = fov; camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.lookAt(l); camera.updateProjectionMatrix(); }
// keyed shots: keys [{t, blend, p, l, f}] — cut when blend undefined/0, glide otherwise
export function shots(ts, keys, drift = 0.0) {
  let a = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i]; const bl = b.blend || 0;
    if (ts >= b.t) { a = b; continue; }
    if (bl > 0 && ts > b.t - bl) { const k = easeIO(seg(ts, b.t - bl, b.t)); const p = a.p.clone().lerp(b.p, k), l = a.l.clone().lerp(b.l, k); cam(addDrift(p, ts, drift), l, lerp(a.f || 40, b.f || 40, k)); return; }
    break;
  }
  cam(addDrift(a.p.clone(), ts, drift), a.l, a.f || 40);
}
function addDrift(p, t, d) { if (!d) return p; return p.add(V(Math.sin(t * 0.7) * d, Math.sin(t * 0.9 + 1) * d * 0.6, Math.cos(t * 0.6) * d)); }
export function toScreen(p) { camera.updateMatrixWorld(); const v = p.clone().project(camera); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, z: v.z }; }

export function cylBetween(a, b, r, m, parent) {
  const d = b.clone().sub(a); const len = d.length();
  const c = mesh(new THREE.CylinderGeometry(r, r, len, 10), m, a.clone().add(b).multiplyScalar(0.5), parent);
  c.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return c;
}
// POV hands on the wheel (driver at local x=-0.4)
export function povHands(car, sleeve = '#2b3442', skin = '#f0c08a') {
  const g = new THREE.Group(); car.g.add(g);
  const sm = mat(sleeve, { r: .85 }), km = mat(skin, { r: .7 });
  const grips = [V(-0.57, 1.0, 0.27), V(-0.23, 1.0, 0.27)];
  const sh = [V(-0.7, 0.95, -0.35), V(-0.1, 0.95, -0.35)];
  for (let i = 0; i < 2; i++) { cylBetween(sh[i], grips[i].clone().add(V(0, -0.02, -0.06)), 0.055, sm, g); sph(0.055, km, grips[i], g, { seg: 12, seg2: 10 }); }
  return g;
}
export function makeSeated(car, p, side = -0.4, lean = 0.12) {
  car.g.add(p.g); p.g.scale.setScalar(0.72); p.g.position.set(side, 0.74, -0.16); p.sit(lean); return p;
}
export function taxiSign(car) {
  const t = canvasTex(256, 96, (g, w, h) => { g.fillStyle = '#ffd400'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.font = '900 70px "Inter Display",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TAXI', w / 2, h / 2 + 4); });
  const m = new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.6 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.24, 0.3), [mat('#ffd400'), mat('#ffd400'), mat('#ffd400'), mat('#ffd400'), m, m]); b.position.set(0, 1.73, -0.3); b.rotation.y = Math.PI / 2; car.g.add(b); return b;
}

// ================================================================ v2: realistic street kit
const _texCache = {};
export function brickTex(base = '#9a4f3a', key = 'b') {
  const k = 'brick' + base + key; if (_texCache[k]) return _texCache[k];
  const r = mulberry(base.length * 17 + key.charCodeAt(0));
  const t = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#cbbfae'; g.fillRect(0, 0, w, h);
    const bh = 32, bw = 96;
    for (let row = 0; row < h / bh; row++) for (let c = -1; c < w / bw + 1; c++) {
      const x = c * bw + (row % 2 ? bw / 2 : 0), y = row * bh;
      const col = new THREE.Color(base); col.offsetHSL((r() - .5) * 0.02, (r() - .5) * 0.08, (r() - .5) * 0.10);
      g.fillStyle = '#' + col.getHexString(); g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
      g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(x + 3, y + bh - 9, bw - 6, 6);
    }
  }, { repeat: [1, 1] });
  _texCache[k] = t; return t;
}
function brickMat(base, w, h) { const t = brickTex(base).clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 3.2, h / 3.2); return new THREE.MeshStandardMaterial({ map: t, roughness: .92 }); }
function signTex(text, bg = '#1f2a24', fg = '#f1e3b9', font = '"Inter Display",sans-serif') {
  return canvasTex(1024, 160, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = fg; g.font = `800 92px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 6); });
}
// shop: front faces +z locally. o: {w,d,h,brick,name,signBg,signFg,awning,floors}
export function shop(x, z, rotY = 0, o = {}) {
  const w = o.w || 8, d = o.d || 8, floors = o.floors || 2, fh = 3.4, h = floors * fh + 0.6;
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
  mesh(new THREE.BoxGeometry(w, h, d), brickMat(o.brick || '#9a4f3a', w, h), V(0, h / 2, 0), g);
  box(w + 0.2, 0.35, d + 0.2, mat('#d9d2c4'), V(0, h + 0.17, 0), g);                 // parapet cap
  if (o.chimney !== false) box(0.9, 1.6, 0.6, brickMat('#8a4535', 1, 2), V(w * 0.3, h + 0.8, -d * 0.2), g);
  // shopfront
  const sf = mat(o.frame || '#1b2b24', { r: .5 });
  box(w - 0.4, 3.2, 0.25, sf, V(0, 1.6, d / 2 + 0.12), g);
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fb7c6, roughness: 0.08, metalness: 0.6, emissive: 0x30404a, emissiveIntensity: 0.25 });
  mesh(new THREE.BoxGeometry(w * 0.55, 2.0, 0.05), glass, V(-w * 0.12, 1.25, d / 2 + 0.27), g, { cast: false });
  box(1.05, 2.2, 0.06, mat('#2a1d16'), V(w * 0.33, 1.1, d / 2 + 0.27), g);
  mesh(new THREE.BoxGeometry(0.9, 1.0, 0.03), glass, V(w * 0.33, 1.55, d / 2 + 0.31), g, { cast: false });
  if (o.name) { const sm = new THREE.MeshStandardMaterial({ map: signTex(o.name, o.signBg, o.signFg), roughness: .6 });
    const s = new THREE.Mesh(new THREE.BoxGeometry(w - 0.5, 0.75, 0.12), [sf, sf, sf, sf, sm, sf]); s.position.set(0, 2.85, d / 2 + 0.3); s.castShadow = true; g.add(s); }
  if (o.awning) { const a = box(w * 0.62, 0.08, 1.2, mat(o.awning), V(-w * 0.12, 2.42, d / 2 + 0.85), g); a.rotation.x = 0.28; }
  // upper floor windows
  const cols = Math.max(2, Math.round(w / 2.6));
  for (let f = 1; f < floors; f++) for (let i = 0; i < cols; i++) {
    const wx = (i - (cols - 1) / 2) * (w / cols), wy = f * fh + 1.6;
    box(1.2, 1.6, 0.08, mat('#f2efe8'), V(wx, wy, d / 2 + 0.03), g, { cast: false });
    box(1.0, 1.4, 0.08, mat('#3a4a58', { r: .15, m: .3 }), V(wx, wy, d / 2 + 0.06), g, { cast: false });
    box(1.0, 0.04, 0.09, mat('#f2efe8'), V(wx, wy, d / 2 + 0.08), g, { cast: false });
    box(1.4, 0.12, 0.25, mat('#d9d2c4'), V(wx, wy - 0.86, d / 2 + 0.12), g);
  }
  return g;
}
export function bin(x, z) { const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); cyl(0.28, 0.24, 0.95, mat('#2e5a3a', { r: .6 }), V(0, 0.48, 0), g, { seg: 14 }); cyl(0.3, 0.3, 0.06, mat('#24472e'), V(0, 0.98, 0), g, { seg: 14 }); return g; }
export function bollard(x, z) { cyl(0.09, 0.1, 0.95, mat('#1c1f24', { r: .5 }), V(x, 0.48, z), null, { seg: 10 }); box(0.2, 0.06, 0.2, mat('#e8e8e2'), V(x, 0.82, z)); }
export function postSign(x, z, rotY, draw) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g); cyl(0.04, 0.04, 2.6, mat('#8a9098', { m: .5, r: .4 }), V(0, 1.3, 0), g, { seg: 8 });
  const t = canvasTex(256, 256, draw); const m = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), new THREE.MeshStandardMaterial({ map: t })); m.position.set(0, 2.45, 0.05); g.add(m); return g; }
export function councilCamera(x, z, rotY = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
  cyl(0.09, 0.11, 5.4, mat('#4a5058', { m: .5, r: .4 }), V(0, 2.7, 0), g, { seg: 12 });
  box(0.08, 0.08, 0.7, mat('#4a5058'), V(0, 5.3, 0.3), g);
  rbox(0.42, 0.42, 0.7, 0.06, mat('#eceae4', { r: .4 }), V(0, 5.1, 0.6), g);
  cyl(0.12, 0.12, 0.08, mat('#0d0f12', { r: .1, m: .4 }), V(0, 5.1, 0.97), g, { rot: [Math.PI / 2, 0, 0], seg: 20 });
  box(0.5, 0.06, 0.8, mat('#d8d6cf'), V(0, 5.35, 0.6), g);
  return g;
}
// ambulance (front faces +z locally)
export class Ambulance {
  constructor() {
    const g = this.g = new THREE.Group(); scene.add(g);
    const bat = canvasTex(512, 128, (c, w, h) => { const s = 64; for (let i = 0; i < w / s; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#1c8a3c' : '#f6dd00'; c.fillRect(i * s, j * s, s, s); } });
    const yel = mat('#f3db12', { r: .4 }); const batM = new THREE.MeshStandardMaterial({ map: bat, roughness: .45 });
    rbox(2.15, 2.0, 4.0, 0.12, yel, V(0, 1.55, -0.8), g);                         // box body
    const side = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 0.55), batM); side.position.set(1.08, 1.05, -0.8); side.rotation.y = Math.PI / 2; g.add(side);
    const side2 = side.clone(); side2.position.x = -1.08; side2.rotation.y = -Math.PI / 2; g.add(side2);
    rbox(2.05, 1.25, 1.7, 0.16, yel, V(0, 1.15, 2.0), g);                          // cab
    const ws = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.65, 0.06), mat('#101418', { r: .1, m: .3 })); ws.position.set(0, 1.45, 2.8); ws.rotation.x = -0.25; g.add(ws);
    for (const sx of [-1, 1]) box(0.05, 0.5, 0.9, mat('#101418', { r: .1, m: .3 }), V(sx * 1.03, 1.45, 2.05), g, { cast: false });
    const front = canvasTex(512, 96, (c, w, h) => { c.fillStyle = '#f3db12'; c.fillRect(0, 0, w, h); c.save(); c.scale(-1, 1); c.fillStyle = '#1c8a3c'; c.font = '900 64px "Inter Display",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('AMBULANCE', -w / 2, h / 2 + 4); c.restore(); });
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.3), new THREE.MeshStandardMaterial({ map: front })); fm.position.set(0, 0.95, 2.86); g.add(fm);
    const chev = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#f3db12'; c.fillRect(0, 0, w, h); c.fillStyle = '#d4202a'; for (let i = -4; i < 8; i++) { c.beginPath(); c.moveTo(i * 40, h); c.lineTo(i * 40 + 20, h); c.lineTo(i * 40 + 20 + 60, 0); c.lineTo(i * 40 + 60, 0); c.fill(); } });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 1.9), new THREE.MeshStandardMaterial({ map: chev })); back.position.set(0, 1.55, -2.81); back.rotation.y = Math.PI; g.add(back);
    box(2.2, 0.25, 0.2, mat('#1a1c20'), V(0, 0.42, 2.85), g); box(2.2, 0.25, 0.2, mat('#1a1c20'), V(0, 0.42, -2.85), g);
    this.head = mat('#f4f6ff', { e: 0xffffff, ei: 1.5, unique: true }); for (const sx of [-1, 1]) box(0.35, 0.18, 0.05, this.head, V(sx * 0.72, 0.78, 2.86), g, { cast: false });
    this.blue = []; for (const [x, y, z] of [[-0.6, 1.83, 1.7], [0.6, 1.83, 1.7], [-0.9, 2.6, -2.7], [0.9, 2.6, -2.7], [-0.75, 0.62, 2.87], [0.75, 0.62, 2.87]]) {
      const m = new THREE.MeshStandardMaterial({ color: 0x1a3cff, emissive: 0x2a5cff, emissiveIntensity: 0.2, roughness: .3 }); box(0.42, 0.14, 0.24, m, V(x, y, z), g, { cast: false }); this.blue.push(m); }
    this.glows = []; for (const sx of [-0.6, 0.6]) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMat().map, color: 0x4a7aff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.set(1.6, 1.6, 1); s.position.set(sx, 1.9, 1.7); g.add(s); this.glows.push(s); }
    this.wheels = []; for (const sx of [-1, 1]) for (const z of [1.9, -1.9]) { const w = cyl(0.42, 0.42, 0.3, mat('#141414'), V(sx * 0.98, 0.42, z), g, { rot: [0, 0, Math.PI / 2], seg: 22 }); cyl(0.24, 0.24, 0.32, mat('#c9ced6', { m: .6, r: .3 }), V(sx * 0.98, 0.42, z), g, { rot: [0, 0, Math.PI / 2], seg: 16 }); }
    // paramedic in cab
    this.crew = new THREE.Group(); g.add(this.crew); sph(0.17, mat('#d9a273'), V(-0.45, 1.62, 2.05), this.crew); rbox(0.5, 0.5, 0.3, 0.08, mat('#1d6b3a'), V(-0.45, 1.25, 2.0), this.crew);
    this.dist = 0;
  }
  set(x, z, h) { this.g.position.set(x, 0, z); this.g.rotation.y = h; return this; }
  flash(t, on = true) { this.blue.forEach((m, i) => { const ph = (Math.floor(t * 6) + (i % 2)) % 2; m.emissiveIntensity = on ? (ph ? 3.5 : 0.15) : 0.15; }); this.glows.forEach((s, i) => { s.visible = on && ((Math.floor(t * 6) + i) % 2 === 0); }); }
  world(lx, ly, lz) { return this.g.localToWorld(V(lx, ly, lz)); }
}
// expressive face for Person (call after construction)
export function addFace(p) {
  const hg = p.headG; p.eyes.forEach(e => e.visible = false);
  const white = mat('#ffffff', { r: .3 }), pup = mat('#1a1a1a', { r: .2 }), brow = mat('#3a2a1e');
  p.face = { eyes: [], pupils: [], brows: [] };
  for (const sx of [-1, 1]) {
    const e = sph(0.038, white, V(sx * 0.062, 0.185, 0.148), hg, { seg: 12, seg2: 10 }); e.scale.z = 0.6; p.face.eyes.push(e);
    const q = sph(0.02, pup, V(sx * 0.062, 0.185, 0.17), hg, { seg: 10, seg2: 8 }); p.face.pupils.push(q);
    const b = box(0.07, 0.016, 0.02, brow, V(sx * 0.064, 0.245, 0.158), hg, { cast: false }); p.face.brows.push(b);
  }
  sph(0.03, mat('#e7a878'), V(0, 0.15, 0.172), hg, { seg: 10, seg2: 8 });
  p.face.mouth = mesh(new THREE.TorusGeometry(0.045, 0.011, 6, 16, Math.PI), mat('#7a2a2a'), V(0, 0.095, 0.155), hg, { cast: false });
  p.expr = (name) => {
    const f = p.face; f.mouth.rotation.set(0, 0, Math.PI); f.mouth.scale.set(1, 1, 1); f.brows.forEach((b, i) => { b.rotation.z = 0; b.position.y = 0.245; }); f.eyes.forEach(e => e.scale.y = 1); f.pupils.forEach(q => q.visible = true);
    if (name === 'smug') { f.mouth.rotation.z = Math.PI + 0.25; f.mouth.scale.set(1.1, 0.6, 1); f.brows.forEach((b, i) => { b.rotation.z = (i ? -0.25 : 0.25); }); f.eyes.forEach(e => e.scale.y = 0.6); }
    if (name === 'shock') { f.mouth.rotation.z = 0; f.mouth.scale.set(0.7, 1.4, 1); f.brows.forEach(b => b.position.y = 0.27); }
    if (name === 'annoyed') { f.mouth.rotation.z = 0; f.mouth.scale.set(1, 0.5, 1); f.brows.forEach((b, i) => { b.rotation.z = (i ? 0.35 : -0.35); b.position.y = 0.235; }); }
    if (name === 'closed') { f.eyes.forEach(e => e.scale.y = 0.15); f.pupils.forEach(q => q.visible = false); }
  };
  p.expr('neutral'); return p;
}
export function hoodie(p, col = '#d62828') { p.torso.children[0].material = mat(col, { r: .85 }); [p.shL, p.shR].forEach(s => s.children[0].material = mat(col, { r: .85 })); const hd = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.06, 8, 18, Math.PI * 1.2), mat(col, { r: .85 })); hd.position.set(0, 0.64, -0.06); hd.rotation.set(Math.PI / 2 + 0.3, 0, Math.PI * 0.4); p.torso.add(hd); return p; }
