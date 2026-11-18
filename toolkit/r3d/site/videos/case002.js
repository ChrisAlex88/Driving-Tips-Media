// Road Court — Case 002: the lane closed (merge in turn). Gary is in the right; Darren (white pickup) blocks him.
// Traffic heads north (-z, heading PI). Lane 1 (left, closing) x=-1.75, lane 2 x=+1.75. Taper cones z -54 -> -68.
import { THREE, V, lerp, seg, easeIO, easeOut, smooth, mat, box, Ground, tree, bush, house, Car, HERO, Person, addFace, hoodie, makeSeated, povHands,
  cam, shots, toScreen, lights, setMood, scene, Pickup, unmarked, officer, cone, yellowSign, textLines, crashBarrier, mulberry, countryside } from '../engine.js';

const HN = Math.PI, L1 = -1.75, L2 = 1.75, TS = -54, TE = -68, VX = -5.0; // VX: verge stopping line
const T0 = 8.25;              // start of the approach (segment 2)
const STARTS = [0.0, 5.86, 8.25, 13.86, 18.75, 25.57, 30.39, 35.62, 39.02, 41.81, 46.19, 50.77, 54.84, 59.26, 64.78, 66.39, 71.92, 80.95, 86.05, 94.45];
const QCOLS = ['#c0c5cc', '#9b2226', '#e9ecef', null, '#2b2d42', null, '#5e548e', '#8d99ae', '#3a7d44', '#d9d9d9', '#7a1f2b', '#1d3557', '#b5b8bd', '#264653'];
const PLATES = ['KD19 FTR', 'BX68 NWL', 'YR70 KLD', '', 'WY18 GJM', '', 'LK21 PRD', 'GT69 ZXA', 'MV17 HRT', 'SK20 BNE', 'CA66 WLT', 'PO71 KRD', 'FN18 OXB', 'HJ67 RTY'];
const PI_ = 3, PO_ = 5;        // index of pickup / police in the lane-2 queue
const qz = (i, off) => -66 + i * 6.6 + off;

// Gary along lane 1 during the approach (T = seconds since segment 2)
const garyApproach = T => lerp(40, -25, T / 22.14);
// queue offset during the approach: slow stop-start crawl, ends at 6.2 (pickup at z=-40)
const qOff = T => 6.2 + 1.45 * (22.14 - T) + 0.9 * Math.sin(T * 1.3);

