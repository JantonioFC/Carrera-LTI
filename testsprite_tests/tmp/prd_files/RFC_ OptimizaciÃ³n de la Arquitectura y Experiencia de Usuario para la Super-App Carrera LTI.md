### RFC: Optimización de la Arquitectura y Experiencia de Usuario para la Super-App Carrera LTI

**Autor:**  Arquitecto Senior de Soluciones & Consultor UX  **Estado:**  Borrador  **Fecha:**  24 de mayo de 2024  **Referencia a Épica:**  US-LTI-001 (Rediseño de Integración y Flujo de Usuario)  **Nivel de Impacto:**  Alto

#### 1\. Resumen Ejecutivo (Abstract)

La plataforma Carrera LTI se proyecta como una "super-app" diseñada para centralizar la vida académica. No obstante, su arquitectura actual opera mediante "islas funcionales" desconectadas (gestión, segundo cerebro y espacio de trabajo) que fragmentan el flujo de trabajo. Para asegurar la retención del estudiante, el sistema debe transicionar de un modelo de silos manuales a un ecosistema integrado donde la herramienta actúe como un aliado invisible.

1. **¿Qué vamos a cambiar?**  Se desmantelará el widget global de Gmail en favor de un modelo de  **divulgación progresiva** . Se automatizarán los flujos entre módulos utilizando la Malla Curricular como el  **State Provider**  primario y se reestructurará la jerarquía visual mediante contraste dinámico.  
2. **¿Por qué ahora?**  La configuración manual de Google Cloud Console (GCC) y la fatiga visual por saturación de información (356 créditos con igual peso gráfico) son bloqueadores críticos. El sistema actual agota el presupuesto cognitivo antes de que el usuario reciba valor.  
3. **¿Cuál es el beneficio técnico inmediato?**  La reducción drástica de la fricción operativa y la automatización del entorno de datos (Malla-Ether-Nexus) permiten que el usuario pase de ser un "oficinista administrativo" a un estudiante enfocado, optimizando la carga biológica (cortisol) del sistema.

#### 2\. Contexto y Motivación

La barrera de entrada técnica actual es inasumible para el público objetivo. Es equivalente a exigirle a un estudiante que fabrique su propio escritorio con madera, clavos y herramientas pesadas la noche anterior a un examen crucial, antes de permitirle abrir el libro de estudio.

* **Problema Técnico Detallado:**  La dependencia de la configuración manual en GCC para habilitar la API de Gmail constituye una falla de diseño operativo. Obligar a un estudiante de primer ciclo a gestionar pantallas de consentimiento OAuth, correos de prueba y claves criptográficas interrumpe el momento de descubrimiento de la aplicación.  
* **Análisis de Deuda Técnica:**  La fragmentación entre el Tracker Universitario, Ether (Canvas/Grafo) y Nexus (Editor de bloques) es una deuda estructural. El sistema no vincula el estado de una materia con la creación de sus contenedores de datos, forzando una gestión manual redundante.  
* **Evidencia Empírica y "Ventana Oscura":**  El widget de Gmail actual es una "ventana oscura" que solicita credenciales de forma persistente en todas las pantallas. Técnicamente, esto actúa como un bloqueador que obliga al usuario al "ignoro activo", un proceso que consume recursos del presupuesto cognitivo y eleva los niveles de fatiga visual. La exposición simultánea de los 356 créditos de la carrera sin jerarquía temporal induce fatiga por escaneo y estrés biológico medible.

#### 3\. Objetivos (Metas y No-Metas)

Delimitar el alcance es vital para asegurar que la reestructuración arquitectónica sea viable sin incurrir en  *scope creep* .

##### Metas (Goals)

* **Implementar Divulgación Progresiva:**  La solicitud de APIs externas se realizará exclusivamente en el punto de necesidad (Nexus AI o centro de notificaciones).  
* **Malla Curricular como Sistema Nervioso:**  El sistema deberá utilizar el  **Subject ID**  de la malla como llave foránea para orquestar la creación automática de nodos en Ether y bases de datos en Nexus.  
* **Jerarquía Visual Dinámica:**  Se aplicará  **renderizado condicional**  para colapsar estados vacíos y manipulación de saturación cromática para diferenciar el contexto temporal (pasado/presente/futuro).

##### No-Metas (Non-Goals)

* **Modo Demo/JSON:**  Aunque es una estrategia de UX válida, la implementación de un modo de demostración con archivos JSON queda fuera del alcance de este RFC para priorizar la conectividad arquitectónica real.  
* **Lógica RAG:**  No se modificará el procesamiento interno de  *Retrieval-Augmented Generation*  de Ether, únicamente su flujo de activación y vinculación de datos.

#### 4\. Propuesta de Solución Detallada: La Arquitectura Integrada

