# ADR-002: Validación de Esquemas en Capa de Sincronización

## Estatus
Propuesto / En Implementación

## Contexto
La aplicación sincroniza datos entre el estado local (Zustand/IndexedDB), el almacenamiento persistente intermedio (`localStorage`) y la nube (Firebase Firestore). Actualmente, estos límites de confianza no están validados en tiempo de ejecución. El código utiliza casts de TypeScript (`as AppData`), lo que oculta potenciales corrupciones de datos si los esquemas cambian o si el almacenamiento local es manipulado.

## Decisión
Implementaremos validación estricta utilizando **Zod** en todos los puntos de entrada y salida de datos externos:
1. **Sync a la Nube**: Validar `AppData` antes de llamar a `setDoc`.
2. **Carga desde la Nube**: Validar los datos recibidos de `getDoc` antes de hidratar los stores.
3. **Persistencia local**: Validar los datos recuperados de `localStorage` y la cola de sincronización.

Utilizaremos los esquemas ya definidos en `src/utils/schemas.ts`, extendiéndolos según sea necesario.

## Consecuencias
- **Positivas**: Mayor resiliencia ante datos corruptos, detección temprana de errores de esquema, eliminación de casts inseguros.
- **Neutras**: Incremento mínimo en el tiempo de procesamiento (overhead de parsing de Zod).
- **Negativas**: Ninguna.
