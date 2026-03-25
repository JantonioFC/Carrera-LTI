# ADR-005: Rate Limiting en Handlers IPC

## Estatus
Implementado — v3.6.0

## Contexto
Los canales IPC son invocados desde el renderer sin ninguna restricción de frecuencia. Sin un límite, un bug o un renderer comprometido podría saturar los subprocesos Python/Rust con miles de llamadas por segundo, causando un DoS local o consumo excesivo de CPU/memoria.

## Decisión
`electron/main.ts` define `createRateLimiter(max, windowMs)`, una función que crea un contador de ventana deslizante. Si se supera el límite lanza `Error("rate limit exceeded")` que rechaza la Promise en el renderer.

Los límites configurados son:

| Canal | Límite |
|---|---|
| `cortex:index` | 10 / min |
| `cortex:query` | 30 / min |
| `cortex:process-document` | 5 / min |
| `cortex:ocr` | 5 / min |
| `cortex:transcribe` | 5 / min |
| `observer:toggle` | 10 / min |

Los canales `config:set` y `config:get` no tienen rate limiter dado su bajo coste.

## Consecuencias

- **Positivas**: Protección contra DoS local y consumo descontrolado de recursos.
- **Neutras**: El límite se reinicia al reiniciar la aplicación (no es persistente entre sesiones).
- **Negativas**: Un uso legítimo muy intensivo (p. ej. indexación batch) puede alcanzar el límite de `cortex:index`.

## Notas
- Implementado en `electron/main.ts` líneas 23–42.
