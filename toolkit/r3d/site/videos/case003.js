// Road Court — Case 003: the middle lane. Nigel hogs lane 2 at 60; Gary undertakes him; a marked police car pulls both over.
// Traffic heads north (-z, heading PI). Lanes: L1 -3.5, L2 0, L3 3.5. Hard shoulder centre HS -6.9.
import { THREE, V, lerp, seg, easeIO, easeOut, smooth, mat, box, sbox, Car, HERO, Person, addFace, hoodie, makeSeated, povHands,
  cam, shots, toScreen, lights, setMood, scene, officer, crashBarrier, mulberry, countryside, policeCar, glasses, treeBelt, canvasTex } from '../engine.js';

const HN = Math.PI, L1 = -3.5, L2 = 0, L3 = 3.5, HS = -6.9;
const V60 = 26.8, T2 = 8.3, TP = 41.0, TD = 6.0;   // 60 mph, motion starts at seg 2, pull-over starts / lasts
const clamp01 = k => Math.min(1, Math.max(0, k));
const pw = (pts, t) => { if (t <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return lerp(va, vb, smooth((t - a) / (b - a))); } return pts[pts.length - 1][1]; };
// reference point that moves at Nigel's speed, then brakes to a stop on the hard shoulder
function Rz(t) { const tt = Math.max(t, 0); if (tt < TP) return -V60 * (tt - T2); const r0 = -V60 * (TP - T2), u = Math.min(tt - TP, TD); return r0 - V60 * (u - u * u / (2 * TD)); }
const pullK = t => smooth(clamp01((t - TP - 0.6) / 3.9));
function motion(t) {
  const R = Rz(t), k = pullK(t);
  const dG = pw([[T2, 70], [13.96, 46], [20.82, 28], [26.93, 12], [33.5, -16], [99, -16]], t);
  const dP = pw([[T2, 420], [35.6, 46], [40.4, 24], [TP + 5, 15], [99, 15]], t);
  return { R, gary: { x: lerp(L1, HS, k), z: R + dG }, nigel: { x: lerp(L2, HS, k), z: R }, pol: { x: lerp(L2, HS, k), z: R + dP }, lights: t > 40.6 };
}
const headOf = (f, t, key) => { const a = f(t - 0.05)[key], b = f(t + 0.05)[key]; const dz = a.z - b.z, dx = b.x - a.x; return dz < 0.02 ? HN : Math.PI - Math.atan2(dx, dz); };

