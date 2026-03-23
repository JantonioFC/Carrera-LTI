# **ADRs — Cortex (Carrera LTI)**
# Registro de Decisiones Arquitectónicas

---

## **ADR-001: Migración de Carrera LTI a Electron**

**Fecha de Registro:** 2026-03-22
**Estado Actual:** Aprobado
**Autores:** Juan
**RFC de Referencia:** RFC-001 - Arquitectura Cortex (Carrera LTI).md
**Nivel de Impacto:** Global (Arquitectura del Sistema)
**Módulos Afectados:** Toda la aplicación Carrera LTI

### **1. Contexto y Definición del Problema**

Carrera LTI es una SPA web (React + Vite + Firebase). La integración de Cortex requiere:
- Captura de audio del sistema (no solo micrófono — el browser no lo permite)
- Ejecución de procesos nativos (Whisper, Docling, RuVector como binarios/scripts)
- Almacenamiento local ilimitado para el vector DB
- Control fino de permisos de OS (micrófono, sistema de archivos)

Ninguno de estos requisitos es alcanzable desde una SPA web sin comprometer la privacidad o requiriendo un servidor local externo.

**Restricciones:**
- El stack de frontend (React + TypeScript + Firebase) debe mantenerse para preservar la inversión existente
- Sin servidor externo (privacidad local como principio irrenunciable)
- Compatibilidad con Windows, macOS y Linux

**Supuestos:**
- El usuario instala la app en una máquina desktop (no tablet ni móvil)
- El hardware mínimo es un equipo de gama media con 8GB RAM

### **2. Decisión Arquitectónica y Justificación**

**Sentencia:** Carrera LTI migra a Electron manteniendo React/TypeScript como stack de Renderer Process y Node.js como Main Process.

**Alcance:** Esta decisión aplica a toda la distribución de Carrera LTI. La versión web puede mantenerse como alternativa sin Cortex, pero Cortex es exclusivo de la versión Electron.

**Justificación crítica:** Electron es el único runtime que permite combinar el stack web existente (React) con acceso completo a APIs nativas del OS en las tres plataformas objetivo, sin reescribir la UI.

**Arquitectura meta:** Electron como contenedor permanente. Cualquier funcionalidad que requiera APIs nativas en el futuro podrá implementarse en el Main Process sin cambios de stack.

### **3. Alternativas Consideradas**

* **Tauri (Rust):** Pros: bundle más liviano (~10MB), mejor performance nativa. Contras: requiere migrar el frontend a Tauri APIs, rompe la inversión en React. **Rechazado** por costo de migración.
* **Servidor local + navegador:** Pros: sin migración del frontend. Contras: experiencia fragmentada, instalación compleja, sin acceso a APIs nativas. **Rechazado** por UX deficiente.
* **Arquitectura web + servicio cloud:** Pros: sin instalador. Contras: elimina la propuesta de valor de privacidad local. **Rechazado** por contradicción con REQ-11.

### **4. Consecuencias y Trade-offs**

**Positivos:**
- Acceso completo a APIs de OS (audio, filesystem, procesos)
- Stack React preservado — cero reescritura de UI
- Distribución como instalador nativo (.exe, .dmg, .AppImage)
- Actualizaciones automáticas vía electron-updater

**Negativos:**
- Bundle de instalación ~150-200MB (vs ~5MB de una PWA)
- Tiempo de arranque mayor que una web app
- Requiere pipeline de builds para 3 plataformas en CI

**Deuda consentida:** Se acepta el overhead de Electron a cambio de las capacidades nativas que Cortex requiere.

### **4.3 Acciones Derivadas**
- [ ] Configurar electron-builder con targets: win (nsis), mac (dmg), linux (AppImage)
- [ ] Configurar GitHub Actions con matrix strategy (ubuntu/windows/macos)
- [ ] Implementar contextBridge para comunicación segura Main↔Renderer
- [ ] Migrar variables de entorno de .env a electron-store cifrado

### **5. Validación y Observabilidad**

