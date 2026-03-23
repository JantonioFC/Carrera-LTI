# **Reporte de Métricas DORA y Salud de Ingeniería**

**Proyecto / Servicio:** Cortex — Carrera LTI (módulo de memoria semántica)

**Periodo del Reporte:** Baseline Pre-lanzamiento — Q1 2026 (Marzo 2026)

**Responsable del Reporte:** Juan

**Estado General del Ecosistema:** 🟡 En Riesgo — proyecto en fase de definición; baseline establecido como objetivo, sin métricas reales aún medibles.

> **Nota de contexto:** Cortex no está en producción. Este documento establece las metas DORA, umbrales de alerta y criterios de salud que guiarán el desarrollo. Las métricas serán revisadas trimestralmente una vez que el proyecto esté operativo.

---

## **1. Resumen de Rendimiento Estratégico (Métricas DORA)**

Las métricas DORA son los pilares fundamentales para medir la velocidad de entrega y la estabilidad del sistema. Dado que Cortex es una aplicación Electron desktop (no un servicio web), las métricas se adaptan al ciclo de releases en lugar de despliegues continuos.

| Métrica | Definición y Relevancia | Objetivo v1.0 | Categoría de Desempeño |
| :---- | :---- | :---- | :---- |
| **Deployment Frequency (DF)** | **Velocidad:** Frecuencia de releases a GitHub Releases (instaladores firmados). Para una app desktop, "despliegue" = publicación de nueva versión. | ≥ 1 release por semana en fase activa | Alto |
| **Lead Time for Changes (LTTC)** | **Agilidad:** Tiempo desde el primer commit de una feature hasta su aparición en un release firmado. Incluye CI/CD matrix build. | < 4 horas (desde merge a main hasta release disponible en GitHub) | Alto |
| **Change Failure Rate (CFR)** | **Calidad:** Porcentaje de releases que resultan en hotfix urgente o rollback manual por el usuario. | < 5% (máx. 1 de cada 20 releases) | Alto |
| **Time to Restore Service (TTRS)** | **Resiliencia:** Tiempo desde detección de bug crítico (pérdida de datos, fallo de privacidad) hasta publicación de release correctivo. | < 24 horas para bugs P0 | Alto |

### **Adaptaciones para Contexto Desktop (Electron)**

A diferencia de aplicaciones web con despliegues en servidores, Cortex tiene particularidades:

- **"Despliegue" = Release en GitHub Releases.** No hay servidores que actualizar. El "despliegue" es la publicación del instalador firmado (.exe / .dmg / .AppImage).
- **TTRS incluye propagación de electron-updater.** El tiempo de restauración implica que el usuario acepte la actualización automática o la descargue manualmente.
- **CFR se mide por issues con label `critical` abiertos en < 48h post-release.**

### **Análisis de Tendencias DORA (Baseline)**

- **Periodo Anterior:** No aplica — proyecto en fase de inicio.
- **Meta v1.0:** Alcanzar categoría "Alto" en todas las métricas para el primer release público.
- **Meta v2.0:** Escalar a categoría "Elite" mediante automatización completa de builds y reducción de matrix build time.

---

## **2. Indicadores de Calidad del Código y Deuda Técnica**

Métricas estáticas y dinámicas que garantizan la mantenibilidad a largo plazo. Los umbrales están alineados con el Plan TDD de Cortex.

- **Cobertura de Tests (Code Coverage):** Actual: N/A — Meta v1.0: ≥ 85% líneas, ≥ 90% ramas en módulos críticos.
  - *Módulos críticos con cobertura ≥ 90% obligatoria:* `CortexOrchestrator`, `GroundingValidator`, `QueueManager`, `FeedbackStore`, `IPCProtocol`.
  - *Herramienta:* `@vitest/coverage-v8`. Reporte publicado como comentario en cada PR.

- **Complejidad Ciclomática Media:** Meta: ≤ 10 por función. Bloqueo de merge si alguna función supera 15.
  - *Herramienta:* Biome con regla de complejidad habilitada.

- **Code Churn (Rotación de Código):** Se comenzará a monitorear tras primer release. Alta rotación esperada en `CortexOrchestrator` durante fases tempranas (normal en sistemas de integración).

- **Deuda Técnica Identificada (Pre-lanzamiento):**
  - *Crítica (Seguridad):* 0 items conocidos — gitleaks en cada commit.
  - *Operativa:* La integración de subprocesos Docling/RuVector en CI requiere tiempos de compilación elevados (Rust); se prevé cacheo de binarios compilados como mejora futura.
  - *Estética:* Biome configurado desde el día 0; deuda estética = 0 desde el inicio.

