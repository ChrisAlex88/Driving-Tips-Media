// Road Court — Case 004: the speed camera. Red-ring 50 with average speed cameras. Kev brakes at each camera and floors it between.
// Traffic heads north (-z, heading PI). Lanes: L1 -3.5, L2 0, L3 3.5. Hard shoulder -6.9.
import { THREE, V, lerp, seg, easeOut, smooth, mat, box, sbox, Car, HERO, Person, addFace, hoodie, makeSeated,
  cam, toScreen, lights, setMood, scene, crashBarrier, mulberry, countryside, glasses, treeBelt, canvasTex, gantry, avgSpeedSign, house } from '../engine.js';

const HN = Math.PI, L1 = -3.5, L2 = 0, L3 = 3.5;
const V70 = 31.3, V50 = 22.35, V40 = 17.9;
const clamp01 = k => Math.min(1, Math.max(0, k));
const pw = (pts, t) => { if (t <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return lerp(va, vb, smooth((t - a) / (b - a))); } return pts[pts.length - 1][1]; };
const vK = t => pw([[0, V70], [22.5, V70], [23.5, 35.8], [26.3, 35.8], [26.9, 33],  [28.3, V40], [29.8, V50], [37.8, V50], [40.3, V70], [40.6, V70], [41.8, V40], [43.0, V50], [43.5, V50], [45.5, V70], [46.4, V70], [47.4, V50], [999, V50]], t);
const vG = t => V50 - (t > 27.4 && t < 30.0 ? 2.9 * Math.sin(Math.PI * (t - 27.4) / 2.6) : 0);
const kevX = t => pw([[0, L2], [24.6, L2], [25.9, L1], [42.3, L1], [44.5, L3], [999, L3]], t);
// integrate positions once
const DT = 0.01, N = 12000, ZG = new Float32Array(N), ZK = new Float32Array(N);
for (let i = 1; i < N; i++) { const t = i * DT; ZG[i] = ZG[i - 1] - vG(t) * DT; ZK[i] = ZK[i - 1] - vK(t) * DT; }
const at = (A, t) => { const f = Math.max(0, Math.min(N - 2, t / DT)), i = Math.floor(f); return lerp(A[i], A[i + 1], f - i); };
const KOFF = 50 - (at(ZK, 17.45) - at(ZG, 17.45));
const zG = t => at(ZG, t), zK = t => at(ZK, t) + KOFF;
const brakingK = t => vK(t + 0.05) < vK(t - 0.05) - 0.02;
const CAM_A = zK(34.2), CAM_B = zK(41.7), CAM_C = zK(47.3);
const HOUSE = V(-150, 0, 150);