- **Métrica de éxito:** Tiempo de arranque < 3s en hardware de referencia
- **Tests:** Suite de integración corriendo en las 3 plataformas en CI antes de cada release
- **Política de revisión:** Revisar si Tauri alcanzó paridad de APIs en 12 meses

---

## **ADR-002: Protocolo IPC vía stdio JSON entre Electron y Subprocesos**

**Fecha de Registro:** 2026-03-22
**Estado Actual:** Aprobado
**Autores:** Juan
**RFC de Referencia:** RFC-001 - Arquitectura Cortex (Carrera LTI).md
**Nivel de Impacto:** Departamental (Módulo Cortex)
**Módulos Afectados:** CortexOrchestrator, Docling, RuVector, Whisper, Observer AI

### **1. Contexto y Definición del Problema**

CortexOrchestrator (Node.js/Main Process) necesita comunicarse con cuatro subprocesos escritos en Python (Docling), Rust (RuVector, Observer AI) y Go/C (Whisper). Se necesita un protocolo IPC que:
- Funcione en las 3 plataformas sin dependencias externas
- Soporte comunicación asíncrona (respuestas que llegan en cualquier orden)
- Sea simple de implementar en Python, Rust y Node.js
- No exponga puertos de red (privacidad, seguridad)

### **2. Decisión Arquitectónica y Justificación**

**Sentencia:** Se adopta stdio con mensajes JSON newline-delimited (NDJSON) como protocolo IPC entre el Main Process y todos los subprocesos de Cortex.

**Protocolo:**
```
Main → Subproceso (stdin): {"id":"uuid","action":"...","payload":{...}}\n
Subproceso → Main (stdout): {"id":"uuid","status":"ok|error|progress","data":{...}}\n
```

**Justificación crítica:** stdio está disponible en todos los lenguajes sin librerías adicionales, no requiere puertos de red, funciona en las 3 plataformas sin configuración, y NDJSON es trivial de parsear. Es el protocolo usado por Language Server Protocol (LSP), probado en producción a escala.

### **3. Alternativas Consideradas**

* **HTTP local (puerto aleatorio):** Pros: bien conocido, fácil debugging. Contras: expone superficie de red, requiere gestión de puertos, más lento para IPC local. **Rechazado** por riesgo de seguridad.
* **gRPC:** Pros: tipado fuerte, streaming nativo. Contras: requiere compilar protobuf en 3 lenguajes, complejidad alta para el beneficio. **Rechazado** por sobre-ingeniería para este caso.
* **Unix sockets / Named pipes:** Pros: más rápido que stdio. Contras: implementación diferente en Windows vs Unix, gestión de permisos de socket. **Rechazado** por complejidad multiplataforma.

### **4. Consecuencias y Trade-offs**

**Positivos:** Sin puertos de red, zero dependencias externas, trivial de implementar en todos los lenguajes, fácil de testear (mock con stdin/stdout)

**Negativos:** Debugging menos visual que HTTP (no se puede usar Postman), throughput máximo limitado por el buffer de stdio (aceptable para este caso de uso)

**Deuda consentida:** Si en el futuro se necesita comunicación bidireccional de alta frecuencia (ej. streaming de audio en tiempo real), evaluar migración a WebSockets locales.

### **4.3 Acciones Derivadas**
- [ ] Implementar `SubprocessManager` en Node.js con spawn, heartbeat y reinicio
- [ ] Definir schema de validación Zod para todos los mensajes IPC entrantes
- [ ] Implementar wrapper stdio en Docling (Python) y RuVector (Rust)

### **5. Validación**

- **Test:** Mock de subproceso que responde mensajes malformados → verificar que el Orchestrator no crashea
- **Test:** Timeout de 30s → verificar estado FAILED en cola y notificación al usuario

---

## **ADR-003: Whisper como Motor de Transcripción Local**

**Fecha de Registro:** 2026-03-22
**Estado Actual:** Aprobado
**Autores:** Juan
**Nivel de Impacto:** Local (Módulo Observer AI / Pipeline de Ingesta)
**Módulos Afectados:** M2.3 Transcripción de Conferencias