- **Vulnerabilidades de Seguridad:**
  - *SAST (Estático):* gitleaks en pre-commit y CI — Críticas: 0 (bloqueante), Altas: 0 (bloqueante).
  - *SCA (Dependencias):* `npm audit` integrado en CI. Meta: 0 vulnerabilidades críticas en dependencias directas.
  - *Electron-específico:* CSP estricta en `BrowserWindow`; `nodeIntegration: false`; `contextIsolation: true`.

---

## **3. Salud del Sistema, Observabilidad y SRE**

Cortex es una aplicación desktop local-first. Los conceptos tradicionales de SRE (uptime de servidor, latencia de red) se adaptan a la experiencia del usuario en su máquina.

### **Métricas de Experiencia de Usuario (Equivalentes a Golden Signals)**

- **Disponibilidad (App Uptime):** Meta: El usuario puede abrir Cortex y ejecutar una consulta en < 5 segundos desde el inicio de la app. Crash rate al arrancar: < 0.1%.

- **Latencia de Respuesta:**

  | Operación | P50 (Objetivo) | P95 (Objetivo) | Bloqueo si supera |
  |---|---|---|---|
  | Consulta al panel flotante (RuVector query) | < 800ms | < 2s | > 5s |
  | Indexado de documento Aether (sin Docling) | < 2s | < 5s | > 30s |
  | Indexado con OCR (Docling) | < 10s | < 30s | > 120s |
  | Transcripción Whisper (por minuto de audio) | < 30s | < 60s | > 5 min |
  | Export de índice a Firebase/GitHub | < 5s | < 15s | > 60s |

- **Tasa de Errores de Subprocesos:**
  - Meta: Tasa de éxito de subprocesos ≥ 98% (medido localmente en la UI del tab dedicado de Cortex).
  - Crash de subproceso con anti-loop (máx. 3 reinicios): debe notificarse al usuario en < 5s.

- **Saturación y Consumo de Recursos (local):**
  - CPU durante indexado: < 80% durante más de 30s seguidos.
  - RAM total de la app Electron: < 500MB en reposo, < 1.5GB durante indexado concurrente.
  - Tamaño del índice RuVector: alerta en UI si supera 2GB.
  - Logs locales: rotación diaria, compresión automática, retención 30 días.

- **Estado de los SLOs Locales:**
  - SLO-01: Tiempo de respuesta del panel flotante < 2s en el 95% de las consultas.
  - SLO-02: 0 archivos WAV persistentes tras transcripción exitosa (privacidad — REQ-22 adyacente).
  - SLO-03: 100% de respuestas LLM con al menos 1 fuente citada de RuVector.

---

## **4. Análisis de Cuellos de Botella y Gestión de Incidentes**

### **4.1 Principales Bloqueos Operativos Anticipados**

- **Bloqueo A — Matrix Build Time en CI:** El build firmado para 3 plataformas (Windows + macOS + Linux) puede superar 30 minutos en GitHub Actions. Mitigación planificada: cachear dependencias npm y binarios Rust de RuVector entre runs.

- **Bloqueo B — Tiempos de setup de Docling en E2E CI:** El job de tests E2E requiere instalar `docling` y `google-adk` via pip. Sin caché, esto puede superar los 5 minutos solo en setup. Mitigación: usar `actions/cache` para el venv de Python.

- **Bloqueo C — Firma de código macOS en CI:** La notarización de Apple puede añadir latencia variable (2-10 minutos). No paralelizable. Bloqueo aceptado como costo operativo.

- **Bloqueo D — Dependencia de subprocesos externos en tests E2E:** Los tests E2E requieren RuVector compilado desde Rust. Si el entorno de CI no tiene `cargo` cacheado, el tiempo de compilación puede superar el timeout. Mitigación: pre-compilar y subir binarios como artifacts entre jobs.

### **4.2 Post-Mortem de Incidentes Críticos**

*No aplica — proyecto no lanzado. Esta sección se activará con el primer release.*

**Plantilla para futuros incidentes (Cultura Blameless):**
- **Incidente [ID-00X]: [Título]**
  - **Impacto:** [Usuarios afectados, duración, funcionalidad degradada]
  - **Causa Raíz:** [Root cause técnico, sin culpar personas]
  - **Acción Correctiva:** [Fix técnico implementado]
  - **Lecciones Aprendidas:** [Cambios en proceso o arquitectura para evitar recurrencia]

**Clasificación de severidad para Cortex:**
| Severidad | Criterio | TTRS Objetivo |
|---|---|---|
| **P0 — Crítico** | Pérdida de datos del índice, fallo de privacidad (WAV no eliminado), app no inicia | < 24h |
| **P1 — Importante** | Subproceso no reinicia, consultas fallan consistentemente | < 72h |
| **P2 — Menor** | UI bug, degradación de rendimiento no crítica | Próximo release |

