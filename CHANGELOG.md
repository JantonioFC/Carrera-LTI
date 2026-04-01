# Changelog — Carrera LTI

Todos los cambios notables de este proyecto se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).
Versionado semántico: [SemVer](https://semver.org/lang/es/).

---

## [v3.13.0] — 2026-04-01

### Removed — Deprecación de pipeline de transcripción de audio (ADR-009)

- `electron/handlers/whisperHandlers.ts` + tests — handler IPC `cortex:transcribe` eliminado
- `electron/handlers/observerHandlers.ts` + tests — handler IPC `observer:toggle` / `observer:status` eliminados
- `scripts/whisper_runner.py` — runner Python de Whisper eliminado
- `scripts/observer_runner.py` — runner Python de Observer AI eliminado
- `src/cortex/observer/` — `ObserverAIToggle.tsx`, `ObserverAIToggle.test.tsx`, `observerStore.ts`, `useObserverIPC.ts`, `useObserverIPC.test.ts` eliminados
- `src/cortex/wav/WavManager.ts` + test — gestor de grabaciones WAV eliminado
- `src/store/observerStore.test.ts` — tests de estado del Observer eliminados
- `electron/preload.ts` — métodos `cortex.transcribe` y `observer.*` eliminados del contextBridge
- `electron/types.d.ts` — interfaces `ObserverIPC` y `CortexIPC.transcribe` eliminadas
- `scripts/setup.mjs` — `openai-whisper` y `sounddevice` eliminados del pip install

### Architecture
- ADR-009 — documenta la decisión de deprecar la transcripción local y el fork privado como ruta de evolución

### Chore
- `.github/workflows/ci.yml` — paso Python syntax check actualizado para referenciar solo `docling_runner.py`
- Ramas mergeadas limpiadas: `feat/v3.11.0-p{1,2,3}`, `docs/readme-examenes-electron41`, `fix/tsconfig-electron-moduleresolution`, ramas Dependabot resueltas

---

## [v3.10.1] — 2026-03-27

### Chore
- Eliminados del repo archivos legacy del proyecto anterior (vault Obsidian): `.obsidian/`, `Tareas/`, `_templates/`, `openspec/`
- Actualizado `.gitignore` para cubrir `dist-electron/` y las carpetas legacy — evita que vuelvan a colarse
- Los archivos se conservan en disco local; solo se quitaron del tracking de git

---

## [v3.10.0] — 2026-03-27

### Security (p1 — #278–#280)
- `electron/main.ts` — validación runtime de parámetros IPC en la frontera main↔renderer (#278–#280)
  - `cortex:query`: `topK` validado como entero 1–50
  - `observer:toggle`: `active` validado como `boolean` (previene string `"false"` truthy)
  - `cortex:transcribe`: `model` validado contra enum `VALID_MODELS`

### DX — TypeScript (p1 — #281–#283)
- `cortexStore.ts` — eliminado estado imposible: `isQuerying: boolean` + `queryError: string | null` reemplazados por variante `{ type: "query_error"; error: string }` en `CortexActivity` (#281)
- `nexusStore.ts` — eliminado `ydoc as any` innecesario en `Record<string, Y.Doc>` (#282)
- `GmailInbox.tsx` / `GmailWidget.tsx` — props `loading/error/messages` separados reemplazados por `GmailInboxState` discriminated union (#283)

### Tests (p2 — #284–#286)
- `branded-types.test-d.ts` (nuevo) — tests de tipo con `expectTypeOf` para los 5 branded types; verifica incompatibilidad estructural (#284)
- `useCloudSync.test.ts` — bloques `vi.hoisted` consolidados en uno + `afterEach(localStorage.clear())` (#285)
- `configHandlers.test.ts` — tests de error-path para clave válida en Zod pero ausente de la allowlist (#286)

### Quality/Performance (p2 — #287–#289)
- `aiUtils.ts` — constantes `NEXUS_AI_CONTEXT_CHARS` (40 000) y `AETHER_NOTES_CONTEXT_CHARS` (30 000) en lugar de magic numbers inconsistentes en `NexusAI.tsx` y `aiClient.ts` (#287)
- `Horarios.tsx` — `Math.random()` reemplazado por `crypto.randomUUID()` para `instanceId` (#288)
- `CalendarEventModal.tsx` / `AetherGraphView.tsx` — magic number 100 ms extraído en `MODAL_FOCUS_DELAY_MS` y `GRAPH_INIT_DELAY_MS` (#289)

### Architecture (p3 — #290–#292)
- `schemas.ts` / `useSubjectData.tsx` — `SubjectDataSchema` incluye `archived` y `archivedAt`; Zod ya no stripea los campos del Soft Delete Protocol al sincronizar (#290)
- `schemas.ts` / `Tareas.tsx` — `DueDate` branded type con validación regex `YYYY-MM-DD`; guardia `Number.isNaN()` en filtro de notificaciones (#291)
- `schemas.ts` / `Tareas.tsx` / `AddTaskModal.tsx` — `SubjectId` branded type en `Task.subjectId`; imposible usar strings arbitrarios como referencia de asignatura (#292)

---

## [v3.7.0] — 2026-03-26

### Security (p0 — #174–#180)
- `pathSecurity.ts` — `startsWith(root + sep)` previene bypass de prefijo en allowlist (#177)
- `main.ts` — `mkdirSync` con `mode: 0o700` en `~/.carrera-lti` (#180)
- `electron/handlers/ruVectorHandlers.ts` — Zod `DocPathSchema` valida `docPath` antes de indexar (#188)
- CSP aplicada via `session.webRequest.onHeadersReceived` en main process (#175)
- Guard `hasFirebaseConfig` evita bundlear credenciales en producción (#174)
- `ci.yml` — `permissions: contents: read` global (#178)
- `release.yml` — `timeout-minutes` en todos los jobs (#179)
- `electron/main.ts` — CSP `connect-src` acotado a dominios explícitos (Firebase + Gemini) (#210)
- `firebase.ts` — `AppDataSchema.safeParse()` valida datos Firestore antes de usarlos (#211)

### Architecture (p1/p2 — #193–#207)
- `electron/utils/logger.ts` (nuevo) — elimina inversión de capas: `main.ts` ya no importa desde `src/` (#193)
- `aiUtils.ts` / `aiClient.ts` — tipos `any` reemplazados por `GenerateContentParameters`, `GenerateContentResponse`, `Schema` de `@google/genai` (#201)
- `AETHER_SYSTEM_INSTRUCTION` extraída como constante — elimina duplicación entre `askAether` y `askAetherStream` (#202)
- `useCloudSync.ts` — `data as any` reemplazado por `data as Partial<SubjectData>` (#203)

### Performance (p1/p2 — #186, #187, #204, #205)
- `MallaCurricular.tsx` — 5 iteraciones sobre `allSubjects` memoizadas con `useMemo` (#186)
- `Dashboard.tsx` — `CURRICULUM.flatMap().find()` por render reemplazado por Map O(1) (#187)
- `Horarios.tsx` — `filter()` sobre schedule memoizado con `useMemo` — O(n×m) → O(1) (#204)
- `AetherGraphView.tsx` — resize listener con `requestAnimationFrame` throttle (#205)

### Fixed (p1)
- `NexusAI.tsx` — eliminar `setMessages` como canal de efecto secundario para localStorage (#185)
- `RuVectorAdapter.ts` — `randomUUID` migrado de `node:crypto` a `globalThis.crypto` (#189)

### Docs & DX (p2 — #195–#199)
- `docs/adr/ADR-004-path-security.md` — decisión de arquitectura para path security (#197)
- `docs/adr/ADR-005-rate-limiting.md` — estrategia de rate limiting IPC (#197)
- `docs/adr/ADR-006-ipc-message-size-guard.md` — guard de 10 MB en mensajes IPC (#197)
- `docs/API_IPC.md` — corregidas claves de config documentadas incorrectamente (#196)
- `README.md` — tabla completa de subdirectorios `src/cortex/` (#198)
- `CONTRIBUTING.md` — sección `test:coverage` y umbrales de CI (#199)

### Tests (p1/p2 — #181–#184, #190–#192, #208–#209)
- Cobertura de `safeStorage.ts`, `result.ts`, `schemas.ts` (#181–#183)
- Tests para `ingestNote`, `semanticSearch`, `importNotes` en `aetherStore` (#184)
- Tests para `icsExport.ts`, `logger.ts` (#190–#191)
- Tests `getYDoc` y `deleteDocument` en `nexusStore` (#192)
- `useCalendarEvents.test.ts` — 8 tests para `saveEvent` y `deleteEvent` (#208)
- `useAcademicCalendar.test.tsx` — 8 tests para hooks de calendario académico (#209)

### Dependencies
- `picomatch` 2.3.1 → 2.3.2 / 4.0.3 → 4.0.4 — security fix CVE-2026-33671, CVE-2026-33672

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
