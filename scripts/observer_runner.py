#!/usr/bin/env python3
"""
Observer AI runner — captura audio del micrófono y guarda WAV al recibir SIGTERM.

Protocolo:
  - Argumento 1: ruta de salida del WAV (obligatorio)
  - Al recibir SIGTERM o SIGINT: guarda el buffer de audio y termina limpiamente

Formato WAV: 16 kHz, mono, PCM 16-bit (compatible con whisper_runner.py)

Dependencia: sounddevice (instalado en el venv junto con openai-whisper)

Ref: RFC-002 §4.4 Fase E — Issue #58
"""

import signal
import sys
import wave

try:
    import numpy as np
    import sounddevice as sd
except ImportError as e:
    print(f"[observer_runner] Error: dependencia no instalada: {e}", file=sys.stderr)
    print("[observer_runner] Ejecuta: npm run setup", file=sys.stderr)
    sys.exit(1)

SAMPLE_RATE = 16_000
CHANNELS = 1
DTYPE = "int16"
BLOCK_SIZE = 1024

frames: list[np.ndarray] = []
running = True


def handle_stop(signum, frame):  # noqa: ARG001
    global running
    running = False


signal.signal(signal.SIGTERM, handle_stop)
signal.signal(signal.SIGINT, handle_stop)


def save_wav(output_path: str) -> None:
    if not frames:
        return
    audio = np.concatenate(frames, axis=0)
    with wave.open(output_path, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(2)  # int16 = 2 bytes
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(audio.tobytes())


def main() -> None:
    if len(sys.argv) < 2:
        print("[observer_runner] Uso: python observer_runner.py <output.wav>", file=sys.stderr)
        sys.exit(1)

    output_path = sys.argv[1]

    def audio_callback(indata: np.ndarray, frames_count: int, time_info, status) -> None:  # noqa: ARG001
        if running:
            frames.append(indata.copy())

    with sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=CHANNELS,
        dtype=DTYPE,
        blocksize=BLOCK_SIZE,
        callback=audio_callback,
    ):
        while running:
            sd.sleep(100)

    save_wav(output_path)


if __name__ == "__main__":
    main()
