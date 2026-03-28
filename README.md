# Carrera LTI — UTEC Uruguay 🎓

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/JantonioFC/Carrera-LTI)

Una **súper-app académica y de productividad** diseñada para estudiantes de la **Licenciatura en Tecnologías de la Información (Plan 2024)** de la **Universidad Tecnológica (UTEC) de Uruguay**.

Combina gestión académica, un Segundo Cerebro (Aether), un Espacio de Trabajo Unificado con IA (Nexus) y un asistente de IA local (Cortex) en una sola aplicación local-first y offline-ready. Disponible como **PWA** y como **app de escritorio** (Electron). Desarrollada bajo la marca **URU/IA.LABS**.

---

## ✨ Características

### 📚 Gestión Académica
| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | Resumen del semestre, cuenta regresiva, gráficos de progreso (Recharts) y promedio general |
| **Calendario** | Vista mensual/semanal de instancias presenciales, exportación `.ics` |
| **Malla Curricular** | Grid interactivo de 8 semestres con créditos y barra de progreso |
| **U.C.** | Gestión de materias: notas, estado, enlaces y recursos por unidad curricular |
| **Tareas** | Kanban avanzado con subtareas, prioridades, fechas y notificaciones push |
| **Horarios** | Generador visual drag-and-drop con `@dnd-kit` |

### 🧠 Aether (Segundo Cerebro)
| Módulo | Descripción |
|--------|-------------|
| **Bóveda** | Editor Markdown híbrido con enlaces bidireccionales `[[Wiki]]` |
| **Grafo de Conocimiento** | Visualización 2D de relaciones entre notas (`react-force-graph-2d`) |
| **Canvas Espacial** | Tablero infinito de libre posicionamiento (`@xyflow/react`) |
| **Asistente Aether** | Chat RAG con Google Gemini sobre tus notas |

### ⚡ Nexus (Unified Intelligence Workspace)
| Módulo | Descripción |
|--------|-------------|
| **Editor de Bloques** | Edición atómica con BlockNote + Yjs CRDT + IndexedDB |
| **Bases de Datos** | Tablas relacionales locales de alta velocidad (Dexie.js / IndexedDB) |
| **Paleta de Comandos** | Búsqueda unificada global con `Ctrl/Cmd + K` |
| **Nexus AI** | Chat con RAG multi-fuente (notas + documentos + bases de datos) vía Gemini 2.5 Flash |
| **Cifrado AES-256** | Protección local con Web Crypto API (PBKDF2 + AES-GCM) |

### 🤖 Cortex (Asistente de IA Local — solo Electron)
| Módulo | Descripción |
|--------|-------------|
| **Observer AI** | Captura de audio en tiempo real vía micrófono — transcribe y convierte en notas automáticamente |
| **Docling** | Procesamiento de documentos (PDF, DOCX, imágenes) con OCR mediante subproceso Python |
| **Whisper** | Transcripción de audio offline con modelo OpenAI Whisper (sin conexión a internet) |
| **RuVector** | Índice vectorial local vía stdio IPC para búsqueda semántica de baja latencia |

### 🔧 Infraestructura
- ⏱️ **Pomodoro Global** — Timer flotante de Focus/Break accesible desde cualquier vista
- 📱 **PWA Instalable** — Service Worker con cache offline (`vite-plugin-pwa`)
- 🖥️ **App de Escritorio** — Distribución Electron con IPC seguro y acceso nativo al sistema
- ☁️ **Sync Cloud** — Respaldo/restauración opcional vía Firebase (auth anónima silenciosa)
- 🛜 **Cola Offline** — Transacciones pendientes se sincronizan automáticamente al recuperar red

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 + Vite 6 |
| Lenguaje | TypeScript (strict) |
| Estilos | Tailwind CSS 3 |
| Editor de Bloques | BlockNote + ProseMirror |
| CRDT / Offline | Yjs + y-indexeddb |
| Base de Datos Local | Dexie.js (IndexedDB) |
| IA Generativa | Google Gemini API (`@google/genai`) |
| Cifrado | Web Crypto API (AES-256-GCM) + electron-store (AES en desktop) |
| Grafos | react-force-graph-2d, @xyflow/react |
| Charts | Recharts |
| DnD | @dnd-kit |
| PWA | vite-plugin-pwa |
| Cloud (opcional) | Firebase Firestore + Auth anónima |
| Desktop | Electron 36 + vite-plugin-electron |
| IPC / Subprocesos | StdioTransport (NDJSON) + Python venv |
| IA Local (Cortex) | Docling · OpenAI Whisper · RuVector · sounddevice |
| Iconos | Lucide React |

