# **Especificación BDD (Gherkin) — Cortex (Carrera LTI)**

**Proyecto:** Cortex — Carrera LTI
**Referencia FSD:** FSD - Cortex (Carrera LTI).md
**Referencia US:** US-001 al US-009
**Estado:** Borrador
**Versión:** 1.0.0

---

## **Feature 1: Toggle de Observer AI**

**Funcionalidad:** Control on/off del módulo de captura de audio

**COMO** estudiante de IT
**QUIERO** activar y desactivar Observer AI con un switch
**PARA** controlar cuándo el sistema captura audio de mis conferencias

**Reglas de Negocio:**
- Observer AI solo captura audio cuando el toggle está explícitamente ON
- El estado del toggle persiste entre sesiones
- Sin permiso de micrófono del OS, el toggle no puede activarse
- Al desactivar mid-conferencia, el audio ya capturado se procesa igualmente

**Contexto:**
- DADO QUE Carrera LTI está abierta en modo Electron
- Y el módulo Cortex está inicializado (RuVector y Docling listos)

```gherkin
@observerai @p0 @regresion
Escenario: Activación exitosa con permiso concedido
  Dado que es la primera vez que el usuario activa Observer AI
  Cuando el usuario hace clic en el switch de Observer AI en la pestaña de Cortex
  Y el sistema operativo muestra el diálogo de permiso de micrófono
  Y el usuario concede el permiso
  Entonces el switch queda en estado ON
  Y aparece el indicador de grabación animado (punto rojo)
  Y el mensaje "Observer AI activo — capturando audio de conferencias" es visible
  Y el estado ON queda guardado en la configuración persistente

@observerai @p0 @regresion
Escenario: Intento de activación con permiso denegado
  Dado que el usuario denegó el permiso de micrófono al sistema operativo
  Cuando el usuario intenta activar el toggle de Observer AI
  Entonces el switch permanece en estado OFF
  Y aparece el mensaje "Permiso de micrófono denegado. Habilitalo desde la configuración del sistema."
  Y no se inicia ningún proceso de captura

@observerai @p0
Escenario: Persistencia de estado entre sesiones
  Dado que Observer AI está en estado ON
  Cuando el usuario cierra Carrera LTI
  Y vuelve a abrir Carrera LTI
  Entonces el toggle arranca en estado ON
  Y el indicador de grabación es visible sin que el usuario deba reactivarlo

@observerai @p1
Escenario: Desactivación con audio en proceso
  Dado que Observer AI está en ON
  Y hay 15 minutos de audio capturado
  Cuando el usuario desactiva el toggle
  Entonces el indicador cambia a "Procesando audio capturado..."
  Y el micrófono se libera inmediatamente
  Y la transcripción continúa en background
  Y al finalizar aparece la nota en Aether
```

---

## **Feature 2: Pipeline de Transcripción de Conferencias**

**Funcionalidad:** Captura → Transcripción → Nota en Aether

**COMO** estudiante que asiste a clases virtuales
**QUIERO** que el audio de mis conferencias se transcriba y aparezca en Aether
**PARA** no perder el contenido de las clases

**Reglas de Negocio:**
- Los archivos WAV se eliminan tras completar la transcripción
- Si el audio es muy largo (>2h), se procesa en fragmentos
- Si hay silencio >10 minutos, la captura se pausa automáticamente
- Las notas generadas tienen siempre el tag `cortex-transcripcion`

**Contexto:**
- DADO QUE Observer AI está en estado ON
- Y Whisper está disponible como subproceso local

