# **ADR: Arquitectura Local-First y Privacidad**

## **Estado**
Aceptado

## **Contexto**
Los estudiantes universitarios manejan información privada (notas, apuntes personales) y a menudo trabajan en entornos con conectividad inestable (transporte público, laboratorios). Necesitábamos una arquitectura que garantizara la privacidad de los datos y la disponibilidad sin internet.

## **Decisión**
Hemos adoptado una arquitectura **Local-First** utilizando el siguiente stack:
1.  **IndexedDB (vía Dexie.js)**: Para almacenamiento de datos estructurados de alta velocidad.
2.  **Yjs (CRDT)**: Para la edición colaborativa/multi-pestaña y resolución automática de conflictos.
3.  **Web Crypto API**: Para cifrado AES-256 de documentos sensibles antes de su persistencia.
4.  **Google Gemini (PaaS)**: Integrado mediante RAG local para mantener el flujo de datos bajo control del usuario.

## **Consecuencias**
*   **Positivas:**
    *   Latencia cero en la UI.
    *   Privacidad total (los datos nunca dejan el dispositivo a menos que se active la Sync opcional).
    *   Funciona al 100% offline.
*   **Negativas:**
    *   Complejidad inicial superior a una arquitectura cliente-servidor tradicional.
    *   Dependencia de las cuotas de almacenamiento del navegador.

## **ADR-002: Sincronización en la Nube (Firebase Firestore)**

### **Estado**
Aceptado

### **Contexto**
La arquitectura Local-First inicial garantizaba privacidad pero dificultaba el uso multidispositivo. Se requería una capa de backup y sincronización opcional pero potente.

### **Decisión**
Implementar un sistema de sincronización universal utilizando **Firebase Firestore**. 
- Los datos se consolidan en un objeto `AppData` que cumple con un esquema Zod estricto.
- Se utiliza `localStorage` para persistencia inmediata y un hook `useCloudSync` para el push/pull con la nube.

### **Consecuencias**
*   **Positivas:** Continuidad entre dispositivos, respaldo seguro de la información.
*   **Negativas:** Introducción de una dependencia externa (aunque opcional).

## **ADR-003: Estrategia de Restauración (Spread Clone)**

### **Estado**
Aceptado

### **Contexto**
Al restaurar datos complejos (como documentos de Nexus o notas de Aether) desde Firestore a los stores de Zustand/Immer, se producían errores de "Object is frozen" debido a la naturaleza de las mutaciones de Immer sobre objetos provenientes de fuentes externas.

### **Decisión**
Adoptar una técnica de **clonado por esparcimiento (Spread Cloning)** durante la hidratación del estado: `store.setState({ items: [...cloudData] })`. Esto asegura que los nuevos objetos en el store sean mutables y no hereden restricciones de solo lectura del motor de red.

### **Consecuencias**
*   **Positivas:** Resolución definitiva de "Nexus state freezing".
*   **Negativas:** Ligero impacto en memoria durante la restauración inicial (insignificante para el volumen de datos actual).

## **ADR-004: Monitor de Gmail Flotante y Privacidad**

### **Estado**
Aceptado

### **Contexto**
El estudiante necesita estar al tanto de correos académicos (UTEC/Docentes) sin interrumpir su flujo de trabajo en Nexus o Aether. Se requería una solución persistente pero no intrusiva.

### **Decisión**
Adoptar un patrón de **Widget Flotante Global** integrado en la raíz de la aplicación (`App.tsx`). 
- **Tecnología**: `framer-motion` para transiciones de estado (minimizado/expandido).
- **Seguridad**: Se utiliza el flujo OAuth2 de Google Identity Services directamente en el cliente. El token de acceso nunca se persiste en disco; solo reside en memoria.
- **Sincronización**: Solo se sincronizan las credenciales de la API (Client ID, API Key), nunca los correos ni el token.

### **Consecuencias**
*   **Positivas:** Acceso inmediato a la comunicación académica fuera del Dashboard. Alta privacidad (correos no se envían a Firebase).
*   **Negativas:** Aumento del bundle size inicial por la inclusión de `framer-motion` y lógica de OAuth global.
