# **Historias de Usuario — Cortex (Carrera LTI)**

**Proyecto:** Cortex — Carrera LTI
**Referencia PRD:** PRD - Cortex (Carrera LTI).md
**Estado Actual:** Backlog

---

## **US-001: Toggle de Observer AI**

**ID:** US-001 | **Prioridad:** P0 | **Estimación:** 3 pts | **Módulo:** Observer AI, M6

**COMO** estudiante que usa Carrera LTI
**QUIERO** poder activar y desactivar Observer AI con un switch visible
**PARA** tener control total sobre cuándo el sistema captura audio, sin incertidumbre sobre si el micrófono está activo

**Criterios de Aceptación:**

*Escenario 1 — Activar Observer AI (primera vez):*
- DADO QUE es la primera vez que el usuario activa el toggle
- CUANDO hace clic en el switch de Observer AI en la pestaña de Cortex
- ENTONCES el OS muestra el diálogo nativo de permiso de micrófono
- Y si el usuario concede el permiso, el switch queda en ON con indicador animado
- Y aparece el mensaje "Observer AI activo — capturando audio de conferencias"

*Escenario 2 — Activar sin permiso concedido:*
- DADO QUE el usuario denegó el permiso de micrófono al OS
- CUANDO intenta activar el toggle
- ENTONCES el switch no se activa
- Y aparece el mensaje "Permiso de micrófono denegado. Habilitalo desde la configuración del sistema."

*Escenario 3 — Estado persiste entre sesiones:*
- DADO QUE Observer AI está en estado ON
- CUANDO el usuario cierra y vuelve a abrir Carrera LTI
- ENTONCES Observer AI arranca en estado ON (sin pedirle al usuario que lo reactive)

*Escenario 4 — Desactivar mid-conferencia:*
- DADO QUE Observer AI está en ON y hay audio capturado
- CUANDO el usuario desactiva el toggle
- ENTONCES se procesa el audio ya capturado (transcripción continúa)
- Y el indicador cambia a "Procesando audio capturado..."
- Y el micrófono se libera inmediatamente

**Dependencias:** Electron IPC para permisos nativos de OS
**DoD:** [ ] Linting pasado [ ] Tests unitarios del toggle state [ ] Probado en Win/Mac/Linux

---

## **US-002: Transcripción Automática de Conferencias**

**ID:** US-002 | **Prioridad:** P0 | **Estimación:** 8 pts | **Módulo:** M2.3, M6.2

**COMO** estudiante de IT que asiste a clases virtuales
**QUIERO** que el audio de mis conferencias se transcriba automáticamente y aparezca como nota en Aether
**PARA** no perder el contenido de las clases sin tener que grabar y transcribir manualmente

**Criterios de Aceptación:**

*Escenario 1 — Transcripción exitosa:*
- DADO QUE Observer AI está en ON y el usuario está en una videoconferencia
- CUANDO termina la conferencia y el usuario desactiva el toggle (o cierra la app)
- ENTONCES Whisper procesa el audio localmente
- Y se crea una nota en Aether con título "Conferencia — {fecha} {hora}"
- Y el cuerpo de la nota contiene la transcripción completa
- Y la nota tiene el tag `cortex-transcripcion`
- Y los archivos WAV temporales son eliminados

*Escenario 2 — Audio de baja calidad:*
- DADO QUE el audio tiene ruido significativo o varios hablantes superpuestos
- CUANDO Whisper completa la transcripción
- ENTONCES la nota se crea igualmente con el contenido transcrito
- Y se muestra una advertencia "Calidad de audio baja — revisá la transcripción"

*Escenario 3 — App cerrada mid-conferencia:*
- DADO QUE la app se cierra inesperadamente durante la captura
- CUANDO el usuario vuelve a abrir Carrera LTI
- ENTONCES los chunks de audio ya capturados se procesan automáticamente
- Y se crea la nota con el contenido parcial disponible

*Escenario 4 — Silencio prolongado:*
- DADO QUE Observer AI está en ON y no detecta audio por más de 10 minutos
- ENTONCES la captura se pausa automáticamente
- Y se muestra una notificación "Observer AI pausado por inactividad. ¿Reanudar?"

**Dependencias:** US-001 (toggle), Whisper subproceso activo, Aether API de creación de notas
**DoD:** [ ] Pipeline completo end-to-end testeado [ ] Archivos WAV eliminados verificados [ ] Nota aparece en Aether

---

## **US-003: Indexado Automático de Documentos de Aether**

**ID:** US-003 | **Prioridad:** P0 | **Estimación:** 5 pts | **Módulo:** M2.1, M3.1, M3.2

**COMO** estudiante que sube material de estudio a Aether
**QUIERO** que mis documentos se indexen en Cortex automáticamente al subirlos o editarlos
**PARA** que estén disponibles en búsquedas semánticas sin ninguna acción manual extra