const VIDEO = {
  episode: 'CASE 004', wordCaps: true,
  build() {
    lights('day');
    const Z0 = 320, Z1 = -1800, L = Z0 - Z1, ZC = (Z0 + Z1) / 2;
    countryside({ cx: 0, cz: -700, grass: '#7fa36a', clearX: 90, clearZ: 1150, avoid: (x, z) => Math.abs(x - HOUSE.x) < 40 && Math.abs(z - HOUSE.z) < 40 });
    box(600, 0.02, L + 600, mat('#7fa36a', { r: 1 }), V(-60, -0.16, ZC + 100), null, { cast: false });
    const asph = mat('#45494f', { r: .92 }), white = new THREE.MeshStandardMaterial({ color: '#ecece6', roughness: .6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    box(17.1, 0.16, L, asph, V(-1.65, -0.07, ZC), null, { cast: false });
    box(11.0, 0.16, L, asph, V(13.25, -0.07, ZC), null, { cast: false });
    box(1.1, 0.17, L, mat('#7c9f69', { r: 1 }), V(7.45, -0.065, ZC), null, { cast: false });
    for (const x of [-8.55, -5.25, 5.25, 8.1, 18.6]) box(x === -5.25 ? 0.2 : 0.15, 0.02, L, white, V(x, 0.015, ZC), null, { cast: false });
    const n = Math.floor(L / 12), geo = new THREE.BoxGeometry(0.15, 0.02, 3), m4 = new THREE.Matrix4();
    for (const x of [-1.75, 1.75, 11.5, 15.0]) { const im = new THREE.InstancedMesh(geo, white, n); for (let i = 0; i < n; i++) { m4.makeTranslation(x, 0.015, Z1 + i * 12 + 1.5); im.setMatrixAt(i, m4); } scene.add(im); }
    crashBarrier(6.6, Z1, Z0);
    treeBelt([-16, -70], Z0, Z1, 1000, 14); treeBelt([24, 80], Z0, Z1, 1000, 19);
    { const bg = new THREE.IcosahedronGeometry(1, 1), nb = Math.floor(L / 2.6), im = new THREE.InstancedMesh(bg, mat('#5a8a48', { flat: true, r: 1 }), nb * 2); const R = mulberry(7); const q = new THREE.Quaternion(), s = V(1, 1, 1), p = V(0, 0, 0); let c = 0;
      for (let i = 0; i < nb; i++) for (const x of [-12.5, 21.5]) { const k = 1.0 + R() * 0.6; p.set(x + R() * 0.6, 0.5 * k, Z1 + i * 2.6); s.set(k * 1.1, k * 0.8, k * 1.1); m4.compose(p, q, s); im.setMatrixAt(c++, m4); } scene.add(im); }
    // gantries: camera gantries where Kev brakes, plain red-ring 50 gantries in between
    this.gA = gantry(CAM_A, { cams: true }); gantry(CAM_B, { cams: true }); gantry(CAM_C, { cams: true });
    for (let z = zG(10.6) - 40; z > Z1 + 50; z -= 230) if ([CAM_A, CAM_B, CAM_C].every(c => Math.abs(c - z) > 90)) gantry(z);
    avgSpeedSign(-10.6, zG(13.6) - 32); avgSpeedSign(-10.6, CAM_A + 260);
    // Kev's house for the letter
    house(HOUSE.x, HOUSE.z, 0, { col: '#e6d8bf', w: 8, d: 7 });
    box(4, 0.04, 12, mat('#9a968e', { r: .9 }), V(HOUSE.x + 6, 0.02, HOUSE.z + 6), null, { cast: false });
    box(0.15, 0.9, 12, mat('#5a8a48'), V(HOUSE.x - 5, 0.45, HOUSE.z + 9));
    // people and vehicles
    const gary = new Car(HERO, { interior: true, lplate: false });
    const drv = addFace(hoodie(makeSeated(gary, new Person({ shirt: '#d62828', pants: '#2c3550', hair: '#3a2a1e', skin: '#c98d5e' }), -0.4, 0.1)));
    drv.shL.rotation.set(-1.05, 0, 0.05); drv.shR.rotation.set(-1.05, 0, -0.05);
    const kev = new Car('#c8102e', { interior: true, plate: 'KV24 FST' }); kev.g.scale.set(1.06, 0.78, 1.08);
    sbox(1.6, 0.06, 0.32, 0.03, mat('#111317', { r: .4 }), V(0, 1.1, -1.95), kev.g); for (const sx of [-0.6, 0.6]) box(0.06, 0.16, 0.12, mat('#111317'), V(sx, 1.0, -1.95), kev.g);
    const kd = glasses(addFace(makeSeated(kev, new Person({ shirt: '#1c1c1f', pants: '#2b2b30', hair: '#1a1a1a', skin: '#d9a27a' }), -0.4, 0.1)), '#111', '#151820');
    kd.shL.rotation.set(-1.05, 0, 0.05); kd.shR.rotation.set(-1.05, 0, -0.05);
    const kevS = glasses(addFace(new Person({ shirt: '#1c1c1f', pants: '#2b2b30', hair: '#1a1a1a', skin: '#d9a27a' })), '#111', '#151820'); kevS.g.visible = false;
    const lt = canvasTex(256, 340, (c, w, h) => { c.fillStyle = '#fbfbf8'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = '800 22px "Inter Display",sans-serif'; c.textAlign = 'center'; c.fillText('NOTICE OF INTENDED', w / 2, 46); c.fillText('PROSECUTION', w / 2, 74);
      c.font = '600 18px "Inter Display",sans-serif'; c.textAlign = 'left'; ['Vehicle: KV24 FST', 'Average speed: 68 mph', 'Speed limit: 50 mph', 'Location: motorway'].forEach((s, i) => c.fillText(s, 22, 128 + i * 34)); c.fillStyle = '#c8102e'; c.fillRect(22, 270, 212, 6); });
    const letter = new THREE.Group(); const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.34), new THREE.MeshStandardMaterial({ map: lt, roughness: .8 }));
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.34), mat('#f4f4f0', { r: .8 })); lb.rotation.y = Math.PI; lb.position.z = -0.002; letter.add(lf, lb);
    letter.position.set(0, -0.62, 0.08); letter.rotation.set(Math.PI / 2 - 0.45, Math.PI, 0); kevS.shR.add(letter);
    const opp = ['#eceff1', '#30343a', '#a51c30', '#9aa3ad', '#2f5d8a', '#c9a227'].map((c, i) => new Car(c, { plate: 'OP' + (40 + i) + ' CAR' }));
    const traffic = ['#e9ecef', '#2b2d42', '#8d99ae', '#3a7d44', '#5e548e'].map((c, i) => new Car(c, { plate: 'TR' + (50 + i) + ' FLW' }));
    return { gary, drv, kev, kd, kevS, opp, traffic };
  },
  frame(ctx) {
    const { O, t } = ctx; O.kevS.g.visible = false; O.kd.g.visible = true; O.drv.expr('neutral'); O.kd.expr('smug'); O.kd.headG.rotation.set(0, 0, 0);
    O.gary.glass.opacity = 0.45; O.kev.glass.opacity = 0.45; place(O, t);
  },
  segs: [
    // 0 cold open: Kev slams the brakes ahead of Gary
    { update(ctx) { const { O, ts } = ctx; place(O, 25.8 + ts * 0.62); const k = O.kev;
        cam(O.gary.world(1.2, 2.6, -9), k.world(0, 0.8, 0), 34);
        ring(ctx, k.world(0, 0.9, 0), 0.2, ''); ctx.tag('BEAT THE CAMERAS?', 0.3, ctx.word('slam') - 0.1, { col: 'yellow' }); ctx.tag('SLAM THE BRAKES', ctx.word('slam') - 0.1, ctx.word('floor') - 0.1, { col: 'red' }); ctx.tag('THEN FLOOR IT', ctx.word('floor') - 0.1, 99, { col: 'red' }); } },
    // 1 case four
    { update(ctx) { const { O, ts } = ctx; place(O, 20); cam(V(-1.2, 3.6, CAM_A + 16), V(0.6, 6.4, CAM_A), 40); ctx.tag('THE SPEED CAMERA', ctx.word('camera') - 0.3, 99, { col: 'red' }); } },
    // 2 gantries 50, average speed check, Gary cruise 50
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const g = O.gary; const ta = ctx.word('average') - 0.2, tg = ctx.word('gary') - 0.2;
        if (ts < ta) cam(g.world(0.8, 2.0, -7.5), g.world(1.5, 5.5, 30), 46); else if (ts < tg) cam(V(-7.8, 2.2, zG(13.6) - 20), V(-10.6, 2.5, zG(13.6) - 32), 34); else cam(g.world(-1.2, 2.2, -8.5), g.world(0, 0.9, 6), 44);
        ctx.tag('50 IN A RED RING', ctx.word('fifty') - 0.15, ta, { col: 'red' }); ctx.tag('AVERAGE SPEED CHECK', ta, tg, { col: 'yellow' }); ctx.label('GARY', g.world(0, 2.2, 0), tg, 99, { bg: '#1f6bff' }); ctx.tag('CRUISE: 50', ctx.word('cruise') - 0.1, 99, { col: 'green' }); } },
    // 3 Kev, sports car, 70
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const k = O.kev;
        if (ts < 2.4) cam(k.world(-1.6, 1.0, 6.5), k.world(0, 0.8, 0), 34); else cam(k.world(-2.2, 1.6, -7.5), k.world(0, 0.8, 4), 42);
        ctx.label('KEV', k.world(0, 2.0, 0), ctx.word('kev') - 0.1, 99, { bg: '#e63946' }); ctx.tag('70 MPH', ctx.word('seventy') - 0.15, 99, { col: 'red' }); } },
    // 4 flies past, cuts in, slams the brakes
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const g = O.gary, k = O.kev; const tsl = ctx.word('slams') - 0.2;
        if (ts < tsl - 1.6) cam(V(g.x - 9, 12, g.z + 16), V(g.x + 1, 0, g.z - 18), 42); else cam(g.world(-0.7, 2.0, -6.5), k.world(0, 0.8, 0), 40);
        ctx.tag('FLIES PAST', 0.2, ctx.word('cuts') - 0.15, { col: 'red' }); ctx.tag('CUTS IN', ctx.word('cuts') - 0.15, tsl, { col: 'red' }); ctx.tag('SLAMS THE BRAKES', tsl, 99, { col: 'red' }); } },
    // 5 Gary's two second gap
    { update(ctx) { const { O, t } = ctx; place(O, t); const g = O.gary, k = O.kev;
        cam(V(g.x - 13, 19, g.z + 18), V((g.x + k.x) / 2, 0, (g.z + k.z) / 2 + 2), 44);
        ctx.tag('2 SECOND GAP', ctx.word('two') - 0.15, 99, { col: 'green' }); gapLine(ctx, g, k); } },
    // 6 crawls past the camera at 50, no flash, laughing
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const k = O.kev; const tl = ctx.word("he's") - 0.2;
        if (ts < tl) cam(V(-7.4, 2.6, k.z + 16), V(-2.0, 3.2, k.z - 6), 46); else { k.glass.opacity = 0.12; O.kd.expr(Math.floor(ts * 5) % 2 ? 'shock' : 'smug'); O.kd.headG.rotation.z = Math.sin(ts * 9) * 0.06; cam(k.world(-0.25, 1.5, 2.75), k.world(-0.4, 1.2, -0.1), 32); }
        ctx.tag('50 MPH', ctx.word('fifty') - 0.15, ctx.word('no') - 0.1, { col: 'green' }); ctx.tag('NO FLASH', ctx.word('no') - 0.1, tl, { col: 'yellow' }); ctx.tag('LAUGHING', tl, 99, { col: 'yellow' }); } },
    // 7 floors it to 70, brakes at the next camera
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const k = O.kev; const tb = ctx.word('next') - 0.3;
        if (ts < tb) cam(k.world(-1.6, 1.4, -8.0), k.world(0, 0.8, 4), 44); else cam(V(-7.4, 2.6, k.z + 16), V(-2.0, 3.2, k.z - 6), 46);
        ctx.tag('FLOORS IT', 0.3, ctx.word('seventy') - 0.15, { col: 'red' }); ctx.tag('70 MPH', ctx.word('seventy') - 0.15, tb, { col: 'red' }); ctx.tag('BRAKES', ctx.word('brakes') - 0.15, 99, { col: 'red' }); } },
    // 8 changes lanes
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const k = O.kev; const tr = ctx.word('right') - 0.2;
        cam(V(k.x - 10, 15, k.z + 20), V(k.x + 1, 0, k.z - 10), 42);
        ctx.tag('CHANGES LANES', ctx.word('changes') - 0.15, tr, { col: 'yellow' }); ctx.tag('RIGHT?', tr, 99, { col: 'yellow' }); } },
    // 9 two weeks later: the letter
    { update(ctx) { const { O, ts } = ctx; letterScene(O, ts > ctx.word('doormat') - 0.2 ? 'shock' : 'neutral');
        if (ts < 1.6) cam(V(HOUSE.x + 9, 3.2, HOUSE.z + 17), V(HOUSE.x + 1, 1.4, HOUSE.z + 5.5), 40); else if (ts < ctx.word('doormat') - 0.2) cam(V(HOUSE.x + 0.3, 2.1, HOUSE.z + 4.75), V(HOUSE.x + 0.72, 1.25, HOUSE.z + 6.05), 42); else cam(V(HOUSE.x + 0.75, 1.9, HOUSE.z + 9.0), V(HOUSE.x + 1.0, 1.75, HOUSE.z + 5.6), 30);
        ctx.tag('2 WEEKS LATER', 0.1, ctx.word('letter') - 0.1, { col: 'yellow' }); ctx.tag('THE LETTER', ctx.word('letter') - 0.1, 99, { col: 'red', y: 1500 }); } },
    // 10 who's right?
    { update(ctx) { const { O } = ctx; place(O, 33.4); cam(V(-16, 26, CAM_A + 70), V(0, 0, CAM_A - 20), 42); ctx.tag("WHO'S RIGHT?", 0.1, 99, { col: 'yellow' }); } },
    // 11 rule 261 red ring
    { update(ctx) { const { O, ts } = ctx; place(O, 20); cam(V(-2.2 + ts * 0.1, 4.2, CAM_A + 13 - ts * 0.4), V(0, 5.9, CAM_A), 38);
        ctx.tag('RULE 261', 0.1, ctx.word('red') - 0.15, { col: 'red' }); ctx.tag('RED RING = LEGAL LIMIT', ctx.word('red') - 0.15, 99, { col: 'red' }); } },
    // 12 average speed: camera A to camera B, replay of Kev
    { update(ctx) { const { O, ts } = ctx; place(O, 33.6 + ts * 1.15); const mid = (CAM_A + CAM_B) / 2;
        cam(V(-14, 165, mid + 160), V(0, 0, mid + 8), 50);
        ctx.label('CAMERA A', V(0, 8, CAM_A), 0.3, 99, { bg: '#e8b100' }); ctx.label('CAMERA B', V(0, 8, CAM_B), 0.9, 99, { bg: '#e8b100' }); ctx.label('KEV', O.kev.world(0, 2.4, 0), 0.3, 99, { bg: '#e63946' });
        ctx.tag('A → B: TIMED', ctx.word('time') - 0.15, ctx.word('braking') - 0.1, { col: 'yellow' }); ctx.tag('AVERAGE SPEED', ctx.word('braking') - 0.1, 99, { col: 'red' }); } },
    // 13 every lane, no flash
    { update(ctx) { const { O, ts } = ctx; place(O, 20); const tf = ctx.word("don't") - 0.2;
        cam(V(-1.0 + ts * 0.15, 5.0, CAM_B + 9), V(0.8, 7.0, CAM_B), 44);
        ctx.tag('EVERY LANE', ctx.word('every') - 0.15, tf, { col: 'yellow' }); ctx.tag('NO FLASH ≠ NOT CAUGHT', tf + 0.6, 99, { col: 'red' }); } },
    // 14 Kev averaged 68: court, 4-6 points or a ban
    { update(ctx) { const { O, ts } = ctx; letterScene(O, 'shock'); const tc = ctx.word('court') - 0.15, tb = ctx.word('four') - 0.15;
        if (ts < tc) cam(V(HOUSE.x + 0.3, 2.1, HOUSE.z + 4.75), V(HOUSE.x + 0.72, 1.25, HOUSE.z + 6.05), 42); else cam(V(HOUSE.x + 0.75, 1.9, HOUSE.z + 9.0), V(HOUSE.x + 1.0, 1.75, HOUSE.z + 5.6), 30);
        ctx.tag('AVERAGE: 68 IN A 50', 0.2, tc, { col: 'red', y: 1500 }); ctx.tag('COURT', tc, tb, { col: 'red' }); ctx.tag('4-6 POINTS OR A BAN', tb, 99, { col: 'red' }); } },
    // 15 slamming the brakes: careless driving
    { update(ctx) { const { O, ts } = ctx; place(O, 26.6 + ts * 0.5); const g = O.gary;
        cam(g.world(-0.7, 2.0, -6.5), O.kev.world(0, 0.8, 0), 40); ctx.tag('CARELESS DRIVING', ctx.word('careless') - 0.15, 99, { col: 'red' }); } },
    // 16 Gary not guilty
    { update(ctx) { const { O, ts } = ctx; place(O, 36); O.gary.glass.opacity = 0.15; O.drv.expr(ts > 0.9 ? 'smug' : 'neutral');
        cam(O.gary.world(-0.3, 1.5, 2.7), O.gary.world(-0.4, 1.25, -0.1), 32); ctx.tag('50 ALL THE WAY', 0.1, ctx.word('not') - 0.2, { col: 'green' }); ctx.tag('GARY: NOT GUILTY', ctx.word('not') - 0.2, 99, { col: 'green' }); } },
    // 17 Kev guilty; would you have braked?
    { update(ctx) { const { O, ts } = ctx; letterScene(O, 'shock'); cam(V(HOUSE.x + 9 + ts * 0.6, 3.0 + ts * 0.5, HOUSE.z + 16 + ts * 0.8), V(HOUSE.x + 1.5, 1.3, HOUSE.z + 5.5), 38);
        ctx.tag('KEV: GUILTY', 0.1, ctx.word('would') - 0.15, { col: 'red' }); ctx.tag('WOULD YOU BRAKE AT THE CAMERA?', ctx.word('would') - 0.15, 99, { col: 'yellow' }); ctx.tag('FOLLOW FOR CASE 005', ctx.word('follow') - 0.1, 99, { col: 'yellow', y: 1420 }); } },
  ],
};
export default VIDEO;

