# 0002: Gestión de Estado con Zustand (reemplaza useReducer)

## Estado
Aceptado — Actualizado en v2.x, revisado en v3.4.0

## Contexto
Originalmente se planificó usar `useReducer` + Context para el estado global de Aether y Nexus. La lógica de transición de estado era compleja (múltiples campos de `AppData` actualizados en respuesta a un solo evento) y `useState` producía renderizados adicionales e inconsistencias.

## Decisión
**Zustand** reemplazó a `useReducer` como gestor de estado global. Se mantienen dos stores principales:

| Store | Archivo | Persistencia |
|---|---|---|
| `aetherStore` | `src/store/aetherStore.ts` | IndexedDB via `idb-keyval` |
| `nexusStore` | `src/store/nexusStore.ts` | IndexedDB via Yjs + `y-indexeddb` |

### Razones del cambio

- Zustand elimina el boilerplate de actions/dispatch/reducers sin sacrificar aislamiento de estado.
- La persistencia con `idb-keyval` supera el límite de `localStorage` (~5 MB) y soporta datos binarios (embeddings).
- El patrón de selectores de Zustand (`useAetherStore(s => s.notes)`) evita renderizados innecesarios de forma nativa.

### Invariantes mantenidos del ADR original

- El estado complejo (listas de notas, embeddings, historial de chat) sigue aislado de la lógica de componentes UI.
- Las operaciones asíncronas usan el tipo `Result<T, Error>` de `src/utils/result.ts` para control de errores sin crasheos en UI.

## Consecuencias

- **Positivas**: Menor boilerplate, mejor DX, soporte nativo de devtools. Las pruebas unitarias mockean Zustand directamente sin Context providers.
- **Negativas**: La hidratación asíncrona desde IDB introduce una ventana breve donde el store está vacío (mitigada con estado inicial explícito).

## Notas
- `nexusStore` usa `Y.Doc` + `IndexeddbPersistence` de Yjs para sincronización de documentos ricos (BlockNote).
- `aetherStore` tiene test suite completa en `src/store/aetherStore.test.ts`.