**Criterios de Aceptación:**

*Escenario 1 — Documento subido:*
- DADO QUE el usuario sube un PDF a Aether
- CUANDO Aether confirma la carga (evento `aether:document_saved`)
- ENTONCES el documento aparece en la cola de Cortex con estado QUEUED
- Y en menos de 10s pasa a estado INDEXED para un PDF estándar (20 páginas)
- Y el contador de documentos indexados en la pestaña de Cortex se actualiza

*Escenario 2 — Documento editado:*
- DADO QUE el usuario edita una nota existente en Aether
- CUANDO guarda los cambios
- ENTONCES RuVector re-indexa el documento automáticamente
- Y los resultados de búsqueda reflejan el contenido actualizado en la próxima consulta

*Escenario 3 — Error de indexado:*
- DADO QUE Docling falla al parsear un archivo corrupto
- CUANDO el indexado falla
- ENTONCES el documento aparece con estado FAILED en la cola
- Y se muestra un mensaje "No se pudo indexar {nombre_archivo} — el archivo puede estar corrupto"
- Y el usuario puede hacer clic en "Re-intentar"

*Escenario 4 — Cola con múltiples documentos:*
- DADO QUE el usuario sube 10 PDFs simultáneamente
- ENTONCES se procesan en orden FIFO
- Y la barra de estado muestra "{n} documentos en cola"
- Y el progreso de cada documento se actualiza en tiempo real

**Dependencias:** Docling subproceso activo, RuVector subproceso activo, Aether eventos
**DoD:** [ ] Re-indexado automático verificado [ ] Test de 10 docs simultáneos < 2 min total

---

## **US-004: OCR de Imágenes (Apuntes, Slides, Pizarrón)**

**ID:** US-004 | **Prioridad:** P1 | **Estimación:** 5 pts | **Módulo:** M2.2

**COMO** estudiante que fotografía apuntes y pizarrones en clase
**QUIERO** subir las fotos a Cortex y obtener el texto extraído automáticamente
**PARA** que mis apuntes manuscritos sean buscables sin tener que transcribirlos a mano

**Criterios de Aceptación:**

*Escenario 1 — OCR exitoso:*
- DADO QUE el usuario sube una foto de un pizarrón a Cortex (desde la pestaña dedicada)
- CUANDO Docling procesa la imagen
- ENTONCES se crea una nota en Aether con el texto extraído
- Y la nota tiene el tag `cortex-ocr` y el título "OCR — {tipo} — {fecha}"
- Y se muestra al usuario un preview del texto antes de confirmar la creación de la nota

*Escenario 2 — OCR con baja confianza:*
- DADO QUE la imagen tiene texto ilegible o de baja resolución
- CUANDO Docling devuelve confianza < 60%
- ENTONCES se muestra la advertencia "Calidad baja — revisá el texto extraído antes de guardar"
- Y el usuario puede editar el texto en el preview antes de crear la nota
- O puede cancelar sin crear nada

*Escenario 3 — Imagen sin texto:*
- DADO QUE la imagen no contiene texto (foto de un diagrama o gráfico puro)
- CUANDO Docling no detecta texto
- ENTONCES se muestra "No se detectó texto en la imagen"
- Y no se crea ninguna nota en Aether

*Escenario 4 — Batch de imágenes:*
- DADO QUE el usuario selecciona 5 imágenes para procesar
- ENTONCES se encolan en orden
- Y cada una genera su propia nota en Aether al completarse

**Dependencias:** US-003 (indexado), Docling con capacidad OCR
**DoD:** [ ] Test con foto real de pizarrón > 70% precisión [ ] Preview editable funcional

---

## **US-005: Consulta en Lenguaje Natural (Panel Flotante)**

**ID:** US-005 | **Prioridad:** P0 | **Estimación:** 8 pts | **Módulo:** M4.1, M4.2

**COMO** estudiante estudiando para un examen
**QUIERO** preguntarle a Cortex sobre temas de mis materias en lenguaje natural
**PARA** obtener respuestas basadas en mi propio material de estudio, con citas de fuente

**Criterios de Aceptación:**

*Escenario 1 — Consulta exitosa con resultados:*
- DADO QUE el usuario tiene documentos indexados sobre "TCP/IP"
- CUANDO escribe "¿Qué es el three-way handshake?" en el panel flotante
- ENTONCES Cortex devuelve una respuesta basada en sus apuntes
- Y la respuesta incluye al menos una cita de fuente (nombre del documento + fragmento)
- Y el tiempo de respuesta total es < 5s (incluyendo LLM)