// ------------------------------------------------------------ state
function place(O, t) {
  const gz = zG(t), kz = zK(t), kx = kevX(t);
  const kh = Math.PI - Math.atan2(kevX(t + 0.05) - kevX(t - 0.05), zK(t - 0.05) - zK(t + 0.05));
  O.gary.set(L1, gz, HN); O.gary.brake(t > 27.3 && t < 29.6); O.gary.g.visible = true;
  O.kev.set(kx, kz, kh); O.kev.brake(brakingK(t)); O.kev.g.visible = true;
  // a few other cars spread out at 50 in lanes 2 and 3, well clear of Gary and Kev
  O.traffic.forEach((c, i) => { const z = gz - 220 - i * 190; c.set(i % 2 ? L3 : L2, z, HN); c.brake(false); c.g.visible = true; });
  setMood('day', V(0, 0, gz)); scene.fog.color.set(0xd3e2ec); scene.fog.near = 120; scene.fog.far = 1300;
  O.opp.forEach((c, i) => { const z = gz - 450 + ((t * 58 + i * 151) % 900); c.set([9.75, 13.25, 16.75][i % 3], z, 0); });
}
// Kev at his front door holding the letter; his car on the drive
function letterScene(O, face) {
  O.kev.set(HOUSE.x + 6, HOUSE.z + 7, Math.PI); O.kev.brake(false); O.kd.g.visible = false;
  const s = O.kevS; s.g.visible = true; s.at(HOUSE.x + 1.0, HOUSE.z + 5.6, 0).stand(); s.shR.rotation.set(-1.25, 0, 0.25); s.shL.rotation.set(-0.2, 0, 0.1); s.headG.rotation.x = 0.25; s.expr(face);
  O.gary.g.visible = false; O.traffic.forEach(c => c.g.visible = false);
  setMood('day', V(HOUSE.x, 0, HOUSE.z)); scene.fog.color.set(0xd3e2ec); scene.fog.near = 120; scene.fog.far = 1300;
}
// a green bracket between Gary and Kev showing the gap
function gapLine(ctx, g, k) {
  if (ctx.ts < ctx.word('two') - 0.15) return; const a = toScreen(g.world(-1.3, 0.2, 2.4)), b = toScreen(k.world(-1.3, 0.2, -2.4));
  const len = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
  ctx.html(`<div style="position:absolute;left:${a.x}px;top:${a.y}px;width:${len}px;height:0;border-top:8px dashed #22c55e;transform-origin:0 0;transform:rotate(${ang}deg)"></div>`);
}
function ring(ctx, p, from, text) {
  if (ctx.ts < from) return; const s = toScreen(p); const k = easeOut(seg(ctx.ts, from, from + 0.3));
  ctx.html(`<div style="position:absolute;left:${s.x}px;top:${s.y}px;width:260px;height:190px;margin:-95px 0 0 -130px;border:8px solid #ff4a4a;border-radius:50%;transform:scale(${1.5 - 0.5 * k}) rotate(-12deg);opacity:${k}"></div>` + (text ? `<div class="tag red" style="left:${s.x}px;top:${s.y + 150}px;opacity:${k};font-size:40px">${text}</div>` : ''));
}
