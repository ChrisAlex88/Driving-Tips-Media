import { THREE, scene, V, Ground, kerb, slab, tree, lamp, Car, Person, HERO, lights, setMood, cam, shots, seg, lerp, easeIO, easeOut, easeIn, clamp, toScreen, trafficLight, mat, box, shop, bin, bollard, councilCamera, Ambulance, addFace, hoodie, makeSeated, mulberry } from '../engine.js';

// Junction: N-S road x -3.5..3.5, E-W road z -3.5..3.5, yellow box over the square.
// Gary drives north (heading PI) in lane x=-1.75 and turns right (east). East arm eastbound lane z=-1.75 is queued.
// Ambulance comes west along the westbound lane z=+1.75 and is blocked by Gary.
const RD = 3.5, PV = 3.5;
const HN = Math.PI, HE = Math.PI / 2, HW = -Math.PI / 2;
const STOP = 4.3;
const NAMES = ['OAK & IRON BARBERS', 'THE CORNER CAFE', 'BAKERS DOZEN', 'PEARL DRY CLEANERS', 'QUICK PRINT', 'PIZZA ROMA', 'HIGH ST CHEMIST', 'THE COPPER KETTLE', 'BOOK NOOK', 'FRESH & GREEN', 'NAIL STUDIO', 'KEYS CUT HERE'];
const BRICKS = ['#9a4f3a', '#8c4a36', '#a85d44', '#7d4434', '#b0705a', '#8f5a48'];
const SIGNBG = ['#1f2a24', '#2b2140', '#5a1f1f', '#173248', '#2a2a2a', '#3d2a14'];

function bez(p0, p1, p2, k) { const a = (1 - k) * (1 - k), b = 2 * k * (1 - k), c = k * k; return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]; }
const G0 = [-1.75, STOP + 2.15], G1 = [-1.75, 1.6], G2 = [0.15, -0.35];
function garyPose(k) { // 0 = at stop line, 1 = stuck in the box
  const p = bez(G0, G1, G2, k), q = bez(G0, G1, G2, Math.min(1, k + 0.02)), q0 = bez(G0, G1, G2, Math.max(0, k - 0.02));
  const h = Math.atan2(q[0] - q0[0], q[1] - q0[1]); return { x: p[0], z: p[1], h: k <= 0 ? HN : h };
}
const GH = garyPose(1).h;

