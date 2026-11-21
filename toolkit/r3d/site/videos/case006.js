// Road Court — Case 006: the tailgater. Gary overtakes a lorry convoy at 70 in lane 2; Brandon (black BMW) sits 1 m behind flashing full beam;
// Gary brake-checks him; Brandon locks up and swerves; a police car pulls both over into a lay-by.
// Dual carriageway heading north (-z, heading PI). Lane 1 x -1.75, lane 2 x +1.75.
import { THREE, V, lerp, seg, easeOut, smooth, mat, box, sbox, Car, HERO, Person, addFace, hoodie, makeSeated,
  cam, toScreen, lights, setMood, scene, officer, crashBarrier, mulberry, countryside, policeCar, glasses, treeBelt, canvasTex, Lorry, fullBeam } from '../engine.js';

const HN = Math.PI, L1 = -1.75, L2 = 1.75, LBX = -5.7, LB = 200;
const V70 = 31.3, VL = 25.0, T0 = 8.75, TB = 39.45;
const clamp01 = k => Math.min(1, Math.max(0, k));
const pw = (pts, t) => { if (t <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return lerp(va, vb, smooth((t - a) / (b - a))); } return pts[pts.length - 1][1]; };
const vG = t => pw([[0, V70], [TB, V70], [TB + 0.9, 23.5], [TB + 1.6, 23.5], [TB + 4.2, V70], [999, V70]], t);
const DT = 0.01, N = 12000, ZG = new Float32Array(N); for (let i = 1; i < N; i++) ZG[i] = ZG[i - 1] - vG(i * DT) * DT;
const at = (A, t) => { const f = Math.max(0, Math.min(N - 2, t / DT)), i = Math.floor(f); return lerp(A[i], A[i + 1], f - i); };
const zG = t => at(ZG, t) - at(ZG, T0);
const NL = 9, lorryZ = (i, t) => -VL * (t - T0) - 40 - (NL - 1 - i) * 23;   // convoy drifts back relative to Gary
const dB = t => pw([[0, 140], [16.43, 70], [20.6, 5.4], [TB + 0.2, 5.4], [TB + 1.2, 4.65], [TB + 2.2, 7.5], [TB + 5, 15], [999, 15]], t);
const xB = t => pw([[0, L2], [TB + 0.7, L2], [TB + 1.5, 2.55], [TB + 3.4, L2], [999, L2]], t);
const dP = t => pw([[0, 200], [30, 70], [44.2, 52], [48.5, 26], [999, 26]], t);

