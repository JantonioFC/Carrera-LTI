# 0002: Patrón Reducer para Gestión de Estado Complejo

## Estado
Aceptado

## Contexto
Tanto `useAether` como `useNexus` acumulaban mucha lógica manejando múltiples estados mediante `useState` por separado (`notes`, `chatHistory`, etc.). Cuando varias piezas de estado cambian en respuesta de un solo evento, `useState` puede resultar en renderizados adicionales e inconsistencias.

## Decisión
- Refactorizar el estado complejo en `useReducer` cuando el siguiente estado dependa fuertemente del estado anterior en contextos globales.
- Esta decisión afecta principalmente a los Context Providers, no a los subsistemas locales de componentes UI menores.
- Utilizar el tipo `Result<T, Error>` en operaciones asíncronas de la capa de datos para controlar rigurosamente el flujo de errores e impedir crasheos en la UI.

## Consecuencias
- **Positivas**: La lógica de transición de estado queda aislada de la lógica del componente, facilitando las pruebas unitarias puras. Las llamadas asíncronas son predecibles.
- **Negativas**: Aumenta levemente el boilerplate (acciones, dispatch, tipado complejo).