const VIDEO = {
  episode: 'CASE 001', wordCaps: true,
  build() {
    lights('day');
    const G = new Ground(240, 4096, 0, 0);
    G.rect(-120, -120, 120, 120, '#b9b4ab');
    G.pavement(-120, -120, 120, 120, '#c4bfb5');
    G.asphalt(-RD, -120, RD, 120, '#3b3f46'); G.asphalt(-120, -RD, 120, RD, '#3b3f46');
    // centre lines and stop lines
    G.line(0, RD + 0.6, 0, 120, 0.12, '#eeeeea', 3, 6); G.line(0, -RD - 0.6, 0, -120, 0.12, '#eeeeea', 3, 6);
    G.line(RD + 0.6, 0, 120, 0, 0.12, '#eeeeea', 3, 6); G.line(-RD - 0.6, 0, -120, 0, 0.12, '#eeeeea', 3, 6);
    G.line(-RD, STOP, 0, STOP, 0.3); G.line(0, -STOP, RD, -STOP, 0.3); G.line(STOP, 0, STOP, RD, 0.3); G.line(-STOP, -RD, -STOP, 0, 0.3);
    // double yellow lines along kerbs
    for (const s of [-1, 1]) { G.line(s * (RD - 0.25), RD + 0.5, s * (RD - 0.25), 120, 0.08, '#e8c21c'); G.line(s * (RD - 0.4), RD + 0.5, s * (RD - 0.4), 120, 0.08, '#e8c21c');
      G.line(s * (RD - 0.25), -RD - 0.5, s * (RD - 0.25), -120, 0.08, '#e8c21c'); G.line(s * (RD - 0.4), -RD - 0.5, s * (RD - 0.4), -120, 0.08, '#e8c21c'); }
    // yellow box
    const g = G.g; g.save(); g.beginPath(); g.rect(G.X(-RD), G.Z(-RD), 2 * RD * G.k, 2 * RD * G.k); g.clip(); g.strokeStyle = '#f2c919'; g.lineWidth = 0.15 * G.k;
    for (let s = -16; s <= 16; s += 1.4) { g.beginPath(); g.moveTo(G.X(s - 8), G.Z(-8)); g.lineTo(G.X(s + 8), G.Z(8)); g.stroke(); g.beginPath(); g.moveTo(G.X(s - 8), G.Z(8)); g.lineTo(G.X(s + 8), G.Z(-8)); g.stroke(); }
    g.restore(); g.strokeStyle = '#f2c919'; g.lineWidth = 0.2 * G.k; g.strokeRect(G.X(-RD + 0.1), G.Z(-RD + 0.1), (2 * RD - 0.2) * G.k, (2 * RD - 0.2) * G.k);
    G.build();
    for (const s of [-1, 1]) { kerb(s * RD, RD, s * RD, 120); kerb(s * RD, -RD, s * RD, -120); kerb(RD, s * RD, 120, s * RD); kerb(-RD, s * RD, -120, s * RD); }
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) slab(sx > 0 ? RD + 0.1 : -120, sz > 0 ? RD + 0.1 : -120, sx > 0 ? 120 : -RD - 0.1, sz > 0 ? 120 : -RD - 0.1, 0.12, '#c9c4ba');
    // shops
    let n = 0; const D = 8, F = RD + PV + D / 2;
    const put = (x, z, r, w = 8) => { shop(x, z, r, { w, d: D, floors: 2 + (n % 3 === 0 ? 1 : 0), brick: BRICKS[n % 6], name: NAMES[n % NAMES.length], signBg: SIGNBG[n % 6], awning: n % 4 === 1 ? '#2f6b4f' : (n % 4 === 3 ? '#8a2b2b' : null) }); n++; };
    for (const sz of [1, -1]) for (let i = 0; i < 6; i++) { const z = sz * (F + i * 8.2); put(-F, z, Math.PI / 2, 8); put(F, z, -Math.PI / 2, 8); }
    for (const sx of [1, -1]) for (let i = 1; i < 6; i++) { const x = sx * (F + i * 8.2); put(x, F, Math.PI, 8); put(x, -F, 0, 8); }
    // street furniture
    this.cam1 = councilCamera(-RD - 1.4, -RD - 1.4, Math.PI / 4);
    for (const [x, z] of [[-RD - 0.5, RD + 0.6], [RD + 0.5, RD + 0.6], [RD + 0.5, -RD - 0.6], [-RD - 0.6, -RD - 0.5]]) { bollard(x, z); }
    bin(-RD - 0.9, 9.5); bin(RD + 0.9, -12); bin(14, RD + 0.9); bin(-16, -RD - 0.9);
    for (const z of [16, 34, -22, -40]) { lamp(-RD - 0.7, z, Math.PI / 2); lamp(RD + 0.7, z + 9, -Math.PI / 2); }
    for (const x of [18, 38, -24, -42]) { lamp(x, RD + 0.7, Math.PI); lamp(x + 9, -RD - 0.7, 0); }
    for (const [x, z] of [[-RD - 1.6, 24], [RD + 1.6, 28], [RD + 1.6, -26], [26, RD + 1.6], [-30, -RD - 1.6], [-RD - 1.6, -34], [44, -RD - 1.6]]) tree(x, z, 0.9);
    // traffic lights
    this.tlS = trafficLight(-RD - 0.55, STOP + 0.3, 0); this.tlE = trafficLight(STOP + 0.3, RD + 0.55, Math.PI / 2);
    this.tlN = trafficLight(RD + 0.55, -STOP - 0.3, Math.PI); this.tlW = trafficLight(-STOP - 0.3, -RD - 0.55, -Math.PI / 2);
    // cars
    const gary = new Car(HERO, { interior: true });
    const drv = addFace(hoodie(makeSeated(gary, new Person({ shirt: '#d62828', pants: '#2c3550', hair: '#3a2a1e', skin: '#c98d5e' }), -0.4, 0.1)));
    drv.shL.rotation.set(-1.05, 0, 0.05); drv.shR.rotation.set(-1.05, 0, -0.05);
    const qcols = ['#c0c5cc', '#9b2226', '#e9ecef', '#2b2d42', '#5e548e', '#8d99ae', '#3a7d44'];
    const queue = qcols.map((c, i) => new Car(c, { plate: ['KD19 FTR', 'BX68 NWL', 'YR70 KLD', 'WY18 GJM', 'BX47 UMP', 'LK21 PRD', 'GT69 ZXA'][i] }));
    const onc = [new Car('#e9ecef', { plate: 'MA20 TEC' }), new Car('#2b2d42', { plate: 'SN71 HYP' }), new Car('#c0c5cc', { plate: 'DL66 WRN' })];
    const amb = new Ambulance();
    const peds = [addFace(new Person({ shirt: '#3a86ff', pants: '#333', hair: '#b07a3a' })), addFace(new Person({ shirt: '#8e44ad', pants: '#2c3550', hair: '#1a1a1a', skin: '#8d5a3a' })), addFace(new Person({ shirt: '#2a9d8f', pants: '#444', hair: '#6b4a2a' }))];
    return { gary, drv, queue, onc, amb, peds, tl: { S: this.tlS, E: this.tlE, N: this.tlN, W: this.tlW } };
  },
  frame(ctx) {
    const { O, t } = ctx; setMood('day', V(0, 0, 0));
    // default "case" state: Gary stuck in the box, queue standing, ambulance waiting
    state(O, { k: 1, q: 0, amb: 7.6, sirens: true, t });
    O.tl.S.set('red'); O.tl.N.set('red'); O.tl.E.set('green'); O.tl.W.set('green');
    O.onc.forEach(c => c.g.visible = false);
    O.drv.expr('neutral'); O.drv.shL.rotation.set(-1.05, 0, 0.05); O.drv.shR.rotation.set(-1.05, 0, -0.05); O.drv.headG.rotation.set(0, 0, 0);
    O.gary.glassClear(false); O.gary.glass.opacity = 0.45;
    // pedestrians strolling
    const pp = [[-RD - 2.2, 30, -1, 0.9], [RD + 2.4, -6, 1, 1.0], [12, RD + 2.3, 1, 0.95]];
    O.peds.forEach((p, i) => { const [x0, z0, d, sp] = pp[i]; const s = (t * sp) % 26; if (i < 2) p.at(x0, z0 + d * (-s), d > 0 ? Math.PI : 0).walk(t * 6 + i); else p.at(x0 + s, z0, Math.PI / 2).walk(t * 6); });
  },
  segs: [
    { update(ctx) { const { ts } = ctx; shots(ts, [{ t: 0, p: V(-9, 22, 18), l: V(2.5, 0, -0.5), f: 42 }, { t: 3.9, blend: 3.9, p: V(-6, 17, 13), l: V(2.5, 0, -0.5), f: 42 }]);
        ring(ctx, V(0.15, 0.8, -0.35), 0.2, 'BLOCKED');
        ctx.tag('IS HE ALLOWED?', 0.15, 99, { col: 'red' }); } },
    { update(ctx) { const { O, ts } = ctx; state(O, { k: 0, q: 0, amb: null, t: ctx.t }); O.tl.S.set('red'); O.tl.E.set('green');
        O.gary.glass.opacity = 0.18; O.drv.expr('smug');
        cam(O.gary.world(-0.3, 1.5, 2.7), O.gary.world(-0.4, 1.25, -0.1), 32);
        ctx.tag('TURNING RIGHT', ctx.word('turning') - 0.1, 99, { col: 'red' }); } },
    { update(ctx) { const { O, ts } = ctx; state(O, { k: 0, q: 0, amb: null, t: ctx.t }); O.tl.S.set('red');
        shots(ts, [{ t: 0, p: V(4.4, 2.3, -5.6), l: V(30, 0.6, -1.4), f: 40 }, { t: 3.0, blend: 3.0, p: V(5.6, 2.4, -5.8), l: V(30, 0.6, -1.4), f: 38 }]);
        ctx.tag('EXIT ROAD BACKED UP', ctx.word('backed') - 0.15, 99, { col: 'red' }); } },
    { update(ctx) { const { O, ts } = ctx; const tg = ctx.word('green') - 0.1, tb = ctx.word('box') - 0.6;
        const k = easeIO(seg(ts, tb, ctx.dur + 0.3)); state(O, { k, q: 0, amb: null, t: ctx.t }); O.tl.S.set(ts < tg ? 'red' : 'green'); O.tl.E.set(ts < tg ? 'green' : 'red'); O.tl.W.set(ts < tg ? 'green' : 'red');
        if (ts < 1.7) cam(V(-RD - 2.4, 2.4, STOP + 4.2), V(-RD - 0.55, 3.0, STOP + 0.3), 30);
        else cam(V(-2.6, 2.6, 13.5), V(-0.2, 0.8, 0), 42);
        ctx.tag('INTO THE BOX', ctx.word('into') - 0.1, 99, { col: 'red' }); } },
    { update(ctx) { const { O, ts } = ctx; const tr = ctx.word('red') - 0.15, tgn = ctx.word('green') - 0.15;
        O.tl.S.set(ts < tr ? 'green' : (ts < tr + 0.01 ? 'amber' : 'red')); O.tl.E.set(ts < tgn ? 'red' : 'green'); O.tl.W.set(ts < tgn ? 'red' : 'green');
        state(O, { k: 1, q: 0, amb: null, t: ctx.t });
        if (ts < tr) cam(V(-5.4, 2.3, 11.5), V(0.2, 0.7, -0.3), 40);
        else if (ts < tgn) cam(V(-RD - 2.4, 2.4, STOP + 4.2), V(-RD - 0.55, 3.0, STOP + 0.3), 30);
        else cam(V(STOP + 4.2, 2.4, RD + 2.4), V(STOP + 0.3, 3.0, RD + 0.55), 30);
        ctx.tag('STUCK IN THE MIDDLE', ctx.word('stuck') - 0.1, tr, { col: 'red' });
        ctx.tag('RED', tr, tgn, { col: 'red' }); ctx.tag('SIDE ROAD GREEN', tgn, 99, { col: 'green' }); } },
    { update(ctx) { const { O, ts } = ctx; state(O, { k: 1, q: 0, amb: null, t: ctx.t });
        shots(ts, [{ t: 0, p: V(10.5, 1.5, 2.4), l: V(0, 0.8, 0.4), f: 40 }, { t: 2.4, blend: 2.4, p: V(8.5, 1.4, 2.2), l: V(0, 0.8, 0.4), f: 40 }]);
        ctx.tag('PARKED ACROSS IT', ctx.word('across') - 0.2, 99, { col: 'red' }); } },
    { update(ctx) { const { O, ts } = ctx; const x = lerp(75, 13, easeOut(seg(ts, 0, ctx.dur))); state(O, { k: 1, q: 0, amb: x, sirens: true, t: ctx.t });
        ctx.ev('siren', 0);
        if (ts < ctx.word('ambulance') - 0.1) cam(V(19, 1.0, 3.2), V(60, 1.3, 1.75), 34);
        else cam(V(x - 9, 1.3, 3.6), V(x, 1.4, 1.75), 40);
        ctx.tag('SIRENS', ctx.word('sirens') - 0.1, ctx.word('ambulance') - 0.15, { col: 'red' }); ctx.tag('AMBULANCE', ctx.word('ambulance') - 0.1, 99, { col: 'red' }); } },
    { update(ctx) { const { O, ts } = ctx; const x = lerp(13, 7.6, easeOut(seg(ts, 0, 1.6))); state(O, { k: 1, q: 0, amb: x, sirens: true, t: ctx.t });
        cam(V(17, 3.0, 4.6), V(2, 0.8, 0.4), 40);
        ctx.tag("CAN'T GET PAST", ctx.word("can't") - 0.1, ctx.word('stops') - 0.1, { col: 'red' }); ctx.tag('STOPS DEAD', ctx.word('stops') - 0.1, 99, { col: 'red' }); } },
    { update(ctx) { const { O, ts } = ctx; const tsr = ctx.word('shrugs') - 0.2; const k = easeOut(seg(ts, tsr, tsr + 0.4)) * (1 - easeIO(seg(ts, tsr + 1.6, tsr + 2.1)));
        O.drv.shL.rotation.set(-1.05 - k * 0.6, 0, 0.05 + k * 0.7); O.drv.shR.rotation.set(-1.05 - k * 0.6, 0, -0.05 - k * 0.7); O.drv.headG.rotation.set(0, 0, k * 0.15);
        O.drv.expr(ts < tsr ? 'neutral' : 'smug'); O.gary.glass.opacity = 0.1;
        cam(O.gary.world(-2.5, 1.45, 0.5), O.gary.world(-0.4, 1.2, -0.12), 34);
        ctx.tag('SHRUGS', tsr, ctx.word('window') - 0.1, { col: 'red' }); ctx.tag('WINDOW DOWN', ctx.word('window') - 0.1, ctx.word('turning') - 0.1, { col: 'red' });
        ctx.tag('"TURNING RIGHT"', ctx.word('turning') - 0.1, ctx.word('allowed') - 0.2, { col: 'red' }); ctx.tag('"I’M ALLOWED"', ctx.word('allowed') - 0.2, 99, { col: 'red' }); } },
    { update(ctx) { const { O, ts } = ctx; const q = easeIn(seg(ts, 1.4, ctx.dur + 1)); state(O, { k: 1, q, amb: 7.6, sirens: true, t: ctx.t });
        cam(V(-3, 26, 13), V(5, 0, -0.5), 42);
        clock(ctx, 0.2);
        ctx.tag('NEARLY A MINUTE', ctx.word('minute') - 0.2, 99, { col: 'red' }); } },
    { update(ctx) { const { O, ts } = ctx;
        shots(ts, [{ t: 0, p: V(0.5, 2.4, 0.5), l: V(-RD - 1.0, 4.6, -RD - 1.0), f: 36 }, { t: 3.0, blend: 3.0, p: V(-0.6, 2.9, -0.6), l: V(-RD - 1.0, 4.8, -RD - 1.0), f: 32 }]);
        ctx.tag('COUNCIL CAMERA', ctx.word('camera') - 0.2, 99, { col: 'red' }); } },
    { update(ctx) { const { ts } = ctx; cam(V(-4, 24, 15), V(2, 0, -0.5), 42); ctx.tag('WHO IS RIGHT?', 0.1, 99, { col: 'yellow' }); } },
    { update(ctx) { const { ts } = ctx; cam(V(-2, 20 - ts * 0.4, 12), V(3, 0, -1), 42);
        ctx.tag('RULE 174', 0.2, ctx.word('exit') - 0.2, { col: 'green' }); ctx.tag('UNTIL EXIT CLEAR', ctx.word('exit') - 0.2, 99, { col: 'green' }); } },
    { update(ctx) { const { O, ts, t } = ctx;
        // the exception: exit road clear, waiting in the box only because of oncoming traffic
        O.queue.forEach(c => c.g.visible = false); O.amb.g.visible = false;
        O.gary.place(-0.75, 0.9, Math.PI - 0.55); O.gary.brake(true);
        O.onc.forEach((c, i) => { c.g.visible = true; const z = -40 + ((ts * 9 + i * 13) % 70); c.set(1.75, z, 0); c.brake(false); });
        O.tl.S.set('green'); O.tl.N.set('green'); O.tl.E.set('red'); O.tl.W.set('red');
        cam(V(-5, 15, 13), V(1, 0, -1), 44);
        ctx.tag('WAIT IN THE BOX', ctx.word('wait') - 0.1, ctx.word('oncoming') - 0.2, { col: 'green' }); ctx.tag('AN EXCEPTION', ctx.word('oncoming') - 0.2, 99, { col: 'green' });
        ctx.label('ONCOMING', V(1.75, 2.4, -10), ctx.word('oncoming') - 0.2, 99, { bg: '#19C15F' }); } },
    { update(ctx) { const { ts } = ctx; cam(V(-3, 17, 11), V(5, 0, -1), 42);
        ctx.tag('EXIT ROAD FULL', ctx.word('full') - 0.2, ctx.word('not') - 0.1, { col: 'red' }); ctx.tag('NOT AN EXCEPTION', ctx.word('not') - 0.1, 99, { col: 'red' }); } },
    { update(ctx) { const { ts } = ctx; const tf = ctx.word('penalty') - 0.2;
        cam(V(-1.4, 3.6, -1.4), V(-RD - 1.0, 4.95, -RD - 1.0), 28);
        if (ts > tf && ts < tf + 0.25) ctx.html(`<div style="position:absolute;inset:0;background:#fff;opacity:${1 - (ts - tf) / 0.25}"></div>`);
        ctx.tag('PENALTY CHARGE', tf, 99, { col: 'red' }); } },
    { update(ctx) { const { O, ts } = ctx; const a = O.amb; cam(V(a.g.position.x - 12.0, 2.2, 5.6), V(a.g.position.x, 1.4, 1.75), 50);
        ctx.tag('WAITING FOR HELP', ctx.word('waiting') - 0.15, 99, { col: 'red' }); } },
    { update(ctx) { const { ts } = ctx; cam(V(-5 + ts * 0.3, 22, 15), V(2, 0, -0.5), 42);
        ring(ctx, V(0.15, 0.8, -0.35), 0.2, '');
        ctx.tag('GARY: GUILTY', ctx.word('guilty') - 0.15, 99, { col: 'red', y: 560 });
        ctx.tag('FOLLOW FOR CASE 002', ctx.word('follow') - 0.1, 99, { col: 'yellow', y: 1420 }); } },
  ],
};
export default VIDEO;