const VIDEO = {
  episode: 'CASE 002', wordCaps: true,
  build() {
    lights('day');
    const G = new Ground(260, 4096, 0, -50); const R = mulberry(5);
    G.grass('#7fa36a');
    for (let i = 0; i < 26000; i++) { const x = lerp(-130, 130, R()), z = lerp(-180, 80, R()); G.g.fillStyle = R() < .5 ? 'rgba(40,80,20,0.18)' : 'rgba(170,210,110,0.16)'; G.g.fillRect(G.X(x), G.Z(z), 4, 4); }
    G.asphalt(-4.0, -180, 3.6, 80, '#3d4148'); G.asphalt(6.4, -180, 14.0, 80, '#3d4148');
    G.rect(3.6, -180, 6.4, 80, '#759a63');
    for (const [a, b] of [[-3.5, 3.4], [6.9, 13.6]]) { G.line(a, -180, a, 80, 0.15); G.line(b, -180, b, 80, 0.15); }
    G.line(0, TE, 0, 80, 0.13, '#f2f2ee', 3, 6); G.line(10.25, -180, 10.25, 80, 0.13, '#f2f2ee', 3, 6);
    G.line(0, -180, 0, TE, 0.13, '#f2f2ee', 3, 6);
    G.build();
    // beyond the detailed ground: plain road and grass into the haze
    const FAR = 1500, asph = mat('#3d4148', { r: .95 }), white = mat('#ecece6', { r: .6 });
    for (const [z0, z1] of [[80, FAR], [-180, -FAR]]) {
      const zc = (z0 + z1) / 2, L = Math.abs(z1 - z0);
      box(7.6, 0.02, L, asph, V(-0.2, 0.004, zc), null, { cast: false }); box(7.6, 0.02, L, asph, V(10.2, 0.004, zc), null, { cast: false });
      for (const x of [-3.5, 3.4, 6.9, 13.6]) box(0.15, 0.025, L, white, V(x, 0.006, zc), null, { cast: false });
      const n = Math.floor(L / 9), geo = new THREE.BoxGeometry(0.13, 0.025, 3); const m4 = new THREE.Matrix4();
      for (const x of [0, 10.25]) { const im = new THREE.InstancedMesh(geo, white, n); for (let i = 0; i < n; i++) { m4.makeTranslation(x, 0.007, Math.min(z0, z1) + i * 9 + 1.5); im.setMatrixAt(i, m4); } scene.add(im); }
    }
    countryside({ cx: 5, cz: -60, grass: '#7fa36a', clearX: 70, clearZ: 430, avoid: (x, z) => x > -14 && x < 24 });
    crashBarrier(5.0, -FAR, FAR);
    // trees, hedges and houses either side
    for (let i = 0; i < 150; i++) { const s = R() < .5 ? -1 : 1; const x = s < 0 ? -10 - R() * 45 : 19 + R() * 45; const z = lerp(-420, 120, R()); tree(x, z, 1.1 + R() * 1.1); }
    for (let z = -400; z < 120; z += 3.2) { bush(-8.2 + R() * 0.6, z, 1.1 + R() * 0.5); bush(17 + R() * 0.6, z, 1.1 + R() * 0.5); }
    const hc = ['#e2c9a6', '#d8b8a0', '#cfcac0', '#e6d8bf', '#c9a27e'];
    for (let i = 0; i < 18; i++) { house(-62 - (i % 3) * 9, -380 + i * 26, Math.PI / 2, { col: hc[i % 5] }); house(75 + (i % 3) * 9, -370 + i * 27, -Math.PI / 2, { col: hc[(i + 2) % 5] }); }
    // roadworks: taper and cones
    for (let k = 0; k <= 7; k++) { const f = k / 7; cone(lerp(-3.3, -0.2, f), lerp(TS, TE, f)); }
    for (let z = TE - 4; z > -230; z -= 4) cone(-0.2, z);
    const van = new THREE.Group(); scene.add(van); van.position.set(-1.9, 0, -96);
    box(2.1, 2.3, 5.2, mat('#f3f3ef', { r: .5 }), V(0, 1.5, 0), van); box(2.1, 0.5, 5.2, mat('#ff7a1a'), V(0, 0.55, 0), van);
    const chev = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#ffd31a'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#d4202a'; for (let i = -6; i < 8; i++) { g.beginPath(); g.moveTo(i * 44, 256); g.lineTo(i * 44 + 22, 256); g.lineTo(i * 44 + 150, 0); g.lineTo(i * 44 + 128, 0); g.fill(); } return c; })()); chev.colorSpace = THREE.SRGBColorSpace;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.3), new THREE.MeshStandardMaterial({ map: chev })); back.position.set(0, 1.5, 2.61); van.add(back);
    for (const sx of [-0.6, 0.6]) box(0.3, 0.16, 0.3, mat('#ffae00', { e: 0xff9a00, ei: 1.5 }), V(sx, 2.75, 1.5), van);
    // signs on the left verge, facing oncoming (+z) traffic
    const yds = (c, w, h, txt) => { c.font = '900 64px "Inter Display",sans-serif'; c.fillText(txt, w / 2, h - 70); };
    yellowSign(-7.2, 58, 0, textLines(['ROAD WORKS', 'AHEAD'], 86), { w: 2.4, h: 1.5 });
    yellowSign(-7.2, 30, 0, (c, w, h) => {
      c.lineWidth = 22; c.strokeStyle = '#111';
      c.beginPath(); c.moveTo(w * 0.62, h - 150); c.lineTo(w * 0.62, 130); c.stroke(); c.beginPath(); c.moveTo(w * 0.62 - 40, 170); c.lineTo(w * 0.62, 115); c.lineTo(w * 0.62 + 40, 170); c.stroke();
      c.beginPath(); c.moveTo(w * 0.38, h - 150); c.lineTo(w * 0.38, 210); c.stroke(); c.fillStyle = '#d4202a'; c.fillRect(w * 0.38 - 50, 180, 100, 26); c.fillStyle = '#111';
      c.font = '900 50px "Inter Display",sans-serif'; c.fillText('LEFT LANE', w / 2, 60); yds(c, w, h, '400 yds');
    }, { w: 2.2, h: 2.4 });
    this.sBoth = yellowSign(-7.2, 2, 0, textLines(['USE BOTH', 'LANES'], 100), { w: 2.4, h: 1.6 });
    yellowSign(5.6, -6, 0, textLines(['USE BOTH', 'LANES'], 100), { w: 1.8, h: 1.2, lift: 1.0 });
    this.sMerge = yellowSign(-7.2, -26, 0, textLines(['MERGE', 'IN TURN'], 104), { w: 2.4, h: 1.6 });
    // vehicles
    const gary = new Car(HERO, { interior: true, lplate: false });
    const drv = addFace(hoodie(makeSeated(gary, new Person({ shirt: '#d62828', pants: '#2c3550', hair: '#3a2a1e', skin: '#c98d5e' }), -0.4, 0.1)));
    drv.shL.rotation.set(-1.05, 0, 0.05); drv.shR.rotation.set(-1.05, 0, -0.05);
    const hands = povHands(gary, '#d62828', '#c98d5e'); hands.visible = false;
    const pick = new Pickup('#eef0f2', { plate: 'DR19 PKP' });
    const darren = addFace(pick.seat(new Person({ shirt: '#3f5a3a', pants: '#2b2b30', hair: '#2a2a2a', skin: '#e3b48b' }), -0.42));
    darren.shL.rotation.set(-1.0, 0, 0.05); darren.shR.rotation.set(-1.0, 0, -0.05);
    const pol = unmarked(new Car('#6b7078', { plate: 'HN72 VRL' }));
    const cop = officer(); cop.g.visible = false;
    const queue = QCOLS.map((c, i) => i === PI_ ? pick : i === PO_ ? pol : new Car(c, { plate: PLATES[i] }));
    const demo = ['#e07a5f', '#f2cc8f', '#81b29a', '#3d405b', '#a8dadc'].map((c, i) => new Car(c, { plate: ['NX19 DMO', 'RK70 ZPR', 'TT68 MRG', 'PL21 ZIP', 'BW17 TRN'][i] }));
    const opp = ['#eceff1', '#30343a', '#a51c30', '#9aa3ad', '#2f5d8a'].map((c, i) => new Car(c, { plate: ['AB12 CDE', 'FG34 HIJ', 'KL56 MNO', 'PQ78 RST', 'UV90 WXY'][i] }));
    return { gary, drv, hands, pick, darren, pol, cop, queue, demo, opp };
  },
  frame(ctx) {
    const { O, t } = ctx; setMood('day', V(0, 0, -30)); scene.fog.color.set(0xd3e2ec); scene.fog.near = 90; scene.fog.far = 1100;
    O.opp.forEach((c, i) => { const z = -300 + ((t * 22 + i * 97) % 520); c.set(i % 2 ? 8.25 : 11.75, z, 0); });
    O.demo.forEach(c => c.g.visible = false); O.cop.g.visible = false; O.hands.visible = false; O.drv.g.visible = true;
    O.drv.expr('neutral'); O.darren.expr('annoyed'); O.darren.torso.rotation.y = 0; O.darren.headG.rotation.set(0, 0, 0);
    O.gary.glass.opacity = 0.45; O.pick.glass.opacity = 0.55; O.pol.police(t, false);
    blocked(O, 1);
  },
  segs: [
    // 0 cold open
    { update(ctx) { const { O, ts } = ctx; blocked(O, 1);
        shots(ts, [{ t: 0, p: V(-12, 15, -24), l: V(-0.5, 0, -40), f: 42 }, { t: 5.8, blend: 5.8, p: V(-9, 11, -27), l: V(-0.5, 0, -40), f: 42 }]);
        ring(ctx, O.pick.world(0, 1.2, 0), 0.2, 'BLOCKING ON PURPOSE');
        ctx.label('GARY', O.gary.world(0, 2.2, 0), ctx.word("gary's") - 0.1, 99, { bg: '#1f6bff' });
        ctx.tag('WHO IS WRONG?', ctx.word("gary's") - 0.1, 99, { col: 'yellow' }); } },
    // 1 case two, the lane closed
    { update(ctx) { const { O, ts } = ctx; approach(O, 0);
        shots(ts, [{ t: 0, p: V(-5.2, 1.3, 40.5), l: V(-7.2, 2.0, 30), f: 34 }, { t: 2.4, blend: 2.4, p: V(-5.6, 1.6, 38), l: V(-7.2, 2.1, 30), f: 32 }]);
        ctx.tag('LANE CLOSED', ctx.word('closed') - 0.15, 99, { col: 'red' }); } },
    // 2 this is Gary
    { update(ctx) { const { O, ts, t } = ctx; const T = t - T0; approach(O, T);
        const g = O.gary; if (ts < 2.6) cam(g.world(-1.4, 1.6, 6.5), g.world(0, 1.0, -1), 40); else cam(g.world(1.2, 2.6, -8.5), g.world(0, 0.8, 6), 44);
        ctx.label('GARY', g.world(0, 2.2, 0), ctx.word('gary') - 0.1, 99, { bg: '#1f6bff' });
        ctx.tag('ROADWORKS AHEAD', ctx.word('roadworks') - 0.1, ctx.word('left') - 0.15, { col: 'yellow' }); ctx.tag('LEFT LANE CLOSING', ctx.word('left') - 0.15, 99, { col: 'red' }); } },
    // 3 the queue
    { update(ctx) { const { O, ts, t } = ctx; approach(O, t - T0);
        shots(ts, [{ t: 0, p: V(4.4, 1.2, -60), l: V(1.2, 0.8, -10), f: 30 }, { t: 4.9, blend: 4.9, p: V(4.2, 1.4, -56), l: V(1.0, 0.8, -8), f: 30 }]);
        ctx.tag('QUEUE', ctx.word('queue') - 0.15, ctx.word('stop') - 0.1, { col: 'red' }); ctx.tag('STOP. START.', ctx.word('stop') - 0.1, 99, { col: 'red' }); } },
    // 4 use both lanes
    { update(ctx) { const { O, ts, t } = ctx; approach(O, t - T0); const g = O.gary; const tm = ctx.word('merge') - 0.15, tg = ctx.word('so') - 0.1;
        if (ts < tm) cam(V(-4.6, 1.4, 14), V(-7.2, 2.2, 2), 32);
        else if (ts < tg) cam(V(-4.6, 1.4, -14), V(-7.2, 2.2, -26), 32);
        else cam(g.world(-6, 9, 9), g.world(0, 0, -6), 42);
        ctx.tag('USE BOTH LANES', ctx.word('use') - 0.1, tm, { col: 'green' }); ctx.tag('MERGE IN TURN', tm, tg, { col: 'green' }); ctx.tag('DOING IT RIGHT', tg, 99, { col: 'green' }); } },
    // 5 meet Darren
    { update(ctx) { const { O, ts, t } = ctx; approach(O, t - T0); const p = O.pick; p.glass.opacity = 0.12;
        cam(p.world(-0.2, 1.95, 3.6), p.world(-0.42, 1.5, 0.2), 30);
        ctx.tag('DARREN', ctx.word('darren') - 0.1, ctx.word('early') - 0.15, { col: 'red' }); ctx.tag('QUEUED EARLY', ctx.word('early') - 0.15, 99, { col: 'red' }); } },
    // 6 swings across
    { update(ctx) { const { O, ts } = ctx; const tsw = ctx.word('swings') - 0.3; const kg = easeOut(seg(ts, 0, ctx.dur - 0.3));
        blocked(O, easeIO(seg(ts, tsw, tsw + 1.6)), lerp(-25, -36.3, kg));
        if (ts < tsw - 0.2) cam(O.gary.world(-1.2, 1.5, 5.8), O.gary.world(0, 1.0, -6), 42); else cam(V(-11, 12, -22), V(-0.6, 0, -40), 40);
        ctx.tag('EMPTY LANE', ctx.word('empty') - 0.1, tsw, { col: 'green' }); ctx.tag('BLOCKS THE LANE', tsw + 0.3, 99, { col: 'red' }); } },
    // 7 window down
    { update(ctx) { const { O, ts } = ctx; blocked(O, 1); const p = O.pick; p.glass.opacity = 0.05;
        const k = easeOut(seg(ts, 0.3, 0.8)); O.darren.torso.rotation.y = -0.5 * k; O.darren.headG.rotation.set(0, -0.6 * k, 0); O.darren.expr(ts > ctx.word('get') - 0.1 ? 'shock' : 'annoyed');
        cam(p.world(-2.6, 1.8, 0.9), p.world(-0.42, 1.6, 0.2), 34);
        ctx.tag('WINDOW DOWN', 0.1, ctx.word('get') - 0.1, { col: 'red' }); ctx.tag('"QUEUE JUMPER!"', ctx.word('queue') - 0.1, 99, { col: 'red' }); } },
    // 8 Gary waits
    { update(ctx) { const { O } = ctx; blocked(O, 1); O.gary.glass.opacity = 0.15;
        cam(O.gary.world(-0.3, 1.5, 2.7), O.gary.world(-0.4, 1.25, -0.1), 32);
        ctx.tag('JUST WAITS', ctx.word('waits') - 0.15, 99, { col: 'green' }); } },
    // 9 brake check 1
    { update(ctx) { const { O, ts } = ctx; const tst = ctx.word('stamps') - 0.15; brakeCheck(O, seg(ts, 0.2, tst), ts >= tst, 0);
        shots(ts, [{ t: 0, p: V(-6.5, 1.3, -38), l: V(-1.6, 1.0, -46), f: 40 }, { t: 4.3, blend: 4.3, p: V(-6.8, 1.4, -40), l: V(-1.6, 1.0, -46), f: 40 }]);
        ctx.tag('CREEPS FORWARD', 0.3, tst, { col: 'red' }); ctx.tag('BRAKE CHECK', tst, 99, { col: 'red' }); } },
    // 10 Gary's left a gap; again
    { update(ctx) { const { O, ts } = ctx; const ta = ctx.word('again') - 0.9;
        if (ts < ta) { brakeCheck(O, 1, true, 0); } else brakeCheck(O, seg(ts, ta, ta + 0.8), ts > ta + 0.8, 1);
        O.drv.g.visible = false; O.hands.visible = true; const g = O.gary; g.cabin.intensity = 3.0; g.glass.opacity = 0.08;
        cam(g.world(-0.4, 1.36, -0.2), g.world(-0.3, 1.25, 9), 52);
        ctx.tag('LEFT A GAP', ctx.word('gap') - 0.15, ta, { col: 'green' }); ctx.tag('BRAKE CHECK x2', ta + 0.6, 99, { col: 'red' }); } },
    // 11 the grey car two cars back
    { update(ctx) { const { O, ts } = ctx; brakeCheck(O, 1, true, 1);
        shots(ts, [{ t: 0, p: V(-4, 6.5, -52), l: V(0.5, 0.6, -32), f: 40 }, { t: 4.0, blend: 4.0, p: V(-3.5, 5.5, -50), l: V(1.0, 0.6, -30), f: 36 }]);
        ring(ctx, O.pol.world(0, 1.0, 0), ctx.word('grey') - 0.2, ''); ctx.tag('GREY CAR', ctx.word('grey') - 0.1, 99, { col: 'yellow' }); } },
    // 12 unmarked police
    { update(ctx) { const { O, ts, t } = ctx; brakeCheck(O, 1, true, 1); O.pol.police(t, ts > 0.1);
        const p = O.pol; const tu = ctx.word('unmarked') - 0.15, tf = ctx.word('filmed') - 0.15;
        if (ts < tf) cam(p.world(-1.55, 1.05, 4.0), p.world(-0.1, 0.7, 2.1), 36); else { p.glass.opacity = 0.04; cam(p.world(-0.4, 2.1, 0.6), O.pick.world(0, 0.8, 0), 44); dashcam(ctx, tf); }
        ctx.tag('BLUE LIGHTS', 0.1, tu, { col: 'red' }); ctx.tag('UNMARKED POLICE', tu, tf, { col: 'red' }); ctx.tag('DASHCAM', tf, 99, { col: 'red' }); } },
    // 13 pulled over; Gary merges in turn
    { update(ctx) { const { O, ts, t } = ctx; const tm = ctx.word('merges') - 0.6; pulled(O, seg(ts, 0, 3.0), easeIO(seg(ts, tm, ctx.dur + 0.4)), t);
        shots(ts, [{ t: 0, p: V(-14, 16, -26), l: V(-1.5, 0, -48), f: 42 }, { t: 5.5, blend: 5.5, p: V(-10, 18, -40), l: V(0, 0, -62), f: 42 }]);
        ctx.tag('PULLED OVER', ctx.word('pulled') - 0.15, tm + 0.4, { col: 'red' }); ctx.tag('MERGES IN TURN', tm + 0.4, 99, { col: 'green' }); } },
    // 14 who's right?
    { update(ctx) { const { O, t } = ctx; pulled(O, 1, 1, t); cam(V(-16, 26, -44), V(-1, 0, -64), 42); ctx.tag("WHO'S RIGHT?", 0.1, 99, { col: 'yellow' }); } },
    // 15 rule 288
    { update(ctx) { const { O, ts, t } = ctx; const tm = ctx.word('merge') - 0.15;
        if (ts < tm) { pulled(O, 1, 1, t); cam(V(-5.6, 1.5, -15), V(-7.2, 2.2, -26), 30); } else { zip(O, ts - tm, t); cam(V(-15, 22, -40), V(0, 0, -62), 40); }
        ctx.tag('RULE 288', 0.1, tm, { col: 'green' }); ctx.tag('MERGE IN TURN', tm, 99, { col: 'green' }); } },
    // 16 rule 134
    { update(ctx) { const { O, ts, t } = ctx; zip(O, ts + 4, t); const tv = ctx.word('very') - 0.15, th = ctx.word('high') - 0.3;
        shots(ts, [{ t: 0, p: V(-8, 6, -44), l: V(0, 0.5, -62), f: 40 }, { t: 9.0, blend: 9.0, p: V(-5, 4.5, -50), l: V(0.5, 0.5, -64), f: 40 }]);
        ctx.tag('RULE 134', 0.1, tv, { col: 'green' }); ctx.tag('VERY LOW SPEED', tv, th, { col: 'green' }); ctx.tag('NOT AT HIGH SPEED', th, 99, { col: 'red' }); } },
    // 17 Gary not guilty
    { update(ctx) { const { O, ts, t } = ctx; pulled(O, 1, 1, t); O.gary.glass.opacity = 0.15; O.drv.expr(ts > ctx.word('not') - 0.2 ? 'smug' : 'neutral');
        cam(O.gary.world(-0.3, 1.5, 2.7), O.gary.world(-0.4, 1.25, -0.1), 32);
        ctx.tag('SIGNS SAID GO', 0.2, ctx.word('not') - 0.2, { col: 'green' }); ctx.tag('GARY: NOT GUILTY', ctx.word('not') - 0.2, 99, { col: 'green' }); } },
    // 18 Darren: careless driving
    { update(ctx) { const { O, ts, t } = ctx; pulled(O, 1, 1, t); const p = O.pick; p.glass.opacity = 0.05; O.darren.expr('annoyed'); O.darren.torso.rotation.y = -0.35; O.darren.headG.rotation.set(0, -0.5, 0);
        const c = O.cop; c.g.visible = true; c.at(p.x + 1.55, p.z + 0.6, -Math.PI / 2).stand(); c.expr('neutral');
        const tc = ctx.word('careless') - 0.15, th = ctx.word('hundred') - 0.2, tco = ctx.word('court') - 0.2;
        if (ts < th) cam(V(p.x + 4.4, 1.7, p.z - 2.4), V(p.x + 0.9, 1.45, p.z + 0.5), 40); else cam(V(p.x + 4.4, 2.3, p.z + 7.5), V(p.x + 0.3, 1.1, p.z - 0.5), 40);
        ctx.label('OFFICER', c.g.position.clone().add(V(0, 2.25, 0)), 0.2, th, { bg: '#e63946' });
        ctx.tag('CARELESS DRIVING', tc, th, { col: 'red' }); ctx.tag('£100 + 3 POINTS', th, tco, { col: 'red' }); ctx.tag('COURT: UP TO 9', tco, 99, { col: 'red' }); } },
    // 19 fair or too soft?
    { update(ctx) { const { O, ts, t } = ctx; pulled(O, 1, 1, t); const c = O.cop; c.g.visible = true; c.at(O.pick.x + 1.55, O.pick.z + 0.6, -Math.PI / 2).stand();
        cam(V(-14 - ts * 0.6, 14 + ts * 1.2, -30 + ts * 0.8), V(-1.5, 0, -56), 42);
        ctx.tag('FAIR OR TOO SOFT?', 0.1, 99, { col: 'yellow' }); ctx.tag('FOLLOW FOR CASE 003', ctx.word('follow') - 0.1, 99, { col: 'yellow', y: 1420 }); } },
  ],
};
export default VIDEO;

