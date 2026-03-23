# Diagramas de Arquitectura - Carrera LTI

Este documento detalla visualmente los procesos críticos de seguridad y flujo de datos dentro del ecosistema Carrera LTI.

## 1. Seguridad de Datos (Local-First AES-256)
Carrera LTI utiliza cifrado simétrico AES-256 para asegurar que los datos sensibles del estudiante nunca salgan del dispositivo en texto plano.

```mermaid
sequenceDiagram
    participant U as Usuario
    participant S as Store (Aether)
    participant K as Key Manager
    participant L as LocalStorage/SQLite
    participant F as Firebase (Cloud Sync)

    U->>S: Ingresa datos sensibles (Notas/Materias)
    S->>K: Solicita Master Key (Derivada de Passphrase)
    K-->>S: Retorna clave AES-256
    S->>S: Cifra datos (Encrypt)
    S->>L: Guarda datos cifrados
    S->>F: Sincroniza datos cifrados (End-to-End Encrypted)
    F-->>U: Datos seguros en la nube
```

## 2. Flujo Nexus AI (RAG - Retrieval Augmented Generation)
Nexus utiliza un motor de recuperación para contextualizar las respuestas de la IA con la información académica del usuario.

```mermaid
graph TD
    A[Consulta del Usuario] --> B{Nexus AI Router}
    B --> C[Búsqueda Semántica en Aether]
    B --> D[Metadatos de Carrera - Malla Curricular]
    C --> E[Vector Retrieval]
    D --> E
    E --> F[Prompt Contextualizado]
    F --> G[Google Gemini API]
    G --> H[Respuesta Inteligente]
    H --> I[Usuario]
```

## 3. Arquitectura Electron — Cortex IPC

En modo escritorio (Electron v3.0+), el proceso principal orquesta subprocesos Python mediante `StdioTransport` (NDJSON stdio).

```mermaid
graph TD
    Renderer[Renderer React] -->|contextBridge| Preload[preload.ts]
    Preload -->|IPC invoke| Main[main.ts]
    Main --> Config[configHandlers\nelectron-store AES]
    Main --> Docling[doclingHandlers\nprocessDocument / ocr]
    Main --> Whisper[whisperHandlers\ntranscribe]
    Main --> Observer[observerHandlers\ntoggle on/off]
    Docling -->|NDJSON stdio| DoclingPy[scripts/docling_runner.py]
    Whisper -->|NDJSON stdio| WhisperPy[scripts/whisper_runner.py]
    Observer -->|NDJSON stdio + SIGTERM| ObserverPy[scripts/observer_runner.py\nsounddevice → WAV 16kHz]
    ObserverPy -->|transcripción| Whisper
    Main --> RuVector[StdioTransport\nRuVector IPC]
```

### Ciclo Observer AI
```mermaid
sequenceDiagram
    participant U as Usuario
    participant R as Renderer
    participant O as observerHandlers
    participant P as observer_runner.py

    U->>R: toggle ON
    R->>O: observer.toggle(true)
    O->>P: spawn + NDJSON init
    P-->>O: {"status":"recording"}
    U->>R: toggle OFF
    R->>O: observer.toggle(false)
    O->>P: SIGTERM
    P->>P: flush WAV 16kHz mono
    P-->>O: {"wav_path":"..."}
    O->>R: transcribe(wav_path)
    R->>R: addNote + ingestNote (Cortex)
```

## 4. Flujo de Configuración (Setup Wizard)
El proceso automatizado de onboarding mediante el CLI.

```mermaid
graph LR
    Start([npm run setup]) --> NodeCheck{Versión Node >= 18?}
    NodeCheck -- No --> Exit([Error & Exit])
    NodeCheck -- Sí --> DepCheck{node_modules?}
    DepCheck -- No --> Install[npm install]
    DepCheck -- Sí --> EnvCheck{Existe .env?}
    EnvCheck -- Sí --> Backup[Backup .env]
    EnvCheck -- No --> NewEnv[Crear .env desde .example]
    Backup --> Prompts[Solicitar Keys: Gemini, Gmail, Firebase]
    NewEnv --> Prompts
    Prompts --> Save[Guardar .env & .gitignore]
    Save --> Dev([npm run dev])
```
