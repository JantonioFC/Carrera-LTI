# **PRD: Cortex — Sistema de Memoria de Conocimiento para Carrera LTI**

**Estado:** Borrador

**Dueño del Producto:** Juan

**Líder Técnico:** Por definir

**Fecha de última actualización:** 2026-03-22

**App ID / Identificador de Proyecto:** `carrera-lti/cortex`

---

## **1. Resumen Ejecutivo**

* **Visión del Producto:** Cortex es una capa de memoria semántica integrada nativamente en Carrera LTI que captura, indexa y surfea conocimiento académico de forma automática, sin fricción y con privacidad total. El estudiante nunca vuelve a perder información que ya procesó.

* **Propuesta de Valor:** La única solución que combina captura automática (transcripción de conferencias, OCR, documentos), procesamiento 100% local, privacidad garantizada y surfeo contextual de conocimiento dentro de un entorno académico integrado. Esta intersección no existe en el mercado hoy.

* **Público Objetivo:**
  * **Primario:** Estudiantes universitarios de carreras IT (Ingeniería en Sistemas, Informática, Ciencias de la Computación), 18-25 años, con alta conciencia de privacidad y múltiples fuentes de información dispersas.
  * **Secundario:** Usuarios actuales de Carrera LTI que ya gestionan notas, tareas y horarios en la plataforma.

* **Contexto de Mercado:** Las herramientas actuales (Notion, Obsidian, Mem.ai, Otter.ai) resuelven partes del problema pero no la totalidad. Notion y Mem.ai son cloud sin E2E encryption. Obsidian es local pero requiere configuración extensa y no captura automáticamente. Otter.ai transcribe pero no integra con el sistema de notas ni con el flujo académico. El 58% de los usuarios no sabe que sus notas no están cifradas en herramientas cloud.

---

## **2. Definición y Análisis del Problema**

* **Estado Actual:** Los estudiantes IT gestionan su conocimiento de forma fragmentada: fotos de pizarrones en el celular, grabaciones de clases que nunca escuchan, PDFs en Google Drive, apuntes en Notion o papel, y bookmarks olvidados. No existe una capa que unifique, indexe y conecte todo ese conocimiento de forma automática y privada.

* **Impacto de No Resolverlo:**
  * Tiempo perdido re-aprendiendo conceptos ya estudiados
  * Incapacidad de conectar conocimiento entre materias relacionadas
  * Pérdida de valor del esfuerzo invertido en clases y lecturas
  * Dependencia de herramientas cloud con riesgos de privacidad

* **Evidencia:**
  * *"Sé que estudié esto el semestre pasado pero no encuentro dónde lo anoté."* — Patrón de frustración universal en estudiantes IT
  * 58.2% de personas desconoce que sus apps de notas no cifran por defecto
  * Estudiantes combinan promedio 2-3 herramientas sin integración entre ellas
  * NotebookLM (Google) es la herramienta de IA más confiada por estudiantes precisamente porque *no alucina fuera de las fuentes del usuario*

* **Análisis de Causas Raíz:**
  * Las herramientas de captura (Otter.ai, Fireflies) no integran con sistemas de notas
  * Las herramientas de notas (Obsidian, Notion) no capturan automáticamente
  * Las herramientas con IA son cloud; las privadas no tienen IA
  * Ninguna herramienta está diseñada para el flujo académico específico de IT

---

## **3. Objetivos Estratégicos y KPIs**

| Objetivo | Métrica de Éxito (KPI) | Línea Base (Hoy) | Meta |
| :---- | :---- | :---- | :---- |
| **Reducir conocimiento perdido** | % de clases con transcripción indexada | 0% | >80% de conferencias asistidas |
| **Adopción de captura** | Documentos indexados por semana | 0 | >5 por semana activa |
| **Calidad de retrieval** | Tasa de resultados marcados como irrelevantes | N/A | <20% |
| **Retención de usuarios** | Usuarios activos a los 30 días de instalación | N/A | >60% |
| **Performance de indexado** | Tiempo de indexado por PDF estándar | N/A | <10 segundos |

* **Estrategia de Seguimiento:** Telemetría local (sin envío a servidores externos). Métricas almacenadas en RuVector y visualizadas en la pestaña dedicada de Cortex.

---

## **4. User Personas**

