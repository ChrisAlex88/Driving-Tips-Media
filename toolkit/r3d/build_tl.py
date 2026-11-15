import sys, json, re, numpy as np, scipy.io.wavfile as wf
sys.path.insert(0, '/home/claude/tts')
import tts
SR = 24000
def speech_regions(a, thr=0.012, win=240):
    n = len(a) // win; e = np.array([np.sqrt((a[i*win:(i+1)*win]**2).mean()) for i in range(n)])
    on = e > thr; return on, win
def build(name, voice='bm_george', speed=1.08):
    segs = json.load(open(f'/home/claude/r3d/scripts/{name}.json'))
    out = []; audio = []; t = 0.0
    for s in segs:
        lead = s.get('lead', 0.25); hold = s.get('hold', 0.35)
        text = s['say']; clean = text.replace('*', '')
        a, _ = tts.synth(clean, voice, s.get('speed', speed))
        a = a.astype(np.float32)
        # trim silence
        on, win = speech_regions(a)
        idx = np.where(on)[0]
        st = max(0, idx[0] * win - 600); en = min(len(a), (idx[-1] + 1) * win + 1200); a = a[st:en]
        on, win = speech_regions(a)
        # word weights
        toks = text.split(); pw = tts.phon_words(clean)
        wts = []
        for (w, ph) in pw:
            base = max(2, len(re.sub(r'[ˈˌ.,!?;:]', '', ph)))
            wts.append(base)
        # find pauses (>=0.12s silence) inside
        gaps = []; i = 0; n = len(on)
        while i < n:
            if not on[i]:
                j = i
                while j < n and not on[j]: j += 1
                if (j - i) * win / SR >= 0.12 and i > 0 and j < n: gaps.append((i * win / SR, j * win / SR))
                i = j
            else: i += 1
        # split words into clauses at punctuation, match clauses to gaps in order
        clauses = []; cur = []
        for k, (w, ph) in enumerate(pw):
            cur.append(k)
            if re.search(r'[.,!?;:]$', w): clauses.append(cur); cur = []
        if cur: clauses.append(cur)
        dur = len(a) / SR
        bounds = [(0.0, 0.0)]
        # choose gaps for clause boundaries by proportional expectation
        total_w = sum(wts); acc = 0; gi = 0
        for ci in range(len(clauses) - 1):
            acc += sum(wts[k] for k in clauses[ci]); exp = acc / total_w * dur
            best = None
            for g in gaps:
                if g[0] > bounds[-1][1] and (best is None or abs((g[0]+g[1])/2 - exp) < abs((best[0]+best[1])/2 - exp)): best = g
            if best and abs((best[0]+best[1])/2 - exp) < 0.9: bounds.append(best);
            else: bounds.append((exp, exp))
        words = []
        starts = [0.06] + [b[1] for b in bounds[1:]]; ends = [b[0] for b in bounds[1:]] + [dur - 0.05]
        for ci, cl in enumerate(clauses):
            s0, s1 = starts[ci], ends[ci]; tw = sum(wts[k] for k in cl); c = s0
            for k in cl:
                d = (s1 - s0) * wts[k] / tw
                w = toks[k]; kflag = '*' in w
                words.append({'w': w.replace('*', ''), 't0': round(lead + c, 3), 't1': round(lead + c + d, 3), 'k': kflag}); c += d
        segdur = lead + dur + hold
        out.append({'start': round(t, 3), 'dur': round(segdur, 3), 'say': clean, 'words': words})
        audio.append(np.zeros(int(lead * SR), np.float32)); audio.append(a); audio.append(np.zeros(int(hold * SR), np.float32))
        t += segdur
    A = np.concatenate(audio); A = A / max(1e-6, np.abs(A).max()) * 0.92
    wf.write(f'/home/claude/r3d/site/tl/{name}_voice.wav', SR, (A * 32767).astype(np.int16))
    json.dump({'total': round(t, 3), 'segments': out}, open(f'/home/claude/r3d/site/tl/{name}.json', 'w'), indent=1)
    print(name, round(t, 2), [round(s['dur'], 2) for s in out])
if __name__ == '__main__':
    build(sys.argv[1])