const VIDEO = {
  episode: 'CASE 003', wordCaps: true,
  build() {
    lights('day');
    const Z0 = 320, Z1 = -1600, L = Z0 - Z1, ZC = (Z0 + Z1) / 2;
    countryside({ cx: 0, cz: -600, grass: '#7fa36a', clearX: 90, clearZ: 1100 });
    box(500, 0.02, L + 400, mat('#7fa36a', { r: 1 }), V(0, -0.16, ZC), null, { cast: false });
    const asph = mat('#45494f', { r: .92 }), white = new THREE.MeshStandardMaterial({ color: '#ecece6', roughness: .6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    box(17.1, 0.16, L, asph, V(-1.65, -0.07, ZC), null, { cast: false });      // hard shoulder + 3 lanes (x -10.2..6.9 incl. strips)
    box(11.0, 0.16, L, asph, V(13.25, -0.07, ZC), null, { cast: false });      // opposite carriageway
    box(1.1, 0.17, L, mat('#7c9f69', { r: 1 }), V(7.45, -0.065, ZC), null, { cast: false });   // central reservation strip
    for (const x of [-8.55, -5.25, 5.25, 8.1, 18.6]) box(x === -5.25 ? 0.2 : 0.15, 0.02, L, white, V(x, 0.015, ZC), null, { cast: false });
    const n = Math.floor(L / 12), geo = new THREE.BoxGeometry(0.15, 0.02, 3), m4 = new THREE.Matrix4();
    for (const x of [-1.75, 1.75, 11.5, 15.0]) { const im = new THREE.InstancedMesh(geo, white, n); for (let i = 0; i < n; i++) { m4.makeTranslation(x, 0.015, Z1 + i * 12 + 1.5); im.setMatrixAt(i, m4); } scene.add(im); }
    crashBarrier(6.6, Z1, Z0);
    // marker posts on the verge, tree belts, hedges
    { const pg = new THREE.BoxGeometry(0.12, 1.0, 0.12), np = Math.floor(L / 50), im = new THREE.InstancedMesh(pg, mat('#f2f2f2', { r: .5 }), np); for (let i = 0; i < np; i++) { m4.makeTranslation(-9.3, 0.5, Z1 + i * 50); im.setMatrixAt(i, m4); } scene.add(im); }
    treeBelt([-16, -70], Z0, Z1, 900, 4); treeBelt([24, 80], Z0, Z1, 900, 9);
    { const bg = new THREE.IcosahedronGeometry(1, 1), nb = Math.floor(L / 2.6), im = new THREE.InstancedMesh(bg, mat('#5a8a48', { flat: true, r: 1 }), nb * 2); const R = mulberry(2); const q = new THREE.Quaternion(), s = V(1, 1, 1), p = V(0, 0, 0); let c = 0;
      for (let i = 0; i < nb; i++) for (const x of [-12.5, 21.5]) { const k = 1.0 + R() * 0.6; p.set(x + R() * 0.6, 0.5 * k, Z1 + i * 2.6); s.set(k * 1.1, k * 0.8, k * 1.1); m4.compose(p, q, s); im.setMatrixAt(c++, m4); } scene.add(im); }
    // over-bridges for a sense of speed
    const conc = mat('#b9b7b1', { r: .85 }), concD = mat('#9d9b95', { r: .9 });
    for (const zb of [-380, -760, 140]) {
      box(70, 1.3, 9, conc, V(4, 6.4, zb)); box(70, 0.9, 0.3, concD, V(4, 7.5, zb - 4.4)); box(70, 0.9, 0.3, concD, V(4, 7.5, zb + 4.4));
      for (const x of [-11.5, 7.45, 20.5]) box(1.2, 5.8, 7, concD, V(x, 2.9, zb));
    }
    // blue motorway sign
    const sign = canvasTex(512, 256, (c, w, h) => { c.fillStyle = '#1c4fa3'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineWidth = 10; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 84px "Inter Display",sans-serif'; c.fillText('J14', w / 2, 92); c.font = '700 58px "Inter Display",sans-serif'; c.fillText('1 mile', w / 2, 180); });
    for (const zs of [-120, -620]) { const g = new THREE.Group(); g.position.set(-11, 0, zs); scene.add(g); for (const sx of [-1.1, 1.1]) box(0.15, 4.2, 0.15, mat('#8a9098', { m: .5 }), V(sx, 2.1, -0.1), g); const f = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.7, 0.08), [mat('#999'), mat('#999'), mat('#999'), mat('#999'), new THREE.MeshStandardMaterial({ map: sign }), mat('#8a8f96')]); f.position.set(0, 3.3, 0); g.add(f); }
    // green / red lane overlays for the explanations
    const strip = (c) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 70), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.28, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.03; m.visible = false; scene.add(m); return m; };
    this.okStrip = strip(0x22c55e); this.badStrip = strip(0xef4444);
    // green arrows: the right way to overtake
    const arrowTex = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#22c55e'; c.beginPath(); c.moveTo(w / 2, 6); c.lineTo(w - 10, h / 2); c.lineTo(w * 0.66, h / 2); c.lineTo(w * 0.66, h - 6); c.lineTo(w * 0.34, h - 6); c.lineTo(w * 0.34, h / 2); c.lineTo(10, h / 2); c.closePath(); c.fill(); });
    this.arrows = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })); m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); this.arrows.push(m); }
    // people and vehicles
    const gary = new Car(HERO, { interior: true, lplate: false });
    const drv = addFace(hoodie(makeSeated(gary, new Person({ shirt: '#d62828', pants: '#2c3550', hair: '#3a2a1e', skin: '#c98d5e' }), -0.4, 0.1)));
    drv.shL.rotation.set(-1.05, 0, 0.05); drv.shR.rotation.set(-1.05, 0, -0.05);
    const nigel = new Car('#b9c0c8', { interior: true, plate: 'NG63 HOG' });
    const nd = glasses(addFace(makeSeated(nigel, new Person({ shirt: '#3d6fa8', pants: '#2b2b30', hair: '#c9c9c9', skin: '#e8bea0' }), -0.4, 0.1), { brow: '#9a9a9a' }));
    nd.shL.rotation.set(-1.05, 0, 0.05); nd.shR.rotation.set(-1.05, 0, -0.05);
    const pol = policeCar(new Car('#f3f5f6', { plate: 'PO19 LCE' }));
    const cop = officer(); cop.g.visible = false;
    const demo = ['#e07a5f', '#f2cc8f', '#81b29a', '#3d405b', '#a8dadc', '#9b2226', '#e9ecef', '#2b2d42', '#5e548e', '#8d99ae', '#3a7d44', '#d9d9d9', '#7a1f2b', '#1d3557', '#b5b8bd'].map((c, i) => new Car(c, { plate: 'Q' + (10 + i) + ' DMO' }));
    const opp = ['#eceff1', '#30343a', '#a51c30', '#9aa3ad', '#2f5d8a', '#c9a227'].map((c, i) => new Car(c, { plate: 'OP' + (20 + i) + ' CAR' }));
    return { gary, drv, nigel, nd, pol, cop, demo, opp, okStrip: this.okStrip, badStrip: this.badStrip, arrows: this.arrows };
  },
  frame(ctx) {
    const { O, t } = ctx; scene.fog.color.set(0xd3e2ec);
    O.demo.forEach(c => c.g.visible = false); O.cop.g.visible = false; O.okStrip.visible = O.badStrip.visible = false; O.arrows.forEach(a => a.visible = false);
    O.drv.expr('neutral'); O.nd.expr('neutral'); O.nd.headG.rotation.set(0, 0, 0); O.drv.headG.rotation.set(0, 0, 0); O.gary.glass.opacity = 0.45; O.nigel.glass.opacity = 0.45;
    place(O, t);
  },
  segs: [
    // 0 cold open: the undertake, ring on the hogger
    { update(ctx) { const { O, ts } = ctx; const tm = 26.93 + ts; const m = place(O, tm); const n = O.nigel;
        cam(V(n.x - 14, 13, n.z + 22), V(n.x - 1.5, 0, n.z - 2), 42);
        ring(ctx, n.world(0, 1.0, 0), 0.2, 'MIDDLE LANE HOGGER');
        ctx.label('GARY', O.gary.world(0, 2.2, 0), ctx.word("gary's") - 0.1, 99, { bg: '#1f6bff' }); ctx.tag('10 MILES', ctx.word('ten') - 0.1, ctx.word("gary's") - 0.1, { col: 'red' }); } },
    // 1 case three
    { update(ctx) { const { O, ts } = ctx; place(O, 14 + ts); const n = O.nigel; O.badStrip.visible = true; O.badStrip.position.set(L2, 0.03, n.z - 20);
        cam(V(n.x + 9, 18, n.z + 26), V(n.x, 0, n.z - 12), 40); ctx.tag('THE MIDDLE LANE', ctx.word('lane') - 0.2, 99, { col: 'red' }); } },
    // 2 empty motorway, Gary in lane 1
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const g = O.gary;
        if (ts < 2.6) cam(g.world(1.6, 1.5, -7.5), g.world(0, 1.0, 2), 40); else cam(g.world(-1.0, 2.4, -9.5), g.world(0, 0.9, 6), 46);
        ctx.tag('70 LIMIT', ctx.word('seventy') - 0.15, ctx.word('gary') - 0.1, { col: 'yellow' }); ctx.label('GARY', g.world(0, 2.2, 0), ctx.word('gary') - 0.1, 99, { bg: '#1f6bff' });
        ctx.tag('LEFT LANE', ctx.word('left') - 0.15, 99, { col: 'green' }); } },
    // 3 Nigel, middle lane, 60, left lane empty
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const n = O.nigel; const te = ctx.word('empty') - 0.6;
        if (ts < te) cam(n.world(-4.2, 1.3, 7.5), n.world(0, 1.0, -1), 36); else { cam(V(n.x - 10, 15, n.z + 18), V(n.x - 2, 0, n.z - 14), 42); O.okStrip.visible = true; O.okStrip.position.set(L1, 0.03, n.z - 18); }
        ctx.label('NIGEL', n.world(0, 2.2, 0), ctx.word('nigel') - 0.1, te, { bg: '#e63946' }); ctx.tag('60 MPH', ctx.word('sixty') - 0.15, te, { col: 'red' }); ctx.tag('LEFT LANE EMPTY', te + 0.4, 99, { col: 'green' }); } },
    // 4 should overtake on the right: green arrows
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const n = O.nigel, g = O.gary; const ta = ctx.word('move') - 0.2;
        if (ts < ta) cam(g.world(-0.6, 2.0, -8.5), g.world(0, 0.9, 10), 44); else { cam(V(n.x - 6, 22, n.z + 30), V(n.x + 1, 0, n.z - 6), 40); arrowsPath(O, g.z, n.z, seg(ts, ta, ta + 1.4)); }
        ctx.tag('CATCHES UP', 0.2, ta, { col: 'yellow' }); ctx.tag('OVERTAKE ON THE RIGHT', ctx.word('right') - 0.3, 99, { col: 'green' }); } },
    // 5 undertakes
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const n = O.nigel; const tu = ctx.word('undertakes') - 0.2;
        if (ts < 1.8) cam(O.gary.world(-0.3, 1.5, 2.7), O.gary.world(-0.4, 1.25, -0.1), 32), O.gary.glass.opacity = 0.15, O.drv.expr('annoyed');
        else { const g = O.gary; cam(V(-6.6, 1.5, g.z + 10), V(-1.2, 0.9, g.z - 8), 44); }
        ctx.tag('HAD ENOUGH', 0.2, tu, { col: 'yellow' }); ctx.tag('UNDERTAKING', tu, 99, { col: 'red' }); } },
    // 6 Nigel singing
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const n = O.nigel; n.glass.opacity = 0.12;
        const ts2 = ctx.word('singing') - 0.2; if (ts > ts2) { O.nd.expr(Math.floor(ts * 4) % 2 ? 'shock' : 'smug'); O.nd.headG.rotation.z = Math.sin(ts * 7) * 0.12; } else O.nd.expr('smug');
        cam(n.world(-0.25, 1.5, 2.75), n.world(-0.4, 1.25, -0.1), 32);
        ctx.tag("DOESN'T NOTICE", 0.2, ctx.word('cruise') - 0.1, { col: 'yellow' }); ctx.tag('CRUISE CONTROL', ctx.word('cruise') - 0.1, ts2, { col: 'yellow' }); ctx.tag('SINGING', ts2, 99, { col: 'yellow' }); } },
    // 7 the police car behind
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const p = O.pol, n = O.nigel;
        shots(ts, [{ t: 0, p: V(n.x - 9, 6, n.z + 6), l: V(n.x, 0.8, n.z + 30), f: 38 }]); cam(V(n.x - 8, 5.5, n.z + 4), V(p.x, 0.8, p.z), 36);
        ring(ctx, p.world(0, 1.2, 0), ctx.word('police') - 0.2, ''); ctx.tag('POLICE', ctx.word('police') - 0.1, 99, { col: 'red' }); } },
    // 8 blue lights, both pulled over
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const n = O.nigel, p = O.pol; const tb = ctx.word('both') - 0.2;
        if (ts < 1.3) cam(p.world(-1.6, 1.3, 5.5), p.world(0, 1.4, 0), 38); else cam(V(n.x + 9, 16, n.z + 26), V(n.x - 2, 0, n.z - 4), 42);
        ctx.tag('BLUE LIGHTS', 0.1, tb, { col: 'red' }); ctx.tag('BOTH PULLED OVER', tb, 99, { col: 'red' }); } },
    // 9 who's right?
    { update(ctx) { const { O, t } = ctx; place(O, 60); const n = O.nigel; cam(V(n.x + 12, 22, n.z + 30), V(n.x, 0, n.z - 4), 40); ctx.tag("WHO'S RIGHT?", 0.1, 99, { col: 'yellow' }); } },
    // 10 rule 264: keep left (flashback)
    { update(ctx) { const { O, ts } = ctx; place(O, 16 + ts * 0.8); const n = O.nigel; O.okStrip.visible = true; O.okStrip.position.set(L1, 0.03, n.z - 16);
        const tm = ctx.word('move') - 0.2; if (ts > tm) { O.badStrip.visible = true; O.badStrip.position.set(L2, 0.03, n.z - 16); }
        cam(V(n.x - 9, 17, n.z + 22), V(n.x - 1.5, 0, n.z - 12), 42);
        ctx.tag('RULE 264', 0.1, ctx.word('left') - 0.2, { col: 'green' }); ctx.tag('KEEP LEFT', ctx.word('left') - 0.2, tm, { col: 'green' }); ctx.tag('THEN MOVE BACK', tm, 99, { col: 'green' }); } },
    // 11 Nigel guilty
    { update(ctx) { const { O, t, ts } = ctx; place(O, 60); const n = O.nigel; n.glass.opacity = 0.1; O.nd.expr(ts > ctx.word('guilty') - 0.2 ? 'shock' : 'neutral'); O.nd.headG.rotation.y = 0.5;
        const c = O.cop; c.g.visible = true; c.at(n.x - 1.45, n.z + 0.4, Math.PI / 2).stand();
        const th = ctx.word('hundred') - 0.2, tg = ctx.word('guilty') - 0.25;
        if (ts < th) cam(V(n.x - 2.9, 1.75, n.z - 5.6), V(n.x - 0.8, 1.35, n.z + 0.2), 38); else cam(n.world(0.2, 1.5, 2.75), n.world(-0.4, 1.25, -0.1), 34);
        ctx.label('OFFICER', c.g.position.clone().add(V(0, 2.25, 0)), 0.2, th, { bg: '#e63946' });
        ctx.tag('CARELESS DRIVING', ctx.word('careless') - 0.15, th, { col: 'red' }); ctx.tag('£100 + 3 POINTS', th, tg, { col: 'red' }); ctx.tag('NIGEL: GUILTY', tg, 99, { col: 'red' }); } },
    // 12 rule 268: don't overtake on the left; exception: queues
    { update(ctx) { const { O, ts, t } = ctx; const tq = ctx.word('main') - 0.2;
        if (ts < tq) { place(O, 27.5 + ts * 0.9); const n = O.nigel; O.badStrip.visible = true; O.badStrip.position.set(L1, 0.03, n.z - 8); cam(V(n.x - 8, 12, n.z + 18), V(n.x - 2, 0, n.z - 6), 42); }
        else { place(O, 60); queueDemo(O, ts - tq); cam(V(-13, 17, 292), V(-0.5, 0, 214), 40); }
        ctx.tag('RULE 268', 0.1, ctx.word('not') - 0.2, { col: 'red' }); ctx.tag('DO NOT PASS ON THE LEFT', ctx.word('not') - 0.2, tq, { col: 'red' }); ctx.tag('QUEUES: LEFT LANE FASTER = OK', ctx.word('queuing') - 0.2, 99, { col: 'green' }); } },
    // 13 undertaking can be careless driving too
    { update(ctx) { const { O, ts } = ctx; place(O, 60); const g = O.gary; g.glass.opacity = 0.1; O.drv.expr(ts > 2 ? 'shock' : 'neutral'); O.drv.headG.rotation.y = 0.5;
        const c = O.cop; c.g.visible = true; c.at(g.x - 1.45, g.z + 0.4, Math.PI / 2).stand();
        const tt = ctx.word('too') - 0.2, ts2 = ctx.word('same') - 0.2;
        if (ts < ts2) cam(V(g.x - 2.9, 1.75, g.z - 5.6), V(g.x - 0.8, 1.35, g.z + 0.2), 38); else cam(g.world(0.2, 1.5, 2.75), g.world(-0.4, 1.25, -0.1), 34);
        ctx.tag('EMPTY MOTORWAY', 0.2, tt, { col: 'yellow' }); ctx.tag('CARELESS DRIVING TOO', tt, ts2, { col: 'red' }); ctx.tag('£100 + 3 POINTS', ts2, 99, { col: 'red' }); } },
    // 14 the right way; Gary half right
    { update(ctx) { const { O, ts, t } = ctx; place(O, 60); rightWay(O, ts); const n = O.nigel; const th = ctx.word('half') - 0.25;
        cam(V(n.x - 8, 20, n.z + 28), V(n.x + 1, 0, n.z - 8), 40);
        ctx.tag('THE RIGHT WAY', 0.2, th, { col: 'green' }); ctx.tag('GARY: HALF RIGHT', th, 99, { col: 'yellow' }); } },
    // 15 fair or should Gary get off?
    { update(ctx) { const { O, ts } = ctx; place(O, 60); const n = O.nigel; const c = O.cop; c.g.visible = true; c.at(n.x - 1.45, n.z - 4, Math.PI / 2 + 0.6).stand();
        cam(V(n.x + 10 + ts * 0.5, 9 + ts * 1.6, n.z + 22 + ts), V(n.x, 0, n.z - 4), 42);
        ctx.tag('FAIR, OR SHOULD GARY GET OFF?', 0.1, 99, { col: 'yellow' }); ctx.tag('FOLLOW FOR CASE 004', ctx.word('follow') - 0.1, 99, { col: 'yellow', y: 1420 }); } },
  ],
};
export default VIDEO;

