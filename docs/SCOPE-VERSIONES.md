# Scope de Versiones — Carrera LTI

## Versión pública (`JantonioFC/Carrera-LTI`)

**Audiencia:** Estudiantes de LTI UTEC (cualquier hardware, sin configuración de servidor)
**Base:** v3.12.1 con pipeline de transcripción eliminado (ADR-009)

### Features incluidas

| Feature | Estado |
|---------|--------|
| Malla curricular interactiva | ✅ |
| Gestión de tareas y correlatividades | ✅ |
| Aether Vault (notas, editor BlockNote) | ✅ |
| Nexus AI — RAG sobre documentos propios | ✅ |
| Indexación de PDFs/DOCX (Docling local) | ✅ |
| Índice semántico (RuVector local) | ✅ |
| Grafo de conocimiento (XYFlow) | ✅ |
| Firebase sync multi-dispositivo | ✅ |
| Cifrado local AES-256-GCM | ✅ |
| PWA (modo web) | ✅ |
| Electron (modo desktop) | ✅ |
| Gemini API (IA en nube, requiere key propia) | ✅ |
| Observer AI — captura de audio | ❌ Eliminado (ADR-009) |
| Transcripción Whisper | ❌ Eliminado (ADR-009) |

### Requisitos de hardware (mínimos)
- CPU: 4 núcleos x86-64 o ARM64
- RAM: 6 GB (sin IA local activa) / 8 GB funcional
- Almacenamiento: ~3.5 GB instalación inicial
- GPU: no requerida
- Red: opcional (Firebase sync, Gemini API)

---

## Versión privada (`Carrera-LTI-Private` — Sovereign Station)

**Audiencia:** Uso personal — ThinkPad T490 Windows 11 + VPS Ubuntu
**Base:** v3.12.1 completa + integración VPS

### Features incluidas

| Feature | Estado |
|---------|--------|
| Todo lo del repo público | ✅ |
| Observer AI — captura de audio | ✅ Mantenido |
| Transcripción Whisper | ✅ → VPS FastAPI |
| Docling (procesamiento PDF) | ✅ → VPS FastAPI |
| RuVector (índice semántico) | ✅ → VPS daemon Rust |
| API Gateway claves Gemini | ✅ → VPS |
| Tailscale (conectividad T490 ↔ VPS) | ✅ Infraestructura |
| CortexOrchestrator remoto | ✅ `fetch()` al VPS |

### Arquitectura de dispositivos

```
ThinkPad T490 (Windows 11)          VPS Ubuntu (8 vCPU / 24 GB RAM)
─────────────────────────           ──────────────────────────────
React 19 UI                         FastAPI — Whisper endpoint
Electron shell                      FastAPI — Docling endpoint
Dexie.js (cache local)              RuVector daemon (Rust)
Yjs CRDT                            API Gateway (Gemini keys)
Firebase sync          ←────────→   Tailscale mesh
AES-256-GCM cifrado
```

### Requisitos de hardware — cliente (T490)
- CPU: 4+ núcleos (solo renderiza UI)
- RAM: 6–8 GB (sin cómputo de IA local)
- Almacenamiento: ~1.5 GB (sin Python venv ni modelos Whisper/Docling locales)
- Red: Tailscale activo para features de IA
- GPU: no requerida

### Requisitos de hardware — VPS
- CPU: 4+ vCPUs (8 recomendado para Whisper paralelo)
- RAM: 16+ GB (modelos Whisper/Docling en memoria)
- Almacenamiento: 20+ GB (modelos + índice RuVector)
- SO: Ubuntu 20.04+
- FFmpeg: instalado en servidor
