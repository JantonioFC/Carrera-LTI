# Changelog — Carrera LTI

Todos los cambios notables de este proyecto se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).
Versionado semántico: [SemVer](https://semver.org/lang/es/).

---

## [3.0.0] — 2026-03-23

### 🚀 Migración Electron — Cortex IPC nativo (RFC-002)

Integración completa del motor Cortex con el proceso principal de Electron.
Todo el procesamiento de IA (indexación, OCR, transcripción, captura de audio)
ocurre ahora en el Main Process mediante subprocesos nativos, sin dependencia
del contexto del navegador.

#### Fase A — Estructura base Electron
- `electron/main.ts`, `electron/preload.ts`, `electron/types.d.ts`
- `contextBridge` con `window.cortexAPI` (config + cortex + observer)
- `tsconfig.electron.json` separado (`moduleResolution: node`)
- `src/vite-env.d.ts`: referencia a los tipos del bridge para el Renderer

#### Fase B — Configuración cifrada
- `electron/handlers/configHandlers.ts`: `config:set` / `config:get`
- `electron-store` con cifrado AES-256; migración automática desde `.env`

#### Fase C — RuVector IPC
- `electron/transports/StdioTransport.ts`: NDJSON stdio con `spawnFn` injectable
- `electron/handlers/ruVectorHandlers.ts`: `cortex:index` / `cortex:query`
- `scripts/setup.mjs`: descarga verificada de RuVector (SHA-256)

#### Fase D — Docling + Whisper
- `electron/handlers/doclingHandlers.ts`: `cortex:process-document` / `cortex:ocr`
- `electron/handlers/whisperHandlers.ts`: `cortex:transcribe` (modelo "small")
- `scripts/docling_runner.py` + `scripts/whisper_runner.py`: runners NDJSON Python
- `scripts/setup.mjs`: venv Python con docling + openai-whisper + sounddevice

#### Fase E — Observer AI
- `electron/handlers/observerHandlers.ts`: proceso long-running (toggle on/off)
- `scripts/observer_runner.py`: captura audio 16 kHz mono (sounddevice), WAV al SIGTERM
- `systemPreferences.askForMediaAccess('microphone')` en macOS
- `src/cortex/observer/useObserverIPC.ts`: toggle → transcribe → nota en Aether
- `src/cortex/ui/CortexTab.tsx`: `ObserverAIToggle` + banner informativo

### 🔒 Seguridad
- `serialize-javascript@7.0.3` forzado via npm overrides (CVE RCE en ≤ 7.0.2)

### 🧪 Tests
- **242 tests · 32 archivos · 0 fallos**
- TDD completo para todos los handlers IPC (observerHandlers: 8 tests)
- Contract tests del contextBridge: Fases B + C + D + E

### 🏗️ CI
- `python3 -m py_compile` valida sintaxis de los 3 runners Python en cada push

---

## [2.0.0] — 2026-03-23

### 🚀 Cortex — Motor de IA local integrado

Esta versión introduce **Cortex**, el sistema de inteligencia artificial local
que convierte Carrera LTI en un asistente de estudio activo. Todo el procesamiento
ocurre en el hardware del usuario: sin envío de datos académicos a la nube.

#### M1 — Core IPC & Orchestrator
- `CortexOrchestrator.shouldRestart()` — lógica anti-bucle con límite de 3 crashes
  y reset automático tras 60 segundos de estabilidad
- `IPCProtocol.parseIPCMessage()` — parser NDJSON con errores tipados
  (`IPCParseError` / `IPCValidationError`) y validación de campos obligatorios
- `QueueManager` — cola FIFO con persistencia en disco y deduplicación por id
- `ConfigStore` — cifrado AES-256-GCM de API keys con derivación de clave via scrypt

#### M2 — Ingestion Pipeline
- `WavManager` — gestión de archivos de audio: elimina .wav tras transcripción
  exitosa, conserva si falla (privacidad REQ-22)
- `AetherIndexBridge` — sincroniza documentos guardados en Aether al índice RuVector
- `SubprocessAdapter` — adaptador IPC genérico con timeout configurable para
  Docling (OCR) y Whisper (transcripción)

#### M3 — Memory & Query
- `RuVectorAdapter` — API semántica (index/query/delete) sobre el binario RuVector
- `GroundingValidator` — implementa REQ-22: `isGrounded()` con tokenización y
  overlap mínimo; `buildGroundedResponse()` con deduplicación de fuentes por docId
- `FeedbackStore` — señales de relevancia con penalización/boost acumulativo y
  poda por ventana de retención de 90 días
- `IndexExporter` — exportación del índice a Firebase Storage bajo
  `users/{uid}/cortex/backup_{timestamp}.zip`

#### M4 — UI
- `cortexStore` — estado Zustand+immer compartido (actividad, resultados, métricas)
- `CortexActivityIndicator` — indicador en tiempo real: idle/indexando/transcribiendo/
  consultando/OCR con barra de progreso opcional
- `CortexFloatingPanel` — panel de consulta rápida al índice con submit por Enter
- `CortexTab` — tab dedicado con métricas del índice y actividad actual
- `NexusContextSurface` — contexto automático al abrir tareas de Nexus Kanban
  (top-3 resultados relevantes, null si no hay contexto)

#### M5 — Observer AI
- `observerStore` — estado del toggle con persistencia en localStorage
- `ObserverAIToggle` — control on/off accesible (role=switch), notificación al
  activar (REQ-06), deshabilitado durante transición
- `ConferencePipeline` — orquestador E2E: audio → Whisper → nota Aether →
  índice RuVector; sin salida de datos a internet; WAV eliminado tras transcripción
  exitosa; conservado si falla para re-intentos

#### M6 — Advanced Features
- `AutoResearchClaw` — búsqueda de papers académicos con aprobación individual
  por resultado (REQ-08); ningún paper se importa automáticamente
- `UpdaterConfig` — canal de actualización stable/beta con opt-in explícito;
  canal beta via `beta.yml` en GitHub Releases
- `HealthMetrics` — métricas de salud en tiempo real: latencias (ventana 24h),
  tasa de éxito, alertas configurables (índice > 2GB, latencia > 5s, éxito < 90%)

#### M7 — Release Infrastructure
- Suite E2E con 5 fixtures académicos controlados y verificación de grounding REQ-22
- Workflow de release multiplataforma (Windows NSIS + macOS DMG + Linux AppImage)
  con firma de código y notarización Apple
- CI actualizado para cubrir ramas `cortex/develop` y `cortex/**`

### Cobertura de tests Cortex
- **21 archivos de test · 168 assertions · 0 failures · 0 flaky**
- Módulos críticos (≥ 90% cobertura): CortexOrchestrator, GroundingValidator,
  QueueManager, IPCProtocol, ConfigStore

### Requisitos de privacidad implementados
| Requisito | Descripción | Módulo |
|-----------|-------------|--------|
| REQ-06 | Notificación visible al activar Observer AI | `ObserverAIToggle` |
| REQ-08 | Aprobación individual antes de importar papers | `AutoResearchClaw` |
| REQ-11 | Sin salida de datos a internet (excepción: AutoResearchClaw) | `ConferencePipeline` |
| REQ-22 | Respuestas solo desde índice local del usuario | `GroundingValidator` |

---

## [1.x] — Versiones anteriores

Las versiones 1.x corresponden a la plataforma web React/Vite sin integración
de IA local. El historial completo está disponible en los commits anteriores al
tag `v2.0.0`.

Funcionalidades heredadas activas en v2.0.0:
- Dashboard académico con analíticas y calendario 2026
- Aether: editor de notas con embeddings locales y grafo de conocimiento
- Nexus: kanban y workspace colaborativo con Y.js
- MallaCurricular, Horarios, Examenes, Materias
- Sincronización Firebase (opcional, opt-in)
