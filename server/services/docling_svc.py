"""Servicio de procesamiento de documentos e imágenes vía Docling."""

from pathlib import Path

from docling.document_converter import DocumentConverter

_converter: DocumentConverter | None = None


def _get_converter() -> DocumentConverter:
    """Instancia el converter de Docling (lazy, una sola vez)."""
    global _converter
    if _converter is None:
        _converter = DocumentConverter()
    return _converter


def process_document(doc_path: str) -> dict:
    """
    Convierte un PDF o DOCX a texto estructurado.

    Args:
        doc_path: Ruta absoluta al archivo en el VPS.

    Returns:
        {"text": str, "chunks": int}
    """
    converter = _get_converter()
    result = converter.convert(doc_path)
    text = result.document.export_to_markdown()
    # Dividir por doble salto de línea como aproximación de chunks
    chunks = [c.strip() for c in text.split("\n\n") if c.strip()]
    return {"text": text, "chunks": len(chunks)}


def ocr(image_path: str) -> dict:
    """
    Extrae texto de una imagen vía Docling OCR.

    Args:
        image_path: Ruta absoluta a la imagen en el VPS.

    Returns:
        {"text": str}
    """
    converter = _get_converter()
    result = converter.convert(image_path)
    text = result.document.export_to_markdown()
    return {"text": text.strip()}


def process_bytes(file_bytes: bytes, filename: str) -> dict:
    """
    Procesa un documento recibido como bytes (upload directo).

    Returns:
        {"text": str, "chunks": int}
    """
    import os
    import tempfile

    suffix = Path(filename).suffix or ".pdf"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        return process_document(tmp_path)
    finally:
        os.unlink(tmp_path)