// ------------------------------------------------------------ states
function queueAt(O, offFn, moving) {
  O.queue.forEach((c, i) => { if (i === PI_ || i === PO_) return; c.g.visible = true; c.set(L2, qz(i, offFn(i)), HN); c.brake(!moving); });
}
// approach: Gary drives up the empty lane 1 while lane 2 crawls
function approach(O, T) {
  const off = qOff(T), mv = Math.cos(T * 1.3) > -0.4;
  queueAt(O, () => off, mv);
  O.pick.set(L2, qz(PI_, off), HN); O.pick.brake(!mv); O.pol.set(L2, qz(PO_, off), HN); O.pol.brake(!mv);
  O.gary.set(L1, garyApproach(T), HN); O.gary.brake(false);
}
// pickup swings across lane 1 (k 0..1); Gary rolls to gz (stops at -36.3)
function blocked(O, k, gz = -36.3) {
  queueAt(O, () => 6.2, false);
  O.pol.set(L2, qz(PO_, 6.2), HN); O.pol.brake(true);
  O.pick.set(lerp(L2, -0.4, k), lerp(-40, -43, k), HN + 0.5 * Math.sin(k * Math.PI * 0.5)); O.pick.brake(true);
  O.gary.set(L1, gz, HN); O.gary.brake(gz >= -36.31 && gz <= -36.29);
}
// brake checks: n = 0 first (angled -> straight in lane 1, -47.5), n = 1 second (-47.5 -> -50.5). k = progress, stop = brake lights
function brakeCheck(O, k, stop, n) {
  queueAt(O, () => 6.2, false); O.pol.set(L2, qz(PO_, 6.2), HN); O.pol.brake(true);
  const e = easeIO(clamp01(k));
  if (n === 0) { O.pick.set(lerp(-0.4, -1.65, e), lerp(-43, -47.5, e), HN + 0.5 * (1 - e)); O.gary.set(L1, lerp(-36.3, -40.5, easeIO(clamp01(k * 1.1 - 0.1))), HN); }
  else { O.pick.set(-1.65, lerp(-47.5, -50.5, e), HN); O.gary.set(L1, lerp(-40.5, -43.2, easeIO(clamp01(k * 1.1 - 0.1))), HN); }
  O.pick.brake(stop || k <= 0); O.gary.brake(stop || k <= 0);
}
// police pulls Darren onto the verge (kp), Gary merges in turn (D 0..1)
function pulled(O, kp, km, t) {
  const e = easeIO(clamp01(kp));
  O.pick.set(lerp(-1.65, VX, e), lerp(-50.5, -52, e), HN + 0.35 * Math.sin(e * Math.PI)); O.pick.brake(e >= 1);
  // police: from lane 2 across behind Gary to the verge behind the pickup
  const pz = lerp(qz(PO_, 6.2), -44.5, e), px = e < 0.35 ? lerp(L2, -0.5, e / 0.35) : lerp(-0.5, VX, Math.min(1, (e - 0.35) / 0.4));
  const ph = e < 0.75 ? HN + 0.35 * Math.sin(Math.min(1, e / 0.75) * Math.PI) : HN; O.pol.set(px, pz, ph); O.pol.police(t, true); O.pol.brake(e >= 1);
  const D = 30 * clamp01(km), gz = -43.2 - D;
  O.gary.set(mergeX(gz), gz, mergeH(gz)); O.gary.brake(km >= 1);
  const da = 1.25 * D, db = Math.max(0, D - 2);
  O.queue.forEach((c, i) => { if (i === PI_ || i === PO_) return; c.g.visible = true; c.set(L2, qz(i, 6.2) - (i < PI_ ? da : db), HN); c.brake(km >= 1 || km <= 0); });
}
// zip merge demo at very low speed: cars alternate from both lanes (u = seconds)
function zip(O, u, t) {
  pulled(O, 1, 1, t);
  const cars = [O.gary, ...O.demo, ...O.queue.filter((c, i) => i !== PI_ && i !== PO_)];
  const v = 2.2; cars.forEach((c, j) => {
    const lane1 = j % 2 === 0 && j < 12; const s = -86 + j * 5.8 - v * u; const z = s;
    const x = lane1 ? mergeX(z) : L2; const h = lane1 ? mergeH(z) : HN;
    c.g.visible = true; c.set(x, z, h); c.brake(false);
  });
}
const clamp01 = k => Math.min(1, Math.max(0, k));
// x of the taper cone line at z, and the lane-1 merge path that keeps the car's left side 0.35 m clear of it
const coneX = z => z > TS ? -3.3 : z < TE ? -0.2 : lerp(-3.3, -0.2, (TS - z) / (TS - TE));
const mergeX = z => { const zf = z - 2.3; return Math.min(L2, Math.max(L1, coneX(zf) + 1.27 + Math.max(0, TE - zf) * 0.45)); };
const mergeH = z => Math.PI - Math.atan(mergeX(z - 0.5) - mergeX(z + 0.5));
function ring(ctx, p, from, text) {
  if (ctx.ts < from) return; const s = toScreen(p); const k = easeOut(seg(ctx.ts, from, from + 0.3));
  ctx.html(`<div style="position:absolute;left:${s.x}px;top:${s.y}px;width:260px;height:190px;margin:-95px 0 0 -130px;border:8px solid #ff4a4a;border-radius:50%;transform:scale(${1.5 - 0.5 * k}) rotate(-12deg);opacity:${k}"></div>` + (text ? `<div class="tag red" style="left:${s.x}px;top:${s.y + 150}px;opacity:${k};font-size:40px">${text}</div>` : ''));
}
function dashcam(ctx, from) {
  if (ctx.ts < from) return; const blink = Math.floor(ctx.t * 2) % 2 === 0; const br = 'position:absolute;width:90px;height:90px;border-color:#fff;border-style:solid;opacity:.9';
  ctx.html(`<div style="${br};left:70px;top:330px;border-width:8px 0 0 8px"></div><div style="${br};right:70px;top:330px;border-width:8px 8px 0 0"></div>
  <div style="${br};left:70px;bottom:330px;border-width:0 0 8px 8px"></div><div style="${br};right:70px;bottom:330px;border-width:0 8px 8px 0"></div>
  <div style="position:absolute;left:110px;top:440px;font:800 44px 'Inter Display',sans-serif;color:#fff;text-shadow:0 2px 8px #000"><span style="color:#ff3b3b;opacity:${blink ? 1 : 0.2}">●</span> REC</div>
  <div style="position:absolute;right:110px;top:440px;font:700 38px 'DejaVu Sans Mono',monospace;color:#fff;text-shadow:0 2px 8px #000">16/11/2026 08:47</div>`);
}
