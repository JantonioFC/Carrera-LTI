# **RFC-001: Arquitectura de Cortex — Sistema de Memoria Semántica para Carrera LTI**

**Autor(es):** Juan

**Estado:** Borrador

**Fecha de Creación:** 2026-03-22

**Fecha de Última Actualización:** 2026-03-22

**Referencia a Épica:** PRD - Cortex (Carrera LTI).md

**Nivel de Impacto:** Crítico

---

## **1. Resumen Ejecutivo (Abstract)**

Esta RFC propone la arquitectura técnica para integrar Cortex, una capa de memoria semántica, dentro de Carrera LTI migrada a Electron. El sistema orquesta cuatro subprocesos externos (Observer AI, Whisper, Docling, RuVector) desde el proceso principal de Electron mediante un protocolo IPC sobre stdio con mensajes JSON. Cortex captura audio de conferencias, transcribe, procesa documentos con OCR, indexa semánticamente y surfea conocimiento contextual al usuario, todo de forma local y privada.

1. **¿Qué vamos a cambiar?** Migrar Carrera LTI de aplicación web (React/Vite) a aplicación desktop (Electron) e integrar el módulo Cortex con cuatro herramientas de IA open-source como subprocesos gestionados.
2. **¿Por qué ahora?** El stack web no permite acceso a APIs de sistema operativo necesarias para captura de audio, gestión de procesos nativos y almacenamiento local de un vector DB.
3. **¿Cuál es el beneficio técnico inmediato?** Procesamiento 100% local, privacidad garantizada por diseño, soporte multiplataforma (Windows/macOS/Linux) y control total del ciclo de vida de los subprocesos.

---

## **2. Contexto y Motivación**

* **Problema Técnico Detallado:** Carrera LTI es actualmente una SPA web (React + Vite + Firebase). Esta arquitectura impide:
  * Captura de audio del sistema (Web Audio API solo captura micrófono, no audio de otras apps)
  * Ejecución de procesos nativos (Whisper CLI, Docling Python, RuVector binario Rust)
  * Almacenamiento local de un vector DB persistente sin restricciones de storage del browser
  * Acceso a permisos de sistema operativo (micrófono, cámara) con control programático fino

* **Análisis de Deuda Técnica:** La migración a Electron no es un parche: establece la base arquitectónica para todas las capacidades de IA local que el proyecto requiere. Sin esta base, Cortex no puede existir.

* **Oportunidad:** El ecosistema de herramientas de IA local (Whisper, Docling, RuVector, Observer AI) ha madurado al punto donde es viable orquestarlas desde una app desktop con complejidad operativa manejable.

* **Evidencia Empírica:** El 58% de usuarios de apps de notas desconoce que sus datos no están cifrados. La privacidad local es un diferenciador real y validado en investigación de mercado.

---

## **3. Objetivos (Metas y No-Metas)**

* **Metas:**
  * Migrar Carrera LTI a Electron manteniendo toda la funcionalidad web existente (Aether, Nexus, Horarios)
  * Definir el protocolo IPC entre el proceso principal de Electron y los subprocesos (Docling, RuVector, Observer AI, Whisper)
  * Establecer el ciclo de vida de subprocesos: inicio, monitoreo, reinicio anti-bucle y apagado limpio
  * Garantizar procesamiento 100% offline para todas las operaciones de Cortex excepto consultas LLM y AutoResearchClaw
  * Compatibilidad en Windows, macOS y Linux sin degradación funcional

* **No-Metas:**
  * No se contempla app móvil en esta RFC
  * No se rediseña la UI de Carrera LTI en esta iteración (solo se añade Cortex)
  * No se migra la autenticación Firebase (se mantiene tal cual)
  * No se implementa colaboración multi-usuario en Cortex
  * El fine-tuning de modelos locales queda fuera de esta RFC (Fase 2)

---

## **4. Propuesta de Solución Detallada**

