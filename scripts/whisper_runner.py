#!/usr/bin/env python3
"""
Whisper runner — protocolo NDJSON stdio para Carrera LTI.

Escucha en stdin mensajes NDJSON con el formato IPC de Cortex:
  {"id": "...", "status": "ok", "data": {"action": "transcribe", "path": "..."}}

Responde en stdout:
  {"id": "...", "status": "ok",    "data": {"text": "...", "language": "es"}}
  {"id": "...", "status": "error", "error": "..."}

Acciones:
  transcribe — Transcribe un archivo WAV 16kHz mono con Whisper

Modelo: small (~500 MB) — balance calidad/velocidad para CPU.
El WAV se elimina tras una transcripción exitosa (ADR-003, privacidad).

Ref: RFC-002 §4.4 Fase D — Issue #56
"""

import json
import os
import sys
from pathlib import Path

# Directorio de grabaciones — Issue #66
_RECORDINGS_DIR = Path.home() / ".carrera-lti" / "observer" / "recordings"


def _safe_delete_wav(wav_path: str) -> None:
    """Elimina el WAV solo si está dentro del directorio de grabaciones permitido."""
    try:
        resolved = Path(wav_path).resolve()
        if str(resolved).startswith(str(_RECORDINGS_DIR.resolve())):
            os.remove(resolved)
        else:
            # Log a stderr (no interrumpe el flujo principal)
            print(
                f"[whisper] delete rechazado fuera de RECORDINGS_DIR: {resolved}",
                file=sys.stderr,
            )
    except OSError:
        pass  # No crítico si falla la eliminación


def _respond(msg_id: str, status: str, data=None, error=None):
    resp = {"id": msg_id, "status": status}
    if data is not None:
        resp["data"] = data
    if error is not None:
        resp["error"] = error
    print(json.dumps(resp), flush=True)


def _transcribe(msg_id: str, payload: dict):
    try:
        import whisper

        path = payload.get("path", "")
        model_name = payload.get("model", "small")

        model = whisper.load_model(model_name)
        result = model.transcribe(path, fp16=False)

        text = result.get("text", "").strip()
        language = result.get("language", "unknown")

        # Eliminar el WAV tras transcripción exitosa (ADR-003: privacidad)
        _safe_delete_wav(path)

        _respond(msg_id, "ok", {"text": text, "language": language})
    except ImportError:
        _respond(msg_id, "error", error="openai-whisper no instalado. Ejecuta: npm run setup")
    except Exception as exc:
        _respond(msg_id, "error", error=str(exc))


def main():
    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
            msg_id = msg.get("id", "unknown")
            data = msg.get("data", {})
            action = data.get("action")

            if action == "transcribe":
                _transcribe(msg_id, data)
            else:
                _respond(msg_id, "error", error=f"acción desconocida: {action}")
        except json.JSONDecodeError as exc:
            _respond("unknown", "error", error=f"JSON inválido: {exc}")


if __name__ == "__main__":
    main()
