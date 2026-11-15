import sys, json, numpy as np, scipy.io.wavfile as wf, subprocess, os
SR = 48000
name, frames, out = sys.argv[1], sys.argv[2], sys.argv[3]
vsr, v = wf.read(f'/home/claude/r3d/site/tl/{name}_voice.wav')
v = v.astype(np.float32) / 32768
# resample voice 24k -> 48k
v = np.interp(np.arange(int(len(v) * SR / vsr)) / SR, np.arange(len(v)) / vsr, v)
total = json.load(open(f'/home/claude/r3d/site/tl/{name}.json'))['total']
N = int((total + 0.5) * SR)
mixL = np.zeros(N, np.float32)
mixL[:len(v)] += v * 1.0
rng = np.random.default_rng(1)
def env(n, a=0.005, d=0.2):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def pop():
    n = int(0.14 * SR); t = np.arange(n) / SR; f = 900 * np.exp(-t * 18) + 380
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.04) * 0.32
def whoosh():
    n = int(0.55 * SR); x = rng.standard_normal(n).astype(np.float32)
    # moving band via simple one-pole filters
    out = np.zeros(n, np.float32); y = 0; k0 = 0.02
    for i in range(n):
        k = k0 + 0.25 * np.sin(np.pi * i / n) ** 2; y += k * (x[i] - y); out[i] = y
    e = np.sin(np.pi * np.arange(n) / n) ** 2
    return out * e * 0.5
def ding():
    n = int(1.2 * SR); t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(1318, 1), (2637, .35), (1976, .25)])
    return s * env(n, 0.003, 0.35) * 0.16
SFX = {'pop': pop(), 'whoosh': whoosh(), 'ding': ding()}
ev = json.load(open(os.path.join(frames, 'events.json')))
for e in ([] if os.environ.get('NOSFX') else ev):
    s = SFX.get(e['name']); i = int(e['t'] * SR)
    if s is None or i >= N: continue
    m = min(len(s), N - i); mixL[i:i + m] += s[:m]
# soft music bed: slow pad chords + gentle pulse
t = np.arange(N) / SR
chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [130.8, 196, 261.6], [196, 246.9, 293.7]]
bed = np.zeros(N, np.float32); L = 2.4
for ci in range(int(total / L) + 2):
    a = int(ci * L * SR); b = min(N, int((ci + 1) * L * SR) + int(0.4 * SR))
    if a >= N: break
    tt = np.arange(b - a) / SR; e = np.minimum(1, tt / 0.6) * np.minimum(1, (b - a) / SR - tt) ** 0.5
    for f in chords[ci % 4]:
        bed[a:b] += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * e * 0.03
    # pulse
    for q in range(4):
        p = a + int(q * L / 4 * SR); n = int(0.18 * SR)
        if p + n < N: bed[p:p + n] += np.sin(2 * np.pi * 55 * np.arange(n) / SR) * env(n, 0.004, 0.06) * 0.08
# duck bed under voice
vv = np.abs(np.concatenate([v, np.zeros(N - len(v))]))
k = int(0.2 * SR); sm = np.convolve(vv, np.ones(k) / k, 'same'); duck = 1 - 0.55 * np.clip(sm / 0.05, 0, 1)
mix = mixL + bed * duck
mix = mix / max(1e-6, np.abs(mix).max()) * 0.89
wf.write('/tmp/mix_' + name + '.wav', SR, (mix * 32767).astype(np.int16))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '30', '-i', os.path.join(frames, 'f%05d.jpg'), '-i', '/tmp/mix_' + name + '.wav',
                '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out], check=True)
print('wrote', out)
