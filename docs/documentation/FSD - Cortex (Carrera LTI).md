# **FSD: Especificación Funcional Detallada — Cortex (Carrera LTI)**

**Proyecto:** Cortex — Carrera LTI

**Referencia PRD:** PRD - Cortex (Carrera LTI).md

**Referencia RFC:** RFC-001 - Arquitectura Cortex (Carrera LTI).md

**Versión:** 1.0.0

**Estado:** Borrador

**Última Revisión:** 2026-03-22

---

## **1. Alcance y Objetivos de la Especificación**

Este documento es la fuente única de verdad sobre el comportamiento esperado de cada módulo de Cortex. Elimina la ambigüedad para el desarrollo y sirve como manual de instrucciones para agentes de codificación.

### **1.1 No-Objetivos (Fuera de Alcance Funcional)**

* No se especifica el comportamiento de los módulos existentes de Carrera LTI (Aether, Nexus, Horarios) salvo sus puntos de integración con Cortex
* No se contempla la interfaz web (solo Electron desktop)
* No se define la lógica interna de RuVector, Docling, Whisper u Observer AI (son cajas negras con contratos de IPC definidos)
* No se especifica el fine-tuning de modelos (Fase 2)

---

## **2. Arquitectura Funcional y Flujos de Usuario**

### **2.1 Mapa de Funcionalidades**

```
Cortex
├── M1. CortexOrchestrator (Main Process)
│   ├── M1.1 Gestión de subprocesos (spawn, monitor, reinicio)
│   ├── M1.2 Cola de procesamiento
│   └── M1.3 Protocolo IPC
│
├── M2. Pipeline de Ingesta
│   ├── M2.1 Indexado de documentos Aether (PDF, DOCX, MD)
│   ├── M2.2 OCR de imágenes (apuntes, slides, pizarrón)
│   └── M2.3 Transcripción de conferencias (Observer AI → Whisper → Aether)
│
├── M3. Motor de Memoria (RuVector)
│   ├── M3.1 Indexado semántico
│   ├── M3.2 Re-indexado automático
│   ├── M3.3 Eliminación de documentos del índice
│   └── M3.4 Feedback de relevancia
│
├── M4. Panel Flotante
│   ├── M4.1 Consulta en lenguaje natural
│   ├── M4.2 Resultados con cita de fuente
│   ├── M4.3 Surfeo contextual (Nexus)
│   └── M4.4 Aprobación de papers (AutoResearchClaw)
│
├── M5. Pestaña Dedicada
│   ├── M5.1 Índice de documentos
│   ├── M5.2 Cola de procesamiento con barra de estado
│   ├── M5.3 Toggle Observer AI
│   ├── M5.4 Historial de consultas
│   └── M5.5 Exportación (Firebase / GitHub)
│
└── M6. Observer AI
    ├── M6.1 Toggle on/off
    ├── M6.2 Captura de audio de conferencias
    └── M6.3 Detección de inicio/fin de conferencia
```

### **2.2 Flujo de Datos Principal (Nivel 0)**

```
Usuario
  │
  ├── Sube PDF a Aether ──────────────────→ M2.1 → M3.1 → RuVector
  │
  ├── Sube imagen a Cortex ────────────────→ M2.2 → Docling OCR → Aether → M3.1
  │
  ├── Activa Observer + entra en conferencia → M6.2 → Whisper → M2.3 → Aether → M3.1
  │
  ├── Consulta en panel flotante ──────────→ M4.1 → RuVector → M4.2 (con fuente)
  │
  └── Abre tarea en Nexus ────────────────→ M4.3 → RuVector → panel flotante

```

---

## **3. Especificación Detallada de Módulos**

### **M1. CortexOrchestrator**

* **Descripción Operativa:** Proceso Node.js que actúa como supervisor de todos los subprocesos de Cortex. Se inicializa al abrir Carrera LTI y se apaga al cerrarla.

* **Entradas:**
  * Eventos del Renderer Process vía ipcMain: `cortex:index`, `cortex:query`, `cortex:ocr`, `cortex:delete`, `cortex:export`
  * Mensajes stdout de subprocesos (JSON newline-delimited)

* **Procesamiento y Reglas:**
  1. Al iniciar: spawn de RuVector y Docling. Esperar mensaje `{"status":"ready"}` de cada uno antes de aceptar operaciones.
  2. Observer AI solo se inicia cuando el usuario activa el toggle (no en el startup).
  3. Cada operación recibe un `operation_id` (UUID v4) para correlacionar respuesta asíncrona.
  4. Si un subproceso no responde al heartbeat en 10s → marcarlo como `CRASHED`.
  5. Anti-bucle: contador de reinicios por subproceso. Reset a 0 si el proceso estuvo estable más de 60s.
  6. Si reinicios > 3 consecutivos → emitir evento `cortex:subprocess_failed` al Renderer → notificar usuario.