*Escenario 2 — Consulta sin resultados en el índice:*
- DADO QUE el usuario no tiene documentos indexados sobre "criptografía cuántica"
- CUANDO pregunta sobre ese tema
- ENTONCES Cortex responde exactamente: "No encontré información sobre esto en tu índice."
- Y ofrece la opción "¿Buscar papers académicos sobre este tema?" (activa AutoResearchClaw)
- Y NO inventa una respuesta con conocimiento externo

*Escenario 3 — Sin conexión a internet:*
- DADO QUE el dispositivo no tiene conexión
- CUANDO el usuario intenta usar el panel flotante
- ENTONCES aparece el mensaje "Necesitás conexión para consultar. Tu índice está actualizado y listo."
- Y el input queda deshabilitado

*Escenario 4 — Resultado marcado como irrelevante:*
- DADO QUE Cortex devolvió un resultado que el usuario considera irrelevante
- CUANDO el usuario hace clic en "No es relevante"
- ENTONCES se registra la señal negativa
- Y en futuras consultas similares ese resultado aparece con menor prioridad

**Dependencias:** US-003 (documentos indexados), API key de LLM configurada, RuVector activo
**DoD:** [ ] Test de grounding (índice vacío → sin respuesta) [ ] Cita de fuente siempre presente

---

## **US-006: Surfeo Contextual desde Nexus (Kanban)**

**ID:** US-006 | **Prioridad:** P1 | **Estimación:** 3 pts | **Módulo:** M4.3

**COMO** estudiante trabajando en una tarea de un proyecto
**QUIERO** que Cortex me muestre automáticamente conocimiento relevante al abrir una tarea en Nexus
**PARA** tener el contexto necesario a mano sin tener que buscar manualmente

**Criterios de Aceptación:**

*Escenario 1 — Tarea con material relacionado:*
- DADO QUE existe una tarea en Nexus "Implementar socket TCP en Python"
- CUANDO el usuario abre esa tarea
- ENTONCES el panel flotante se activa automáticamente
- Y muestra hasta 3 resultados relevantes de RuVector con su fuente
- Y el header del panel dice "Relacionado con esta tarea:"

*Escenario 2 — Tarea sin material relacionado:*
- DADO QUE el usuario abre una tarea sobre un tema no indexado
- CUANDO Cortex busca y no encuentra resultados relevantes
- ENTONCES el panel flotante NO aparece (no interrumpir con "sin resultados")

*Escenario 3 — Panel flotante ya abierto:*
- DADO QUE el usuario ya tiene el panel flotante abierto con una consulta
- CUANDO abre una tarea en Nexus
- ENTONCES el panel actualiza los resultados para la nueva tarea
- Y muestra indicador "Contexto actualizado para la tarea actual"

**Dependencias:** US-005 (panel flotante funcional), US-003 (documentos indexados), Nexus API evento `task_opened`
**DoD:** [ ] Test de no-aparición cuando sin resultados [ ] Transición suave entre contextos

---

## **US-007: Eliminación de Documento del Índice**

**ID:** US-007 | **Prioridad:** P1 | **Estimación:** 2 pts | **Módulo:** M3.3, M5.1

**COMO** estudiante que quiere controlar qué recuerda Cortex
**QUIERO** poder eliminar documentos del índice de RuVector desde la pestaña de Cortex
**PARA** que Cortex no use ese material en futuras consultas, sin perder el documento original en Aether

**Criterios de Aceptación:**

*Escenario 1 — Eliminación exitosa:*
- DADO QUE existe un documento indexado en Cortex
- CUANDO el usuario hace clic en "Eliminar del índice" y confirma en el diálogo
- ENTONCES el documento desaparece de la lista del índice en la pestaña de Cortex
- Y una búsqueda posterior no devuelve resultados de ese documento
- Y el documento original permanece intacto en Aether

*Escenario 2 — Cancelación:*
- DADO QUE el usuario hace clic en "Eliminar del índice"
- CUANDO aparece el diálogo de confirmación y el usuario hace clic en "Cancelar"
- ENTONCES no se realiza ningún cambio

*Escenario 3 — Documento en cola de procesamiento:*
- DADO QUE el documento está en estado QUEUED o PROCESSING
- CUANDO el usuario intenta eliminarlo del índice
- ENTONCES se muestra "Este documento está siendo procesado. Esperá a que termine."

**Dependencias:** US-003, M5.1 lista de documentos
**DoD:** [ ] Test: documento eliminado del índice, verificar ausencia en queries [ ] Documento en Aether intacto verificado

---

## **US-008: Exportación del Índice a Firebase o GitHub**

**ID:** US-008 | **Prioridad:** P2 | **Estimación:** 5 pts | **Módulo:** M5.5

**COMO** estudiante que acumula conocimiento durante años de carrera
**QUIERO** hacer backups de mi índice de Cortex en Firebase o GitHub
**PARA** no perder años de conocimiento indexado si reinstalo el sistema o cambio de computadora