```gherkin
@transcripcion @p0 @regresion
Escenario: Transcripción exitosa de conferencia
  Dado que el usuario está en una videoconferencia con audio activo
  Y Observer AI está capturando audio (toggle ON)
  Cuando el usuario desactiva el toggle al finalizar la clase
  Entonces Whisper procesa el audio localmente
  Y se crea una nota en Aether con el título "Conferencia — {fecha} {hora}"
  Y el cuerpo de la nota contiene texto legible con la transcripción
  Y la nota tiene el tag "cortex-transcripcion"
  Y los archivos WAV temporales son eliminados del sistema de archivos
  Y la nota queda disponible en el índice de RuVector

@transcripcion @p1
Escenario: Pausa automática por silencio prolongado
  Dado que Observer AI está en ON y capturando
  Cuando no se detecta audio por más de 10 minutos consecutivos
  Entonces la captura se pausa automáticamente
  Y aparece la notificación "Observer AI pausado por inactividad"
  Y se ofrece el botón "Reanudar captura"
  Y el audio ya capturado no se pierde

@transcripcion @p1
Escenario: Cierre inesperado de la app mid-conferencia
  Dado que hay audio capturado en chunks pendientes
  Cuando el usuario vuelve a abrir Carrera LTI
  Entonces los chunks disponibles se procesan automáticamente al iniciar
  Y se crea una nota en Aether con el contenido parcial
  Y aparece el aviso "Conferencia interrumpida — nota parcial creada"

@transcripcion @p1 @edge
Escenario: Audio con múltiples hablantes y ruido de fondo
  Dado que la conferencia tiene varios participantes hablando simultáneamente
  Y hay ruido de fondo moderado
  Cuando Whisper completa la transcripción
  Entonces la nota se crea con el texto transcrito disponible
  Y se muestra la advertencia "Calidad de audio baja — revisá la transcripción antes de usarla"
```

---

## **Feature 3: Indexado Automático de Documentos**

**Funcionalidad:** Documentos de Aether → RuVector

**COMO** estudiante que organiza su material en Aether
**QUIERO** que mis documentos se indexen automáticamente al subirlos o editarlos
**PARA** que estén disponibles en búsquedas sin acción manual extra

**Reglas de Negocio:**
- El indexado se dispara automáticamente en `aether:document_saved` y `aether:document_updated`
- Si el documento ya existe en el índice → re-indexar (sobreescribir)
- Un PDF estándar (20 páginas) debe indexarse en < 10 segundos
- El estado del indexado es visible en la barra de cola

```gherkin
@indexado @p0 @regresion
Escenario: Indexado automático al subir PDF
  Dado que Docling y RuVector están listos
  Cuando el usuario sube un PDF de 20 páginas a Aether
  Entonces el documento aparece en la cola de Cortex con estado "En proceso"
  Y en menos de 10 segundos el estado cambia a "Indexado"
  Y el contador de documentos en la pestaña de Cortex se incrementa en 1

@indexado @p0 @regresion
Escenario: Re-indexado automático al editar nota
  Dado que existe una nota "Apuntes de Redes" ya indexada en Cortex
  Cuando el usuario edita la nota agregando nuevo contenido y guarda
  Entonces el re-indexado se dispara automáticamente
  Y el nuevo contenido aparece en búsquedas posteriores
  Y el contenido anterior ya no es recuperable en búsquedas

@indexado @p0 @edge
Escenario: Error de indexado por archivo corrupto
  Dado que el usuario sube un PDF dañado o no-estándar
  Cuando Docling falla al parsear el archivo
  Entonces el documento aparece con estado "Error" en la cola
  Y se muestra el mensaje "No se pudo indexar {nombre} — el archivo puede estar corrupto"
  Y aparece el botón "Re-intentar"
  Y el documento original en Aether permanece sin cambios

@indexado @p1
Escenario: Cola de múltiples documentos simultáneos
  Dado que el usuario sube 10 PDFs al mismo tiempo a Aether
  Entonces los 10 aparecen en la cola en orden FIFO
  Y la barra de estado muestra "10 documentos en cola"
  Y se procesan uno a la vez mostrando progreso individual
  Y al finalizar todos, el contador del índice refleja el total correcto
```

---

## **Feature 4: OCR de Imágenes**

**Funcionalidad:** Fotos → texto → nota en Aether

**COMO** estudiante que fotografía apuntes y pizarrones
**QUIERO** procesar imágenes para extraer texto
**PARA** que mis apuntes manuscritos sean buscables

**Reglas de Negocio:**
- El usuario debe iniciar el procesamiento explícitamente (no automático)
- Si confianza del OCR < 60%, mostrar advertencia y permitir edición previa
- El texto extraído pasa por un preview editable antes de crear la nota