### **1. Contexto y Definición del Problema**

El sistema necesita transcribir audio de conferencias de forma local, sin enviar datos a servidores externos. El audio puede contener:
- Español rioplatense con terminología técnica de IT
- Múltiples hablantes
- Ruido de fondo (ambiente de estudio/trabajo)
- Jargon técnico (nombres de protocolos, comandos, siglas)

Requisitos: offline, multiplataforma, castellano, precisión aceptable sin GPU.

### **2. Decisión Arquitectónica y Justificación**

**Sentencia:** Se adopta OpenAI Whisper (modelo `small` por defecto, configurable a `base` o `medium`) ejecutado como subproceso local vía CLI.

**Justificación crítica:** Whisper es el STT local con mayor precisión para español sin GPU en 2026. El modelo `small` (244M parámetros) alcanza >90% de precisión en castellano en CPU, completa en tiempo razonable (<2x duración del audio), y es open-source bajo MIT.

**Configuración por defecto:** `whisper --model small --language es --output_format txt`

### **3. Alternativas Consideradas**

* **Otter.ai / Deepgram:** Pros: mayor precisión, speaker diarization. Contras: cloud, datos enviados a terceros, costo mensual, rompe REQ-11. **Rechazado** por privacidad.
* **Whisper modelo `base`:** Pros: más rápido, menor RAM. Contras: menor precisión con terminología IT en castellano. **Disponible como opción de configuración** para hardware limitado.
* **Whisper modelo `medium`:** Pros: mayor precisión. Contras: 769M parámetros, lento en CPU sin GPU. **Disponible como opción de configuración** para hardware con GPU.
* **Coqui TTS / Vosk:** Pros: más livianos. Contras: precisión significativamente menor en español técnico. **Rechazados** por calidad insuficiente.

### **4. Consecuencias y Trade-offs**

**Positivos:** 100% offline, código abierto, sin costo de API, precisión >90% en castellano

**Negativos:** Tiempo de transcripción ~0.5-1x duración del audio en CPU; modelo `small` requiere ~500MB de RAM y ~500MB de disco

**Deuda consentida:** Speaker diarization (identificar quién habla) no está implementado en esta fase. El texto transcrito no distingue hablantes.

### **4.3 Acciones Derivadas**
- [ ] Empaquetar binario de Whisper en el instalador de Electron (no requerir Python del sistema)
- [ ] Implementar descarga del modelo al primer uso (no incluir en el instalador)
- [ ] Exponer opción de modelo en la pestaña de configuración de Cortex

---

## **ADR-004: RuVector como Base de Datos Vectorial**

**Fecha de Registro:** 2026-03-22
**Estado Actual:** Aprobado
**Autores:** Juan
**Nivel de Impacto:** Global (Módulo Cortex — Motor de Memoria)
**Módulos Afectados:** M3 Motor de Memoria, M4.1 Panel Flotante

### **1. Contexto y Definición del Problema**

Se necesita una base de datos vectorial que:
- Corra completamente local (sin servidor externo)
- Funcione en Windows/macOS/Linux
- Soporte búsqueda semántica con scores de relevancia
- Se auto-aprenda de los patrones de uso del usuario
- Persista el índice entre sesiones
- No requiera GPU

### **2. Decisión Arquitectónica y Justificación**

**Sentencia:** Se adopta RuVector (Rust) como base de datos vectorial embebida de Cortex.

**Justificación crítica:** RuVector es la única solución que combina: ejecución local sin GPU, auto-aprendizaje (motor SONA), compatibilidad con pgvector para queries SQL familiares, soporte multiplataforma nativo en Rust, y un modelo de datos que encaja con el caso de uso de Cortex (búsqueda semántica + feedback loop).

### **3. Alternativas Consideradas**