**Criterios de Aceptación:**

*Escenario 1 — Exportación a Firebase:*
- DADO QUE el usuario está autenticado con Firebase
- CUANDO hace clic en "Exportar a Firebase" en la pestaña de Cortex
- ENTONCES se muestra el tamaño estimado del backup y se solicita confirmación
- Y al confirmar, se sube el índice serializado a Firebase Storage bajo `users/{uid}/cortex/`
- Y al completar aparece "Backup guardado exitosamente ({tamaño} — {fecha})"

*Escenario 2 — Exportación a GitHub:*
- DADO QUE el usuario ingresó su GitHub token en la configuración
- CUANDO hace clic en "Exportar a GitHub"
- ENTONCES se le pide seleccionar un repositorio (o crear uno nuevo)
- Y el índice se commitea al repositorio seleccionado
- Y al completar aparece el link al commit en GitHub

*Escenario 3 — Sin token de GitHub configurado:*
- DADO QUE el usuario nunca configuró su GitHub token
- CUANDO intenta exportar a GitHub
- ENTONCES aparece "Configurá tu GitHub token primero" con enlace a la sección de configuración

*Escenario 4 — Sin conexión:*
- DADO QUE el dispositivo no tiene conexión
- CUANDO intenta exportar
- ENTONCES aparece "Necesitás conexión para exportar"

**Dependencias:** Firebase auth existente, GitHub API, RuVector serialización
**DoD:** [ ] Token GitHub almacenado cifrado verificado [ ] Backup en Firebase verificado manualmente

---

## **US-009: AutoResearchClaw con Aprobación Individual**

**ID:** US-009 | **Prioridad:** P1 | **Estimación:** 8 pts | **Módulo:** M4.4

**COMO** estudiante investigando un tema en Aether
**QUIERO** que Cortex encuentre papers académicos relacionados y me los presente para aprobar individualmente
**PARA** enriquecer mi índice con investigación académica relevante sin que se importe nada sin mi consentimiento

**Criterios de Aceptación:**

*Escenario 1 — Papers encontrados:*
- DADO QUE el usuario tiene una nota activa en Aether con > 200 palabras sobre "redes neuronales"
- CUANDO AutoResearchClaw encuentra papers relacionados
- ENTONCES el panel flotante muestra "Encontré papers relacionados a este tema" (máx. 5)
- Y cada paper muestra: título, abstract resumido, fuente (arXiv/Semantic Scholar), año
- Y cada paper tiene los botones "Importar" y "Descartar"

*Escenario 2 — Usuario aprueba un paper:*
- DADO QUE el usuario hace clic en "Importar" en un paper
- ENTONCES Docling descarga y procesa el paper
- Y se crea una nota en Aether con el contenido del paper y el tag `cortex-paper`
- Y la nota se indexa en RuVector
- Y el paper desaparece de la lista de "pendientes de aprobación"

*Escenario 3 — Usuario descarta un paper:*
- DADO QUE el usuario hace clic en "Descartar"
- ENTONCES el paper se registra en feedback.json como descartado
- Y no vuelve a aparecer en sugerencias futuras

*Escenario 4 — Sin conexión:*
- DADO QUE AutoResearchClaw requiere conexión
- CUANDO el dispositivo está offline
- ENTONCES la funcionalidad de AutoResearchClaw se oculta del panel flotante
- Y no se muestran sugerencias de papers

*Escenario 5 — AutoResearchClaw sin resultados:*
- DADO QUE el tema es muy específico y no se encuentran papers
- ENTONCES el panel flotante NO muestra la sección de papers (no mostrar "sin resultados")

**Dependencias:** US-005 (panel flotante), AutoResearchClaw integrado, conexión a internet
**DoD:** [ ] Test: nada se importa sin click explícito [ ] Feedback de descarte persiste entre sesiones

---

## **Definición Global de DoR y DoD**

### **Definition of Ready (DoR) — Aplica a todas las US**
- [ ] La historia tiene criterios de aceptación con escenarios Dado/Cuando/Entonces
- [ ] Las dependencias están identificadas y resueltas o en sprint anterior
- [ ] El diseño de UI fue revisado (aunque sea un sketch)
- [ ] El equipo estimó la historia sin dudas bloqueantes

### **Definition of Done (DoD) — Aplica a todas las US**
- [ ] Linting con Biome: cero errores ni warnings
- [ ] Todos los criterios de aceptación testeados (Vitest)
- [ ] Cobertura de la US > 85% en líneas y > 90% en ramas
- [ ] Probado en las 3 plataformas (Windows, macOS, Linux)
- [ ] Sin secrets en el código (revisión manual)
- [ ] Documentación del componente actualizada en FSD