La solución se fundamenta en convertir la sincronización de estado (YJS) en el tejido conectivo que unifique los módulos.

##### 4.1 Divulgación Progresiva (Módulo de Comunicación)

El sistema  **deberá eliminar**  el widget global de Gmail. La petición de la API Key se trasladará a modales contextuales. Si el estudiante intenta usar Nexus AI para resumir correos, el sistema presentará en ese instante la necesidad de la llave, transformando el requerimiento técnico en el acceso a un "superpoder" ya deseado.

##### 4.2 Automatización del Ecosistema (Malla como Cerebro)

La Malla Curricular actuará como el  **Primary State Provider** .

* **Mecanismo de Trigger:**  Al marcar una materia como "En Curso", el sistema emitirá un evento de cambio de estado.  
* **Suscripción de Módulos:**   **Ether**  (como suscriptor) creará automáticamente una carpeta estructurada con el metadata del  **Subject ID** .  **Nexus**  generará una base de datos relacional pre-configurada para bibliografía, utilizando el mismo ID como vínculo de integridad.  
* **Eliminación del "Síndrome de la Hoja en Blanco":**  El entorno de estudio se pre-construirá proactivamente basándose en la carga académica del usuario.

##### 4.3 Jerarquía Visual Dinámica y Pomodoro

El diseño se ajustará al consumo biológico de energía:

* **Peso Visual y Opacidad:**  Los semestres aprobados (pasado) y remotos (futuro) deberán renderizarse con una  **opacidad de 0.4**  o filtros de escala de grises. La saturación cromática máxima se reservará para el semestre activo.  
* **Colapso de Estados Vacíos:**  Paneles de "sin tareas" o "sin notas" se colapsarán mediante renderizado condicional en indicadores unidimensionales (barras de estado delgadas) para permitir que la interfaz "respire".  
* **Pomodoro Integrado:**  El temporizador no será una ventana flotante. Deberá integrarse en las tarjetas del Kanban y emitir un evento de  **"Time-on-Task"**  asociado específicamente al  **Subject ID**  de la materia en curso, permitiendo analíticas de rendimiento futuras.

#### 5\. Alternativas Consideradas y Trade-offs

Característica,Enfoque Actual (Compartimentado),Enfoque Propuesto (Sistémico)  
Flujo Cognitivo,Fragmentado; el usuario es el integrador.,Unificado; la app es el puente de datos.  
Arquitectura,Islas funcionales aisladas.,Modelo Pub/Sub basado en YJS.  
Carga de Datos,Manual y propensa a errores.,Automatizada vía Subject ID (Data-binding).  
Impacto Visual,Saturación plana (Fatiga de escaneo).,Jerarquía temporal dinámica.  
**Compromisos Técnicos:**

* **Complejidad del Código:**  La lógica de automatización incrementa la complejidad del orquestador de estados, pero reduce drásticamente el costo cognitivo del usuario.  
* **Rendimiento Local:**  La sincronización de YJS entre múltiples módulos activos requiere una gestión eficiente del ciclo de vida de los nodos para evitar latencia en dispositivos de gama media.

#### 6\. Plan de Implementación y Rollout

1. **Fase 1 (Optimización de Interfaz):**  Implementación de renderizado condicional para estados vacíos y aplicación de opacidad dinámica en la Malla Curricular.  
2. **Fase 2 (Conectividad de Datos):**  Implementación de los  *triggers*  de estado para que el cambio en la Malla genere automáticamente las estructuras en Ether y Nexus utilizando el Subject ID.  
3. **Fase 3 (Refactorización de APIs):**  Eliminación del widget global de Gmail y despliegue del flujo de configuración bajo demanda.

#### 7\. Estrategia de Testing y Observabilidad

* **Métricas de Rendimiento:**  
* **Latencia de Creación (P95 \< 200ms):**  Tiempo entre el cambio de estado en la malla y la disponibilidad de la carpeta/DB en Ether/Nexus.  
* **Consistencia de Datos:**  Verificación de integridad entre el estado de la Malla y la existencia de recursos vinculados en el almacenamiento local.  
* **Protocolo de Rollback:**  
* Si la sincronización de YJS falla, el sistema deberá desplegar un componente UI de tipo  **"Retry Sync" (Toast)** .  
* En caso de error crítico, se debe garantizar el acceso  *read-only*  a los datos locales para no interrumpir el estudio.

#### 8\. Preguntas Abiertas e Incertidumbres

1. **Escalabilidad del Grafo:**  ¿Cómo se comportará la latencia de sincronización local cuando el volumen de nodos en Ether crezca exponencialmente debido a la creación proactiva de estructuras por materia?  
2. **Gobernanza de Datos:**  ¿Cuál será el protocolo de limpieza para recursos de Nexus/Ether generados automáticamente si un estudiante desmarca una materia como "en curso" por error?

