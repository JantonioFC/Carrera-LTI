# ADR-001: Patrón de Adaptador para Autenticación e Integraciones

## Estatus
Parcialmente implementado — v3.x

## Contexto
La aplicación **Carrera LTI** usa Firebase para autenticación y sincronización cloud, y la API de Gmail para el widget de correo. Acoplar directamente los SDKs externos en hooks de React dificulta el testing y crea vendor lock-in.

### Problemas identificados originalmente

1. **Dificultad de Testing**: Mockear el SDK global de Firebase/Google requería configuración compleja.
2. **Vendor Lock-in**: Migrar a otro proveedor requeriría tocar múltiples archivos.
3. **Fugas de Abstracción**: Lógica de infraestructura en capa de UI.

## Decisión
Implementar el **Patrón de Adaptador** para desacoplar el núcleo de los proveedores externos.

### Estado actual de implementación

| Adaptador | Archivo | Estatus |
|---|---|---|
| Firebase (Firestore + Auth) | `src/utils/firebase.ts` | Implementado |
| GmailService | `src/services/gmail.ts` | Implementado — singleton con lazy init |
| Configuración cifrada (Electron) | `electron/handlers/configHandlers.ts` | Implementado |
| IAuthService (interfaz genérica) | — | Pendiente — aún acoplado a Firebase directamente |

### Patrón aplicado en GmailService

`GmailService` encapsula gapi + Google Identity Services (GSI) detrás de métodos de alto nivel (`initialize`, `authenticate`, `fetchUnreadMessages`, `signOut`). Los componentes React no importan gapi directamente.

### Inyección de dependencias en hooks (v3.4.0)

`useObserverIPC` acepta `ObserverIPCCallbacks` opcional para desacoplar el hook del store concreto (patrón aplicado en #90). Esto permite testing sin montar el store real.

## Consecuencias

- **Positivas**: `GmailService` y los handlers IPC de Electron son completamente testeables sin entorno real.
- **Pendiente**: Falta definir `IAuthService` genérico para Firebase Auth. Actualmente los componentes de sincronización cloud importan Firebase directamente.
- **Negativas**: Ninguna adicional a las identificadas originalmente.

## Notas
- Tests de GmailService en `src/services/gmail.test.ts` (22 tests, mocks de `window.gapi` y `window.google`).
- Tests de configHandlers en `electron/handlers/configHandlers.test.ts`.
