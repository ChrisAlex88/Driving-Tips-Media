import { renderer, scene, camera, toScreen, clamp, seg, easeOut, W, H } from './engine.js';
const Q = new URLSearchParams(location.search);
const NAME = Q.get('v'); const NOR = Q.get('nr') === '1';
const mod = await import(`./videos/${NAME}.js?${Date.now()}`);
const video = mod.default;
const TL = await (await fetch(`./tl/${NAME}.json?${Date.now()}`)).json();
const O = video.build(); window.__O = O;
const ov = document.getElementById('ov');
const events = []; const evSeen = new Set();
const norm = s => s.toLowerCase().replace(/[^a-z0-9'£]/g, '');

function captionHTML(segT, ts) {
  const ws = segT.words; if (!ws || !ws.length) return '';
  // chunk into groups of up to 3 words, breaking after punctuation
  const chunks = []; let cur = [];
  ws.forEach((w, i) => { cur.push(w); if (cur.length >= 3 || /[.,!?;:]$/.test(w.w)) { chunks.push(cur); cur = []; } });
  if (cur.length) chunks.push(cur);
  let c = null;
  for (const ch of chunks) if (ts >= ch[0].t0 - 0.05) c = ch;
  if (!c) return '';
  const last = c[c.length - 1]; if (ts > last.t1 + 0.6 && c === chunks[chunks.length - 1]) return '';
  return `<div class="cap">${c.map(w => `<span class="${w.k ? 'k' : ''}">${w.w.replace(/[*]/g, '')}</span>`).join(' ')}</div>`;
}

function wordHTML(segT, ts) {
  const ws = segT.words; if (!ws || !ws.length) return ''; let c = null;
  for (const w of ws) if (ts >= w.t0 - 0.03) c = w;
  if (!c || ts > ws[ws.length - 1].t1 + 0.4) return '';
  return `<div class="word ${c.k ? 'k' : ''}">${c.w.replace(/[*.,!?;:"]/g, '')}</div>`;
}
window.renderAt = function (t) {
  let si = 0; for (let i = 0; i < TL.segments.length; i++) if (t >= TL.segments[i].start) si = i;
  const S = TL.segments[si], ts = t - S.start; const segDef = video.segs[si] || {};
  let html = '';
  const ctx = {
    O, t, ts, si, dur: S.dur, total: TL.total,
    word(w, n = 0) { const nw = norm(w); let c = 0; for (const x of S.words) if (norm(x.w) === nw) { if (c === n) return x.t0; c++; } return 0; },
    wordEnd(w, n = 0) { const nw = norm(w); let c = 0; for (const x of S.words) if (norm(x.w) === nw) { if (c === n) return x.t1; c++; } return 0; },
    ev(name, at) { const T = S.start + at; const key = name + '@' + T.toFixed(2); if (ts >= at && !evSeen.has(key)) { evSeen.add(key); events.push({ name, t: T }); } },
    html(s) { html += s; },
    label(text, p, from, to = 99, o = {}) {
      if (ts < from || ts > to) return; const s = toScreen(p); if (s.z > 1) return;
      const k = easeOut(seg(ts, from, from + 0.25)); const out = to < 99 ? 1 - seg(ts, to - 0.2, to) : 1;
      const bg = o.bg || '#111'; const sc = 0.6 + 0.4 * k;
      html += `<div class="lab" style="left:${s.x}px;top:${s.y - (o.lift ?? 10)}px;background:${bg};border-color:${bg};color:${o.color || '#fff'};font-size:${o.size || 38}px;opacity:${k * out};transform:translate(-50%,-100%) scale(${sc})">${text}</div>`;
      if (o.sfx !== false) this.ev('pop', from);
    },
    big(text, from, to = 99, o = {}) {
      if (ts < from || ts > to) return; const k = easeOut(seg(ts, from, from + 0.3)); const out = to < 99 ? 1 - seg(ts, to - 0.25, to) : 1;
      html += `<div class="big" style="top:${o.y || 760}px;font-size:${o.size || 120}px;color:${o.color || '#fff'};opacity:${k * out};transform:scale(${0.7 + 0.3 * k})">${text}</div>`;
      if (o.sfx !== false) this.ev(o.sfx || 'whoosh', from);
    },
    box(inner, from, to = 99, o = {}) {
      if (ts < from || ts > to) return; const k = easeOut(seg(ts, from, from + 0.35)); const out = to < 99 ? 1 - seg(ts, to - 0.25, to) : 1;
      html += `<div class="box" style="top:${o.y || 560}px;opacity:${k * out};transform:translateY(${(1 - k) * 60}px)">${inner(ts)}</div>`;
      if (o.sfx !== false) this.ev('whoosh', from);
    },
    stamp(text, at, o = {}) {
      if (ts < at) return; const k = easeOut(seg(ts, at, at + 0.22)); const col = o.col || '#19C15F';
      html += `<div class="stamp" style="top:${o.y || 900}px;color:${col};border-color:${col};background:rgba(10,14,22,.55);opacity:${k};transform:translate(-50%,-50%) rotate(-6deg) scale(${1.6 - 0.6 * k})">${text}</div>`;
      this.ev(o.sfx || 'ding', at);
    },
    tag(text, from, to = 99, o = {}) {
      if (ts < from || ts > to) return; const k = easeOut(seg(ts, from, from + 0.2)); const out = to < 99 ? 1 - seg(ts, to - 0.15, to) : 1;
      html += `<div class="tag ${o.col || 'red'}" style="top:${o.y || 560}px;opacity:${k * out};transform:translate(-50%,-50%) scale(${1.25 - 0.25 * k})">${text}</div>`;
    },
    quiz(q, opts, right, reveal, o = {}) {
      const from = o.from ?? 0.1; if (ts < from) return;
      const k = easeOut(seg(ts, from, from + 0.35));
      const rows = opts.map((op, i) => `<div class="qopt ${ts >= reveal ? (i === right ? 'right' : 'wrong') : ''}"><span class="lt">${'AB'[i]}</span>${op}</div>`).join('');
      html += `<div class="box" style="top:${o.y || 560}px;opacity:${k};transform:translateY(${(1 - k) * 60}px)"><div class="bt">${o.title || 'QUICK QUIZ'}</div><div style="font-weight:900;font-size:50px;line-height:1.12">${q}</div>${rows}</div>`;
      this.ev('whoosh', from); this.ev('ding', reveal);
    },
  };
  if (video.frame) video.frame(ctx);
  if (segDef.update) segDef.update(ctx);
  if (!NOR) renderer.render(scene, camera);
  // overlay
  const prog = `<div class="prog" style="width:${clamp(t / TL.total) * W}px"></div>`;
  const brand = video.episode ? `<div class="ep"><span class="bar"></span><span class="nm">DRIVING TIPS UK</span><span>${video.episode}</span></div><div class="handle">@driving.tips.uk</div>` : `<div class="brand"><span class="l">L</span>Driving Tips UK</div><div class="handle">@driving.tips.uk</div>`;
  const head = segDef.head ? `<div class="headwrap">${segDef.kicker ? `<div class="kicker">${segDef.kicker}</div>` : ''}<div class="head" style="${segDef.headSize ? 'font-size:' + segDef.headSize + 'px' : ''}">${segDef.head}</div></div>` : '';
  ov.innerHTML = prog + brand + head + html + (segDef.noCaps ? '' : (video.wordCaps ? wordHTML(S, ts) : captionHTML(S, ts)));
  return true;
};
window.getEvents = () => events;
window.TOTAL = TL.total;
window.ready = true;
