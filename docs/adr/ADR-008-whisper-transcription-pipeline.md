# ADR-005: Pipeline de Transcripción de Audio (Whisper + WAV Cleanup)

## Estatus
~~Implementado — v3.4.0~~ **Supersedido por ADR-009** (deprecado en v3.13.0)

## Contexto
El módulo Observer de Cortex captura audio del micrófono y necesita transcribirlo a texto para ingresarlo como nota en Aether Vault. Se requiere una decisión sobre:

1. Dónde y cuándo limpiar el archivo WAV temporal.
2. En qué proceso corre la transcripción.
3. Cómo manejar errores en la pipeline.

## Decisión

### Pipeline de transcripción

```
Observer activo → grabación WAV en ~/.carrera-lti/recordings/recording_{ts}.wav
  → observer:toggle(false) desde UI
  → SubprocessAdapter envía transcribe al whisper_runner.py
  → Whisper procesa WAV → texto + idioma detectado
  → whisper_runner.py elimina el WAV exitosamente
  → IPC retorna { text, language } al renderer
  → addNote() + ingestNote() en aetherStore
```

### Decisiones específicas

| Aspecto | Decisión | Razón |
|---|---|---|
| Proceso de transcripción | `whisper_runner.py` (subproceso Python) | Whisper requiere Python y GPU/CPU; aislarlo evita bloquear el Main Process |
| Limpieza del WAV | En `whisper_runner.py` tras transcripción exitosa | El runner tiene acceso directo al path y sabe si fue exitosa |
| Directorio de grabaciones | `~/.carrera-lti/recordings/` | Separado del `userData` de Electron para facilitar limpieza manual |
| Modelo por defecto | `small` (~500 MB) | Balance calidad/velocidad en CPU. El usuario puede pasar `model` vía IPC |
| Fallo en limpieza WAV | Log de advertencia, sin propagar error | Archivo huérfano es preferible a perder la transcripción |

## Consecuencias

- **Positivas**: Limpieza de archivos temporales en el mismo proceso que los genera. No se acumulan WAVs si la transcripción falla.
- **Neutras**: El WAV existe durante el tiempo de transcripción (~1-30s según duración).
- **Negativas**: Si el proceso Python es terminado abruptamente, el WAV puede quedar huérfano. Mitigación: el setup limpia `recordings/` al iniciar.

## Referencias
- `scripts/whisper_runner.py` — implementación del runner
- `electron/handlers/whisperHandlers.ts` — handler IPC
- ADR-004 — justificación general de subprocesos Python vs Web Workers
- Issue #140 — separación de esta decisión de ADR-003
