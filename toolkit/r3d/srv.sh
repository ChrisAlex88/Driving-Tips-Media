#!/bin/bash
curl -s -o /dev/null http://127.0.0.1:8765/index.html || (setsid nohup python3 -m http.server 8765 --directory /home/claude/r3d/site > /tmp/srv.log 2>&1 < /dev/null & sleep 1)
