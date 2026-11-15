import { THREE, scene, V, Ground, kerb, slab, tree, bush, house, lamp, Car, Person, HERO, lights, setMood, cam, shots, seg, lerp, easeIO, easeOut, easeIn, clamp, toScreen, povHands, belisha, trafficLight, mat, box, rbox } from '../engine.js';

// road along z, width 9 (x -4.5..4.5). We drive north (heading PI, towards -z) in the left lane x -4.5..0.
// crossing centred at z=0, 3m wide (z -1.5..1.5). Give-way / stop line on our side at z=2.5.
const RW = 4.5, CW = 1.5, GL = 2.6;
const HN = Math.PI;              // facing -z
const STOP_Z = GL + 2.15;        // car centre when front bumper at the line
const LANE = -2.3;

function zig(G, x, z0, z1) {
  const g = G.g; g.strokeStyle = '#f2f2ee'; g.lineWidth = 0.12 * G.k; g.beginPath();
  const n = Math.round(Math.abs(z1 - z0) / 1.0); for (let i = 0; i <= n; i++) { const z = lerp(z0, z1, i / n); const xx = x + (i % 2 ? 0.22 : -0.22); i ? g.lineTo(G.X(xx), G.Z(z)) : g.moveTo(G.X(xx), G.Z(z)); } g.stroke();
}
function paint(variant, y) {
  const G = new Ground(64, 2048, 0, 0); G.rand = (() => { let a = 3; return () => (a = (a * 9301 + 49297) % 233280) / 233280; })();
  G.grass('#6ea455');
  G.pavement(-8.6, -32, -RW, 32); G.pavement(RW, -32, 8.6, 32);
  G.asphalt(-RW, -32, RW, 32);
  const island = variant !== 'A';
  if (variant === 'C') {   // pelican straight across: studs + stop lines
    for (const zz of [-CW, CW]) for (let x = -RW; x < RW; x += 0.5) G.rect(x + 0.1, zz - 0.12, x + 0.3, zz + 0.12, '#e8e8e2');
    G.line(-RW, GL, -1.0, GL, 0.3); G.line(1.0, -GL, RW, -GL, 0.3);
  } else {
    // zebra stripes (parallel to traffic), give-way dashed lines
    for (let x = -RW + 0.25; x < RW - 0.2; x += 1.0) { if (island && Math.abs(x + 0.25) < 1.1) continue; G.rect(x, -CW, x + 0.5, CW, '#f4f4ef'); }
    G.line(-RW, GL, island ? -1.0 : 0, GL, 0.2, '#f2f2ee', 0.6, 0.3); G.line(island ? 1.0 : 0, -GL, RW, -GL, 0.2, '#f2f2ee', 0.6, 0.3);
  }
  // zig-zags on approaches
  for (const s of [1, -1]) {
    const z0 = s * (GL + 0.1), z1 = s * (GL + 14);
    zig(G, -RW + 0.25, z0, z1); zig(G, RW - 0.25, z0, z1);
    if (island) { zig(G, -1.25, z0, z1); zig(G, 1.25, z0, z1); } else zig(G, 0, z0, z1);
  }
  // centre line beyond
  G.line(0, GL + 14.5, 0, 32, 0.12, '#f2f2ee', 3, 6); G.line(0, -GL - 14.5, 0, -32, 0.12, '#f2f2ee', 3, 6);
  const m = G.build(y); return m;
}