const VIDEO = {
  episode: 'CASE 006', wordCaps: true,
  build() {
    lights('day');
    const Z0 = 360, Z1 = -2000, L = Z0 - Z1, ZC = (Z0 + Z1) / 2;
    countryside({ cx: 0, cz: -800, grass: '#7fa36a', clearX: 90, clearZ: 1250 });
    box(600, 0.02, L + 600, mat('#7fa36a', { r: 1 }), V(0, -0.16, ZC), null, { cast: false });
    const asph = mat('#45494f', { r: .92 }), white = new THREE.MeshStandardMaterial({ color: '#ecece6', roughness: .6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    box(7.6, 0.16, L, asph, V(0, -0.07, ZC), null, { cast: false });
    box(7.6, 0.16, L, asph, V(9.6, -0.07, ZC), null, { cast: false });
    box(2.0, 0.17, L, mat('#7c9f69', { r: 1 }), V(4.8, -0.065, ZC), null, { cast: false });
    for (const x of [-3.5, 3.5, 6.1, 13.1]) box(0.15, 0.02, L, white, V(x, 0.015, ZC), null, { cast: false });
    const n = Math.floor(L / 12), geo = new THREE.BoxGeometry(0.15, 0.02, 3), m4 = new THREE.Matrix4();
    for (const x of [0, 9.6]) { const im = new THREE.InstancedMesh(geo, white, n); for (let i = 0; i < n; i++) { m4.makeTranslation(x, 0.015, Z1 + i * 12 + 1.5); im.setMatrixAt(i, m4); } scene.add(im); }
    crashBarrier(4.8, Z1, Z0);
    // lay-by where the police stop them
    box(3.4, 0.16, 90, asph, V(LBX, -0.069, LB), null, { cast: false }); box(0.15, 0.02, 90, white, V(-3.6, 0.016, LB), null, { cast: false });
    treeBelt([-14, -70], Z0, Z1, 1000, 24); treeBelt([20, 80], Z0, Z1, 1000, 29);
    { const bg = new THREE.IcosahedronGeometry(1, 1), nb = Math.floor(L / 2.6), im = new THREE.InstancedMesh(bg, mat('#5a8a48', { flat: true, r: 1 }), nb * 2); const R = mulberry(5); const q = new THREE.Quaternion(), s = V(1, 1, 1), p = V(0, 0, 0); let c = 0;
      for (let i = 0; i < nb; i++) { const z = Z1 + i * 2.6; for (const x of [-9.8, 17.5]) { if (x < 0 && Math.abs(z - LB) < 48) continue; const k = 1.0 + R() * 0.6; p.set(x + R() * 0.6, 0.5 * k, z); s.set(k * 1.1, k * 0.8, k * 1.1); m4.compose(p, q, s); im.setMatrixAt(c++, m4); } } im.count = c; scene.add(im); }
    { const pg = new THREE.BoxGeometry(0.12, 1.0, 0.12), np = Math.floor(L / 50), im = new THREE.InstancedMesh(pg, mat('#f2f2f2', { r: .5 }), np); for (let i = 0; i < np; i++) { m4.makeTranslation(-8.2, 0.5, Z1 + i * 50); im.setMatrixAt(i, m4); } scene.add(im); }
    const conc = mat('#b9b7b1', { r: .85 }), concD = mat('#9d9b95', { r: .9 });
    for (const zb of [-520, -1150]) { box(60, 1.3, 9, conc, V(4, 6.4, zb)); box(60, 0.9, 0.3, concD, V(4, 7.5, zb - 4.4)); box(60, 0.9, 0.3, concD, V(4, 7.5, zb + 4.4)); for (const x of [-7.5, 4.8, 17]) box(1.2, 5.8, 7, concD, V(x, 2.9, zb)); }
    // vehicles and people
    const gary = new Car(HERO, { interior: true, lplate: false });
    const drv = addFace(hoodie(makeSeated(gary, new Person({ shirt: '#d62828', pants: '#2c3550', hair: '#3a2a1e', skin: '#c98d5e' }), -0.4, 0.1)));
    drv.shL.rotation.set(-1.05, 0, 0.05); drv.shR.rotation.set(-1.05, 0, -0.05);
    const bmw = new Car('#16181c', { interior: true, plate: 'BR19 NDN' }); bmw.g.scale.set(1.03, 0.92, 1.05); const beam = fullBeam(bmw);
    for (const sx of [-0.17, 0.17]) sbox(0.26, 0.2, 0.05, 0.06, mat('#0c0d0f', { r: .3, m: .5 }), V(sx, 0.78, 2.2), bmw.g, { cast: false });
    const bd = glasses(addFace(makeSeated(bmw, new Person({ shirt: '#f4f4f4', pants: '#2b2b30', hair: '#d8b46a', skin: '#e9b98c' }), -0.4, 0.1)), '#111', '#151820');
    bd.shL.rotation.set(-1.05, 0, 0.05); bd.shR.rotation.set(-1.05, 0, -0.05);
    const pol = policeCar(new Car('#f3f5f6', { plate: 'PO21 TFC' }));
    const cop = officer(); cop.g.visible = false;
    const lorries = []; const cabs = ['#1f4e8c', '#c8102e', '#2f6b4f', '#e9ecef', '#f2a900', '#3d405b', '#1f4e8c', '#8a2b2b', '#5a5f66'];
    for (let i = 0; i < NL; i++) lorries.push(new Lorry(cabs[i], i % 3 === 1 ? '#d9dde2' : '#eef0f2', { stripe: ['#c8102e', '#1f4e8c', '#2f6b4f'][i % 3], plate: 'HG' + (10 + i) + ' LRY' }));
    const opp = ['#eceff1', '#30343a', '#a51c30', '#9aa3ad', '#2f5d8a', '#c9a227'].map((c, i) => new Car(c, { plate: 'OP' + (60 + i) + ' CAR' }));
    return { gary, drv, bmw, beam, bd, pol, cop, lorries, opp };
  },
  frame(ctx) {
    const { O, t } = ctx; O.cop.g.visible = false; O.drv.expr('neutral'); O.bd.expr('annoyed'); O.drv.headG.rotation.set(0, 0, 0); O.bd.headG.rotation.set(0, 0, 0);
    O.gary.glass.opacity = 0.45; O.bmw.glass.opacity = 0.6; O.beam(false); place(O, t);
  },
  segs: [
    // 0 cold open: BMW a metre off Gary's bumper
    { update(ctx) { const { O, ts } = ctx; place(O, 24 + ts * 0.5); const g = O.gary, b = O.bmw;
        cam(V(g.x + 3.6, 1.5, g.z + 9.5), V(g.x, 0.9, g.z + 1.5), 40);
        ring(ctx, b.world(0, 1.0, 1.6), 0.2, ''); ctx.tag('1 METRE', 0.3, ctx.word('seventy') - 0.1, { col: 'red' }); ctx.tag('AT 70 MPH', ctx.word('seventy') - 0.1, 99, { col: 'red' }); } },
    // 1 case six
    { update(ctx) { const { O, ts } = ctx; place(O, 22.4 + ts); const b = O.bmw; cam(V(5.6, 2.2, b.z - 6.5), b.world(0, 0.9, 1.0), 40); ctx.tag('THE TAILGATER', ctx.word('tailgater') - 0.3, 99, { col: 'red' }); } },
    // 2 dual carriageway, overtaking lorries at 70
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const g = O.gary; const tl = ctx.word('lorries') - 0.3;
        if (ts < tl) cam(g.world(-1.2, 2.4, -9.5), g.world(0, 0.9, 6), 44); else cam(V(g.x + 9, 14, g.z + 18), V(g.x - 2.5, 0, g.z - 18), 42);
        ctx.label('GARY', g.world(0, 2.2, 0), ctx.word('gary') - 0.1, 99, { bg: '#1f6bff' }); ctx.tag('70 LIMIT', ctx.word('seventy') - 0.15, tl, { col: 'yellow' }); ctx.tag('OVERTAKING LORRIES', tl, ctx.word('exactly') - 0.1, { col: 'green' }); ctx.tag('EXACTLY 70', ctx.word('exactly') - 0.1, 99, { col: 'green' }); } },
    // 3 Brandon comes up fast and sits on the bumper
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const b = O.bmw, g = O.gary; const tb = ctx.word('sits') - 0.2;
        if (ts < tb) cam(b.world(-1.4, 1.0, 7.5), b.world(0, 0.8, 0), 34); else cam(V(g.x + 3.8, 1.4, g.z + 9.5), V(g.x, 0.9, g.z + 2.0), 40);
        ctx.label('BRANDON', b.world(0, 2.1, 0), ctx.word('brandon') - 0.1, tb, { bg: '#e63946' }); ctx.tag('BLACK BMW', ctx.word('black') - 0.1, tb, { col: 'red' }); ctx.tag('ON HIS BUMPER', tb, 99, { col: 'red' }); } },
    // 4 one metre at 70 (no time to stop)
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const g = O.gary, b = O.bmw; const tn = ctx.word('no') - 0.2;
        cam(V(9.5, 2.0, g.z + 2.65), V(g.x, 0.8, g.z + 2.65), 52); gapMark(ctx, g, b, '#ff4a4a');
        ctx.tag('1 METRE', 0.2, tn, { col: 'red' }); ctx.tag('NO TIME TO STOP', tn, 99, { col: 'red' }); } },
    // 5 full beams: flash flash flash
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const g = O.gary; const tf = ctx.word('flash') - 0.1;
        flashBeams(O, ctx); const b = O.bmw;
        cam(V(5.6, 1.7, g.z - 1.5), b.world(0, 0.9, 1.6), 40);
        ctx.tag('FULL BEAM', tf, ctx.word('move') - 0.15, { col: 'red' }); ctx.tag('"MOVE OVER!"', ctx.word('move') - 0.15, 99, { col: 'red' }); } },
    // 6 Gary can't move over: lorries on his left
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const g = O.gary; cam(V(g.x + 7, 16, g.z + 16), V(g.x - 2, 0, g.z - 6), 42); flashBeams(O, ctx, 0.6);
        ctx.tag("CAN'T MOVE OVER", ctx.word("can't") - 0.15, ctx.word('lorries') - 0.15, { col: 'yellow' }); ctx.tag('LORRIES ON HIS LEFT', ctx.word('lorries') - 0.15, 99, { col: 'yellow' }); } },
    // 7 Gary taps the brakes. Hard.
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const g = O.gary; const th = ctx.word('taps') - 0.3;
        if (ts < th) { g.glass.opacity = 0.15; O.drv.expr('smug'); cam(g.world(-0.3, 1.5, 2.7), g.world(-0.4, 1.25, -0.1), 32); } else cam(V(g.x + 3.4, 1.2, g.z + 8.5), V(g.x, 0.9, g.z + 2), 40);
        ctx.tag('WHAT WE WANT TO DO', ctx.word('want') - 0.15, th, { col: 'yellow' }); ctx.tag('BRAKE CHECK', ctx.word('hard') - 0.15, 99, { col: 'red' }); } },
    // 8 Brandon locks up and swerves
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const g = O.gary, b = O.bmw;
        if (ts < 1.2) { b.glass.opacity = 0.1; O.bd.expr('shock'); cam(b.world(-0.25, 1.5, 2.75), b.world(-0.4, 1.25, -0.1), 32); } else cam(V(g.x + 8, 11, g.z + 15), V(g.x, 0, g.z + 3), 40);
        smoke(ctx, b, t); ctx.tag('LOCKS UP', ctx.word('locks') - 0.15, ctx.word('swerves') - 0.1, { col: 'red' }); ctx.tag('INCHES FROM A CRASH', ctx.word('inches') - 0.15, 99, { col: 'red' }); } },
    // 9 police saw it, pulls both over
    { update(ctx) { const { O, ts, t } = ctx; const tp = ctx.word('pulls') - 0.3;
        if (ts < tp) { place(O, t); const p = O.pol; cam(p.world(-1.6, 1.3, 6.0), p.world(0, 1.2, 0), 38); ring(ctx, p.world(0, 1.2, 0), ctx.word('police') - 0.2, ''); }
        else { layby(O, t); cam(V(LBX + 9, 12, LB + 22), V(LBX, 0, LB - 2), 40); }
        ctx.tag('POLICE', ctx.word('police') - 0.15, tp, { col: 'red' }); ctx.tag('BOTH PULLED OVER', tp, 99, { col: 'red' }); } },
    // 10 who's right?
    { update(ctx) { const { O, t } = ctx; layby(O, t); cam(V(LBX + 12, 20, LB + 26), V(LBX, 0, LB - 4), 40); ctx.tag("WHO'S RIGHT?", 0.1, 99, { col: 'yellow' }); } },
    // 11 rule 126: two second gap; tailgating careless driving
    { update(ctx) { const { O, ts } = ctx; place(O, 21.4 + ts * 0.15); const g = O.gary, b = O.bmw; const tc = ctx.word('careless') - 0.2, th = ctx.word('hundred') - 0.2;
        if (ts < tc) { cam(V(g.x + 14, 26, g.z + 40), V(g.x, 0, g.z + 30), 44); twoSec(ctx, g); } else cam(V(9.5, 2.0, g.z + 2.65), V(g.x, 0.8, g.z + 2.65), 52);
        ctx.tag('RULE 126', 0.1, ctx.word('two') - 0.15, { col: 'green' }); ctx.tag('2 SECONDS = 62 M AT 70', ctx.word('two') - 0.15, tc, { col: 'green' }); ctx.tag('CARELESS DRIVING', tc, th, { col: 'red' }); ctx.tag('£100 + 3 POINTS', th, 99, { col: 'red' }); } },
    // 12 rule 110: flash only to let others know you're there
    { update(ctx) { const { O, ts } = ctx; place(O, 29.2 + ts * 0.35); const b = O.bmw; flashBeams(O, ctx); cam(V(5.6, 1.8, b.z - 7), b.world(0, 0.8, 1.8), 38);
        ctx.tag('RULE 110', 0.1, ctx.word('never') - 0.15, { col: 'red' }); ctx.tag('NEVER TO INTIMIDATE', ctx.word('never') - 0.15, 99, { col: 'red' }); } },
    // 13 braking hard to teach a lesson: careless too
    { update(ctx) { const { O, ts } = ctx; place(O, 39.1 + ts * 0.45); const g = O.gary, b = O.bmw; smoke(ctx, b, 39.1 + ts * 0.45);
        cam(V(g.x + 8, 11, g.z + 15), V(g.x, 0, g.z + 3), 40);
        ctx.tag('TEACH HIM A LESSON?', ctx.word('lesson') - 0.2, ctx.word('crash') - 0.2, { col: 'yellow' }); ctx.tag('CRASH RISK', ctx.word('crash') - 0.2, ctx.word('careless') - 0.2, { col: 'red' }); ctx.tag('CARELESS TOO', ctx.word('careless') - 0.2, 99, { col: 'red' }); } },
    // 14 the right move: ease off gently, finish the overtake, move left
    { update(ctx) { const { O, ts } = ctx; rightMove(O, ts); const g = O.gary;
        cam(V(g.x + 10, 15, g.z + 20), V(g.x - 1, 0, g.z - 6), 42);
        ctx.tag('EASE OFF GENTLY', ctx.word('gently') - 0.2, ctx.word('finish') - 0.1, { col: 'green' }); ctx.tag('FINISH THE OVERTAKE', ctx.word('finish') - 0.1, ctx.word('left') - 0.2, { col: 'green' }); ctx.tag('MOVE LEFT, LET HIM GO', ctx.word('left') - 0.2, 99, { col: 'green' }); } },
    // 15 Brandon guilty, Gary half right
    { update(ctx) { const { O, ts, t } = ctx; layby(O, t); cam(V(LBX + 10 + ts * 0.5, 7 + ts * 1.5, LB + 18 + ts), V(LBX, 0.5, LB - 2), 40);
        ctx.tag('BRANDON: GUILTY', ctx.word('guilty') - 0.2, ctx.word('half') - 0.15, { col: 'red' }); ctx.tag('GARY: HALF RIGHT', ctx.word('half') - 0.15, ctx.word('would') - 0.1, { col: 'yellow' });
        ctx.tag('WOULD YOU HAVE TAPPED THE BRAKES?', ctx.word('would') - 0.1, 99, { col: 'yellow' }); ctx.tag('FOLLOW FOR CASE 007', ctx.word('follow') - 0.1, 99, { col: 'yellow', y: 1420 }); } },
  ],
};
export default VIDEO;

