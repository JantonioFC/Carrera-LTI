# ADR-009: Depreciación del Pipeline de Transcripción de Audio

## Estatus
Aprobado — pendiente implementación

## Contexto

La funcionalidad de Observer AI (captura de audio vía micrófono → transcripción Whisper → nota en Aether) fue implementada en v3.4.0 como herramienta de apoyo para clases presenciales.

### Limitaciones identificadas en el análisis de requisitos (2026-03-31)

1. **Cobertura de hardware incompleta**: `observer_runner.py` usa `sd.InputStream()` sin parámetro `device`, capturando exclusivamente el dispositivo de entrada por defecto del sistema (micrófono físico).

2. **Caso de uso real no cubierto**: El audio a procesar proviene principalmente de videoconferencias y videos de clase reproducidos en el navegador, no del micrófono. Capturar audio del sistema requiere configuración manual de dispositivos virtuales (VB-Cable en Windows, BlackHole en macOS, monitor PulseAudio en Linux), lo que supone una barrera operativa inaceptable para el usuario final.

3. **Dependencia de FFmpeg no gestionada**: `openai-whisper` requiere FFmpeg instalado a nivel de sistema. `npm run setup` no lo verifica ni lo instala, generando fallos silenciosos en la transcripción.

4. **Carga de hardware en dispositivo local**: El modelo Whisper `small` (~500 MB, `fp16=False`) consume ~1.2 GB de RAM al cargarse, compitiendo con el resto de la aplicación en hardware estudiantil de gama media.

5. **Alternativa más viable descartada**: La ingesta directa de archivos de video (MP4/MKV) implicaría acumulación de gigabytes de datos en disco, incompatible con el perfil de uso real.

### Consecuencia

Ninguna de las rutas de captura de audio disponibles cubre el caso de uso principal sin fricción operativa o impacto de hardware inaceptable. La feature entrega valor marginal en su estado actual.

## Decisión

Deprecar y eliminar del repositorio público el pipeline completo de transcripción de audio:

- `scripts/whisper_runner.py`
- `scripts/observer_runner.py`
- `src/cortex/observer/` (ObserverAIToggle, useObserverIPC, observerStore)
- `src/cortex/wav/` (WavManager)
- `electron/handlers/whisperHandlers.ts`
- `electron/handlers/observerHandlers.ts`
- `electron/handlers/pathSecurity.ts`
- Referencias en `CortexTab.tsx`, `cortexStore.ts`, `preload.ts`, `types.d.ts`, `main.ts`

El resto del sistema (Docling, RuVector, Nexus AI RAG, Aether, Firebase sync) no se ve afectado.

## Alternativa mantenida en fork privado

El pipeline de transcripción se conserva y extiende en el repositorio privado `Carrera-LTI-Private`, donde Whisper corre en un VPS Ubuntu como servicio FastAPI, eliminando la carga de hardware local y la dependencia de FFmpeg en el dispositivo cliente.

## Consecuencias

- **Positivas**:
  - Elimina una dependencia de sistema (FFmpeg) no gestionada por el setup
  - Reduce el consumo de RAM en ~1.2 GB durante sesiones de trabajo
  - Simplifica la superficie de mantenimiento del repo público
  - Reduce la barrera de entrada para nuevos usuarios

- **Negativas**:
  - Usuarios con micrófono activo pierden la capacidad de transcripción automática
  - Las notas de Aether derivadas de grabaciones deben crearse manualmente

## Referencias

- ADR-008: Pipeline de Transcripción de Audio (Whisper + WAV Cleanup) — decisión original
- Análisis de requisitos de hardware: `SUBIR/INFORME_CORRECCIÓN.md`
- Issue de seguimiento: pendiente de apertura