* **Estados del Orchestrator:**
  * `INITIALIZING` → `READY` → `DEGRADED` (un subproceso caído) → `FAILED` (múltiples caídos)

* **Salidas:**
  * Eventos ipcMain hacia Renderer: `cortex:progress`, `cortex:result`, `cortex:error`, `cortex:subprocess_status`
  * Escritura en `queue.json` (estado de cola persistente)

---

### **M2. Pipeline de Ingesta**

#### **M2.1 Indexado de Documentos Aether**

* **Trigger:** Evento de Aether `aether:document_saved` o `aether:document_updated`
* **Entradas:** `{ path: string, type: "pdf"|"docx"|"md"|"txt", aether_id: string }`
* **Procesamiento:**
  1. Encolar operación en `queue.json` con estado `PENDING`
  2. Enviar a Docling: `{"action": "parse", "path": "...", "type": "..."}`
  3. Docling devuelve texto estructurado + metadata
  4. Enviar texto + `aether_id` a RuVector: `{"action": "index", "id": "aether_id", "content": "..."}`
  5. RuVector confirma indexado → actualizar estado en queue a `DONE`
* **Side Effects:** Actualizar barra de estado en M5.2
* **Regla de idempotencia:** Si `aether_id` ya existe en RuVector → re-indexar (sobreescribir). Esto cubre REQ-17.
* **Salidas:** Evento `cortex:indexed` con `{ aether_id, chunks_count, duration_ms }`
* **Timeout:** 30s por documento. Si excede → estado `FAILED` en cola, notificación al usuario.

#### **M2.2 OCR de Imágenes**

* **Trigger:** Usuario selecciona imagen desde la pestaña dedicada de Cortex (botón "Procesar imagen")
* **Entradas:** `{ image_path: string, source_type: "handwritten"|"slide"|"whiteboard" }`
* **Procesamiento:**
  1. Enviar imagen a Docling: `{"action": "ocr", "path": "...", "hint": "source_type"}`
  2. Docling devuelve texto extraído + confianza del OCR
  3. Crear nota nueva en Aether con: título auto-generado (fecha + tipo), contenido = texto OCR, tag = `cortex-ocr`
  4. Disparar M2.1 para indexar la nueva nota
* **Salidas:** Nota creada en Aether + confirmación al usuario con preview del texto extraído
* **Edge Case:** Si confianza OCR < 60% → mostrar advertencia "Calidad baja, revisá el texto antes de guardar" con opción de cancelar

#### **M2.3 Transcripción de Conferencias**

* **Trigger:** Observer AI detecta audio durante conferencia (toggle ON)
* **Procesamiento:**
  1. Observer AI captura audio en chunks de 30s → archivos `.wav` temporales en `~/.carrera-lti/observer/recordings/`
  2. Al finalizar la conferencia (usuario desactiva toggle o cierra la app): concatenar chunks
  3. Enviar archivo completo a Whisper: `{"action": "transcribe", "path": "...", "language": "es"}`
  4. Whisper devuelve texto con timestamps por párrafo
  5. Crear nota en Aether: título = "Conferencia — {fecha hora}", contenido = transcripción, tag = `cortex-transcripcion`
  6. Eliminar archivos `.wav` temporales
  7. Disparar M2.1 para indexar la nueva nota
* **Salidas:** Nota de transcripción en Aether, archivos WAV eliminados
* **Edge Case — App se cierra mid-conferencia:** Los chunks ya capturados se procesan igualmente. Los chunks incompletos se descartan.
* **Edge Case — Sin audio detectado:** Si Observer AI detecta silencio > 10 min → pausa la captura, notifica al usuario.

---

### **M3. Motor de Memoria (RuVector)**

#### **M3.1 Indexado Semántico**

* **Contrato IPC con RuVector:**
  ```json
  // Index
  { "action": "index", "id": "aether_uuid", "content": "texto completo", "metadata": { "type": "pdf|md|transcripcion|ocr", "aether_path": "...", "date": "ISO8601" } }
  // Response
  { "status": "ok", "chunks": 12, "duration_ms": 340 }
  ```

#### **M3.2 Re-indexado Automático**