// ------------------------------------------------------------ state
function place(O, t) {
  const gz = zG(t), braking = t > TB - 0.05 && t < TB + 1.7;
  O.gary.set(L2, gz, HN); O.gary.brake(braking); O.gary.g.visible = true;
  const bz = gz + dB(t), bx = xB(t); const bh = Math.PI - Math.atan2(xB(t + 0.05) - xB(t - 0.05), 3.1);
  O.bmw.set(bx, bz, bh); O.bmw.brake(t > TB + 0.25 && t < TB + 2.2); O.bmw.g.visible = true;
  O.pol.set(L2, gz + dB(t) + dP(t), HN); O.pol.police(t, t > 44.6); O.pol.brake(false); O.pol.g.visible = true;
  O.lorries.forEach((l, i) => { l.set(L1, lorryZ(i, t), HN); l.brake(false); l.g.visible = true; });
  setMood('day', V(0, 0, gz)); scene.fog.color.set(0xd3e2ec); scene.fog.near = 120; scene.fog.far = 1300;
  O.opp.forEach((c, i) => { const z = gz - 450 + ((t * 58 + i * 151) % 900); c.set([7.85, 11.35][i % 2], z, 0); });
}
// all three stopped in the lay-by; officer at Brandon's passenger side
function layby(O, t) {
  O.gary.set(LBX, LB - 9, HN); O.bmw.set(LBX, LB, HN); O.pol.set(LBX, LB + 9.5, HN); [O.gary, O.bmw, O.pol].forEach(c => { c.brake(true); c.g.visible = true; }); O.pol.police(t, true);
  O.lorries.forEach(l => l.g.visible = false);
  const c = O.cop; c.g.visible = true; c.at(LBX - 1.45, LB + 0.4, Math.PI / 2).stand();
  setMood('day', V(LBX, 0, LB)); scene.fog.color.set(0xd3e2ec); scene.fog.near = 120; scene.fog.far = 1300;
  O.opp.forEach((c2, i) => { const z = LB - 450 + ((t * 58 + i * 151) % 900); c2.set([7.85, 11.35][i % 2], z, 0); });
}
// demo of the right move on an empty stretch near z ~ 120: Gary eases off, completes the overtake of the last lorry, moves left; Brandon passes
function rightMove(O, ts) {
  const R = 140 - V70 * ts; const lz = R + 2 + (V70 - VL) * ts - 14;
  O.lorries.forEach((l, i) => { l.g.visible = i === 0; }); O.lorries[0].set(L1, lz + 8, HN);
  const k = smooth(clamp01((ts - 3.2) / 1.6)); const gx = lerp(L2, L1, k);
  O.gary.set(gx, R - 3, HN - 0.12 * Math.sin(Math.PI * k)); O.gary.brake(false); O.gary.g.visible = true;
  const bpass = smooth(clamp01((ts - 4.3) / 1.6)); O.bmw.set(L2, R + 12 - bpass * 40, HN); O.bmw.brake(false);
  O.pol.g.visible = false; setMood('day', V(0, 0, R)); scene.fog.color.set(0xd3e2ec);
}
function flashBeams(O, ctx, k = 1) { const ph = ctx.t * 2.2; O.beam(Math.floor(ph * 2) % 2 === 0 && k > 0.5); }
function gapMark(ctx, g, b, col) { const a = toScreen(g.world(0.95, 0.6, -2.2)), c = toScreen(b.world(-0.95, 0.6, 2.2)); const y = Math.min(a.y, c.y) - 40;
  ctx.html(`<div style="position:absolute;left:${Math.min(a.x, c.x)}px;top:${y}px;width:${Math.abs(c.x - a.x)}px;height:0;border-top:10px solid ${col}"></div>`); }
