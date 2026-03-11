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
