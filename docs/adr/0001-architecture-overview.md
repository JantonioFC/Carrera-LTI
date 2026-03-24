# 0001: Arquitectura Unificada (Aether + Nexus + Cortex)

## Estado
Aceptado — Actualizado en v3.4.0

## Contexto
El sistema "Carrera LTI" comenzó como una SPA web para un estudiante, con módulos **Aether** (Segundo Cerebro) y **Nexus** (Editor de Bloques). A partir de v3.0.0 (RFC-002) se migró a una aplicación **Electron 36**, añadiendo el módulo **Cortex** que integra subprocesos Python para procesamiento de documentos, transcripción de audio y búsqueda vectorial semántica.

## Decisión

### Estructura de capas (v3.x)

```
Renderer Process (React 19 + Vite)
  ├─ Dashboard · Calendario · Tareas · Gmail · Progreso
  ├─ Aether Vault  — notas + RAG local + grafo de conocimiento
  ├─ Nexus Editor  — editor de bloques (BlockNote) + IDB/Yjs
  └─ Cortex Tab    — índice documental + Observer AI

contextBridge / preload.ts (window.cortexAPI)

Main Process (Electron + Node.js)
  ├─ SubprocessAdapter — IPC NDJSON con subprocesos Python
  ├─ CircuitBreaker    — protección ante crashes de subprocesos
  ├─ StdioTransport    — comunicación stdio con binarios/scripts
  └─ electron-store    — configuración cifrada con OS Keychain

Subprocesos Python (scripts/)
  ├─ ruvector       — búsqueda vectorial semántica (binario Rust)
  ├─ docling_runner — extracción de texto / OCR (PDF, imágenes)
  ├─ whisper_runner — transcripción de audio (OpenAI Whisper)
  └─ observer_runner— captura de audio en clase
```

### Decisiones de arquitectura

- **Enfoque Modular**: Áreas claramente diferenciadas (Dashboard, Calendario, Tareas, Aether, Nexus, Cortex).
- **Gestión de Estado**: Zustand con persistencia en IndexedDB (aetherStore, nexusStore). El `useReducer` original fue reemplazado por Zustand desde v2.x (ver ADR-0002).
- **Sincronización Cloud**: Firebase Firestore para respaldos incrementales/manuales. Prioridad offline-first con IndexedDB + Yjs (Nexus) y IDB-Keyval (Aether).
- **IA local**: RAG con embeddings Gemini `text-embedding-004` + cosine similarity local (ver ADR-003). Los subprocesos Python corren en el proceso principal de Electron, no en Web Workers (ver ADR-004).
- **Seguridad**: `safeStorage` de Electron cifra la clave maestra con el Keychain del OS. `contextIsolation: true` + `sandbox: true` en la BrowserWindow.
- **Logging**: `src/utils/logger.ts` para logging estructurado; ningún `console.*` en producción.

## Consecuencias

- **Positivas**: La app puede correr 100% offline para las funciones core. Altamente responsiva. Los subprocesos Python se reinician automáticamente si crashean (CircuitBreaker + SIGTERM graceful).
- **Negativas**: Requiere Python 3.10+ y el binario `ruvector` instalados localmente (`npm run setup`). El tamaño del instalador es mayor que una SPA pura.

## Notas
- La migración Electron se documentó en `docs/RFC-002` (Fases A–E).
- Los canales IPC están documentados en `docs/API_IPC.md`.
- El protocolo NDJSON entre SubprocessAdapter y scripts Python está en `src/cortex/ipc/IPCProtocol.ts`.
