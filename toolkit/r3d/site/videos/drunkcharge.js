import { THREE, scene, V, Ground, kerb, slab, tree, bush, house, lamp, stars, moon, Car, Person, HERO, lights, setMood, L, cam, shots, seg, lerp, easeIO, easeOut, clamp, toScreen, povHands, makeSeated, taxiSign, glowMat, mat, box } from '../engine.js';

// layout: road along x (z -6..1), parking strip z 1..6 with bays, pavement z 6..10, buildings at z>=10
const CAR = { x: 0, z: 3.4 };     // parked car, heading -x (driver side faces -z, towards camera)
const HD = -Math.PI / 2;

export default {
  build() {
    lights('night');
    const G = new Ground(240, 4096, -40, 0);
    G.grass('#55783f');
    G.asphalt(-160, -6, 80, 6.0, '#373b42');
    G.pavement(-160, 6, 80, 10.5); G.pavement(-160, -10, 80, -6);
    G.line(-160, -2.5, 80, -2.5, 0.12, '#eeeeea', 3, 6);
    G.line(-160, 1.0, 80, 1.0, 0.12, '#eeeeea');              // edge of carriageway / parking strip
    for (let x = -18; x <= 18; x += 6) G.line(x, 1.0, x, 5.8, 0.12, '#eeeeea');   // bay lines (bays along x)
    G.line(-18, 5.8, 18, 5.8, 0.12, '#eeeeea');
    G.build();
    kerb(-160, 6, 80, 6); kerb(-160, -6, 80, -6);
    slab(-160, 6.1, 80, 10.5, 0.12, '#cfcbc3'); slab(-160, -10.5, 80, -6.1, 0.12, '#cfcbc3');
    // buildings behind the bays (facing -z => rotY = PI)
    house(-1, 14, Math.PI, { w: 12, d: 7, h: 6.2, col: '#b98962', roof: '#55423a', night: true, awning: '#25463a', sign: 'THE KINGS ARMS', cols: 4, litP: .95, door: '#1f3a2e' });
    house(-14, 14, Math.PI, { w: 8, d: 7, h: 5.6, col: '#d9c6a4', roof: '#6b4a3c', night: true, litP: .5 });
    house(12, 14, Math.PI, { w: 9, d: 7, h: 5.8, col: '#c7b7a0', roof: '#5b4638', night: true, litP: .45 });
    for (let i = 0; i < 9; i++) { const x = -26 - i * 10; house(x, 14, Math.PI, { w: 8.5, d: 7, h: 5.4 + (i % 3) * 0.3, col: ['#d9c6a4', '#c9a98a', '#e0d3bd'][i % 3], roof: ['#6b4a3c', '#5b4638', '#7a4f40'][i % 3], night: true, litP: .5 }); }
    for (let i = 0; i < 13; i++) { const x = 20 - i * 10; house(x, -20, 0, { w: 8.5, d: 7, h: 5.4 + (i % 2) * 0.4, col: ['#e0d3bd', '#d4b48f', '#c9b9a5'][i % 3], roof: ['#5b4638', '#7a4f40', '#6b4a3c'][i % 3], night: true, litP: .45 }); }
    for (let i = 0; i < 12; i++) { tree(18 - i * 11, 9.4, 0.85); tree(14 - i * 11, -9.4, 0.85); }
    this.lamps = [lamp(6, 9.2, Math.PI, true, true), lamp(-10, 9.2, Math.PI, true, true), lamp(-2, -9.2, 0, true, false), lamp(-30, 9.2, Math.PI, true, true)];
    stars(600); this.moon = moon(V(0.45, 0.5, 1));
    // parked cars in other bays
    const o1 = new Car('#c0c5cc', { plate: 'KD19 FTR' }); o1.place(-12, 3.4, HD);
    const o2 = new Car('#9b2226', { plate: 'BX68 NWL' }); o2.place(12, 3.4, HD);
    // hero
    const car = new Car(HERO, { interior: true }); car.place(CAR.x, CAR.z, HD);
    const drv = makeSeated(car, new Person({ shirt: '#f2a516', pants: '#2c3550', closed: true }), -0.4, 0.28);
    drv.headG.rotation.set(-0.15, 0, 0.38); drv.shL.rotation.set(-0.35, 0, 0.12); drv.shR.rotation.set(-0.35, 0, -0.12);
    const hands = povHands(car); hands.visible = false;
    const inLight = new THREE.PointLight(0xffd9a8, 2.0, 4, 2); inLight.position.set(0.2, 1.45, 0.3); car.g.add(inLight);
    // morning traffic / taxi
    const taxi = new Car('#16181c', { plate: 'TX21 CAB', lplate: false }); taxiSign(taxi);
    const walker = new Person({ shirt: '#f2a516', pants: '#2c3550' });
    // a moving car for the morning POV
    const ahead = new Car('#e9ecef', { plate: 'YR70 KLD' });
    return { car, drv, hands, inLight, taxi, walker, ahead, o1, o2 };
  },
  frame(ctx) {
    const { O } = ctx;
    setMood('night', V(CAR.x, 0, CAR.z));
    O.car.place(CAR.x, CAR.z, HD); O.car.glassClear(false); O.car.glass.opacity = 0.32; O.inLight.intensity = 1.2; O.car.lightsOn(false); O.car.brake(false);
    O.drv.g.visible = true; O.drv.eyesClosed(true); O.drv.headG.rotation.set(-0.15, 0, 0.38); O.drv.torso.rotation.x = -0.28;
    O.hands.visible = false; O.car.cabin.intensity = 0;
    O.taxi.g.visible = false; O.walker.g.visible = false; O.ahead.g.visible = false;
    this.lamps.forEach(l => l.visible = true);
  },
  segs: [
    { kicker: 'After a night out', head: "Sleep it off <span class='hl'>in the car?</span>",
      update(ctx) { const { ts } = ctx;
        shots(ts, [{ t: 0, p: V(-0.4, 1.35, -9.6), l: V(-0.2, 2.0, CAR.z), f: 42 }, { t: 5.1, blend: 5.1, p: V(-0.3, 1.3, -8.2), l: V(-0.2, 1.9, CAR.z), f: 42 }], 0.02);
        zzz(ctx, 0.3);
      } },
    { kicker: 'Engine off', head: "Not driving. <span class='hl'>Still 10 points?</span>",
      update(ctx) { const { O, ts } = ctx; O.car.glassClear(true); O.inLight.intensity = 1.6;
        const a = O.car.world(0.62, 1.32, 0.5), b = O.car.world(-0.38, 1.0, -0.3);
        const a2 = O.car.world(0.7, 1.38, 0.62), b2 = O.car.world(-0.4, 1.05, -0.25);
        shots(ts, [{ t: 0, p: a, l: b, f: 56 }, { t: 5.5, blend: 5.5, p: a2, l: b2, f: 60 }]);
        ctx.big("<span class='hl'>10</span> POINTS", ctx.word('ten'), 99, { y: 640, size: 150 });
      } },
    { kicker: "That's being", head: "In charge <span class='hl'>of the car</span>",
      update(ctx) { const { O, ts } = ctx;
        shots(ts, [{ t: 0, p: V(-4.6, 2.4, -5.2), l: V(0, 1.0, CAR.z), f: 40 }, { t: 6.3, blend: 6.3, p: V(3.4, 2.2, -5.4), l: V(-0.2, 1.0, CAR.z), f: 36 }]);
        const head = O.car.world(-0.4, 1.75, -0.3);
        ctx.label('IN THE CAR ✓', head, ctx.word('in', 1) - 0.1, 99, { bg: '#EF3B3B', lift: 30 });
        ctx.label('KEYS ✓', O.car.world(-0.6, 1.0, 0.9), ctx.word('keys') - 0.1, 99, { bg: '#EF3B3B', lift: 6 });
        ctx.label('OVER THE LIMIT ✓', O.car.world(-0.4, 1.7, -1.6), ctx.word('limit') - 0.15, 99, { bg: '#EF3B3B', lift: 90 });
        zzz(ctx, 0);
      } },
    { kicker: 'The penalty', head: "Drunk <span class='hl'>in charge</span>",
      update(ctx) { const { ts } = ctx;
        const a = 0.2 + ts * 0.05; cam(V(Math.sin(a) * -12 + CAR.x, 7.5 - ts * 0.3, -Math.cos(a) * 12 + CAR.z), V(CAR.x, 0.8, CAR.z), 38);
        ctx.box(t => `<div class="bt">Drunk in charge</div>
          <div class="row"><span>Points</span><b style="opacity:${t > ctx.word('ten') ? 1 : .15}">10</b></div>
          <div class="row"><span>Or</span><b style="opacity:${t > ctx.word('ban') ? 1 : .15}">a ban</b></div>
          <div class="row"><span>Prison</span><b style="opacity:${t > ctx.word('three') ? 1 : .15}">up to 3 months</b></div>`, 0.2, 99, { y: 520 });
      } },
    { kicker: 'Even if', head: "Asleep, <span class='hl'>engine off</span>",
      update(ctx) { const { O, ts } = ctx;
        shots(ts, [{ t: 0, p: V(-1.2, 1.35, -4.4), l: V(-0.3, 1.2, CAR.z), f: 40 }, { t: 3.9, blend: 3.9, p: V(0.4, 1.35, -3.6), l: V(-0.4, 1.25, CAR.z), f: 38 }]);
        zzz(ctx, 0);
        ctx.stamp('CAN BE CHARGED', ctx.word('charged') - 0.25, { col: '#EF3B3B', y: 980 });
      } },
    { noCaps: false, kicker: '', head: '',
      update(ctx) { const { O, ts } = ctx; const k = seg(ts, 0.0, 1.4);
        setMood(k < 0.5 ? 'night' : 'dawn', V(CAR.x, 0, CAR.z));
        cam(V(-0.3, 1.4 + k * 0.6, -9.4), V(-0.2, 2.0 + k * 0.5, CAR.z), 42);
        O.drv.eyesClosed(k < 0.7);
        if (k >= 0.5) lampsOff(ctx);
        ctx.big("THE <span class='hl'>MORNING</span> AFTER", 0.6, 99, { y: 700, size: 104 });
      } },
    { kicker: 'Highway Code · rule 95', head: "Still <span class='hl'>over the limit?</span>",
      update(ctx) { const { O, ts } = ctx; setMood('dawn', V(-30, 0, 0)); lampsOff(ctx);
        // driving along the road (heading -x, left lane z=-0.75)
        const x = 10 - ts * 9.5; O.car.set(x, -0.75, HD); O.car.glassClear(true);
        O.drv.g.visible = false; O.hands.visible = true;
        O.ahead.g.visible = true; O.ahead.set(x - 26 - ts * 0.4, -0.75, HD);
        const eye = O.car.world(-0.4, 1.25, -0.5), fwd = O.car.world(-0.35, 1.0, 8);
        cam(eye, fwd, 62); O.inLight.intensity = 0; O.car.cabin.intensity = 3.0;
        ctx.label('UNFIT TO DRIVE?', O.car.world(-0.3, 2.2, 14), ctx.word('unfit') - 0.1, 99, { bg: '#EF3B3B' });
      } },
    { kicker: 'After a night out', head: "Leave the car. <span class='hl'>Get a taxi.</span>",
      update(ctx) { const { O, ts } = ctx; setMood('dawn', V(0, 0, 3)); lampsOff(ctx);
        O.drv.g.visible = false;
        // person walks away along the pavement, taxi pulls up on the road
        O.walker.g.visible = true; const kw = seg(ts, 0.4, 4.6); O.walker.at(lerp(0.4, -4.6, kw), lerp(2.0, 1.1, kw), -Math.PI / 2 - 0.15).walk(kw > 0 && kw < 1 ? ts * 7 : 0);
        O.taxi.g.visible = true; const k = easeOut(seg(ts, 0.3, 4.2)); const tx = lerp(40, -7.2, k); O.taxi.set(tx, -0.75, HD); O.taxi.brake(k > 0.9);
        shots(ts, [{ t: 0, p: V(-4.6, 1.7, -9.8), l: V(-5.2, 1.5, 2.5), f: 44 }, { t: 7.2, blend: 7.2, p: V(-6.4, 1.8, -9.6), l: V(-6.6, 1.5, 2.0), f: 44 }]);
        ctx.label('LEAVE THE CAR', O.car.world(0, 1.8, 0), ctx.word('leave') - 0.1, 99, { bg: '#19C15F' });
        ctx.label('TAXI ✓', O.taxi.world(0, 2.0, 0), ctx.word('taxi') - 0.1, 99, { bg: '#19C15F' });
      } },
    { kicker: '', head: '', noCaps: true,
      update(ctx) { const { ts } = ctx; const a = 0.5 + ts * 0.04;
        cam(V(Math.sin(a) * -14 + CAR.x, 6, -Math.cos(a) * 14 + CAR.z), V(CAR.x, 1.0, CAR.z), 40); zzz(ctx, 0);
        ctx.quiz('Asleep in your parked car, over the limit, keys with you. <span class="hl">Points?</span>', ["No, you're not driving", 'Yes, up to 10 points'], 1, 99, { y: 470 });
      } },
    { kicker: '', head: '', noCaps: false,
      update(ctx) { const { ts } = ctx; const a = 0.8 + ts * 0.04;
        cam(V(Math.sin(a) * -14 + CAR.x, 6, -Math.cos(a) * 14 + CAR.z), V(CAR.x, 1.0, CAR.z), 40); zzz(ctx, 0);
        ctx.quiz('Asleep in your parked car, over the limit, keys with you. <span class="hl">Points?</span>', ["No, you're not driving", 'Yes, up to 10 points'], 1, 0.15, { y: 470, from: -1 });
        ctx.big("FOLLOW <span class='hl'>FOR MORE</span>", 2.3, 99, { y: 1180, size: 84, sfx: 'whoosh' });
      } },
  ],
};
function zzz(ctx, from) {
  const p = ctx.O.car.world(-0.45, 1.75, -0.3); const s = toScreen(p); if (s.z > 1) return;
  let h = '';
  for (let i = 0; i < 3; i++) { const ph = ((ctx.t * 0.55 + i / 3) % 1); h += `<div style="position:absolute;left:${s.x + 20 + ph * 70}px;top:${s.y - 30 - ph * 160}px;font-weight:900;font-size:${46 + ph * 40}px;opacity:${Math.sin(ph * Math.PI)};color:#fff;text-shadow:0 3px 12px rgba(0,0,0,.6)">z</div>`; }
  if (ctx.ts >= from) ctx.html(h);
}
function ring(ctx, p, from, text) {
  if (ctx.ts < from) return; const s = toScreen(p); const k = easeOut(seg(ctx.ts, from, from + 0.3));
  ctx.html(`<div style="position:absolute;left:${s.x}px;top:${s.y}px;width:150px;height:150px;margin:-75px 0 0 -75px;border:9px solid #EF3B3B;border-radius:50%;transform:scale(${1.6 - 0.6 * k});opacity:${k};box-shadow:0 0 24px rgba(239,59,59,.6)"></div><div class="lab" style="left:${s.x}px;top:${s.y - 90}px;background:#EF3B3B;border-color:#EF3B3B;opacity:${k}">${text}</div>`);
  ctx.ev('pop', from);
}
function lampsOff(ctx) { /* lamps keep geometry; dawn light dominates */ }
