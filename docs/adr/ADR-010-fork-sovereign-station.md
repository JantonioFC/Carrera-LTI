# ADR-010: Fork Privado — Sovereign Station

## Estatus
Aprobado — en implementación

## Contexto

Carrera LTI v3.12.1 opera bajo una arquitectura local-first donde todos los procesos de cómputo (Whisper, Docling, RuVector) corren en el mismo dispositivo que la interfaz de usuario. Esto genera:

- Congelado de UI al procesar documentos densos (IPC stdio/NDJSON bloquea el hilo principal de JS)
- Proceso Python acoplado al ciclo de vida de la ventana Electron (muere al cerrar)
- Carga de hardware incompatible con hardware estudiantil de gama media
- Dependencia de FFmpeg a nivel de sistema no gestionada por el setup

El análisis de infraestructura disponible (2026-03-31) confirma acceso a un VPS Ubuntu con 8 vCPUs y 24 GB RAM, hardware superior al dispositivo local (ThinkPad T490, i7 8va gen, 16 GB RAM, Windows 11).

## Decisión

Crear el repositorio privado `Carrera-LTI-Private` a partir del estado de v3.12.1, con una arquitectura de **reparto de cargas asimétrico**:

| Componente | Dispositivo actual | Dispositivo objetivo |
|---|---|---|
| React 19 UI + Vite | T490 (Windows 11) | T490 (Windows 11) — sin cambios |
| Dexie.js (cache local) | T490 | T490 — sin cambios |
| Firebase sync | Nube (Google) | Nube (Google) — sin cambios |
| Yjs (CRDT Aether) | T490 | T490 — sin cambios |
| Whisper (transcripción) | T490 (proceso Python local) | **VPS Ubuntu — FastAPI** |
| Docling (procesamiento PDF) | T490 (proceso Python local) | **VPS Ubuntu — FastAPI** |
| RuVector (índice semántico) | T490 (daemon Rust local) | **VPS Ubuntu — daemon Rust** |
| CortexOrchestrator | `child_process` local | **`fetch()` al VPS** |
| Conectividad T490 ↔ VPS | — | **Tailscale** |
| FFmpeg | Dependencia del cliente | **VPS — gestionada en servidor** |
| Claves Gemini | Variable de entorno cliente | **API Gateway en VPS** |

## Qué NO cambia respecto al repo público

- Arquitectura de datos: Dexie.js como cache local + Firebase como respaldo/sync multi-dispositivo
- Lógica de negocio: malla curricular, tareas, Aether, Nexus AI
- Stack frontend: React 19, Zustand, Vite, TypeScript 6
- Cifrado: Web Crypto AES-256-GCM + safeStorage (DPAPI en Windows)
- CI/CD y metodología de releases

## Correcciones respecto a los informes SUBIR

Los documentos de análisis externo propusieron reemplazar Firebase con "Engram DB". Esta propuesta se descarta:

- Firebase cumple el rol de sincronización multi-dispositivo (T490 ↔ Xiaomi ↔ otros). Eliminarlo es innecesario.
- Engram es el servidor MCP de memoria para agentes IA — no aplica como base de datos de aplicación.

El objetivo es **separación de cómputo**, no reemplazo de stack de datos.

## Consecuencias

- **Positivas**:
  - UI siempre responsiva — el hilo principal JS queda libre del cómputo pesado
  - Whisper corre en VPS con modelos más precisos (mayor RAM disponible)
  - FFmpeg gestionado en el servidor, no en el cliente Windows
  - El proceso de IA persiste aunque se cierre la ventana Electron
  - Tailscale elimina la gestión manual de IPs y port-forwarding

- **Negativas**:
  - Funcionalidad de IA local requiere conectividad con el VPS (Tailscale activo)
  - Mayor complejidad de infraestructura y mantenimiento del servidor

## Referencias

- v3.12.1 — punto de partida del fork
- ADR-009: Depreciación del pipeline de transcripción (repo público)
- `SUBIR/INFORME_CORRECCIÓN.md` — análisis técnico base
- `SUBIR/Optimización de T490 con VPS para LTI.md` — análisis de hardware
