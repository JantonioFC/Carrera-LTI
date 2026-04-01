# Hoja de Ruta — Integración VPS (Sovereign Station)

**Repo:** `Carrera-LTI-Private`
**Punto de partida:** v3.12.1
**Objetivo:** T490 Windows 11 como thin client; VPS Ubuntu como backend de cómputo IA

---

## Prerequisitos (antes de cualquier código)

- [ ] Repo privado creado en GitHub (`Carrera-LTI-Private`) a partir de v3.12.1
- [ ] Tailscale instalado en T490 y en VPS — conectividad verificada
- [ ] Python 3.10+, FFmpeg y Node.js 20+ instalados en VPS
- [ ] Puerto FastAPI definido (sugerido: `8000`) — accesible vía Tailscale

---

## Fase 1 — Infraestructura base

**Objetivo:** VPS responde a peticiones del cliente. Sin modificar el frontend aún.

### Tareas

1. **Crear servicio FastAPI en VPS**
   - Endpoint `POST /cortex/transcribe` — recibe path o bytes de audio → retorna `{ text, language }`
   - Endpoint `POST /cortex/process_document` — recibe path de PDF/DOCX → retorna `{ text, chunks }`
   - Endpoint `POST /cortex/ocr` — recibe path de imagen → retorna `{ text }`
   - Mantener el protocolo de respuesta compatible con el IPC actual (mismos campos)

2. **Migrar RuVector al VPS**
   - Compilar o copiar el binario Rust al VPS
   - Configurar como servicio systemd (persistencia entre reinicios)
   - Verificar que el índice persiste en el NVMe del VPS

3. **Configurar API Gateway para claves Gemini**
   - Endpoint proxy en FastAPI: `POST /ai/generate`
   - Claves Gemini almacenadas en variables de entorno del servidor (no en cliente)
   - Autenticación del cliente: token interno por Tailscale (sin exposición a internet)

4. **Verificar conectividad T490 → VPS**
   - `curl http://<tailscale-ip>:8000/health` desde T490

### Criterio de éxito
El VPS responde a todas las peticiones de prueba desde el T490 vía Tailscale.

---

## Fase 2 — Refactor del cliente

**Objetivo:** `CortexOrchestrator` deja de usar `child_process` y apunta al VPS.

### Tareas

1. **Agregar variable de entorno `VITE_CORTEX_URL`**
   - Valor: URL del VPS vía Tailscale (ej. `http://100.x.x.x:8000`)
   - Fallback: vacío → comportamiento local actual (retrocompatibilidad durante transición)

2. **Refactorizar `src/cortex/orchestrator/`**
   - Reemplazar llamadas a `child_process` / `SubprocessAdapter` por `fetch()` al VPS
   - Mantener la misma interfaz de respuesta para no romper consumidores en `bridge/` y `queue/`

3. **Refactorizar `src/services/aiClient.ts`**
   - Apuntar a `VITE_CORTEX_URL/ai/generate` en lugar de `https://generativelanguage.googleapis.com`
   - Eliminar la necesidad de que el usuario configure la clave Gemini en el cliente

4. **Actualizar `electron/main.ts`**
   - No instanciar SubprocessAdapter para Whisper/Docling si `VITE_CORTEX_URL` está definido
   - Mantener la instanciación de RuVector local como fallback opcional

### Criterio de éxito
Indexar un PDF y hacer una consulta en Nexus AI con el VPS como backend. Sin procesos Python locales.

---

## Fase 3 — Observer AI remoto

**Objetivo:** La transcripción de audio usa el Whisper del VPS.

### Tareas

1. **Modificar `useObserverIPC.ts`**
   - Al llamar `api.cortex.transcribe(wavPath)`: si `VITE_CORTEX_URL` está definido, enviar el WAV vía `fetch()` al VPS en lugar del IPC local
   - El WAV se envía como `multipart/form-data` o se lee y se envía como bytes

2. **Actualizar endpoint FastAPI `/cortex/transcribe`**
   - Aceptar upload de archivo (no solo path local)
   - El VPS procesa con Whisper y retorna el texto

3. **Limpiar dependencias Python del cliente**
   - Eliminar `scripts/whisper_runner.py` y `scripts/observer_runner.py` del build del cliente
   - `npm run setup` ya no instala el venv Python en el T490

### Criterio de éxito
Grabación de clase → transcripción en VPS → nota en Aether, sin que el T490 instale Python o FFmpeg.

---

## Fase 4 — Limpieza y estabilización

1. Eliminar `SubprocessAdapter` del cliente si ya no hay procesos locales
2. Actualizar `SCOPE-VERSIONES.md` con versión implementada
3. Documentar configuración de Tailscale en README del fork privado
4. Configurar servicios FastAPI y RuVector como systemd en VPS

---

## Notas de implementación

- **No eliminar Firebase**: cumple rol de sync multi-dispositivo (T490 ↔ Xiaomi). No está en scope de cambio.
- **Tailscale como capa de seguridad**: el VPS no necesita SSL complejo — el tráfico viaja cifrado por la red mesh de Tailscale.
- **WebLLM/WebGPU**: descartado como objetivo de esta hoja de ruta. Tecnología inmadura en hardware heterogéneo. Puede evaluarse en el futuro.
- **Contrato de mensajes IPC**: mantener campos `{ id, status, data, error }` en las respuestas FastAPI para no romper los consumidores existentes en `bridge/` y `queue/`.