```gherkin
@ocr @p1 @regresion
Escenario: OCR exitoso de foto de pizarrón
  Dado que el usuario tiene una foto de un pizarrón con texto legible
  Cuando el usuario sube la imagen desde la pestaña de Cortex y selecciona "Pizarrón"
  Entonces Docling extrae el texto de la imagen
  Y se muestra un preview del texto extraído para revisión
  Cuando el usuario confirma el preview
  Entonces se crea una nota en Aether con el tag "cortex-ocr"
  Y el título de la nota es "OCR — Pizarrón — {fecha}"
  Y la nota se indexa automáticamente en RuVector

@ocr @p1 @edge
Escenario: OCR con baja confianza
  Dado que la imagen tiene texto parcialmente ilegible (foto movida o baja resolución)
  Cuando Docling devuelve confianza inferior al 60%
  Entonces se muestra el texto extraído con la advertencia "Calidad baja — revisá el texto antes de guardar"
  Y el usuario puede editar el texto en el preview
  Y solo se crea la nota después de que el usuario confirma explícitamente

@ocr @p1 @edge
Escenario: Imagen sin texto detectado
  Dado que la imagen es un diagrama sin texto (gráfico o figura)
  Cuando Docling procesa la imagen
  Entonces se muestra el mensaje "No se detectó texto en la imagen"
  Y no se crea ninguna nota en Aether
  Y no se encola ninguna operación de indexado
```

---

## **Feature 5: Panel Flotante — Consultas con Grounding**

**Funcionalidad:** Búsqueda semántica en el índice personal

**COMO** estudiante estudiando para un examen
**QUIERO** consultar Cortex en lenguaje natural
**PARA** obtener respuestas basadas únicamente en mi material indexado

**Reglas de Negocio:**
- El LLM responde SOLO basándose en chunks de RuVector
- Si no hay resultados relevantes → respuesta literal "No encontré información sobre esto en tu índice."
- Cada respuesta cita su fuente (nombre del documento + fragmento)
- Las consultas requieren conexión a internet
- El usuario puede marcar resultados como irrelevantes

```gherkin
@panel @p0 @regresion @critico
Escenario: Consulta exitosa con material indexado
  Dado que existen notas indexadas sobre "TCP/IP" y "sockets"
  Y el dispositivo tiene conexión a internet
  Cuando el usuario escribe "¿Cómo funciona el three-way handshake?" en el panel flotante
  Entonces Cortex devuelve una respuesta sobre el three-way handshake
  Y la respuesta incluye al menos una cita con el nombre del documento fuente
  Y el fragmento relevante del documento es visible
  Y el tiempo de respuesta total es menor a 5 segundos

@panel @p0 @regresion @critico
Escenario: Consulta sin material en el índice (test de grounding)
  Dado que el índice de RuVector está vacío o no contiene documentos sobre "criptografía cuántica"
  Cuando el usuario pregunta "¿Qué es la criptografía cuántica?"
  Entonces Cortex responde exactamente "No encontré información sobre esto en tu índice."
  Y NO se incluye información de preentrenamiento del LLM en la respuesta
  Y se ofrece la opción "¿Buscar papers académicos sobre este tema?"

@panel @p0 @regresion
Escenario: Consulta sin conexión a internet
  Dado que el dispositivo no tiene conexión a internet
  Cuando el usuario intenta escribir en el panel flotante
  Entonces el input está deshabilitado
  Y aparece el mensaje "Necesitás conexión para consultar. Tu índice está actualizado y listo."

@panel @p1
Escenario: Marcar resultado como irrelevante
  Dado que Cortex devolvió un resultado sobre "UDP" en respuesta a una consulta sobre "TCP"
  Cuando el usuario hace clic en "No es relevante" en ese resultado
  Entonces se registra la señal negativa en feedback.json
  Y en la próxima consulta similar ese resultado aparece con menor prioridad o no aparece
```

---

## **Feature 6: Surfeo Contextual desde Nexus**

**Funcionalidad:** Conocimiento relevante al abrir tareas de Kanban

```gherkin
@nexus @p1 @regresion
Escenario: Panel contextual al abrir tarea con material relacionado
  Dado que existen documentos indexados sobre "implementación de sockets en Python"
  Y hay una tarea en Nexus titulada "Implementar socket TCP en Python"
  Cuando el usuario abre esa tarea en Nexus
  Entonces el panel flotante aparece automáticamente
  Y muestra hasta 3 resultados relevantes con su fuente
  Y el header dice "Relacionado con esta tarea:"

@nexus @p1
Escenario: Panel no aparece cuando no hay material relacionado
  Dado que el usuario abre una tarea sobre un tema sin documentos indexados
  Cuando Cortex busca y no encuentra resultados con score suficiente
  Entonces el panel flotante NO aparece
  Y no hay ninguna interrupción visual para el usuario
```

---

## **Feature 7: Resiliencia de Subprocesos**

**Funcionalidad:** Reinicio automático con protección anti-bucle

