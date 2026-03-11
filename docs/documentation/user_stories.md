# **Historias de Usuario: Carrera LTI**

## **1. Gestión Académica**

### **COMO** estudiante de la LTI
### **QUIERO** visualizar mi progreso en la malla curricular
### **PARA** saber cuántos créditos me faltan para recibirme o alcanzar la tecnicatura.
*   **Criterios de Aceptación:**
    *   La app debe mostrar los 8 semestres con sus materias.
    *   Debe haber un contador de créditos aprobados vs. totales.
    *   El progreso debe actualizarse en tiempo real al cambiar el estado de una materia.

## **2. Segundo Cerebro (Aether)**

### **COMO** estudiante que investiga un tema complejo
### **QUIERO** crear notas vinculadas bidireccionalmente
### **PARA** construir una red de conocimiento que sea fácil de navegar luego de meses.
*   **Criterios de Aceptación:**
    *   Soporte para sintaxis `[[Nombre de la Nota]]`.
    *   Visualización de grafo interactivo para ver las conexiones.

## **3. Workspace Inteligente (Nexus)**

### **COMO** usuario que maneja mucha documentación técnica
### **QUIERO** que una IA analice mis documentos locales
### **PARA** obtener respuestas rápidas sin tener que releer todo o exponer mis datos a la nube pública.
*   **Criterios de Aceptación:**
    *   El chat debe usar RAG sobre documentos de IndexedDB.
    *   No debe requerir conexión constante a internet si el modelo es local o el contexto ya está procesado.
    *   Cifrado de la API Key del proveedor de IA.

## **4. Organización de Tareas**

### **COMO** estudiante con múltiples entregas
### **QUIERO** un tablero Kanban con subtareas
### **PARA** desglosar proyectos grandes en pasos manejables.
*   **Criterios de Aceptación:**
    *   Columnas: Por hacer, En proceso, Hecho.
    *   Soporte para prioridades y fechas de vencimiento.

## **5. Sincronización Universal**

### **COMO** estudiante que usa laptop y tablet
### **QUIERO** que mis tareas, notas y documentos se mantengan sincronizados automáticamente
### **PARA** poder cambiar de dispositivo sin perder mi progreso o tener que exportar datos manualmente.
*   **Criterios de Aceptación:**
    *   Sincronización con Firebase Firestore.
    *   Opción de "Restaurar desde la nube" en caso de pérdida de datos locales.
    *   Soporte para todos los módulos (Tareas, Horarios, Aether, Nexus).

## **6. Calendario Académico**

### **COMO** estudiante con una agenda apretada
### **QUIERO** visualizar mis entregas y exámenes en diferentes escalas (año, mes, semana)
### **PARA** planificar mi tiempo de estudio con antelación.
*   **Criterios de Aceptación:**
    *   Vistas intercambiables de año, mes y semana.
    *   Modal interactivo para añadir eventos rápidamente.
    *   Persistencia de eventos en el almacenamiento local y en la nube.

## **7. Monitor de Gmail (Comunicación)**

### **COMO** estudiante que espera noticias de un docente
### **QUIERO** ver mis correos académicos no leídos desde cualquier parte de la app
### **PARA** no perder tiempo revisando pestañas externas y mantener mi enfoque.
*   **Criterios de Aceptación:**
    *   Botón flotante global (FAB) con indicador numérico de correos.
    *   Panel expandible para leer fragmentos de los correos.
    *   Soporte para múltiples dispositivos mediante sincronización de credenciales.