---

## 🚀 Instalación y Configuración

Carrera LTI utiliza un **Setup Wizard** interactivo para automatizar la configuración del entorno, las APIs de Google, Firebase y las dependencias Python para Cortex.

Requiere [Node.js](https://nodejs.org/) v20 LTS+ y Python 3.10+.

```bash
# 1. Clonar el repositorio
git clone https://github.com/JantonioFC/Carrera-LTI.git
cd "Carrera LTI"

# 2. Ejecutar el asistente de configuración
# Instala dependencias npm, configura .env y crea el venv Python para Cortex
npm run setup

# 3a. Modo web (PWA)
npm run dev

# 3b. Modo escritorio (Electron)
npm run dev:electron
```

> **Nota:** El comando `npm run setup` es la forma recomendada de inicializar el proyecto por primera vez o para actualizar tus credenciales de forma segura. Consulta la [Guía Visual (PDF)](docs/GUIA_VISUAL_CONFIGURACION.pdf) si no tienes tus claves.


---

## 🖼️ Guía Visual (Tour Rápido)

### Dashboard Principal
![Dashboard](docs/img/01-dashboard.png)

### Ecosistema Aether & Nexus
| Aether (Segundo Cerebro) | Nexus (Workspace AI) |
| :--- | :--- |
| ![Aether](docs/img/02-aether-editor.png) | ![Nexus](docs/img/05-nexus-editor.png) |

> [!TIP]
> Para una guía paso a paso con capturas reales y seguras, descarga la **[Guía Visual de Configuración (PDF)](docs/GUIA_VISUAL_CONFIGURACION.pdf)**.
> Consulta también los [Diagramas de Arquitectura](docs/DIAGRAMAS_ARQUITECTURA.md) para detalles técnicos (AES-256, RAG Flow).

---

## 📁 Estructura del Proyecto

```text
src/
├── components/
│   ├── Sidebar.tsx           # Navegación principal (13 módulos)
│   ├── CommandPalette.tsx    # Paleta de comandos global (Ctrl+K)
│   └── Pomodoro.tsx          # Timer flotante
├── cortex/
│   ├── bridge/               # Contract tests del contextBridge Electron
│   ├── observer/             # useObserverIPC — toggle, transcribe, addNote
│   └── ui/                   # CortexTab + ObserverAIToggle
├── hooks/
│   ├── useAether.tsx         # Context Provider de Aether (notas, links, grafo)
│   ├── useNexus.tsx          # Context Provider de Nexus (docs Yjs + IndexedDB)
│   ├── useNexusDB.tsx        # Motor de BD Relacionales (Dexie)
│   └── useCloudSync.tsx      # Sincronización Firebase offline-resiliente
├── utils/
│   ├── schemas.ts            # Branded types (TaskId, SubtaskId, AetherNoteId, NexusDocumentId, ChatMessageId, DueDate, SubjectId) + Zod schemas IPC
│   ├── aiUtils.ts            # truncateContext, generateStructuredContentWithRetry, constantes de contexto
│   └── nexusCrypto.ts        # Cifrado/descifrado AES-256-GCM
├── data/
│   └── lti.ts                # Datos académicos oficiales UTEC Plan 2024
├── pages/
│   ├── Dashboard.tsx         # Vista principal con analíticas
│   ├── Calendario.tsx        # Calendario mensual/semanal + export .ics
│   ├── MallaCurricular.tsx   # Malla de 8 semestres
│   ├── Materias.tsx          # Gestión de U.C.
│   ├── Tareas.tsx            # Kanban avanzado
│   ├── Horarios.tsx          # Generador visual de horarios
│   ├── AetherVault.tsx       # Editor + Grafo de conocimiento
│   ├── AetherCanvas.tsx      # Canvas espacial infinito
│   ├── AetherChat.tsx        # Chat IA (Aether)
│   ├── NexusWorkspace.tsx    # Editor de bloques atómico
│   ├── NexusDatabase.tsx     # BD relacionales (vista Tabla)
│   └── NexusAI.tsx           # Chat IA multi-fuente (Nexus)
├── index.css                 # Sistema de diseño + dark theme premium
└── App.tsx                   # Router y providers globales
electron/
├── main.ts                   # Proceso principal Electron (IPC handlers init)
├── preload.ts                # contextBridge — expone APIs a renderer
├── types.d.ts                # Tipos globales window.cortexAPI
├── utils/
│   └── logger.ts             # Logger del proceso principal (no importa desde src/)
├── handlers/
│   ├── configHandlers.ts     # Config IPC (electron-store cifrado)
│   ├── doclingHandlers.ts    # processDocument + ocr
│   ├── observerHandlers.ts   # Observer AI toggle on/off
│   └── whisperHandlers.ts    # Transcripción de audio offline
└── transports/
    └── StdioTransport.ts     # NDJSON stdio IPC (inyectable para tests)
scripts/
├── setup.mjs                 # Wizard: configura .env + instala venv Python
├── docling_runner.py         # Runner Docling (NDJSON)
├── observer_runner.py        # Runner Observer AI con sounddevice
└── whisper_runner.py         # Runner Whisper (borra WAV tras transcripción)
```

---

## 📂 Subdirectorios de `src/cortex/`

| Directorio | Contenido |
|---|---|
| `bridge/` | Contract tests del `contextBridge` de Electron (`AetherIndexBridge`) |
| `config/` | `ConfigStore` — acceso tipado a la configuración cifrada desde el renderer |
| `e2e/` | Tests end-to-end de Cortex con fixtures de documentos reales |
| `export/` | `IndexExporter` — exporta el índice vectorial a JSON |
| `feedback/` | `FeedbackStore` — almacena retroalimentación del usuario sobre resultados RAG |
| `grounding/` | `GroundingValidator` — valida que las respuestas IA citen fuentes del índice |
| `ipc/` | `IPCProtocol` — parseo y validación de mensajes NDJSON del protocolo stdio |
| `observer/` | `useObserverIPC`, `ObserverAIToggle`, `ConferencePipeline` — grabación y transcripción |
| `orchestrator/` | `CortexOrchestrator` — coordina los flujos index → query → grounding |
| `queue/` | `QueueManager` — cola de tareas de indexación con reintentos |
| `research/` | `AutoResearchClaw` — búsqueda automática de contexto académico |
| `ui/` | Componentes React de Cortex (`CortexTab`, `CortexFloatingPanel`, `CortexActivityIndicator`) |
| `updater/` | `UpdaterConfig` — configuración del canal de actualizaciones de Cortex |
| `wav/` | `WavManager` — gestión del ciclo de vida de archivos WAV temporales |
| `__mocks__/` | Mock de `electron` para Vitest (evita importar Electron en tests del renderer) |

---

## 🔑 Configuración de IA (Opcional)

Nexus AI y Asistente Aether requieren una **API Key de Google AI Studio** (gratuita):

1. Ir a [aistudio.google.com](https://aistudio.google.com)
2. Click en **"Get API Key"** → **"Create API Key"**
3. Pegar la clave en la app (se guarda de forma segura e indefinida en la base de datos local IndexedDB de tu navegador)

---

## 📝 Personalización Académica

Los datos oficiales están en `src/data/lti.ts`:

- `SEMESTER_START` — Fecha de inicio de cursos
- `EXAM_START` / `EXAM_END` — Períodos de examen
- `CURRICULUM` — 8 semestres con U.C., créditos y prerrequisitos
- `DEFAULT_PRESENCIALES` — Fechas base de jornadas presenciales

> Los cambios que hagas desde la interfaz se guardan en tu navegador y prevalecen sobre estos valores base.

---

## 📄 Licencia

Este proyecto está bajo la licencia **Creative Commons Atribución-NoComercial 4.0 Internacional (CC BY-NC 4.0)**.

© 2026 URU/IA.LABS · Generación 2026 · UTEC Uruguay
