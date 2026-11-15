# Driving Tips UK video toolkit
3D video engine (three.js) + voice (Kokoro, British male `bm_george`) used to make the page's videos.
- `r3d/site/engine.js` – car (blue L-plate car), people, streets, crossings, lights, camera helpers
- `r3d/site/main.js` – timeline, captions, labels, boxes, quiz
- `r3d/site/videos/*.js` – one file per video
- `r3d/scripts/*.json` – voice scripts; `build_tl.py <video>` makes voice + timings
- `r3d/render.py <video> 30 out/<dir>` renders frames (run `./srv.sh` first); `NOSFX=1 python3 mix.py <video> out/<dir> out/<video>.mp4` adds voice + music, no pop-up sounds
Restore in a new workspace: `bash toolkit/setup.sh`