* **ChromaDB:** Pros: popular, buena documentación. Contras: requiere Python, sin auto-aprendizaje, más lento en búsquedas grandes. **Rechazado** por dependencia Python (ya usamos Python para Docling, pero agregar una segunda dependencia Python pesada es riesgo operativo).
* **Qdrant (local):** Pros: excelente rendimiento, API REST limpia. Contras: binario Rust sin auto-aprendizaje, requiere servidor separado. **Rechazado** por overhead de servidor local.
* **sqlite-vec:** Pros: trivial de embeber, sin dependencias. Contras: sin auto-aprendizaje, búsqueda vectorial básica. **Descartado** como opción de fallback si RuVector falla.
* **Pinecone / Weaviate cloud:** Pros: excelente calidad. Contras: cloud, datos enviados a terceros. **Rechazado** por privacidad (REQ-11).

### **4. Consecuencias y Trade-offs**

**Positivos:** Auto-aprendizaje de patrones del usuario (RuVector SONA), 100% local, compilado en Rust (sin dependencias), O(log n) en búsquedas

**Negativos:** Proyecto relativamente nuevo (2025), menor comunidad que ChromaDB o Qdrant, riesgo de cambios de API

**Plan de contingencia:** Si RuVector muestra inestabilidad en producción, migrar a `sqlite-vec` como fallback (pierde auto-aprendizaje pero mantiene búsqueda semántica básica).

### **4.3 Acciones Derivadas**
- [ ] Implementar wrapper IPC stdio para RuVector (si no tiene modo stdio nativo)
- [ ] Definir schema del índice: campos, metadata, retención
- [ ] Implementar tests de carga con 10k+ documentos para validar performance

---

## **ADR-005: Google ADK como Backbone de Orquestación de Agentes**

**Fecha de Registro:** 2026-03-22
**Estado Actual:** Aprobado
**Autores:** Juan
**Nivel de Impacto:** Departamental (Módulo Cortex — Orquestación)
**Módulos Afectados:** M4.1 Panel Flotante, M4.4 AutoResearchClaw

### **1. Contexto y Definición del Problema**

Cortex necesita coordinar múltiples agentes especializados (Fabric para síntesis, agency-agents para especialidades, AutoResearchClaw para investigación). Se necesita un framework que:
- Soporte multi-agente con patrones de orquestación probados
- Funcione con múltiples LLMs (no solo Gemini)
- Tenga soporte para herramientas y MCP
- Pueda correr en Node.js o Python

### **2. Decisión Arquitectónica y Justificación**

**Sentencia:** Se adopta Google ADK (Python SDK) como backbone de orquestación de agentes en Cortex.

**Justificación crítica:** Google ADK provee orquestación secuencial, paralela y en bucle out-of-the-box, soporte para herramientas custom y MCP, y el patrón de agente jerárquico que Cortex necesita (coordinador → especialistas). Si bien está optimizado para Gemini, soporta otros LLMs vía configuración.

**Nota de compatibilidad:** ADK corre como subproceso Python adicional. Se integra con el CortexOrchestrator vía el mismo protocolo IPC stdio (ADR-002).

### **3. Alternativas Consideradas**

* **LangChain:** Pros: ecosistema grande, maduro. Contras: abstracción excesiva, verboso, conocido por inestabilidad de API entre versiones. **Rechazado** por mantenibilidad.
* **LlamaIndex:** Pros: excelente para RAG. Contras: orientado a Q&A sobre documentos, menos flexible para agentes generales. **Rechazado** por foco demasiado estrecho.
* **Implementación custom:** Pros: control total. Contras: reinventar la rueda para patrones de orquestación ya resueltos. **Rechazado** por costo de desarrollo.
* **CrewAI:** Pros: interfaz simple para multi-agente. Contras: menor soporte para herramientas MCP, menos mantenido. **Rechazado** por ecosistema más limitado.

### **4. Consecuencias y Trade-offs**

**Positivos:** Patrones de orquestación probados, soporte MCP nativo (útil para futuras integraciones), integración con agency-agents y AutoResearchClaw

**Negativos:** Dependencia adicional de Python, optimizado para Gemini (requiere configuración extra para otros LLMs), añade un subproceso más al Orchestrator

