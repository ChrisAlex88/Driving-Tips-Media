// Road Court — Case 005: the junction (Rule H2). Gary turns left and stops for Margaret waiting to cross the side road.
// Wayne (white van) horns him, swings round, turns in and nearly hits her. Gary's dashcam has it all.
// Main road N-S x -3.5..3.5 (traffic north = heading PI, left lane x=-1.75). Side road to the WEST, z -3.5..3.5.
import { THREE, V, lerp, seg, easeOut, easeIO, smooth, mat, box, Ground, kerb, slab, tree, lamp, shop, bin, bollard, Car, HERO, Person, addFace, hoodie, makeSeated,
  cam, toScreen, lights, setMood, scene, glasses, Van, indicators } from '../engine.js';

const RD = 3.5, PV = 3.5, HN = Math.PI, HW = -Math.PI / 2, L1 = -1.75;
const NAMES = ['OAK & IRON BARBERS', 'THE CORNER CAFE', 'BAKERS DOZEN', 'PEARL DRY CLEANERS', 'QUICK PRINT', 'PIZZA ROMA', 'HIGH ST CHEMIST', 'THE COPPER KETTLE', 'BOOK NOOK', 'FRESH & GREEN', 'NAIL STUDIO', 'KEYS CUT HERE'];
const BRICKS = ['#9a4f3a', '#8c4a36', '#a85d44', '#7d4434', '#b0705a', '#8f5a48'];
const SIGNBG = ['#1f2a24', '#2b2140', '#5a1f1f', '#173248', '#2a2a2a', '#3d2a14'];
const clamp01 = k => Math.min(1, Math.max(0, k));
const pw = (pts, t) => { if (t <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return lerp(va, vb, smooth((t - a) / (b - a))); } return pts[pts.length - 1][1]; };
const CROSS_X = -7.0, GSTOP = 6.6, VSTOP = 14.2;

// Gary: approaches in lane 1, stops at the mouth; at the end turns into the side road
const garyZ = t => pw([[8.52, 46], [12.9, GSTOP]], t);
// Margaret: waits on the south corner, steps out, freezes when the van comes, then finishes crossing
const margZ = t => pw([[31.0, 4.75], [35.0, 2.25], [41.9, 2.25], [47.5, -4.7]], t);
// Wayne's van path (centre line), parameter u 0..1
const VP = [[L1, VSTOP], [1.35, 8.0], [1.25, 2.6], [-1.6, 1.75], [-3.45, 1.75]];
function cr(p0, p1, p2, p3, u) { const u2 = u * u, u3 = u2 * u; return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3); }
function vanAt(u) { const n = VP.length - 1, f = clamp01(u) * n, i = Math.min(n - 1, Math.floor(f)), k = f - i; const P = j => VP[Math.max(0, Math.min(n, j))];
  return [cr(P(i - 1)[0], P(i)[0], P(i + 1)[0], P(i + 2)[0], k), cr(P(i - 1)[1], P(i)[1], P(i + 1)[1], P(i + 2)[1], k)]; }
// progress over time: pulls out at 33.6, hard stop at 39.1
const vanU = t => { if (t < 33.6) return 0; if (t > 39.1) return 1; const k = (t - 33.6) / 5.5; return k < 0.3 ? 0.18 * (k / 0.3) ** 2 : 0.18 + 0.82 * (1 - (1 - (k - 0.3) / 0.7) ** 1.6); };
function vanPose(t) { const u = vanU(t), [x, z] = vanAt(u), [x2, z2] = vanAt(Math.min(1, u + 0.01)), [x0, z0] = vanAt(Math.max(0, u - 0.01)); return { x, z, h: Math.atan2(x2 - x0, z2 - z0) }; }