function twoSec(ctx, g) { const a = toScreen(g.world(1.3, 0.1, -2.3)), c = toScreen(g.world(1.3, 0.1, -2.3 - 62.6)); const len = Math.hypot(c.x - a.x, c.y - a.y), ang = Math.atan2(c.y - a.y, c.x - a.x) * 180 / Math.PI;
  ctx.html(`<div style="position:absolute;left:${a.x}px;top:${a.y}px;width:${len}px;height:0;border-top:10px dashed #22c55e;transform-origin:0 0;transform:rotate(${ang}deg)"></div>`); }
function smoke(ctx, b, t) { if (t < TB + 0.5 || t > TB + 1.9) return; for (const sx of [-0.8, 0.8]) { const s = toScreen(b.world(sx, 0.2, 1.4)); const k = (t - TB - 0.5) / 1.4;
  ctx.html(`<div style="position:absolute;left:${s.x - 60}px;top:${s.y - 60}px;width:120px;height:120px;border-radius:50%;background:radial-gradient(rgba(235,235,235,${0.75 - k * 0.5}),rgba(235,235,235,0));transform:scale(${1 + k * 1.5})"></div>`); } }
function ring(ctx, p, from, text) {
  if (ctx.ts < from) return; const s = toScreen(p); const k = easeOut(seg(ctx.ts, from, from + 0.3));
  ctx.html(`<div style="position:absolute;left:${s.x}px;top:${s.y}px;width:260px;height:190px;margin:-95px 0 0 -130px;border:8px solid #ff4a4a;border-radius:50%;transform:scale(${1.5 - 0.5 * k}) rotate(-12deg);opacity:${k}"></div>` + (text ? `<div class="tag red" style="left:${s.x}px;top:${s.y + 150}px;opacity:${k};font-size:40px">${text}</div>` : ''));
}
