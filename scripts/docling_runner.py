#!/usr/bin/env python3
"""
Docling runner — protocolo NDJSON stdio para Carrera LTI.

Escucha en stdin mensajes NDJSON con el formato IPC de Cortex:
  {"id": "...", "status": "ok", "data": {"action": "...", ...}}

Responde en stdout:
  {"id": "...", "status": "ok",    "data": {...}}
  {"id": "...", "status": "error", "error": "..."}

Acciones:
  process_document — Convierte PDF/DOCX a texto estructurado (Docling)
  ocr              — Extrae texto de imagen (Docling OCR)

Ref: RFC-002 §4.4 Fase D — Issue #55
"""

import json
import sys


def _respond(msg_id: str, status: str, data=None, error=None):
    resp = {"id": msg_id, "status": status}
    if data is not None:
        resp["data"] = data
    if error is not None:
        resp["error"] = error
    print(json.dumps(resp), flush=True)


def _process_document(msg_id: str, payload: dict):
    try:
        from docling.document_converter import DocumentConverter

        path = payload.get("path", "")
        converter = DocumentConverter()
        result = converter.convert(path)
        text = result.document.export_to_text()
        # Dividir en chunks de ~500 palabras para indexación
        words = text.split()
        chunk_size = 500
        chunks = [" ".join(words[i : i + chunk_size]) for i in range(0, len(words), chunk_size)]
        _respond(msg_id, "ok", {"chunks": len(chunks), "text": text})
    except ImportError:
        _respond(msg_id, "error", error="docling no instalado. Ejecuta: npm run setup")
    except Exception as exc:
        _respond(msg_id, "error", error=str(exc))


def _ocr(msg_id: str, payload: dict):
    try:
        from docling.document_converter import DocumentConverter

        path = payload.get("path", "")
        converter = DocumentConverter()
        result = converter.convert(path)
        text = result.document.export_to_text()
        _respond(msg_id, "ok", {"text": text})
    except ImportError:
        _respond(msg_id, "error", error="docling no instalado. Ejecuta: npm run setup")
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

            if action == "process_document":
                _process_document(msg_id, data)
            elif action == "ocr":
                _ocr(msg_id, data)
            else:
                _respond(msg_id, "error", error=f"acción desconocida: {action}")
        except json.JSONDecodeError as exc:
            _respond("unknown", "error", error=f"JSON inválido: {exc}")


if __name__ == "__main__":
    main()