### **Perfil Principal: Matías — El Estudiante IT Organizado**
* **Contexto:** Estudiante de Ingeniería en Sistemas, 3er año. Cursa materias con alta correlación entre sí (Redes, Sistemas Operativos, Arquitectura). Asiste a clases virtuales y presenciales.
* **Necesidad:** No perder el conocimiento que ya adquirió. Conectar conceptos entre materias. Llegar preparado a exámenes y proyectos sin re-leer todo desde cero.
* **Competencia Técnica:** Alta. Acepta configuración inicial si es guiada. Tolerancia cero a herramientas que fallan silenciosamente.
* **Frustración principal:** Sus apuntes están en 5 lugares distintos y las grabaciones de clase nunca las escucha completas.
* **Cita representativa:** *"Sé que estudié esto el semestre pasado pero no encuentro dónde lo anoté."*

### **Anti-Persona: El Estudiante Minimalista**
* Vive en Google Docs + WhatsApp. No tiene intención de cambiar su flujo. **No es el target de Cortex.**

---

## **5. Requisitos Funcionales (Alcance Detallado)**

### **P0: Críticos — Imprescindibles para el Lanzamiento**

* **RF.01 (REQ-01):** Cortex opera exclusivamente mientras Carrera LTI está abierta. Al cerrar la app, toda captura y procesamiento se detiene. Sin actividad en background fuera del contexto de la app.
* **RF.02 (REQ-02):** Migración de Carrera LTI a Electron como runtime para acceso a APIs de sistema operativo.
* **RF.03 (REQ-03):** Observer AI captura audio únicamente durante conferencias de video. El micrófono no se activa en ningún otro contexto. Toggle on/off explícito controlado por el usuario.
* **RF.04 (REQ-04):** Pipeline de transcripción: audio de conferencia → Whisper local → transcripción → Aether (nota editable) → RuVector (indexado semántico).
* **RF.05 (REQ-05):** Sin captura redundante. Los documentos y notas ya ingresados por Aether se indexan automáticamente. Aether es la fuente única de verdad para el contenido.
* **RF.06 (REQ-06):** Cortex siempre activo mientras Carrera LTI está abierta. Observer AI tiene toggle on/off independiente. Ambos estados persisten entre sesiones.
* **RF.07 (REQ-07):** Dos puntos de acceso a Cortex en la UI:
  * **Panel flotante:** Consultas rápidas disponibles desde cualquier módulo sin perder el foco de trabajo.
  * **Pestaña dedicada:** Historial completo, documentos indexados, cola de procesamiento, toggle de Observer AI, exportación.
* **RF.08 (REQ-10):** Compatibilidad total en Windows, macOS y Linux. Sin degradación de funcionalidad entre plataformas.
* **RF.09 (REQ-11):** Modo offline completo. Whisper, Docling y RuVector operan sin conexión. AutoResearchClaw y consultas al LLM requieren conexión y se indica claramente en la UI.
* **RF.10 (REQ-12):** Indicador de actividad visible en todo momento. El usuario sabe exactamente qué está haciendo Cortex: indexando, transcribiendo, procesando OCR, buscando papers.
* **RF.11 (REQ-21):** Setup con mínima fricción. Whisper, Docling y RuVector se instalan y configuran automáticamente. La configuración guiada se concentra únicamente en: API key del LLM, Firebase y GitHub (opcional). Los permisos de micrófono del OS se solicitan mediante diálogos nativos en el primer uso de Observer AI.
* **RF.12 (REQ-22):** Cortex responde únicamente basándose en contenido indexado del usuario. Sin mezcla con conocimiento general del LLM. Cada respuesta cita la fuente específica (documento, transcripción o nota).

### **P1: Importantes — Añaden Valor Significativo**