* **Trigger:** `aether:document_updated` con el mismo `aether_id`
* **Comportamiento:** Mismo flujo que M2.1. RuVector sobreescribe los chunks existentes del documento.
* **Garantía:** El usuario nunca ve resultados de una versión anterior de un documento editado.

#### **M3.3 Eliminación del Índice**

* **Trigger:** Usuario hace clic en "Eliminar del índice" en M5.1
* **Contrato IPC:**
  ```json
  { "action": "delete", "id": "aether_uuid" }
  // Response
  { "status": "ok", "chunks_deleted": 12 }
  ```
* **Regla crítica:** La eliminación del índice NO borra el documento en Aether. Son operaciones independientes.
* **Confirmación:** Mostrar diálogo de confirmación antes de ejecutar.

#### **M3.4 Feedback de Relevancia**

* **Trigger:** Usuario marca resultado como irrelevante en M4.2
* **Almacenamiento:** `feedback.json` → `{ "query_id": "...", "result_id": "aether_uuid", "signal": "negative" }`
* **Uso:** En cada query, los `result_id` con señal negativa reciente reciben un penalizador de score (-30%).
* **Retención de feedback:** 90 días. Después se elimina automáticamente.

---

### **M4. Panel Flotante**

#### **M4.1 Consulta en Lenguaje Natural**

* **Descripción:** Input de texto siempre visible en el panel flotante. El usuario escribe su consulta.
* **Entradas:** String de consulta (máx. 500 caracteres)
* **Procesamiento:**
  1. Verificar conexión a internet. Si offline → mostrar "Consultas requieren conexión" y deshabilitar input.
  2. Si online: enviar consulta + contexto actual (módulo activo, tarea abierta en Nexus) al LLM con instrucción de grounding.
  3. El LLM genera un query semántico → enviar a RuVector: `{"action": "search", "query": "...", "top_k": 5}`
  4. RuVector devuelve chunks rankeados con `aether_id` y score
  5. Aplicar penalizador de feedback (M3.4)
  6. LLM sintetiza respuesta usando SOLO los chunks devueltos. Instrucción explícita: no usar conocimiento externo.
  7. Mostrar respuesta + lista de fuentes citadas (nombre del documento en Aether, fragmento relevante)
* **Salidas:** Respuesta grounded + fuentes citadas (REQ-22)
* **Regla de grounding:** Si RuVector no devuelve resultados relevantes (score < umbral), responder: "No encontré información sobre esto en tu índice. ¿Querés que busque papers académicos?"

#### **M4.2 Resultados con Cita de Fuente**

* Cada resultado muestra: nombre del documento, tipo (PDF/nota/transcripción/OCR), fecha de ingesta, fragmento relevante
* Botón "Marcar como irrelevante" → M3.4
* Botón "Abrir en Aether" → navega al documento fuente

#### **M4.3 Surfeo Contextual desde Nexus**

* **Trigger:** Usuario abre una tarea en Nexus (`nexus:task_opened` con `{ task_id, title, description }`)
* **Comportamiento:** Sin que el usuario escriba nada, el panel flotante ejecuta automáticamente una búsqueda usando título + descripción de la tarea como query
* **Display:** "Encontré esto relacionado a tu tarea:" + top 3 resultados
* **Si no hay resultados relevantes:** El panel flotante no aparece (no interrumpir al usuario con "no encontré nada")

#### **M4.4 Aprobación de Papers (AutoResearchClaw)**

* **Trigger:** Cortex detecta tema activo en Aether (actualización de nota con > 200 palabras)
* **Comportamiento:**
  1. Lanzar AutoResearchClaw con el tema detectado → lista de papers candidatos
  2. Mostrar en panel flotante: "Encontré papers relacionados a este tema" + lista con título, abstract, fuente (arXiv/Semantic Scholar)
  3. Para cada paper: botón "Importar" y botón "Descartar"
  4. "Importar" → Docling procesa el paper → Aether crea nota → RuVector indexa
  5. "Descartar" → se registra en `feedback.json` para no volver a sugerir el mismo paper
* **Regla crítica:** Nunca importar sin acción explícita del usuario (REQ-08)

---

### **M5. Pestaña Dedicada**

#### **M5.1 Índice de Documentos**

* Lista paginada de todos los documentos indexados en RuVector
* Columnas: nombre, tipo, fecha de ingesta, chunks, estado (indexado/pendiente/error)
* Acciones por documento: "Abrir en Aether", "Re-indexar", "Eliminar del índice"
* Filtros: por tipo, por fecha, por texto

#### **M5.2 Cola de Procesamiento con Barra de Estado**