const VIDEO = {
  episode: 'CASE 005', wordCaps: true,
  build() {
    lights('day');
    const G = new Ground(240, 4096, 0, 0);
    G.rect(-120, -120, 120, 120, '#b9b4ab'); G.pavement(-120, -120, 120, 120, '#c4bfb5');
    G.asphalt(-RD, -120, RD, 120, '#3b3f46'); G.asphalt(-120, -RD, -RD, RD, '#3b3f46');
    G.line(0, -120, 0, 120, 0.12, '#eeeeea', 3, 6); G.line(-RD - 6, 0, -120, 0, 0.12, '#eeeeea', 3, 6);
    G.line(-RD - 0.35, -RD + 0.2, -RD - 0.35, 0, 0.2, '#eeeeea', 0.6, 0.3); G.line(-RD - 0.75, -RD + 0.2, -RD - 0.75, 0, 0.2, '#eeeeea', 0.6, 0.3);   // give-way lines
    // tactile paving at the dropped kerbs where Margaret crosses
    for (const z of [RD + 0.45, -RD - 0.45]) G.rect(CROSS_X - 0.8, z - 0.4, CROSS_X + 0.8, z + 0.4, '#c69a83');
    for (const s of [-1, 1]) { G.line(s * (RD - 0.25), RD + 0.5, s * (RD - 0.25), 120, 0.08, '#e8c21c'); G.line(s * (RD - 0.25), -RD - 0.5, s * (RD - 0.25), -120, 0.08, '#e8c21c'); }
    G.build();
    kerb(RD, -120, RD, 120); kerb(-RD, RD, -RD, 120); kerb(-RD, -RD, -RD, -120); kerb(-RD, RD, -120, RD); kerb(-RD, -RD, -120, -RD);
    slab(RD + 0.1, -120, 120, 120, 0.12, '#c9c4ba'); slab(-120, RD + 0.1, -RD - 0.1, 120, 0.12, '#c9c4ba'); slab(-120, -120, -RD - 0.1, -RD - 0.1, 0.12, '#c9c4ba');
    let n = 0; const D = 8, F = RD + PV + D / 2;
    const put = (x, z, r) => { shop(x, z, r, { w: 8, d: D, floors: 2 + (n % 3 === 0 ? 1 : 0), brick: BRICKS[n % 6], name: NAMES[n % NAMES.length], signBg: SIGNBG[n % 6], awning: n % 4 === 1 ? '#2f6b4f' : (n % 4 === 3 ? '#8a2b2b' : null) }); n++; };
    for (let i = -14; i <= 14; i++) put(F, i * 8.2, -Math.PI / 2);
    for (let i = 0; i < 14; i++) { put(-F, F + i * 8.2, Math.PI / 2); put(-F, -F - i * 8.2, Math.PI / 2); }
    for (let i = 1; i < 14; i++) { put(-F - i * 8.2, F, Math.PI); put(-F - i * 8.2, -F, 0); }
    // city beyond the detailed ground, fading into haze
    const FAR = 420, asph = mat('#3b3f46', { r: .95 });
    for (const s2 of [-1, 1]) { box(2 * RD, 0.02, FAR - 120, asph, V(0, 0.005, s2 * (120 + (FAR - 120) / 2)), null, { cast: false });
      slab(RD + 0.1, Math.min(s2 * 120, s2 * FAR), RD + 8, Math.max(s2 * 120, s2 * FAR), 0.12, '#c9c4ba'); slab(-RD - 8, Math.min(s2 * 120, s2 * FAR), -RD - 0.1, Math.max(s2 * 120, s2 * FAR), 0.12, '#c9c4ba'); }
    box(FAR - 120, 0.02, 2 * RD, asph, V(-(120 + (FAR - 120) / 2), 0.005, 0), null, { cast: false });
    box(2 * FAR, 0.01, 2 * FAR, mat('#b9b4ab', { r: 1 }), V(0, -0.3, 0), null, { cast: false });
    let m = 0; for (let d = 135; d < FAR; d += 9) { for (const s2 of [-1, 1]) for (const s3 of [-1, 1]) { const h = 7 + ((m * 37) % 9); m++; box(8.4, h, 9, mat(BRICKS[m % 6], { r: .9 }), V(s3 * F, h / 2, s2 * d), null, { cast: false }); }
      for (const s3 of [-1, 1]) { const h = 7 + ((m * 29) % 9); m++; box(9, h, 8.4, mat(BRICKS[m % 6], { r: .9 }), V(-d, h / 2, s3 * F), null, { cast: false }); } }
    for (const [x, z] of [[RD + 0.5, 9], [RD + 0.5, -9]]) bollard(x, z);
    bin(-RD - 0.9, 13.5); bin(RD + 0.9, -12); bin(-16, -RD - 0.9);
    for (const z of [18, 36, -22, -40]) { lamp(-RD - 0.7, z, Math.PI / 2); lamp(RD + 0.7, z + 9, -Math.PI / 2); }
    for (const x of [-20, -38]) { lamp(x, RD + 0.7, Math.PI); lamp(x - 9, -RD - 0.7, 0); }
    for (const [x, z] of [[-RD - 1.6, 26], [RD + 1.6, 30], [RD + 1.6, -26], [-28, -RD - 1.6], [-RD - 1.6, -32]]) tree(x, z, 0.9);
    // people and vehicles
    const gary = new Car(HERO, { interior: true, lplate: false }); const gInd = indicators(gary, 1);
    const drv = addFace(hoodie(makeSeated(gary, new Person({ shirt: '#d62828', pants: '#2c3550', hair: '#3a2a1e', skin: '#c98d5e' }), -0.4, 0.1)));
    drv.shL.rotation.set(-1.05, 0, 0.05); drv.shR.rotation.set(-1.05, 0, -0.05);
    const van = new Van('#f1f2f3', { plate: 'WY19 RSH' }); const vInd = indicators(van, 1, { w: 1.0, zf: 2.62, zr: -2.6, y: 1.0 });
    const way = addFace(van.seat(new Person({ shirt: '#3b5b7a', pants: '#2b2b30', hair: '#6b4a2e', skin: '#e3b48b' })), { brow: '#4a3220' });
    way.shL.rotation.set(-1.0, 0, 0.05); way.shR.rotation.set(-1.0, 0, -0.05);
    const marg = glasses(addFace(new Person({ shirt: '#6a4c93', pants: '#4a4a4f', hair: '#dcdcdc', skin: '#f0c8a8' }), { brow: '#bdbdbd' }), '#5a4a3a');
    const bag = new THREE.Group(); bag.position.set(0, -0.62, 0.06); marg.shL.add(bag); box(0.26, 0.3, 0.12, mat('#e9e2c6', { r: .8 }), V(0, -0.15, 0), bag); box(0.02, 0.14, 0.02, mat('#8a7a5a'), V(0.06, 0.03, 0), bag); box(0.02, 0.14, 0.02, mat('#8a7a5a'), V(-0.06, 0.03, 0), bag);
    const peds = [['#2a9d8f', '#264653'], ['#e76f51', '#2b2b30'], ['#457b9d', '#1d3557']].map(([s, p], i) => addFace(new Person({ shirt: s, pants: p, hair: ['#2a1a10', '#c19a6b', '#111'][i], skin: ['#c98d5e', '#f0c08a', '#8d5524'][i] })));
    const parked = [['#b5b8bd', 'PK61 ABC'], ['#264653', 'PK19 DEF']].map(([c, p]) => new Car(c, { plate: p }));
    parked[0].place(RD - 1.25, -24, 0); parked[1].place(RD - 1.25, -33, 0);
    return { gary, gInd, drv, van, vInd, way, marg, peds, parked };
  },
  frame(ctx) {
    const { O, t } = ctx; setMood('day', V(-2, 0, 4)); scene.fog.color.set(0xd3e2ec); scene.fog.near = 70; scene.fog.far = 360;
    O.drv.expr('neutral'); O.way.expr('annoyed'); O.marg.expr('neutral'); O.way.headG.rotation.set(0, 0, 0); O.drv.headG.rotation.set(0, 0, 0); O.way.torso.rotation.set(0, 0, 0);
    O.gary.glass.opacity = 0.45; O.van.glass.opacity = 0.85; place(O, t);
  },
  segs: [
    // 0 cold open: the van swings round Gary toward Margaret
    { update(ctx) { const { O, ts } = ctx; const tm = 35.4 + ts * 0.62; place(O, tm);
        cam(V(1.5, 14, 21), V(-3.8, 0, 2.5), 40);
        ring(ctx, O.van.world(0, 1.4, 0), 0.2, ''); ctx.tag('BEEPED GARY', 0.3, ctx.word('ten') - 0.1, { col: 'red' }); ctx.tag('NEARLY RAN SOMEONE OVER', ctx.word('ten') - 0.1, 99, { col: 'red' }); } },
    // 1 case five
    { update(ctx) { const { O, ts } = ctx; place(O, 20); cam(V(2.0, 8, 17 - ts * 0.5), V(-5, 0.5, 1), 42); ctx.tag('THE JUNCTION', ctx.word('junction') - 0.3, 99, { col: 'yellow' }); } },
    // 2 high street, turning left, indicator
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const g = O.gary; const ti = ctx.word('indicator') - 0.2;
        if (ts < ti) cam(g.world(-1.3, 2.4, -9.5), g.world(0, 0.9, 6), 44); else cam(g.world(1.6, 1.1, 5.2), g.world(0.7, 0.8, 1.5), 40);
        ctx.label('GARY', g.world(0, 2.2, 0), ctx.word('gary') - 0.1, ti, { bg: '#1f6bff' }); ctx.tag('TURNING LEFT', ctx.word('left') - 0.15, ti, { col: 'yellow' }); ctx.tag('INDICATOR ON', ti, 99, { col: 'green' }); } },
    // 3 Margaret waiting; Gary stops
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const m = O.marg; const tg = ctx.word('stops') - 0.2;
        if (ts < tg) cam(V(CROSS_X + 3.2, 1.6, 8.6), V(CROSS_X - 0.2, 1.2, 4.6), 40); else cam(V(1.8, 9, 17), V(-3.5, 0, 3.5), 40);
        ctx.label('MARGARET', m.g.position.clone().add(V(0, 2.1, 0)), ctx.word('margaret') - 0.1, 99, { bg: '#7b5ea7' }); ctx.tag('WAITING TO CROSS', ctx.word('waiting') - 0.15, tg, { col: 'yellow' }); ctx.tag('GARY STOPS', tg, 99, { col: 'green' }); } },
    // 4 Wayne, white van, leans on the horn
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const v = O.van; const th = ctx.word('horn') - 0.3;
        if (ts < 2.8) { cam(v.world(-3.4, 2.1, 7.0), v.world(0, 1.7, 0.8), 40); O.van.glass.opacity = 0.3; } else { cam(v.world(-0.6, 2.0, 3.6), v.world(-0.45, 1.75, 0.9), 34); O.van.glass.opacity = 0.15; }
        ctx.label('WAYNE', v.world(0, 2.9, 0), ctx.word('wayne') - 0.1, th, { bg: '#e63946' }); ctx.tag('LATE FOR A JOB', ctx.word('late') - 0.15, th, { col: 'red' }); if (ts > th) horn(ctx, v.world(0, 2.6, 2.6)); } },
    // 5 window down: you've got priority
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const v = O.van; O.van.glass.opacity = 0.05; O.way.expr(Math.floor(ts * 5) % 2 ? 'shock' : 'annoyed'); O.way.torso.rotation.y = -0.3; O.way.headG.rotation.y = -0.55;
        cam(v.world(-2.3, 2.15, 2.0), v.world(-0.45, 1.85, 0.9), 34);
        ctx.tag('"MOVE!"', 0.2, ctx.word('she') - 0.1, { col: 'red' }); ctx.tag('"SHE HASN\'T STARTED!"', ctx.word('she') - 0.1, ctx.word("you've") - 0.1, { col: 'red' }); ctx.tag('"YOU\'VE GOT PRIORITY!"', ctx.word("you've") - 0.1, 99, { col: 'red' }); } },
    // 6 Gary doesn't move; Margaret steps out
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const ts2 = ctx.word('steps') - 0.3;
        if (ts < ts2) { O.gary.glass.opacity = 0.15; cam(O.gary.world(-0.3, 1.5, 2.7), O.gary.world(-0.4, 1.25, -0.1), 32); } else { const mp = O.marg.g.position; cam(V(CROSS_X + 3.4, 1.5, mp.z + 4.2), V(mp.x, 1.0, mp.z - 0.6), 40); }
        ctx.tag("DOESN'T MOVE", 0.2, ts2, { col: 'green' }); ctx.tag('STEPS OUT', ts2, 99, { col: 'yellow' }); } },
    // 7 Wayne swings out round Gary and turns in
    { update(ctx) { const { O, ts, t } = ctx; place(O, t);
        cam(V(1.0, 15, 23), V(-2.0, 0, 3.5), 40);
        ctx.tag('SWINGS OUT', ctx.word('swings') - 0.2, ctx.word('turns') - 0.15, { col: 'red' }); ctx.tag('TURNS IN', ctx.word('turns') - 0.15, 99, { col: 'red' }); } },
    // 8 straight at Margaret; brakes inches from her
    { update(ctx) { const { O, ts, t } = ctx; place(O, t); const ti = ctx.word('inches') - 0.25;
        if (ts < 1.7) cam(V(CROSS_X - 4.0, 1.3, 0.6), V(CROSS_X + 2.0, 1.1, 1.9), 44); else cam(V(CROSS_X - 1.5, 1.0, -2.6), V(CROSS_X + 0.6, 1.0, 2.0), 46);
        if (ts > 1.4) O.marg.expr('shock');
        ctx.tag('STRAIGHT AT MARGARET', 0.2, ctx.word('slams') - 0.15, { col: 'red' }); ctx.tag('INCHES', ti, 99, { col: 'red' }); } },
    // 9 all on Gary's dashcam
    { update(ctx) { const { O, ts } = ctx; place(O, 36.0 + ts * 1.0); const g = O.gary; g.glass.opacity = 0.04;
        cam(g.world(-0.15, 1.36, 0.85), V(-3.6, 1.0, 1.6), 58); dashcam(ctx, 0); ctx.tag('DASHCAM', ctx.word('dashcam') - 0.2, 99, { col: 'red' }); } },
    // 10 who's right?
    { update(ctx) { const { O } = ctx; place(O, 40); cam(V(2.5, 20, 21), V(-4, 0, 2), 42); ctx.tag("WHO'S RIGHT?", 0.1, 99, { col: 'yellow' }); } },
    // 11 rule H2 (replay: waiting, then crossing)
    { update(ctx) { const { O, ts } = ctx; const tw = ctx.word('waiting') - 0.2; place(O, ts < tw ? 30.2 : Math.min(34.8, 30.4 + (ts - tw) * 0.9));
        cam(V(2.0, 12, 16), V(-5.5, 0, 3.0), 40); ring(ctx, O.marg.g.position.clone().add(V(0, 0.9, 0)), ctx.word('crossing') - 0.3, '');
        ctx.tag('RULE H2 (2022)', 0.1, ctx.word('crossing') - 0.2, { col: 'green' }); ctx.tag('CROSSING', ctx.word('crossing') - 0.2, tw, { col: 'green' }); ctx.tag('OR WAITING TO CROSS', tw, 99, { col: 'green' }); } },
    // 12 waiting counts
    { update(ctx) { const { O, ts } = ctx; place(O, 26); const m = O.marg; cam(V(CROSS_X + 3.0, 1.7, 8.8), V(CROSS_X - 0.2, 1.2, 4.7), 38);
        ctx.tag('WAITING COUNTS', ctx.word('counts') - 0.2, ctx.word('gary') - 0.15, { col: 'green' }); ctx.tag('GARY WAS RIGHT', ctx.word('gary') - 0.15, 99, { col: 'green' }); } },
    // 13 rule 167 + rule 112
    { update(ctx) { const { O, ts } = ctx; const th = ctx.word('two') - 0.9;
        if (ts < th) { place(O, 34.0 + ts * 0.9); cam(V(1.0, 16, 24), V(-2.0, 0, 3.5), 40); } else { place(O, 22); const v = O.van; cam(v.world(-3.4, 2.3, 7.4), v.world(0, 1.6, 0.2), 40); O.van.glass.opacity = 0.3; if (ts > ctx.word('stationary') - 0.2) horn(ctx, v.world(0, 2.6, 2.6)); }
        ctx.tag('RULE 167', 0.1, ctx.word('overtake') - 0.2, { col: 'red' }); ctx.tag("DON'T OVERTAKE AT A JUNCTION", ctx.word('overtake') - 0.2, th, { col: 'red' }); ctx.tag('RULE 112', th, ctx.word('stationary') - 0.2, { col: 'red' }); ctx.tag('NO HORN WHEN STATIONARY', ctx.word('stationary') - 0.2, 99, { col: 'red' }); } },
    // 14 dashcam to police
    { update(ctx) { const { O, ts } = ctx; place(O, 36.6 + ts * 0.5); const g = O.gary; g.glass.opacity = 0.04;
        cam(g.world(-0.15, 1.36, 0.85), V(-3.6, 1.0, 1.6), 58); dashcam(ctx, 0);
        ctx.tag('SENT TO THE POLICE', 0.4, ctx.word('evidence') - 0.2, { col: 'yellow' }); ctx.tag('EVIDENCE', ctx.word('evidence') - 0.2, 99, { col: 'red' }); } },
    // 15 careless driving
    { update(ctx) { const { O, ts } = ctx; place(O, 39.6); O.marg.expr('shock'); const v = O.van; O.van.glass.opacity = 0.15; O.way.expr('shock');
        const th = ctx.word('hundred') - 0.2, tn = ctx.word('nine') - 0.2;
        if (ts < th) cam(V(CROSS_X - 1.4, 1.2, -1.6), V(CROSS_X + 0.9, 1.1, 2.2), 44); else cam(v.world(-0.2, 2.1, 4.6), v.world(-0.45, 1.8, 0.9), 34);
        ctx.tag('CARELESS DRIVING', ctx.word('careless') - 0.15, th, { col: 'red' }); ctx.tag('£100 + 3 POINTS', th, tn, { col: 'red' }); ctx.tag('UP TO 9 IN COURT', tn, 99, { col: 'red' }); } },
    // 16 Gary not guilty, Margaret safe
    { update(ctx) { const { O, ts } = ctx; const tm = ctx.word('margaret') - 0.2;
        if (ts < tm) { place(O, 44); O.gary.glass.opacity = 0.15; O.drv.expr('smug'); cam(O.gary.world(-0.3, 1.5, 2.7), O.gary.world(-0.4, 1.25, -0.1), 32); }
        else { place(O, 48); O.marg.expr('smug'); O.marg.shR.rotation.set(-2.6, 0, 0.3 + Math.sin(ts * 10) * 0.25); cam(V(CROSS_X + 2.6, 1.6, -9.5), V(CROSS_X, 1.3, -4.7), 38); }
        ctx.tag('GARY: NOT GUILTY', ctx.word('not') - 0.2, tm, { col: 'green' }); ctx.tag('MARGARET: SAFE', tm, 99, { col: 'green' }); } },
    // 17 Wayne guilty
    { update(ctx) { const { O, ts } = ctx; place(O, 48); O.way.expr('annoyed'); cam(V(3 + ts * 0.3, 12 + ts, 20 + ts), V(-4, 0, 2), 40);
        ctx.tag('WAYNE: GUILTY', 0.1, ctx.word('did') - 0.15, { col: 'red' }); ctx.tag('DID YOU KNOW WAITING COUNTS?', ctx.word('did') - 0.15, 99, { col: 'yellow' }); ctx.tag('FOLLOW FOR CASE 006', ctx.word('follow') - 0.1, 99, { col: 'yellow', y: 1420 }); } },
  ],
};
export default VIDEO;