* **RF.13 (REQ-08):** AutoResearchClaw busca automáticamente papers académicos relacionados al tema activo en Aether. Cada resultado encontrado requiere aprobación individual del usuario antes de importarse a Aether y RuVector.
* **RF.14 (REQ-09):** OCR vía Docling para imágenes subidas por el usuario: fotos de apuntes manuscritos, capturas de diapositivas y fotografías de pizarrón. El texto extraído se deriva a Aether como nota editable y se indexa en RuVector.
* **RF.15 (REQ-13):** Al abrir una tarea en Nexus (Kanban), el panel flotante de Cortex surfea automáticamente conocimiento relevante de RuVector para esa tarea.
* **RF.16 (REQ-16):** Docling y RuVector se reinician automáticamente si crashean. Protección anti-bucle: máximo 3 reintentos consecutivos. Al superar el límite, notificación al usuario con opción de reinicio manual.
* **RF.17 (REQ-17):** Al editar un documento en Aether, RuVector re-indexa el contenido actualizado automáticamente. Sin acción manual del usuario.
* **RF.18 (REQ-18):** El usuario puede eliminar cualquier documento del índice de RuVector desde la pestaña dedicada de Cortex sin afectar el documento original en Aether.
* **RF.19 (REQ-19):** Cola de procesamiento visible como barra de estado en la pestaña dedicada. Muestra progreso, orden y estado de cada ítem (documentos, transcripciones, imágenes OCR).
* **RF.20 (REQ-20):** El usuario puede marcar resultados del panel flotante como irrelevantes. El feedback se registra en RuVector como señal negativa para mejorar futuros resultados.

### **P2: Deseables — Fase Futura**

* **RF.21 (REQ-14):** Exportación manual del índice de RuVector a Firebase (ya integrado en Carrera LTI) o GitHub. La exportación es siempre manual y explícita, nunca automática.
* **RF.22:** Fine-tuning de modelo local sobre el historial académico acumulado en RuVector (requiere GPU — Fase 2).

### **Fuera de Alcance**

* Captura de pantalla o video de actividad del usuario
* Colaboración en tiempo real entre usuarios
* App móvil (Electron es desktop-first)
* Modo multi-usuario o multi-perfil
* Integración con plataformas externas de videollamada (Zoom, Meet) — Observer AI captura el audio del sistema localmente

---

## **6. Requisitos No Funcionales**

* **Privacidad:** Todo el procesamiento de datos del usuario (transcripción, OCR, indexado) ocurre localmente. Ningún dato del usuario sale de la máquina excepto en operaciones explícitas con consentimiento (AutoResearchClaw, consultas LLM, exportación a Firebase/GitHub).
* **Seguridad:** Las API keys (LLM, Firebase, GitHub) se almacenan cifradas localmente. No se persisten en texto plano. Consistente con la arquitectura de seguridad existente en Carrera LTI (AES para keys sensibles).
* **Resiliencia (REQ-16):** Subprocesos externos (Docling, RuVector) con reinicio automático y protección anti-bucle (máx. 3 intentos consecutivos).
* **Rendimiento:** Indexado de un PDF estándar (20 páginas) en menos de 10 segundos. Resultados en el panel flotante en menos de 2 segundos.
* **Mantenibilidad:** Arquitectura de subprocesos con IPC definido. Separación clara entre capas: captura, procesamiento, almacenamiento y presentación.
* **Compatibilidad:** Windows, macOS, Linux sin degradación funcional (REQ-10).
* **Offline-first:** La funcionalidad central opera sin conexión. Las funciones que requieren red están claramente marcadas en la UI (REQ-11).

---

## **7. Experiencia de Usuario (UX) e Interacción**

* **Principios de Diseño:**
  * *Invisibilidad activa:* Cortex trabaja en segundo plano sin interrumpir. Solo aparece cuando el usuario lo necesita o cuando tiene algo relevante que mostrar.
  * *Transparencia total:* El usuario siempre sabe qué está indexado, qué se está procesando y de dónde vienen las respuestas (REQ-22).
  * *Control explícito:* Nada se importa, elimina o comparte sin aprobación del usuario.
  * *Consistencia visual:* El panel flotante y la pestaña dedicada respetan el design system de Carrera LTI.

* **Arquitectura de Información:**
  ```
  Carrera LTI
  ├── Aether (notas)      → input de documentos, destino de transcripciones y OCR
  ├── Nexus (kanban)      → trigger de surfeo contextual
  ├── Horarios            → contexto temporal para Cortex
  └── Cortex [pestaña]
      ├── Índice          → documentos indexados, estado, eliminación
      ├── Cola            → barra de procesamiento activo
      ├── Historial       → consultas anteriores con fuentes citadas
      ├── Observer AI     → toggle on/off, estado del micrófono
      └── Exportación     → Firebase / GitHub (manual)

  [Panel flotante — disponible desde cualquier módulo]
  └── Búsqueda semántica + resultados con fuente citada
  ```