### **4.3 Acciones Derivadas**
- [ ] Incluir google-adk en el entorno Python de Docling (un solo venv)
- [ ] Implementar adaptadores para LLMs alternativos (Claude, GPT-4)
- [ ] Definir los agentes especializados de Cortex usando agency-agents como base

---

## **ADR-006: Grounding Estricto de Respuestas — Solo Contenido Indexado**

**Fecha de Registro:** 2026-03-22
**Estado Actual:** Aprobado
**Autores:** Juan
**RFC de Referencia:** PRD - Cortex (Carrera LTI).md (REQ-22)
**Nivel de Impacto:** Global (Toda la interfaz de Cortex con el usuario)
**Módulos Afectados:** M4.1 Panel Flotante

### **1. Contexto y Definición del Problema**

Los LLMs tienden a combinar conocimiento del índice del usuario con conocimiento propio del preentrenamiento, generando respuestas que "parecen" venir del material del usuario pero incluyen información externa no verificable. En un contexto académico, esto es especialmente problemático: el estudiante puede creer que algo está en sus apuntes cuando en realidad el LLM lo inventó.

**Evidencia de mercado:** NotebookLM (Google) tiene el mayor ratio de recomendación en comunidades estudiantiles precisamente porque *"no alucina fuera de las fuentes"*. Los usuarios confían en IA que claramente delimita su base de conocimiento.

### **2. Decisión Arquitectónica y Justificación**

**Sentencia:** Todas las respuestas del panel flotante de Cortex se generan ÚNICAMENTE basándose en chunks devueltos por RuVector. El LLM recibe la instrucción explícita de no usar conocimiento externo. Cada respuesta cita la fuente específica.

**System prompt obligatorio para todas las queries:**
```
Eres el asistente de memoria de [usuario]. Responde ÚNICAMENTE basándote en los
fragmentos de documentos proporcionados a continuación. Si la información no está
en los fragmentos, responde exactamente: "No encontré información sobre esto en
tu índice." No uses conocimiento externo bajo ninguna circunstancia. Cita siempre
el documento fuente de cada afirmación.

Fragmentos disponibles:
[chunks de RuVector]
```

**Justificación crítica:** La confianza del usuario en Cortex depende de que el sistema sea predecible. Un sistema que a veces usa el índice y a veces usa conocimiento del LLM es impredecible y potencialmente peligroso en contextos académicos (exámenes, trabajos).

### **3. Alternativas Consideradas**

* **RAG híbrido (índice + conocimiento LLM):** Pros: respuestas más completas aunque no estén en el índice. Contras: el usuario no puede saber qué vino del índice y qué del LLM, viola la propuesta de valor de "memoria personal". **Rechazado** por confiabilidad.
* **Sin grounding (LLM libre):** No aplica para este caso de uso. **Rechazado** directamente.

### **4. Consecuencias y Trade-offs**

**Positivos:** Confianza total del usuario en las fuentes, alineación con el modelo mental de "mi memoria personal", diferenciador clave vs. ChatGPT u otros LLMs genéricos

**Negativos:** Si el índice está vacío o el documento relevante no fue indexado, Cortex no puede ayudar (comportamiento esperado y honesto)

**Deuda consentida:** El sistema no puede responder preguntas generales de IT que no estén en el índice. Esto es intencional — para eso el usuario tiene acceso directo al LLM.

### **4.3 Acciones Derivadas**
- [ ] Implementar test de regresión semántica: queries conocidas que NO deben generar respuestas si el material no está indexado
- [ ] Agregar banner visible en el panel flotante: "Cortex responde solo con tu material indexado"
- [ ] Definir el umbral de score de RuVector por debajo del cual no se incluye un chunk en el contexto del LLM

### **5. Validación**

- **Test crítico:** Vaciar el índice → hacer una pregunta técnica conocida → verificar que Cortex responde "No encontré información en tu índice" en lugar de responder con conocimiento propio del LLM
- **Métrica:** Tasa de respuestas sin fuente citada debe ser 0%