* Muestra operaciones activas y pendientes en `queue.json`
* Columnas: operación, documento, progreso (%), estado, tiempo estimado
* Siempre visible en la parte inferior de la pestaña
* Indicador global en la app (icono de Cortex en la barra de navegación) que muestra actividad

#### **M5.3 Toggle Observer AI**

* Switch on/off prominente
* Estado OFF (default): ícono de micrófono tachado, texto "Observer AI desactivado"
* Estado ON: ícono de micrófono activo (animado), texto "Capturando audio de conferencias"
* Al activar: solicitar permisos de micrófono al OS si no se dieron antes
* Al desactivar mid-conferencia: procesar lo capturado hasta ese momento

#### **M5.4 Historial de Consultas**

* Lista cronológica de consultas al panel flotante
* Muestra: query, respuesta resumida, fuentes citadas, fecha/hora
* Permite re-ejecutar una consulta anterior

#### **M5.5 Exportación**

* **Firebase:** Serializar RuVector index → upload a Firebase Storage bajo `users/{uid}/cortex/backup_{timestamp}.zip`
* **GitHub:** Serializar RuVector index → commit en repositorio seleccionado por el usuario. Requiere token de GitHub (se guarda cifrado en electron-store).
* **Reglas:**
  * Solo manual, nunca automático (REQ-14)
  * Mostrar tamaño estimado antes de exportar
  * Confirmación explícita del usuario

---

### **M6. Observer AI**

#### **M6.1 Toggle On/Off**

* Estado persiste en `electron-store` entre sesiones
* Default: OFF en primera instalación
* El toggle es el único punto de control del micrófono

#### **M6.2 Captura de Audio**

* Al activar: Observer AI monitorea el audio del sistema (no solo el micrófono)
* Graba en chunks de 30s en formato WAV mono 16kHz (formato óptimo para Whisper)
* Los chunks se almacenan en `~/.carrera-lti/observer/recordings/`
* Indicador visual de grabación en la UI (punto rojo animado en el ícono de Cortex)

#### **M6.3 Detección de Conferencia**

* Observer AI está "en escucha pasiva" cuando el toggle está ON
* Inicia grabación cuando detecta: nivel de audio sostenido por > 30s
* Pausa automática si detecta silencio > 10 minutos (el usuario puede reanudar)
* No hay detección automática de apps de videoconferencia; el usuario controla el toggle

---

## **4. Máquinas de Estado**

### **4.1 Estado del Documento en el Índice**

```
AETHER_SAVED
     ↓
  QUEUED ──→ PROCESSING ──→ INDEXED
                  ↓
               FAILED (notifica usuario, opción de re-intentar)
```

### **4.2 Estado de Observer AI**

```
OFF
 ↓ (usuario activa toggle)
REQUESTING_PERMISSION
 ↓ (OS concede permiso)
LISTENING (activo, sin audio detectado)
 ↓ (audio detectado > 30s)
RECORDING
 ↓ (silencio > 10 min)
PAUSED (usuario puede reanudar)
 ↓ (usuario desactiva toggle o cierra app)
TRANSCRIBING
 ↓
OFF
```

### **4.3 Timeouts y Caducidad**

| Operación | Timeout | Comportamiento al expirar |
|---|---|---|
| Subproceso sin respuesta a heartbeat | 10s | Marcar como CRASHED, iniciar reinicio |
| Indexado de documento | 30s | Estado FAILED en cola, notificar usuario |
| Consulta a RuVector | 5s | Mostrar "Búsqueda tardando más de lo esperado..." |
| Respuesta del LLM | 30s | Mostrar "Sin conexión o servicio lento" |
| Archivo WAV sin procesar | 24h | Eliminar automáticamente |
| Chunks de feedback | 90 días | Eliminar automáticamente |

---

## **5. Contratos de Datos**

### **5.1 Evento: aether:document_saved**
```typescript
interface AetherDocumentEvent {
  aether_id: string;      // UUID del documento en Aether
  path: string;           // Ruta absoluta del archivo
  type: "pdf" | "docx" | "md" | "txt";
  title: string;
  updated_at: string;     // ISO8601
}
```

### **5.2 Respuesta de Query RuVector**
```typescript
interface RuVectorSearchResult {
  id: string;             // aether_id del documento fuente
  chunk: string;          // Fragmento relevante (máx. 300 chars)
  score: number;          // 0.0 - 1.0
  metadata: {
    type: string;
    title: string;
    date: string;
  }
}
```

