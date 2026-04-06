"""Endpoints proxy de Gemini — la API key vive en el VPS."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Any

from server.services import gemini_svc

router = APIRouter(prefix="/ai", tags=["ai"])

VALID_ACTIONS = {"askAether", "askNexus", "askAetherStream", "askNexusStream"}


class GenerateRequest(BaseModel):
    action: str
    model: str = "gemini-2.5-flash"
    contents: Any = None
    messages: Any = None
    systemInstruction: str | None = None
    temperature: float | None = None


class GenerateResponse(BaseModel):
    text: str


# ── Respuesta completa ────────────────────────────────────────────────────────

@router.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """
    Proxy de Gemini para respuestas estructuradas (askAether / askNexus).
    La API key de Gemini vive en el servidor — el cliente no la necesita.
    """
    if req.action not in VALID_ACTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"action inválida: '{req.action}'. Válidas: {sorted(VALID_ACTIONS)}",
        )

    try:
        text = gemini_svc.generate(req.model_dump())
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error Gemini: {e}") from e

    return {"text": text}


# ── Streaming ─────────────────────────────────────────────────────────────────

@router.post("/generate/stream")
async def generate_stream(req: GenerateRequest):
    """
    Proxy de Gemini en modo streaming (askAetherStream / askNexusStream).
    Devuelve chunks de texto como text/plain chunked transfer.
    Compatible con VPSAIClient.askAetherStream / askNexusStream.
    """
    if req.action not in VALID_ACTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"action inválida: '{req.action}'",
        )

    async def _stream():
        try:
            async for chunk in gemini_svc.generate_stream(req.model_dump()):
                yield chunk
        except RuntimeError as e:
            yield f"\n[ERROR] {e}"
        except Exception as e:
            yield f"\n[ERROR] Gemini: {e}"

    return StreamingResponse(_stream(), media_type="text/plain")