// ------------------------------------------------------------ state
function place(O, t) {
  const g = O.gary; g.set(L1, garyZ(t), HN); g.brake(t > 12.6); O.gInd(t, t > 9.6);
  const v = O.van; const vp = vanPose(t); const vz = t < 33.6 ? pw([[8.52, 54], [13.9, VSTOP]], t) : vp.z; v.set(t < 33.6 ? L1 : vp.x, vz, t < 33.6 ? HN : vp.h + 0);
  v.brake(t < 33.6 ? t > 13.6 : t > 38.0); O.vInd(t, t > 33.0 && t < 39.5);
  const m = O.marg; const mz = margZ(t), walking = (t > 31 && t < 35) || (t > 41.9 && t < 47.5);
  m.at(CROSS_X, mz, HN).walk(walking ? t * 5.5 : 0, walking ? 0.35 : 0); if (!walking) m.stand(); m.shL.rotation.x = 0.05; m.shR.rotation.set(0, 0, 0);
  // other pedestrians strolling on the far pavements
  O.peds.forEach((p, i) => { const s = [1, -1, 1][i], x = [RD + 1.8, RD + 2.4, -RD - 2.0][i], z0 = [-20, 30, -30][i]; p.at(x, z0 + s * ((t * 1.25) % 40), s > 0 ? 0 : Math.PI).walk(t * 6 + i); });
}
function horn(ctx, p) { const s = toScreen(p); const k = 0.85 + 0.15 * Math.sin(ctx.t * 30); ctx.html(`<div class="tag red" style="left:${s.x}px;top:${s.y - 60}px;transform:translate(-50%,0) scale(${k});font-size:46px">BEEEEP!</div>`); }
function dashcam(ctx, from) {
  if (ctx.ts < from) return; const blink = Math.floor(ctx.t * 2) % 2 === 0; const br = 'position:absolute;width:90px;height:90px;border-color:#fff;border-style:solid;opacity:.9';
  ctx.html(`<div style="${br};left:70px;top:330px;border-width:8px 0 0 8px"></div><div style="${br};right:70px;top:330px;border-width:8px 8px 0 0"></div>
  <div style="${br};left:70px;bottom:330px;border-width:0 0 8px 8px"></div><div style="${br};right:70px;bottom:330px;border-width:0 8px 8px 0"></div>
  <div style="position:absolute;left:110px;top:440px;font:800 44px 'Inter Display',sans-serif;color:#fff;text-shadow:0 2px 8px #000"><span style="color:#ff3b3b;opacity:${blink ? 1 : 0.2}">●</span> REC</div>
  <div style="position:absolute;right:110px;top:440px;font:700 38px 'DejaVu Sans Mono',monospace;color:#fff;text-shadow:0 2px 8px #000">20/11/2026 08:52</div>`);
}
function ring(ctx, p, from, text) {
  if (ctx.ts < from) return; const s = toScreen(p); const k = easeOut(seg(ctx.ts, from, from + 0.3));
  ctx.html(`<div style="position:absolute;left:${s.x}px;top:${s.y}px;width:260px;height:190px;margin:-95px 0 0 -130px;border:8px solid #ff4a4a;border-radius:50%;transform:scale(${1.5 - 0.5 * k}) rotate(-12deg);opacity:${k}"></div>` + (text ? `<div class="tag red" style="left:${s.x}px;top:${s.y + 150}px;opacity:${k};font-size:40px">${text}</div>` : ''));
}