---

## **5. Estrategia de Mejora e Iniciativas (Próximo Periodo)**

Acciones concretas para el ciclo de desarrollo v1.0 de Cortex:

1. - [ ] **Cacheo de Dependencias en CI:** Implementar `actions/cache` para node_modules, pip venv y cargo target. Meta: reducir LTTC de 45min a < 20min.

2. - [ ] **Test Coverage Baseline:** Alcanzar 85%+ de cobertura en todos los módulos antes del primer PR a `main`. Priorizar `GroundingValidator` (REQ-22) y `WavManager` (privacidad).

3. - [ ] **Shift-Left Security desde Commit 1:** Configurar gitleaks como pre-commit hook (husky) y en CI desde el primer día. Meta: 0 secrets en historial de git.

4. - [ ] **Monitoreo Local de Latencia:** Implementar logging estructurado en JSON desde el inicio (`operation_id`, `duration_ms`, `status`) para poder analizar latencias reales vs. objetivos en la primera semana de uso.

5. - [ ] **Automatizar Changelog:** Configurar `conventional commits` + generación automática de CHANGELOG.md en cada release para reducir esfuerzo de documentación de releases.

6. - [ ] **Definir Bug Bounty Interno:** Establecer proceso para que beta testers (equipo) reporten bugs con severity antes del release público. Usar GitHub Issues con labels `p0`/`p1`/`p2`.

---

## **6. Conclusiones y Visión del Tech Lead**

**Estado Actual:** Cortex se encuentra en fase de definición con documentación completa (PRD, RFC, FSD, ADRs, User Stories, BDD, TDD, CI/CD). El ecosistema está diseñado con principios de calidad desde el día cero: Biome linting, Vitest testing, gitleaks, matrix builds.

**Fortalezas del diseño actual:**
- Arquitectura local-first que elimina dependencias de infraestructura de servidor.
- Protocolo IPC bien definido (NDJSON stdio) con tests unitarios especificados.
- Grounding estricto (REQ-22) que previene respuestas alucinadas — diferenciador clave de privacidad y calidad.
- CI/CD matrix multiplataforma desde el día 0.

**Riesgos de ingeniería a monitorear:**
- Tiempo de build en CI puede convertirse en fricción si el matrix build supera 30 minutos. Requiere optimización activa de caché.
- La integración de 4 subprocesos externos (Whisper, Docling, RuVector, Observer AI) aumenta la superficie de fallo. El anti-loop y los timeouts son el escudo principal.
- El tamaño del instalador (~700MB con Whisper embebido) puede ser una barrera de adopción. Considerar distribución del modelo separada del instalador base.

**Necesidades de Recursos:**
- Certificados de firma de código para Windows y macOS son requeridos antes del primer release público. Costo estimado: ~$100-200/año.
- GitHub Actions minutes pueden agotarse si el matrix build es frecuente. Considerar self-hosted runner en Linux para reducir costos.

**Mensaje Final:** Cortex tiene una base arquitectónica sólida. El reto principal no es técnico sino de integración: hacer que 4 subprocesos de diferentes ecosistemas (Rust, Python, Node.js) trabajen de forma resiliente en 3 plataformas. La estrategia de mocking en tests unitarios y los tests E2E con datos controlados son la red de seguridad fundamental. El primer indicador de éxito real será el LTTC: si podemos publicar un fix de P0 en menos de 24 horas desde la detección, el pipeline está maduro.

---

## **7. Referencias, Dashboards y Trazabilidad**

- **Logs locales:** `~/.carrera-lti/cortex/logs/cortex-YYYY-MM-DD.log` — análisis manual o con `jq`.
- **Métricas en UI:** Tab dedicado de Cortex → sección "Estado del Sistema" (documentado en FSD Módulo M5.4).
- **CI/CD:** GitHub Actions en el repositorio `carrera-lti` → tab Actions.
- **Cobertura:** Reporte de `@vitest/coverage-v8` publicado como comentario en cada PR.
- **Issues y bug tracking:** GitHub Issues con labels `p0`, `p1`, `p2`, `critical`, `regression`.
- **ADRs:** `ADR - Cortex (Carrera LTI).md` — 6 decisiones arquitectónicas registradas.
- **RFC:** `RFC-001 - Arquitectura Cortex (Carrera LTI).md` — propuesta técnica base.
- **Historial de sesiones de desarrollo:** Engram MCP (`mem_search project:cortex`).
