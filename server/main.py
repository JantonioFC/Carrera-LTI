"""
Carrera LTI — Backend VPS (Sovereign Station)

Servidor FastAPI que provee los endpoints de IA al cliente Electron (T490).
Comunicación exclusivamente via red Tailscale — sin exposición a internet.

Arrancar:
    uvicorn server.main:app --host 0.0.0.0 --port 8000

En producción (systemd):
    ver scripts/vps-setup.sh
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI

from server.routers import ai, cortex

load_dotenv()

app = FastAPI(
    title="Carrera LTI — Cortex VPS",
    description="Backend de procesamiento IA para Sovereign Station.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
)

app.include_router(cortex.router)
app.include_router(ai.router)


@app.get("/health")
def health():
    """Health check para verificar conectividad T490 → VPS."""
    return {"status": "ok", "version": app.version}


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("server.main:app", host=host, port=port, reload=False)