const VIDEO = {
  build() {
    lights('day');
    // base world
    const B = new Ground(260, 4096, 0, -40); B.grass('#6ea455');
    B.pavement(-8.6, -170, -RW, 90); B.pavement(RW, -170, 8.6, 90); B.asphalt(-RW, -170, RW, 90);
    B.line(0, -170, 0, 90, 0.12, '#f2f2ee', 3, 6);
    B.build(0);
    kerb(-RW, -170, -RW, 90); kerb(RW, -170, RW, 90);
    slab(-8.6, -170, -RW - 0.1, 90, 0.12, '#cfcbc3'); slab(RW + 0.1, -170, 8.6, 90, 0.12, '#cfcbc3');
    const V3 = { A: paint('A', 0.004), B: paint('B', 0.005), C: paint('C', 0.006) };
    // island refuge (B, C)
    const isl = new THREE.Group(); scene.add(isl);
    rbox(1.6, 0.16, 7.0, 0.06, mat('#d2cec6'), V(0, 0.08, 0), isl); box(1.2, 0.02, 6.6, mat('#6aa04e'), V(0, 0.165, 0), isl, { cast: false });
    for (const zz of [-3.6, 3.6]) { const b = box(0.22, 0.6, 0.22, mat('#f4f4f4'), V(0, 0.3, zz), isl); }
    // beacons
    const bA = [belisha(-RW - 0.45, -CW - 0.4), belisha(RW + 0.45, CW + 0.4)];
    const bI = [belisha(0, -CW - 0.35), belisha(0, CW + 0.35)];
    // pelican lights (C)
    const tl = [trafficLight(-RW - 0.5, GL + 0.3, 0), trafficLight(0.35, GL + 0.3, 0), trafficLight(RW + 0.5, -GL - 0.3, Math.PI), trafficLight(-0.35, -GL - 0.3, Math.PI)];
    // buildings + trees
    const cols = ['#e2c9a6', '#d4b48f', '#c9b9a5', '#e6d8c3', '#cfa78a'], roofs = ['#a65a46', '#7a4f40', '#8a5a48', '#6b4a3c'];
    for (let i = 0; i < 14; i++) { const z = 60 - i * 15;
      house(-14.5, z, Math.PI / 2, { w: 12, d: 8, h: 6 + (i % 3) * 0.6, col: cols[i % 5], roof: roofs[i % 4], cols: 4 });
      house(14.5, z + 6, -Math.PI / 2, { w: 12, d: 8, h: 6 + ((i + 1) % 3) * 0.6, col: cols[(i + 2) % 5], roof: roofs[(i + 1) % 4], cols: 4 }); }
    for (let i = 0; i < 18; i++) { const z = 70 - i * 12; if (Math.abs(z) < 5) continue; tree(-7.4, z, 0.8); tree(7.4, z + 5, 0.8); }
    for (let i = 0; i < 6; i++) { lamp(-6.2, 40 - i * 30, Math.PI / 2); lamp(6.2, 25 - i * 30, -Math.PI / 2); }
    // cars
    const car = new Car(HERO, { interior: true }); const hands = povHands(car);
    const q1 = new Car('#e9ecef', { plate: 'KD19 FTR' }), q2 = new Car('#9b2226', { plate: 'BX68 NWL' });
    const opp = new Car('#5e548e', { plate: 'YR70 KLD' });
    const ped = new Person({ shirt: '#f2b316', pants: '#2c3550', hair: '#3a2a20' });
    const ped2 = new Person({ shirt: '#3a86ff', pants: '#333', hair: '#b07a3a', skin: '#c98d5e' });
    return { V3, isl, bA, bI, tl, car, hands, q1, q2, opp, ped, ped2 };
  },
  frame(ctx) {
    const { O, t } = ctx; setMood('day', V(0, 0, 3));
    this.variant(O, 'A');
    O.car.place(LANE, STOP_Z, HN); O.car.glassClear(false); O.car.cabin.intensity = 0; O.hands.visible = false; O.car.brake(true);
    O.q1.place(LANE, STOP_Z + 6.2, HN); O.q1.brake(true); O.q2.place(LANE, STOP_Z + 12.4, HN); O.q2.brake(true);
    O.opp.g.visible = false; O.ped2.g.visible = false; O.ped.g.visible = true;
    [...O.bA, ...O.bI].forEach(b => b.flash(t)); O.tl.forEach(l => l.set('amber'));
  },
  variant(O, v) {
    O.V3.A.visible = v === 'A'; O.V3.B.visible = v === 'B'; O.V3.C.visible = v === 'C';
    O.isl.visible = v !== 'A'; O.bI.forEach(b => b.g.visible = v === 'B'); O.bA.forEach(b => b.g.visible = v !== 'C'); O.tl.forEach(l => l.g.visible = v === 'C');
  },
  segs: [
    { kicker: 'On your driving test', head: "They step onto <span class='hl'>the zebra</span>",
      update(ctx) { const { O, ts } = ctx;
        const k = easeOut(seg(ts, 0, 3.0)); const z = lerp(STOP_Z + 22, STOP_Z, k); O.car.set(LANE, z, HN); O.car.brake(k > 0.6); O.q1.place(LANE, z + 6.2, HN, z); O.q1.brake(k > 0.6); O.q2.place(LANE, z + 12.4 + (1 - k) * 4, HN, z); O.q2.brake(k > 0.7);
        pov(O); pedPath(O.ped, P1, ctx.t);
        ctx.label('ZEBRA CROSSING', V(-2.2, 0.2, 0), ctx.word('zebra') - 0.1, 99, { bg: '#111', lift: 0 });
      } },
    { kicker: 'Now they’re past your side', head: "Can you <span class='hl'>go?</span>",
      update(ctx) { const { O, ts } = ctx; pov(O);
        pedPath(O.ped, P1, ctx.t);
        ctx.label('PAST YOUR CAR', O.ped.g.position.clone().add(V(0, 2.1, 0)), ctx.word('past') - 0.1, 99, { bg: '#EF3B3B' });
      } },
    { kicker: '', head: "Look <span class='hl'>closer</span>",
      update(ctx) { const { O, ts } = ctx; pedPath(O.ped, P1, ctx.t);
        const eye = O.car.world(-0.4, 1.25, -0.5), fwd = O.car.world(-0.35, 1.0, 8);
        const k = easeIO(seg(ts, 0.1, ctx.dur)); cam(eye.clone().lerp(TOP.p, k), fwd.clone().lerp(TOP.l, k), lerp(62, TOP.f, k));
      } },
    { kicker: 'No island', head: "<span class='hl'>One</span> crossing",
      update(ctx) { const { O, ts } = ctx; pedPath(O.ped, P1, ctx.t);
        top(ts);
        ctx.label('ONE CROSSING', V(0, 0.1, -2.2), ctx.word('one') - 0.1, 99, { bg: '#111', lift: 0 });
        ctx.label('STILL ON IT', O.ped.g.position.clone().add(V(0, 1.9, 0)), ctx.word('still') - 0.1, 99, { bg: '#EF3B3B' });
        ctx.label('WAIT', O.car.world(0, 1.7, 0), ctx.word('wait') - 0.1, 99, { bg: '#EF3B3B' });
      } },
    { kicker: 'Highway Code · rule 195', head: "You <span class='hl'>must</span> give way",
      update(ctx) { const { O, ts } = ctx; pedPath(O.ped, P1, ctx.t);
        top(ts + 6, 0.3);
        ctx.box(t => `<div class="bt">Not giving way at a zebra</div>
          <div class="row"><span>Points</span><b style="opacity:${t > ctx.word('three') ? 1 : .15}">3</b></div>
          <div class="row"><span>Fine</span><b style="opacity:${t > ctx.word('hundred') ? 1 : .15}">£100</b></div>
          <div style="font-weight:600;font-size:28px;opacity:.7;margin-top:10px">Typical fixed penalty</div>`, 0.3, 99, { y: 520 });
      } },
    { kicker: 'Now add', head: "An <span class='hl'>island</span>",
      update(ctx) { const { O, ts } = ctx; this_variant(ctx, 'B');
        const k = easeOut(seg(ts, 0.3, 0.9)); O.isl.scale.set(1, k, 1); O.bI.forEach(b => b.g.scale.set(1, Math.max(0.01, k), 1));
        O.ped.g.visible = false; top(ts);
        ctx.ev('pop', 0.3);
      } },
    { kicker: 'Island = two crossings', head: "Off your half? <span class='hl'>Go.</span>",
      update(ctx) { const { O, ts } = ctx; this_variant(ctx, 'B'); O.isl.scale.set(1, 1, 1); O.bI.forEach(b => b.g.scale.set(1, 1, 1));
        pedPath(O.ped, [[0.3, -6.2], [4.6, -0.5], [9.5, 4.2]], ts);
        const go = ctx.word('go') - 0.1; const kg = easeIn(seg(ts, go, ctx.dur + 1.5)); O.car.set(LANE, STOP_Z - kg * 4.5, HN); O.car.brake(kg <= 0);
        top(ts);
        ctx.label('CROSSING 1', V(-2.7, 0.1, -2.6), ctx.word('two') - 0.1, ctx.word('off'), { bg: '#111', lift: 0, size: 32 });
        ctx.label('CROSSING 2', V(2.7, 0.1, -2.6), ctx.word('separate') - 0.05, ctx.word('off'), { bg: '#111', lift: 0, size: 32 });
        ctx.label('OFF YOUR HALF ✓', O.ped.g.position.clone().add(V(0, 1.9, 0)), ctx.word('off') - 0.05, ctx.word('go') + 0.3, { bg: '#19C15F' });
        ctx.label('GOOD TO GO', O.car.world(0, 1.7, 0), go, 99, { bg: '#19C15F' });
      } },
    { kicker: 'But traffic lights', head: "Straight across = <span class='hl'>one</span>",
      update(ctx) { const { O, ts, t } = ctx; this_variant(ctx, 'C');
        O.tl.forEach(l => l.set((Math.floor(t * 1.6) % 2) ? 'amber' : 'off'));
        // pedestrian coming from the far side, now on the far half
        O.ped2._z = 0.4; pedPath(O.ped2, [[0.2, 6.2], [9.2, 1.4]], ts); O.ped2.g.visible = true; O.ped.g.visible = false;
        top(ts);
        ctx.label('TRAFFIC LIGHTS', O.tl[1].g.position.clone().add(V(0, 4.2, 0)), ctx.word('traffic') - 0.1, 99, { bg: '#111' });
        ctx.label('ONE CROSSING', V(0, 0.1, -2.4), ctx.word('one') - 0.1, 99, { bg: '#EF3B3B', lift: 0 });
        ctx.label('WAIT', O.car.world(0, 1.7, 0), ctx.word('wait') - 0.1, 99, { bg: '#EF3B3B' });
      } },
    { kicker: '', head: '', noCaps: true,
      update(ctx) { const { O, ts } = ctx; this_variant(ctx, 'B'); O.isl.scale.set(1, 1, 1); O.bI.forEach(b => b.g.scale.set(1, 1, 1));
        O.ped.at(2.5, 0, Math.PI / 2).stand(); top(ts * 0.3, 0.5);
        ctx.quiz('Zebra with an island. They’ve reached the <span class="hl">far half</span>. Can you go?', ['Yes, carefully', 'No, wait until they’re off'], 0, 99, { y: 470 });
      } },
    { kicker: '', head: '', noCaps: false,
      update(ctx) { const { O, ts } = ctx; this_variant(ctx, 'B'); O.isl.scale.set(1, 1, 1); O.bI.forEach(b => b.g.scale.set(1, 1, 1));
        O.ped.at(2.5 + ts * 1.2, 0, Math.PI / 2).walk(ts * 7); const kg = easeIn(seg(ts, 0.4, 5)); O.car.set(LANE, STOP_Z - kg * 6, HN); O.car.brake(kg <= 0);
        top(2.4 + ts * 0.3, 0.5);
        ctx.quiz('Zebra with an island. They’ve reached the <span class="hl">far half</span>. Can you go?', ['Yes, carefully', 'No, wait until they’re off'], 0, 0.15, { y: 470, from: -1 });
        ctx.big("FOLLOW <span class='hl'>FOR MORE</span>", 2.3, 99, { y: 1180, size: 84 });
      } },
  ],
};
function this_variant(ctx, v) { VIDEO.variant(ctx.O, v); }
const TOP = { p: V(-1.0, 24, 15.5), l: V(-0.3, 0, 2.2), f: 44 };
function top(ts, drift = 0.6) { cam(V(TOP.p.x + Math.sin(ts * 0.25) * drift, TOP.p.y - ts * 0.15, TOP.p.z), TOP.l, TOP.f); }
function pov(O) { O.car.glassClear(true); O.hands.visible = true; O.car.cabin.intensity = 3.5; const eye = O.car.world(-0.4, 1.25, -0.5), fwd = O.car.world(-0.35, 1.0, 8); cam(eye, fwd, 62); }
// pedestrian walks across along x at z=zz, starting at time `start` (in the walk's own clock)
function walkPed(p, x0, zz, tt, start, h0, until = 99) {
  const dir = x0 < 0 ? 1 : -1; const speed = 1.25;
  const tw = clamp(tt - start, 0, until); const x = x0 + dir * tw * speed;
  p.g.visible = true; p.at(x, zz, dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  if (tt > start && tw < until) p.walk((tt - start) * 7); else p.stand();
}
export default VIDEO;
function pedPath(p, keys, t) {
  p.g.visible = true; let x = keys[0][1], moving = false, dir = Math.sign(keys[keys.length - 1][1] - keys[0][1]) || 1, dist = 0;
  for (let i = 0; i < keys.length - 1; i++) { const [t0, x0] = keys[i], [t1, x1] = keys[i + 1];
    if (t >= t1) { dist += Math.abs(x1 - x0); x = x1; continue; }
    if (t > t0) { const k = (t - t0) / (t1 - t0); x = lerp(x0, x1, k); dist += Math.abs(x - x0); moving = true; } break; }
  p.at(x, p._z ?? -0.4, dir > 0 ? Math.PI / 2 : -Math.PI / 2); if (moving) p.walk(dist * 4.2); else p.stand();
}
const P1 = [[0.6, -6.2], [4.59, -0.6], [8.77, 1.3], [10.29, 1.9], [16.08, 4.0], [19.0, 6.0]];