### **4.1 Arquitectura y Diagramas**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CARRERA LTI (Electron)                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Renderer Process (React/TypeScript)          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │   │
│  │  │  Aether  │ │  Nexus   │ │ Horarios │ │   Cortex   │  │   │
│  │  │  (notas) │ │ (kanban) │ │          │ │   (UI)     │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │ IPC (contextBridge / ipcRenderer)   │
│  ┌─────────────────────────▼────────────────────────────────┐   │
│  │              Main Process (Node.js/TypeScript)            │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │           CortexOrchestrator                     │    │   │
│  │  │  (Google ADK como backbone de agentes)           │    │   │
│  │  └──────┬──────────┬───────────┬───────────┬────────┘    │   │
│  │         │          │           │           │              │   │
│  │  ┌──────▼──┐ ┌─────▼──┐ ┌─────▼──┐ ┌─────▼──────────┐  │   │
│  │  │Observer │ │Whisper │ │Docling │ │   RuVector     │  │   │
│  │  │  AI     │ │ (Rust/ │ │(Python │ │  (Rust binary) │  │   │
│  │  │(TS/Rust)│ │ binary)│ │ venv)  │ │                │  │   │
│  │  └─────────┘ └────────┘ └────────┘ └────────────────┘  │   │
│  │                                                          │   │
│  │  Protocolo IPC: stdio JSON streams (línea por mensaje)   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Almacenamiento Local                                     │   │
│  │  ~/.carrera-lti/cortex/                                   │   │
│  │  ├── ruvector.db     (índice vectorial)                   │   │
│  │  ├── queue.json      (cola de procesamiento)              │   │
│  │  └── feedback.json   (señales de relevancia)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### **4.2 Protocolo IPC — stdio JSON Streams**

Cada subproceso se comunica con el Main Process a través de stdin/stdout. El protocolo es:

```json
// Mensaje de Main → Subproceso
{ "id": "uuid-v4", "action": "index_document", "payload": { "path": "/...", "type": "pdf" } }

// Respuesta de Subproceso → Main
{ "id": "uuid-v4", "status": "ok"|"error"|"progress", "data": {...}, "error": null }
```

**Reglas del protocolo:**
- Un mensaje por línea (newline-delimited JSON)
- El campo `id` permite correlacionar respuestas asíncronas
- `status: "progress"` para operaciones largas (indexado, transcripción)
- Timeout de 30s por operación; si no responde → reinicio del subproceso

### **4.3 Ciclo de Vida de Subprocesos**

```
App abre
   ↓
CortexOrchestrator.init()
   ├── spawn(ruvector) → espera "ready"
   ├── spawn(docling)  → espera "ready"
   └── Observer AI: NO se inicia hasta que el usuario activa el toggle

Operación normal
   ├── Main Process envía mensajes → subprocesos
   ├── Subprocesos responden → Main Process
   └── Heartbeat cada 5s → si no responde → marca como "caído"

Subproceso cae
   ├── Detectado por heartbeat o exit code
   ├── intento_reinicio++
   ├── Si intento_reinicio <= 3 → spawn() nuevamente
   └── Si intento_reinicio > 3 → notificar usuario, esperar intervención

App cierra
   ├── CortexOrchestrator.shutdown()
   ├── Envía SIGTERM a cada subproceso
   ├── Espera 3s para cierre limpio
   └── SIGKILL si no terminaron
```

### **4.4 Cambios en Esquema de Datos**

```
~/.carrera-lti/
├── cortex/
│   ├── ruvector.db          # RuVector — índice vectorial persistente
│   ├── queue.json           # Cola de procesamiento en curso
│   ├── feedback.json        # Señales de relevancia del usuario
│   └── export/              # Exportaciones a Firebase/GitHub
│       └── backup_YYYYMMDD.zip
└── observer/
    └── recordings/          # Audio temporal (se elimina tras transcribir)
        └── *.wav            # Máx. 24h de retención
```

**Política de retención:** Los archivos `.wav` de conferencias se eliminan automáticamente tras completar la transcripción y confirmar que la nota está en Aether. Nunca persisten más de 24 horas.

### **4.5 Migración de Carrera LTI a Electron**

**Estrategia incremental (sin big bang):**

| Fase | Descripción | Duración estimada |
|---|---|---|
| Fase A | Envolver la SPA existente en Electron shell. Sin cambios de UI. | Sprint 1 |
| Fase B | Migrar storage de IndexedDB a electron-store donde aplique. Mantener Firebase para auth. | Sprint 2 |
| Fase C | Integrar CortexOrchestrator con subprocesos. Primero solo RuVector. | Sprint 3 |
| Fase D | Integrar Docling + Whisper + Observer AI. | Sprint 4-5 |
| Fase E | UI de Cortex (panel flotante + pestaña). | Sprint 6 |

---

## **5. Alternativas Consideradas**

* **Opción A (La elegida): Electron + subprocesos stdio**
  * Pros: Control total del ciclo de vida, multiplataforma, reutiliza el stack React existente, protocolo simple
  * Contras: Complejidad de gestión de subprocesos, tamaño del instalador mayor (~200MB)