**Reglas de Negocio:**
- Máximo 3 reinicios consecutivos por subproceso
- El contador de reinicios se resetea si el proceso estuvo estable > 60 segundos
- Al superar 3 reinicios, se notifica al usuario y se espera intervención manual
- El crash de un subproceso NO debe crashear Carrera LTI

```gherkin
@resiliencia @p0 @regresion @critico
Escenario: Reinicio automático de subproceso caído
  Dado que RuVector está corriendo normalmente
  Cuando RuVector se cierra inesperadamente (simulado por SIGKILL en test)
  Entonces CortexOrchestrator detecta la caída en menos de 15 segundos
  Y reinicia RuVector automáticamente
  Y la UI muestra brevemente "Reconectando Cortex..." sin crashear
  Y Carrera LTI continúa funcionando normalmente tras el reinicio

@resiliencia @p0 @regresion @critico
Escenario: Protección anti-bucle tras 3 reinicios fallidos
  Dado que un subproceso falla 3 veces consecutivas en menos de 60 segundos
  Cuando el tercer reinicio también falla
  Entonces CortexOrchestrator detiene los intentos de reinicio
  Y muestra al usuario la notificación "Cortex encontró un problema. Intentá reiniciarlo manualmente."
  Y ofrece el botón "Reiniciar Cortex"
  Y Carrera LTI sigue funcionando (Aether, Nexus, Horarios no afectados)

@resiliencia @p1
Escenario: Reset del contador tras estabilidad
  Dado que un subproceso tuvo 2 reinicios
  Cuando el subproceso permanece estable durante más de 60 segundos
  Entonces el contador de reinicios se resetea a 0
  Y el próximo crash dispara un reinicio nuevo (no suma al contador anterior)
```

---

## **Feature 8: Exportación del Índice**

```gherkin
@exportacion @p2
Escenario: Exportación exitosa a Firebase
  Dado que el usuario está autenticado con Firebase en Carrera LTI
  Cuando el usuario hace clic en "Exportar a Firebase" en la pestaña de Cortex
  Entonces se muestra el tamaño estimado del backup con mensaje de confirmación
  Cuando el usuario confirma
  Entonces el índice se sube a Firebase Storage bajo users/{uid}/cortex/
  Y aparece "Backup guardado exitosamente — {tamaño} — {fecha}"

@exportacion @p2
Escenario: Exportación sin conexión
  Dado que el dispositivo no tiene conexión a internet
  Cuando el usuario intenta exportar
  Entonces aparece el mensaje "Necesitás conexión para exportar"
  Y ningún dato sale del sistema
```

---

## **Etiquetas y Metadatos**

- `@p0` — Críticos para el lanzamiento (bloquean release si fallan)
- `@p1` — Importantes (deben pasar antes del primer release estable)
- `@p2` — Deseables (pueden omitirse en v1.0)
- `@regresion` — Se ejecutan en cada PR
- `@critico` — Afectan privacidad, seguridad o integridad de datos
- `@edge` — Casos borde, se ejecutan en release candidates
- `@observerai` — Módulo Observer AI
- `@transcripcion` — Pipeline de transcripción
- `@indexado` — Pipeline de indexado
- `@ocr` — Módulo OCR
- `@panel` — Panel flotante
- `@nexus` — Integración con Nexus
- `@resiliencia` — Gestión de subprocesos
- `@exportacion` — Exportación de índice

---

## **Guía de Implementación**

- **Selectores de UI:** Usar `data-testid` en todos los elementos interactivos. Ej: `data-testid="observer-toggle"`, `data-testid="cortex-query-input"`, `data-testid="cortex-result-irrelevant"`
- **Mocks de subprocesos:** Para tests de resiliencia, usar stubs que simulan el proceso externo respondiendo mensajes IPC, sin ejecutar Whisper/Docling/RuVector reales
- **Test de grounding:** Es el test más crítico — debe correr en cada CI. Índice vacío → query técnica → verificar que la respuesta es exactamente el mensaje de "no encontré información"
- **Tiempo:** Para tests de timeout, usar `TimeProvider` inyectable en lugar de `Date.now()` directamente

---

## **DoD para BDD**

- [ ] Todos los escenarios revisados contra los criterios de aceptación de las US
- [ ] Escenarios `@critico` testeados manualmente antes del release
- [ ] Los escenarios de grounding (Feature 5) corren en cada PR sin excepción
- [ ] Los 3 flujos cubiertos por feature: camino feliz, casos borde, errores técnicos
- [ ] Tags aplicados para filtrado en GitHub Actions
