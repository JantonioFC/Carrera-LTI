# ADR-002: Validación de Esquemas en Capa de Sincronización

## Estatus
Implementado — v3.x

## Contexto
La aplicación sincroniza datos entre:
- Estado en memoria (Zustand)
- Persistencia local (IndexedDB via idb-keyval / Yjs)
- Nube (Firebase Firestore)
- Configuración cifrada (electron-store)

Sin validación en tiempo de ejecución, un cambio de esquema o una corrupción de datos local podría causar crasheos silenciosos en la UI, ya que TypeScript solo protege en tiempo de compilación.

## Decisión
Validación estricta con **Zod** en todos los límites de confianza:

| Punto de entrada | Descripción |
|---|---|
| Carga desde Firestore | Validar antes de hidratar los stores |
| Escritura a Firestore | Validar `AppData` antes de `setDoc` |
| Persistencia local | Validar datos recuperados de IDB |
| Configuración de Electron | Los handlers IPC validan parámetros de entrada |

Los esquemas están centralizados en `src/utils/schemas.ts` y son la fuente de verdad para los tipos de runtime.

### Cobertura actual

- `AppData`, `AetherNote`, `AetherNoteId` (branded type: `` `note_${string}` ``) — validados.
- `safeStorage` (`src/utils/safeStorage.ts`) — valida con Zod antes de parsear datos persistidos.
- Handlers IPC de Electron — validan tipos de parámetros en `makeConfigHandlers`, `makeRuVectorHandlers`, etc.

## Consecuencias

- **Positivas**: Detección temprana de errores de esquema, eliminación de casts `as AppData`, mejor resiliencia ante datos corruptos o migrados parcialmente.
- **Neutras**: Overhead mínimo de parsing (Zod es ~5× más rápido que parseo manual con validación manual).
- **Negativas**: Ninguna.

## Notas
- Tests en `src/utils/safeStorage.test.ts` cubren casos de datos corruptos/expirados.
- El tipo branded `AetherNoteId = \`note_${string}\`` previene mezcla accidental de IDs de diferentes entidades.