* **User Journey Crítico — Conferencia de clase:**
  1. Usuario activa Observer AI desde el toggle
  2. Inicia la videoconferencia en su app habitual
  3. Cortex captura el audio del sistema (indicador visible)
  4. Al finalizar, Whisper transcribe localmente
  5. La transcripción aparece en Aether como nota nueva, editable
  6. RuVector indexa la nota automáticamente
  7. Observer AI se puede desactivar manualmente o queda listo para la próxima conferencia

* **User Journey Crítico — Consulta en Nexus:**
  1. Usuario abre una tarea en el Kanban de Nexus
  2. El panel flotante de Cortex aparece automáticamente
  3. Muestra los 3-5 fragmentos más relevantes de RuVector con fuente citada
  4. El usuario puede descartarlos o profundizar en alguno

---

## **8. Stack Tecnológico**

| Capa | Tecnología | Rol |
|---|---|---|
| Runtime | Electron | Host de la app desktop multiplataforma |
| Frontend | React + TypeScript | UI de Carrera LTI + interfaces de Cortex |
| Linting | Biome | Calidad de código |
| Testing | Vitest | Tests unitarios e integración |
| Auth / Storage cloud | Firebase | Autenticación y exportación opcional |
| Memoria semántica | RuVector (Rust) | Vector DB auto-aprendiente |
| Captura de audio | Observer AI | Captura de conferencias (on/off) |
| Transcripción | Whisper (local) | STT offline, multiplataforma |
| Procesamiento de docs | Docling (Python) | PDF, DOCX, OCR de imágenes |
| Búsqueda académica | AutoResearchClaw | Papers bajo aprobación del usuario |
| Orquestación de agentes | Google ADK | Backbone del sistema multi-agente |
| Prompt patterns | Fabric | Síntesis y formateo de respuestas |
| Personalidades de agentes | agency-agents | Especialistas por dominio |

---

## **9. Riesgos, Supuestos y Mitigaciones**

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Migración a Electron rompe funcionalidades web actuales | Alta | Alto | Plan de migración incremental; mantener compatibilidad web durante transición |
| Whisper con acento rioplatense / terminología técnica IT | Media | Medio | Fine-tuning futuro (REQ-22); edición manual accesible en Aether |
| Subprocesos Python/Rust inestables en algún OS | Media | Alto | REQ-16: reinicio automático + anti-bucle; tests multiplataforma en CI |
| Adopción baja por complejidad percibida | Alta | Alto | REQ-21: onboarding de un solo instalador; configuración mínima para arrancar |
| Latencia de RuVector con índices grandes (años de uso) | Baja | Medio | Benchmarking progresivo; paginación de resultados |
| IPC entre Electron y subprocesos externos frágil | Media | Alto | Protocolo IPC definido y documentado; timeouts explícitos |

**Supuestos:**
* Carrera LTI tiene base de usuarios activos que ya usan Aether y Nexus
* El usuario tiene hardware mínimo para correr Whisper en CPU (sin GPU requerida)
* AutoResearchClaw tiene acceso a Semantic Scholar / arXiv sin autenticación

---

## **10. Criterios de Gating para el Lanzamiento**

1. **Privacidad:** Verificación de que ningún dato del usuario sale de la máquina sin acción explícita. Revisión de código de todos los subprocesos.
2. **Multiplataforma:** Suite de tests corriendo en Windows, macOS y Linux en CI.
3. **Onboarding:** Tiempo desde instalación hasta primer documento indexado < 5 minutos en usuario sin conocimiento previo.
4. **Resiliencia:** Crash de Docling o RuVector no crashea Carrera LTI. Verificado en tests.
5. **Grounding (REQ-22):** Ninguna respuesta del panel flotante incluye información no presente en el índice del usuario. Verificado con suite de tests de regresión semántica.
6. **Documentación:** FSD, ADR de decisiones arquitectónicas clave y guía de instalación completados.

---

## **11. Próximos Pasos**

1. Generar FSD (Especificación Funcional Detallada) por módulo: Observer AI, Pipeline de indexado, Panel flotante, Pestaña dedicada
2. Registrar decisiones arquitectónicas clave en ADRs (IPC protocol, modelo Whisper a usar, estrategia de subprocesos)
3. Definir historias de usuario para el sprint inicial (P0)
4. Diseño de wireframes del panel flotante y pestaña dedicada
5. Plan de migración de Carrera LTI a Electron
