# Changelog — Carrera LTI

Todos los cambios notables de este proyecto se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).
Versionado semántico: [SemVer](https://semver.org/lang/es/).

---

## [v3.7.0] — 2026-03-25

### Security
- `pathSecurity.ts` — `startsWith(root + sep)` previene bypass de prefijo en allowlist (#177)
- `main.ts` — `mkdirSync` con `mode: 0o700` en `~/.carrera-lti` (#180)
- `electron/handlers/ruVectorHandlers.ts` — Zod `DocPathSchema` valida `docPath` antes de indexar (#188)
- CSP aplicada via `session.webRequest.onHeadersReceived` en main process (#175)
- Guard `hasFirebaseConfig` evita bundlear credenciales en producción (#174)
- `ci.yml` — `permissions: contents: read` global (#178)
- `release.yml` — `timeout-minutes` en todos los jobs (#179)

### Performance
- `MallaCurricular.tsx` — 5 iteraciones sobre `allSubjects` memoizadas con `useMemo` (#186)
- `Dashboard.tsx` — `CURRICULUM.flatMap().find()` por render reemplazado por Map O(1) (#187)

### Fixed
- `NexusAI.tsx` — eliminar `setMessages` como canal de efecto secundario para localStorage (#185)
- `RuVectorAdapter.ts` — `randomUUID` migrado de `node:crypto` a `globalThis.crypto` (#189)

### DX
- `package.json` — `version` actualizado a `"3.6.0"` (#176)

### Tests
- Cobertura de `safeStorage.ts`, `result.ts`, `schemas.ts` (#181–#183)
- Tests para `ingestNote`, `semanticSearch`, `importNotes` en `aetherStore` (#184)
- Tests para `icsExport.ts`, `logger.ts` (#190–#191)
- Tests `getYDoc` y `deleteDocument` en `nexusStore` (#192)

---

## [v3.6.0] — 2026-03-25

### Added
- `React.memo` en 6 subcomponentes presentacionales: `NexusSidebar`, `NexusTableView`, `NexusKanbanView`, `AetherContextPanel`, `AetherSidebar`, `KanbanColumn` (#151)
- Tests unitarios para `ErrorBoundary` — 10 tests cubriendo estado normal, fallback, reset y `console.error` (#156)
- `vi.useFakeTimers()` / `vi.setSystemTime(FIXED_NOW)` en tests de `HealthMetrics` y `CortexOrchestrator` para aserciones de tiempo determinísticas (#157)
- Step de coverage en CI con validación de umbrales (`lines: 60%, functions: 60%, branches: 55%`) (#158)
- Validación Zod en IPC: `cortexQuery` (text/topK) y Whisper `transcribe` (model) (#148)
- Guard `MAX_IPC_MESSAGE_BYTES = 10 MB` antes de `JSON.parse` en `IPCProtocol.ts` (#149)
- Tipos ID template-literal (`AetherNoteId`, `TaskId`, `SubtaskId`, `ChatMessageId`, `NexusDocumentId`) como fuente única de verdad en `schemas.ts` (#152)
- `CalendarEventsMap` tipado reemplaza `Record<string, any[]>` (#153)

### Changed
- `AetherVault.tsx` dividido: 545 → ~170 LOC. Extrae 4 subcomponentes a `src/components/aether/` (#154)
- `NexusDatabase.tsx` dividido: 430 → ~90 LOC. Extrae 3 subcomponentes a `src/components/nexus/` (#155)
- `Tareas.tsx` dividido: 423 → ~140 LOC. Extrae `AddTaskModal` y `KanbanColumn` a `src/components/tareas/` (#155)

### Security
- `assertSafePath` usa `realpathSync` para prevenir traversal por symlinks (#150)
- Tests de allowlist: 6 tests de rechazo para `configSet`/`configGet` con claves fuera de `ALLOWED_CONFIG_KEYS` (#147)
- Validación Zod en handlers IPC vectoriales y Whisper (#148)

---

## [v3.5.0] — 2026-03-24

### Added
- JSDoc para 4 módulos de `src/cortex/` (#125)
- `Materias` y `Horarios` divididos en subcomponentes (#130, #131)

### Changed
- Issues P0/P1/P2 resueltos (#107–#141)
- Correcciones TypeScript strict en toda la capa Cortex

### Fixed
- Formato Biome en pipeline CI
- Separador de ruta en Windows en `pathSecurity.test.ts`

---

## [v3.4.0] — 2026-03-xx

### Added
- `SubprocessAdapter` desacoplado de `CortexOrchestrator` (#89)
- `CircuitBreaker` con umbrales configurables (#90)
- Logger estructurado reemplaza `console.*` (#91)
- `CONTRIBUTING.md` y `docs/API_IPC.md` (#93, #94)
- ADR-001/002/003 actualizados (#98), `TROUBLESHOOTING.md` (#99)
- Matrix CI: Node 18+20, macOS, SHA-256 en release (#95–#97)

---

## [v3.3.0] — 2026-02-xx

### Added
- Job E2E en CI: pipeline Observer → Transcribe → Aether (#87, #88)
- Tests unitarios para `GmailService`, `ruVectorHandlers`, AI utils, crypto, embeddings (#80–#86)

---

## [v3.2.0] — 2026-02-xx

### Changed
- Performance hardening y mejoras de calidad (#67–#79)

---

## [v3.1.0] — 2026-01-xx

### Security
- Hardening: sanitización de inputs, allowlist de configuración, guard de path traversal, validación IPC (#59–#66)

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
