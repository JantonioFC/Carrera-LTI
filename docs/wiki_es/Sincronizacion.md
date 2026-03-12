# Sincronización en la Nube (Universal Sync)

Aunque Carrera LTI es local-first, entendemos la importancia de tener tus datos en todos tus dispositivos.

## ☁️ Arquitectura de Sincronización
Utilizamos **Firebase Firestore** como puente para la continuidad de los datos.

### Qué se sincroniza:
- Notas de Aether y grafos.
- Documentos de Nexus.
- Progreso académico y tareas.
- Configuración y claves (encriptadas localmente).

## 🔄 El Hook `useCloudSync`
Es el orquestador principal que:
1.  **Detecta cambios**: Monitoriza los stores de Zustand.
2.  **Gestiona la Cola (Queue)**: Si no hay internet, guarda los cambios en `lti_sync_queue`.
3.  **Resuelve Conflictos**: Prioriza el cambio más reciente o utiliza lógica de fusión inteligente.

## 🔐 Privacidad y Autenticación
- **Firebase Auth Anónima**: No necesitas crear una cuenta de Google para empezar a sincronizar; el sistema crea un ID único y persistente para ti.
- **Estructura Segura**: Tus datos se guardan en la ruta protegida `users/{userId}/data`.

---
[[Nexus Workspace|Nexus]] | [[Guía de Desarrollo|Desarrollo]]
