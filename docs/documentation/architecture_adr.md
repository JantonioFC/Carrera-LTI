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
