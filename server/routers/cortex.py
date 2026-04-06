"""Endpoints de procesamiento IA local: transcripción, documentos y OCR."""

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from server.services import docling_svc, whisper_svc

router = APIRouter(prefix="/cortex", tags=["cortex"])


# ── Transcripción ─────────────────────────────────────────────────────────────

class TranscribeResponse(BaseModel):
    text: str
    language: str


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(file: UploadFile = File(...)):
    """
    Transcribe un archivo de audio (WAV, MP3, etc.) vía Whisper.

    El cliente envía el archivo como multipart/form-data.
    Compatible con useObserverIPC.ts (modo VPS).
    """
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Archivo de audio vacío.")

    try:
        result = whisper_svc.transcribe_bytes(
            audio_bytes, filename=file.filename or "audio.wav"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en transcripción: {e}") from e

    return result


# ── Procesamiento de documentos ───────────────────────────────────────────────

class ProcessDocumentResponse(BaseModel):
    text: str
    chunks: int


@router.post("/process_document", response_model=ProcessDocumentResponse)
async def process_document(file: UploadFile = File(...)):
    """
    Convierte un PDF o DOCX a texto estructurado vía Docling.
    El archivo se recibe como multipart/form-data.
    """
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Archivo vacío.")

    try:
        result = docling_svc.process_bytes(
            file_bytes, filename=file.filename or "document.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando documento: {e}") from e

    return result


# ── OCR ───────────────────────────────────────────────────────────────────────

class OcrResponse(BaseModel):
    text: str


@router.post("/ocr", response_model=OcrResponse)
async def ocr(file: UploadFile = File(...)):
    """
    Extrae texto de una imagen vía Docling OCR.
    El archivo se recibe como multipart/form-data.
    """
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Imagen vacía.")

    try:
        result = docling_svc.process_bytes(
            file_bytes, filename=file.filename or "image.png"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en OCR: {e}") from e

    return {"text": result["text"]}