* **Opción B: Tauri (Rust)**
  * Pros: Bundle más liviano (~10MB), mejor rendimiento nativo
  * Contras: Requiere reescribir el frontend en compatibilidad con Tauri APIs, curva de aprendizaje alta, rompe la inversión en React existente
  * **Motivo del Rechazo:** El costo de migración supera los beneficios para un proyecto existente en React

* **Opción C: Servidor local (Express) + navegador**
  * Pros: Sin migración, usa el stack web actual
  * Contras: Experiencia fragmentada (navegador + servidor), sin acceso a APIs nativas de OS, instalación compleja para el usuario
  * **Motivo del Rechazo:** No resuelve el problema de captura de audio del sistema ni la gestión de subprocesos

* **Opción D: Hacer nada / Cortex en la nube**
  * Riesgo: Elimina la propuesta de valor de privacidad local, que es el diferenciador clave vs. Notion/Mem.ai
  * **Motivo del Rechazo:** Contradice el REQ-11 y el principio de privacidad del PRD

---

## **6. Impacto y Trade-offs**

* **Rendimiento vs. Tamaño:** Electron añade ~150MB al bundle. Aceptable para una app desktop con estas capacidades.
* **Complejidad Operativa:** La gestión de 4 subprocesos en 3 plataformas es la parte más frágil del sistema. Requiere testing exhaustivo multiplataforma en CI.
* **Developer Experience:** El desarrollo local ahora requiere tener Python (Docling), Rust (RuVector) y Node (Electron) instalados. Se mitiga con un script de setup automatizado.
* **Costos de Infraestructura:** Cero costo de servidor. Todo corre en el hardware del usuario. Costo de AutoResearchClaw = tokens de la API del LLM.

---

## **7. Plan de Implementación y Rollout**

1. **Fase 1 — Electron Shell:** Envolver la SPA sin tocar funcionalidad. Validar que Aether, Nexus y Horarios funcionan idénticos.
2. **Fase 2 — CortexOrchestrator:** Implementar el gestor de subprocesos con RuVector. Indexado manual de documentos de Aether.
3. **Fase 3 — Pipeline completo:** Docling (OCR + PDF) + Whisper (transcripción). Panel flotante básico.
4. **Fase 4 — Observer AI:** Toggle de conferencias. Integración con Nexus. AutoResearchClaw.
5. **Fase 5 — Pulido:** Exportación Firebase/GitHub, feedback de relevancia, onboarding guiado.

---

## **8. Estrategia de Testing y Observabilidad**

* **Unit Tests:** Vitest para lógica de CortexOrchestrator (gestión de cola, reinicio anti-bucle, serialización IPC)
* **Integration Tests:** Tests end-to-end del pipeline completo: PDF → Docling → RuVector → query → resultado
* **Multiplataforma:** GitHub Actions con matrix strategy (ubuntu-latest, windows-latest, macos-latest)
* **Métricas:** Tiempo de indexado por tipo de documento, latencia de query, tasa de reinicio de subprocesos

---

## **9. Seguridad y Gobernanza**

* **API Keys:** Almacenadas en electron-store con cifrado AES-256 (consistente con arquitectura de seguridad existente en Carrera LTI, REQ de seguridad del PRD)
* **Audio:** Los archivos WAV temporales se almacenan solo en el directorio de la app y se eliminan tras transcripción
* **IPC:** La comunicación stdio es local al proceso; no expone puertos de red
* **Permisos:** Se solicitan permisos de micrófono al OS mediante diálogos nativos, no se accede sin consentimiento
* **Subprocesos:** No tienen acceso a internet excepto AutoResearchClaw (aislados por diseño)

---

## **10. Preguntas Abiertas**

* ¿Qué modelo de Whisper usar por defecto? (`base` para velocidad vs `small` para precisión con acento rioplatense)
* ¿Cómo empaquetar el entorno Python de Docling en el instalador sin requerir Python instalado en la máquina del usuario?
* ¿Electron-builder o electron-forge para el sistema de build y distribución?

---

## **11. Apéndices y Referencias**

* [Observer AI GitHub](https://github.com/Roy3838/Observer)
* [Docling GitHub](https://github.com/docling-project/docling)
* [RuVector GitHub](https://github.com/ruvnet/RuVector)
* [Google ADK Docs](https://google.github.io/adk-docs/)
* [Fabric GitHub](https://github.com/danielmiessler/Fabric)
* PRD - Cortex (Carrera LTI).md
