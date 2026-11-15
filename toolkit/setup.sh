#!/bin/bash
# Restores the Driving Tips UK video toolkit into a fresh workspace.
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
mkdir -p /home/claude/tts /home/claude/r3d
cp -r "$SRC/r3d/." /home/claude/r3d/
cp "$SRC/tts/"* /home/claude/tts/
cd /home/claude/tts
[ -f piper/espeak-ng ] || { curl -sL -o piper.tgz https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz && tar xzf piper.tgz && chmod +x piper/espeak-ng piper/piper; }
[ -f kokoro.onnx ] || curl -sL -o kokoro.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
[ -f voices.bin ] || curl -sL -o voices.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
echo "Toolkit restored. Voice: bm_george."
