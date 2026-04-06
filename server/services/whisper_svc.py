"""Servicio de transcripción de audio vía Whisper."""

import os
import tempfile
from pathlib import Path

import whisper

_model: whisper.Whisper | None = None


def _get_model() -> whisper.Whisper:
    """Carga el modelo Whisper en memoria (lazy, una sola vez)."""
    global _model
    if _model is None:
        model_name = os.getenv("WHISPER_MODEL", "base")
        _model = whisper.load_model(model_name)
    return _model


def transcribe_bytes(audio_bytes: bytes, filename: str = "audio.wav") -> dict:
    """
    Transcribe audio recibido como bytes.

    Args:
        audio_bytes: Contenido del archivo de audio (WAV, MP3, etc.)
        filename: Nombre original del archivo (para inferir extensión).

    Returns:
        {"text": str, "language": str}
    """
    model = _get_model()
    suffix = Path(filename).suffix or ".wav"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        result = model.transcribe(tmp_path)
        return {
            "text": result["text"].strip(),
            "language": result.get("language", "unknown"),
        }
    finally:
        os.unlink(tmp_path)


def transcribe_path(audio_path: str) -> dict:
    """
    Transcribe audio desde una ruta local en el VPS.

    Returns:
        {"text": str, "language": str}
    """
    model = _get_model()
    result = model.transcribe(audio_path)
    return {
        "text": result["text"].strip(),
        "language": result.get("language", "unknown"),
    }
