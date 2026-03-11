# **FSD: Especificación Funcional Detallada - Carrera LTI**

**Proyecto:** Carrera LTI

**Referencia PRD:** [prd.md](./prd.md)

**Versión:** 1.1.0

**Estado:** Alpha

## **1. Alcance y Objetivos de la Especificación**

Este documento detalla la lógica operativa de los módulos centrales de Carrera LTI, específicamente la gestión académica y el ecosistema de IA.

## **2. Arquitectura Funcional**

### **2.1 Mapa de Funcionalidades**
1. **Gestión Académica:** Dashboard, Calendario 2026, Malla Curricular, Gestión de U.C.
2. **Segundo Cerebro (Aether):** Editor Markdown, Grafo, Canvas, Chat RAG.
3. **Workspace (Nexus):** Editor de bloques, Bases de datos locales, Nexus AI.
4. **Sincronización (Cloud Sync):** Backup en Firebase, Restauración Universal, Persistencia Híbrida.
5. **Comunicación:** Monitor de Gmail Flotante, Notificaciones unread, Auth OAuth2.

## **3. Especificación Detallada de Módulos**

### **3.1 Módulo: Malla Curricular**
* **Descripción:** Representación visual de los 48 créditos/materias de la carrera.
* **Reglas de Negocio:**
    1. **Cálculo de Créditos:** Los créditos se suman automáticamente basándose en el estado "Aprobada".
    2. **Titulación Intermedia:** El sistema debe resaltar el progreso hacia la "Tecnicatura" (semestres 1-4) independientemente del progreso total.
    3. **Estados de U.C.:** Una materia solo puede estar en uno de estos estados: `pendiente`, `en_curso`, `aprobada`, `reprobada`.
* **Interacción:** Click en una materia debe abrir el detalle de la Unidad Curricular (U.C.).

### **3.2 Módulo: Motor de IA (Nexus / Aether)**
* **Entradas:** Texto del usuario, contexto de notas (Bóveda) o archivos (Nexus).
* **Procesamiento:**
    1. **Retrieval (RAG):** El sistema busca fragmentos relevantes en IndexedDB mediante embeddings.
    2. **Generación:** Envío de contexto + query a Google Gemini 2.5 Flash.
* **Seguridad:** La API Key de Gemini debe persistirse únicamente en el almacenamiento local cifrado del navegador.

### **3.3 Módulo: Calendario Académico 2026**
* **Vistas:** Soporta vista Anual, Mensual (Mini-Cards y Detalle) y Semanal.
* **Eventos:** Gestión de eventos locales con `useCalendarEvents`.
* **Interacción:** Modal premium interactivo para creación y edición rápida de eventos.

### **3.4 Módulo: Sincronización Universal (Firebase)**
* **Proveedor:** Firebase Firestore para persistencia en tiempo real.
* **Lógica de Sincronización:**
    1. **Consolidación:** El hook `useCloudSync` centraliza el estado global de todos los módulos.
    2. **Estrategia de Restauración:** Al restaurar datos, se realiza un *clonado por esparcimiento* (`[...data]`) para romper referencias de objetos congelados (Immer fix).
    3. **Persistencia Híbrida:** Los datos residen en stores de Zustand y se sincronizan asíncronamente con la nube.

### **3.5 Módulo: Monitor de Gmail Flotante**
*   **Componente:** `GmailWidget.tsx` integrado globalmente en `App.tsx`.
*   **Estados de UI:**
    1.  **Minimizado (FAB):** Botón flotante con badge de correos no leídos.
    2.  **Expandido:** Panel con lista de correos o configuración de credenciales.
*   **Garantías de Privacidad:**
    1.  El token de acceso OAuth2 se mantiene exclusivamente en memoria volátil.
    2.  Las credenciales (Client ID / API Key) se sincronizan de forma segura mediante Cloud Sync.
*   **Polling:** El sistema consulta la API de Gmail cada 5 minutos (configurable) para actualizar el estado de la bandeja.

## **4. Máquinas de Estado**

### **4.1 Estado de una Tarea (Kanban)**
* **Estados:** `Por hacer`, `En proceso`, `Hecho`.
* **Transiciones:** Libre movimiento entre columnas mediante Drag-and-Drop.

## **5. Contratos de Datos**

### **5.1 Estructura de Materia (lti.ts)**
```typescript
interface Subject {
  id: string;
  name: string;
  credits: number;
  semester: number;
  status: 'pendiente' | 'en_curso' | 'aprobada' | 'reprobada';
  color?: string;
}
```

## **6. Gestión de Casos de Borde**
* **Modo Offline:** Si la sincronización con Firebase falla, el sistema debe encolar la transacción y mostrar un indicador de "Pendiente de sincronización".
* **Conflicto de Edición:** En Nexus, si dos instancias editan el mismo bloque, se resuelve mediante Yjs (CRDT).