function state(O, s) {
  const g = garyPose(s.k); O.gary.place(g.x, g.z, g.h, s.k * 8); O.gary.brake(s.k >= 1 || s.k <= 0);
  // queue in the eastbound lane of the east arm
  O.queue.forEach((c, i) => { c.g.visible = true; const x = 6.4 + i * 5.6 + (s.q || 0) * 30; c.set(x, -1.75, HE); c.brake(!(s.q > 0)); });
  if (s.amb == null) { O.amb.g.visible = false; } else { O.amb.g.visible = true; O.amb.set(s.amb, 1.75, HW); O.amb.flash(s.t, true); }
}
function ring(ctx, p, from, text) {
  if (ctx.ts < from) return; const s = toScreen(p); const k = easeOut(seg(ctx.ts, from, from + 0.3));
  ctx.html(`<div style="position:absolute;left:${s.x}px;top:${s.y}px;width:230px;height:170px;margin:-85px 0 0 -115px;border:8px solid #ff4a4a;border-radius:50%;transform:scale(${1.5 - 0.5 * k}) rotate(-12deg);opacity:${k}"></div>` + (text ? `<div class="tag red" style="left:${s.x}px;top:${s.y + 140}px;opacity:${k};font-size:40px">${text}</div>` : ''));
}
function clock(ctx, from) {
  if (ctx.ts < from) return; const k = seg(ctx.ts, from, ctx.dur); const ang = k * 330;
  ctx.html(`<div style="position:absolute;left:50%;top:650px;width:220px;height:220px;margin-left:-110px;border-radius:50%;border:10px solid #fff;background:rgba(10,12,16,.55);box-shadow:0 10px 30px rgba(0,0,0,.4)">
   <div style="position:absolute;left:50%;top:50%;width:8px;height:90px;margin:-90px 0 0 -4px;background:#ff4a4a;border-radius:4px;transform-origin:50% 100%;transform:rotate(${ang}deg)"></div>
   <div style="position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:#fff"></div></div>`);
}
