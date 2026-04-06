"""Proxy del servicio Gemini — la API key vive en el VPS, no en el cliente."""

import json
import os
from collections.abc import AsyncGenerator
from typing import Any

from google import genai
from google.genai import types

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY no configurada en el servidor VPS.")
        _client = genai.Client(api_key=api_key)
    return _client


def _build_config(payload: dict) -> types.GenerateContentConfig:
    """Construye la configuración de Gemini desde el payload del cliente."""
    config_kwargs: dict[str, Any] = {}
    if payload.get("systemInstruction"):
        config_kwargs["system_instruction"] = payload["systemInstruction"]
    if payload.get("temperature") is not None:
        config_kwargs["temperature"] = payload["temperature"]
    return types.GenerateContentConfig(**config_kwargs)


def generate(payload: dict) -> str:
    """
    Genera contenido con Gemini (respuesta completa, no streaming).

    Payload esperado (desde VPSAIClient):
    {
        "action": "askAether" | "askNexus",
        "model": "gemini-2.5-flash",
        "contents": <str | list>,
        "messages": <list>,           # para askNexus
        "systemInstruction": <str>,
        "temperature": <float>
    }

    Returns:
        Texto generado por Gemini (JSON string para respuestas estructuradas).
    """
    client = _get_client()
    model = payload.get("model", "gemini-2.5-flash")
    config = _build_config(payload)

    contents = payload.get("contents") or payload.get("messages")

    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=config,
    )
    return response.text or ""


async def generate_stream(payload: dict) -> AsyncGenerator[str, None]:
    """
    Genera contenido con Gemini en modo streaming (Server-Sent Events).

    Yields chunks de texto a medida que Gemini los produce.
    """
    client = _get_client()
    model = payload.get("model", "gemini-2.5-flash")
    config = _build_config(payload)
    contents = payload.get("contents") or payload.get("messages")

    async for chunk in await client.aio.models.generate_content_stream(
        model=model,
        contents=contents,
        config=config,
    ):
        if chunk.text:
            yield chunk.text
