# ADR-006: Guardia de Tamaño de Mensajes IPC (10 MB)

## Estatus
Implementado — v3.6.0

## Contexto
Los subprocesos Python/Rust envían respuestas al proceso principal mediante NDJSON por stdio. Un subproceso que devuelva una línea NDJSON muy grande (p. ej. por un documento corrupto o un bug) podría causar un DoS por agotamiento de memoria en el proceso principal (#149).

## Decisión
`src/cortex/ipc/IPCProtocol.ts` define `MAX_IPC_MESSAGE_BYTES = 10 * 1024 * 1024` (10 MB). La función `parseIPCMessage()` comprueba la longitud del string antes de llamar a `JSON.parse()`. Si se supera el límite, lanza `IPCParseError("message too large: N bytes (max 10485760)")`.

## Consecuencias

- **Positivas**: Prevención de DoS por mensajes NDJSON gigantes; falla rápida antes del parseo JSON costoso.
- **Neutras**: 10 MB es un límite conservador; documentos muy grandes se procesan en chunks por los runners Python, no en un único mensaje.
- **Negativas**: Ninguna identificada.

## Notas
- Tests unitarios en `src/cortex/ipc/IPCProtocol.test.ts`.
- Issue de origen: #149.