### **5.3 Configuración de Cortex (electron-store)**
```typescript
interface CortexConfig {
  observer_enabled: boolean;
  whisper_model: "base" | "small" | "medium";
  llm_api_key: string;    // Cifrada con AES-256
  github_token?: string;  // Cifrada con AES-256
  firebase_enabled: boolean;
  max_queue_size: number; // Default: 50
  feedback_retention_days: number; // Default: 90
}
```

---

## **6. Gestión de Edge Cases y Resiliencia**

* **Fallo de Docling mid-OCR:** Si Docling falla durante el procesamiento, el item queda en estado `FAILED` en la cola. El usuario puede re-intentar. El archivo original no se modifica.
* **RuVector index corrupto:** Si RuVector no puede leer el index al iniciar, mostrar error "Índice corrupto" con opción de "Reconstruir desde Aether" (re-indexar todos los documentos existentes).
* **Disco lleno:** Verificar espacio disponible antes de encolar operaciones. Si < 500MB → advertir al usuario y suspender indexado.
* **Subproceso Python sin entorno:** Si Docling no puede iniciarse por falta de dependencias → mostrar mensaje de error con enlace a instrucciones de reinstalación.
* **Consulta sin conexión:** Si el usuario consulta el panel flotante sin internet → mensaje claro "Necesitás conexión para consultar. Tu índice está disponible y se actualizará cuando conectes."

---

## **7. Requisitos No Funcionales (Especificación Técnica)**

* **Latencia de indexado:** < 10s para PDF estándar (20 páginas)
* **Latencia de query:** < 2s para resultados de RuVector (sin contar respuesta del LLM)
* **Latencia de respuesta LLM:** Mostrar streaming token a token. Primeros tokens < 1s.
* **Memoria de subprocesos:** RuVector: máx. 512MB RAM. Docling: máx. 1GB RAM durante procesamiento.
* **Arranque de Cortex:** Subprocesos listos en < 5s desde el inicio de la app.
* **Logs:** Cada operación registra `operation_id`, timestamps de inicio/fin, duración y resultado en logs locales (`~/.carrera-lti/cortex/logs/`).

---

## **8. Internacionalización**

* La UI de Cortex se presenta en castellano (idioma de Carrera LTI)
* Whisper transcribe en castellano por defecto (`language: "es"`)
* AutoResearchClaw busca papers en inglés y español (idioma académico predominante)
* Las notas generadas automáticamente (transcripciones, OCR) se crean en castellano con títulos descriptivos

---

## **9. Criterios de Validación (Gating Funcional)**

* [ ] Al subir un PDF a Aether, aparece en el índice de Cortex en < 10s
* [ ] Al editar una nota en Aether, el índice se actualiza automáticamente
* [ ] Al eliminar un documento del índice, el documento persiste en Aether sin cambios
* [ ] La transcripción de 30 minutos de audio genera una nota en Aether con texto legible
* [ ] El OCR de una foto de pizarrón genera texto con > 70% de precisión
* [ ] El panel flotante no devuelve información que no esté en el índice del usuario
* [ ] Cada respuesta del panel flotante incluye al menos una cita de fuente
* [ ] Al crashear RuVector, Carrera LTI no se cierra y se inicia el proceso de reinicio
* [ ] Con 3+ reinicios consecutivos de un subproceso, el usuario recibe notificación clara
* [ ] Sin conexión a internet, el panel flotante muestra el estado correcto en < 1s

---

## **10. Apéndices y Referencias**

### **Glosario de Dominio**
| Término | Definición |
|---|---|
| **Chunk** | Fragmento de texto de un documento, unidad mínima de indexado en RuVector |
| **Grounding** | Restricción de respuestas del LLM al contenido del índice del usuario únicamente |
| **Surfeo contextual** | Aparición proactiva de conocimiento relevante sin que el usuario lo solicite explícitamente |
| **Score de relevancia** | Valor 0.0-1.0 que RuVector asigna a cada chunk según su similitud semántica con la query |
| **Anti-bucle** | Mecanismo que limita los reinicios automáticos de subprocesos para evitar loops infinitos |

### **Versiones de Dependencias Clave**
| Dependencia | Versión mínima | Notas |
|---|---|---|
| Electron | 33.x | Soporte multiplataforma estable |
| Whisper | base / small | Elegir según hardware del usuario |
| Docling | 2.x | Requiere Python 3.10+ |
| RuVector | 2.x | Binario Rust, sin dependencias externas |
| Google ADK | latest | Para orquestación de agentes |

### **Historial de Cambios**
| Fecha | Cambio | Autor |
|---|---|---|
| 2026-03-22 | Versión inicial | Juan |
