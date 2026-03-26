# ADR-004: Procesamiento Intensivo — Web Workers vs. Subprocesos Python

## Estatus
Parcialmente superado — revisado en v3.4.0

## Contexto
Las operaciones intensivas de CPU en **Aether Vault** (cálculo del grafo de conocimiento, búsqueda vectorial entre cientos de notas) pueden bloquear el hilo principal de la UI. El ADR original propuso delegar estas tareas a **Web Workers**.

Con la introducción de Electron en v3.0.0 (RFC-002), surgió una alternativa: **subprocesos Python** gestionados por el Main Process, más adecuados para tareas que requieren modelos ML pesados (Whisper, Docling) o binarios nativos (RuVector).

## Decisión

### División actual de responsabilidades

| Tarea | Solución adoptada | Razón |
|---|---|---|
| Búsqueda vectorial (notas Aether) | Frontend — `findSimilarNotes()` síncrono | Colecciones pequeñas (<500 notas); latencia < 5ms |
| Indexación de documentos (PDF, DOCX) | Subproceso Python — `docling_runner.py` | Requiere Docling (modelo ML, ~1 GB) |
| Transcripción de audio | Subproceso Python — `whisper_runner.py` | Requiere OpenAI Whisper (modelo ML) |
| Búsqueda vectorial (documentos Cortex) | Subproceso Rust — `ruvector` | Alto rendimiento, bajo footprint de memoria |
| Cálculo del grafo (Aether) | Frontend — `getGraphData()` con índice Map | O(n) con Map index; suficiente a escala actual |

### Estado de Web Workers

**No implementado.** A la escala actual (<500 notas, <100 documentos), el hilo principal no se bloquea perceptiblemente. Si la colección escala significativamente, `findSimilarNotes()` y `getGraphData()` son candidatos para mover a un Worker.

### Arquitectura de subprocesos Python (implementada)

```
electron/main.ts
  └─ SubprocessAdapter (electron/subprocess/)
       ├─ StdioTransport — NDJSON por stdin/stdout
       ├─ CircuitBreaker — fast-fail tras 3 crasheos consecutivos
       └─ Graceful shutdown — SIGTERM en app.before-quit
```

## Consecuencias

- **Positivas**: Los modelos ML pesados corren en procesos aislados; un crash de Whisper no afecta la UI. El Main Process puede reiniciar subprocesos individualmente.
- **Pendiente**: Mover `getGraphData()` y `findSimilarNotes()` a un Web Worker si las colecciones superan ~1000 elementos.
- **Neutras**: La arquitectura de subprocesos Python es más robusta que Web Workers para tareas ML, pero requiere instalación adicional (`npm run setup`).

## Notas
- `CircuitBreaker` documentado en `electron/subprocess/CircuitBreaker.ts` con tests completos.
- El protocolo NDJSON está tipado en `src/cortex/ipc/IPCProtocol.ts`.
- Graceful shutdown implementado en `electron/main.ts` (`before-quit` → SIGTERM → 500ms → quit).
