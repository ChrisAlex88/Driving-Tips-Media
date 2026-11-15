import sys, os, json, time, subprocess
from playwright.sync_api import sync_playwright
name = sys.argv[1]; mode = sys.argv[2]; out = sys.argv[3]
os.makedirs(out, exist_ok=True)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync']
with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)
    pg = b.new_page(viewport={'width': 1080, 'height': 1920})
    pg.on('console', lambda m: print('console:', m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: print('PAGEERR', e))
    rs = os.environ.get('RS', '1')
    pg.goto(f'http://127.0.0.1:8765/index.html?v={name}&rs={rs}' + ('&nr=1' if mode == 'events' else ''))
    pg.wait_for_function('window.ready === true', timeout=180000)
    total = pg.evaluate('window.TOTAL')
    if mode == 'events':
        for f in range(int(total * 30)): pg.evaluate(f'window.renderAt({f / 30})')
        json.dump(pg.evaluate('window.getEvents()'), open(f'{out}/events.json', 'w')); print('events', len(pg.evaluate('window.getEvents()')))
    elif mode == 'stills':
        for t in [float(x) for x in sys.argv[4:]]:
            pg.evaluate(f'window.renderAt({t})'); pg.screenshot(path=f'{out}/{name}_{t:05.2f}.jpg', type='jpeg', quality=88)
    else:
        fps = float(mode); n = int(total * fps); t0 = time.time()
        start = int(os.environ.get('START', '0'))
        for f in range(start, n):
            fn = f'{out}/f{f:05d}.jpg'
            if os.path.exists(fn): continue
            pg.evaluate(f'window.renderAt({f / fps})'); pg.screenshot(path=fn, type='jpeg', quality=92)
            if f % 60 == 0: print(f'{name} {f}/{n} {(time.time()-t0)/(f-start+1):.2f}s/f', flush=True)
        json.dump(pg.evaluate('window.getEvents()'), open(f'{out}/events.json', 'w'))
        open(f'{out}/DONE', 'w').write('ok')
    b.close()