// ------------------------------------------------------------ state
function place(O, t) {
  const m = motion(t);
  for (const [car, key] of [[O.gary, 'gary'], [O.nigel, 'nigel'], [O.pol, 'pol']]) { const s = m[key]; car.set(s.x, s.z, headOf(motion, t, key)); car.g.visible = true; }
  const stopped = t > TP + TD - 0.3; O.gary.brake(t > TP); O.nigel.brake(t > TP); O.pol.brake(stopped); O.pol.police(t, m.lights);
  setMood('day', V(0, 0, m.R)); scene.fog.color.set(0xd3e2ec); scene.fog.near = 120; scene.fog.far = 1300;
  O.opp.forEach((c, i) => { const z = m.R - 450 + ((t * 58 + i * 151) % 900); c.set([9.75, 13.25, 16.75][i % 3], z, 0); });
  return m;
}
// green arrows from Gary (lane 1) out to lane 3, past Nigel and back
function arrowsPath(O, gz, nz, k) {
  const pts = []; const z0 = gz - 4, z3 = nz - 22;
  for (let i = 0; i < O.arrows.length; i++) { const u = i / (O.arrows.length - 1); const z = lerp(z0, z3, u); const x = u < 0.3 ? lerp(L1, L3, smooth(u / 0.3)) : u > 0.75 ? lerp(L3, L1, smooth((u - 0.75) / 0.25)) : L3; pts.push([x, z]); }
  O.arrows.forEach((a, i) => { const [x, z] = pts[i]; const nx = pts[Math.min(i + 1, pts.length - 1)], pv = pts[Math.max(i - 1, 0)]; a.position.set(x, 0.04, z); a.rotation.set(-Math.PI / 2, 0, Math.atan2(nx[0] - pv[0], -(nx[1] - pv[1])) * -1); a.visible = i / O.arrows.length <= k; });
}
// demo: Gary passes Nigel the right way (lane 3), then returns left. Runs on an empty stretch near z ~ 60
function rightWay(O, ts) {
  const R = 70 - V60 * ts; const n = O.nigel, g = O.gary; n.set(L2, R, HN); n.brake(false);
  const d = lerp(18, -22, smooth(clamp01(ts / 4.4))); const u = clamp01((18 - d) / 40);
  const gx = u < 0.3 ? lerp(L1, L3, smooth(u / 0.3)) : u > 0.75 ? lerp(L3, L1, smooth((u - 0.75) / 0.25)) : L3; g.set(gx, R + d, HN - (u < 0.3 ? 0.18 * Math.sin(Math.PI * u / 0.3) : u > 0.75 ? -0.18 * Math.sin(Math.PI * (u - 0.75) / 0.25) : 0)); g.brake(false);
  O.pol.g.visible = false; arrowsPath(O, R + 18, R, 1);
}
// demo: congested traffic, lane 1 moving faster than lanes 2 and 3 (z ~ 150..220)
function queueDemo(O, u) {
  O.demo.forEach((c, i) => { const lane = i % 3; const row = Math.floor(i / 3); const v = lane === 0 ? 5.5 : 2.2;
    const z = 225 + row * 9 + lane * 2.5 - v * u; c.g.visible = true; c.set([L1, L2, L3][lane], z, HN); c.brake(lane !== 0); });
  O.okStrip.visible = true; O.okStrip.position.set(L1, 0.03, 200);
}
function ring(ctx, p, from, text) {
  if (ctx.ts < from) return; const s = toScreen(p); const k = easeOut(seg(ctx.ts, from, from + 0.3));
  ctx.html(`<div style="position:absolute;left:${s.x}px;top:${s.y}px;width:260px;height:190px;margin:-95px 0 0 -130px;border:8px solid #ff4a4a;border-radius:50%;transform:scale(${1.5 - 0.5 * k}) rotate(-12deg);opacity:${k}"></div>` + (text ? `<div class="tag red" style="left:${s.x}px;top:${s.y + 150}px;opacity:${k};font-size:40px">${text}</div>` : ''));
}
