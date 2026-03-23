# **Especificación de Infraestructura y Pipeline CI/CD — Cortex (Carrera LTI)**

**Proyecto:** Cortex — Carrera LTI
**Referencia RFC:** RFC-001 - Arquitectura Cortex (Carrera LTI).md
**Estado:** Borrador
**Responsable DevOps:** Juan
**Fecha de Revisión:** 2026-03-22

---

## **1. Estrategia de Entornos**

Carrera LTI es una app Electron desktop (no una aplicación web de servidor). La estrategia de entornos se adapta a este contexto:

### **1.1 Entornos**

| Entorno | Descripción | Acceso |
|---|---|---|
| **Local (Dev)** | Máquina del desarrollador. Electron en modo dev con hot-reload. Subprocesos (Docling, RuVector) ejecutados localmente. Firebase emulator para auth/storage. | Solo el dev |
| **CI (Testing)** | GitHub Actions runners. Builds y tests automatizados en Ubuntu/Windows/macOS. Sin subprocesos reales en tests unitarios (mocks). | Automático por PR |
| **Staging (Preview)** | Build de Electron firmado sin distribución pública. Instalado manualmente en máquina de staging para tests manuales y E2E completos. | Equipo interno |
| **Producción (Release)** | Build firmado distribuido vía GitHub Releases (electron-updater). Instalado por usuarios finales. | Público |

### **1.2 Particularidades de Electron vs. Web**

A diferencia de un servidor web, Carrera LTI no tiene "instancias" ni escalado horizontal. Cada usuario ejecuta su propia instancia. Las consideraciones de infraestructura se centran en:
- **Build pipeline:** Compilación para 3 plataformas con firma de código
- **Distribución:** GitHub Releases como fuente de verdad para descargas y actualizaciones
- **Actualizaciones:** electron-updater para actualizaciones automáticas silenciosas
- **Telemetría (opt-in):** Solo métricas locales; sin envío a servidores externos por defecto

### **1.3 Configuración de Entorno Local**

```bash
# Setup de desarrollo — un solo comando
npm run setup:dev

# Lo que hace:
# 1. Instala dependencias Node.js (npm install)
# 2. Crea y activa venv Python para Docling + google-adk
# 3. Descarga binario de RuVector para el OS actual
# 4. Descarga modelo Whisper "small" (~500MB)
# 5. Inicia Firebase emulator
# 6. Lanza Electron en modo dev
```

---

## **2. Pipeline de CI/CD**

### **2.1 Triggers**

| Trigger | Jobs que se ejecutan |
|---|---|
| PR hacia `main` | Lint → Unit Tests → Build check (sin firma) |
| Push a `main` (merge de PR) | Lint → Unit Tests → Build firmado → Tests E2E → Deploy Staging |
| Tag `v*.*.*` | Todo lo anterior + Release a GitHub Releases |

### **2.2 Job: Lint y Calidad Estática**

```yaml
# .github/workflows/ci.yml (fragmento)
lint:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'npm'
    - run: npm ci
    - run: npm run lint          # Biome — cero errores ni warnings
    - run: npm run type-check    # tsc --noEmit
    - run: npm run secret-scan   # gitleaks — bloquea si encuentra secrets
```

**Reglas de bloqueo:**
- Cualquier error de Biome → bloquea el merge
- Cualquier error de TypeScript → bloquea el merge
- Cualquier secret detectado por gitleaks → bloquea el merge y alerta inmediata

### **2.3 Job: Tests Unitarios (Matrix Multiplataforma)**

```yaml
test-unit:
  strategy:
    matrix:
      os: [ubuntu-latest, windows-latest, macos-latest]
  runs-on: ${{ matrix.os }}
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'npm'
    - run: npm ci
    - run: npm run test:unit     # Vitest — sin subprocesos reales
    - run: npm run test:coverage # Cobertura mínima o falla
```

**Umbrales de cobertura (vitest.config.ts):**
```typescript
coverage: {
  thresholds: {
    lines: 85,
    branches: 90,
    functions: 85,
  }
}
```

**Tiempo máximo:** 30 segundos. Si excede → investigar y optimizar mocks.

### **2.4 Job: Build Check (PR)**

```yaml
build-check:
  runs-on: ${{ matrix.os }}
  strategy:
    matrix:
      os: [ubuntu-latest, windows-latest, macos-latest]
  steps:
    - run: npm run build:electron  # Verificar que el build no rompe (sin firma)
```

Sin firma de código en PRs (solo verifica que el build compila). La firma se aplica solo en merges a `main` y releases.

### **2.5 Job: Tests E2E (solo en merge a main)**

```yaml
test-e2e:
  runs-on: ubuntu-latest
  steps:
    - run: python -m venv venv && pip install docling google-adk
    - run: cargo build --release  # Compilar RuVector
    - run: npm run test:e2e        # Playwright + subprocesos reales
```

Los tests E2E usan subprocesos reales con datos de prueba predefinidos:
- Un set de PDFs de prueba (~5 documentos)
- Queries predefinidas con respuestas esperadas
- Verificación de grounding (REQ-22) con índice controlado

**Tiempo máximo:** 5 minutos.

### **2.6 Job: Build y Release**

```yaml
release:
  if: startsWith(github.ref, 'refs/tags/v')
  strategy:
    matrix:
      include:
        - os: windows-latest, target: nsis        # .exe installer
        - os: macos-latest,   target: dmg         # .dmg
        - os: ubuntu-latest,  target: AppImage    # .AppImage
  steps:
    - run: npm run build:electron:signed  # Requiere secrets de firma
    - uses: softprops/action-gh-release@v1
      with:
        files: dist/*.exe dist/*.dmg dist/*.AppImage
```

**Secrets requeridos en GitHub:**
- `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` — para firma y notarización macOS
- `WIN_CERTIFICATE` — para firma de código Windows
- `LINUX_GPG_KEY` — para firma de paquetes Linux (opcional)

---

## **3. Estrategia de Distribución y Actualizaciones**

### **3.1 electron-updater**

```typescript
// main.ts
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify(); // silencioso al inicio

// Al encontrar actualización:
// 1. Descarga en background
// 2. Notifica al usuario con opción "Actualizar ahora" o "Más tarde"
// 3. La actualización se aplica al reiniciar
```

**Canal de distribución:**
- `latest.yml` en GitHub Releases → canal estable
- `beta.yml` → canal de prueba (opt-in en configuración de la app)

### **3.2 Empaquetado de Dependencias**

El instalador incluye todo lo necesario para que el usuario no instale nada extra:

| Componente | Estrategia de empaquetado |
|---|---|
| RuVector (Rust) | Binario compilado incluido en `resources/` |
| Whisper | Binario incluido en `resources/`. Modelos descargados al primer uso |
| Docling + google-adk | Entorno Python embebido usando `PyInstaller` o `pyapp` |
| Node.js | Incluido por Electron |

**Tamaño estimado del instalador:**
- Sin modelo Whisper: ~180MB
- Con modelo `small` preincluido: ~700MB (opcional — el modelo se descarga al primer uso por defecto)

---

## **4. Infraestructura como Código**

Carrera LTI no tiene servidores propios (100% local + Firebase). La única infraestructura gestionada es:

### **4.1 Firebase (existente)**

```
Firebase Project: carrera-lti-prod
├── Authentication: Email/Password + Google
├── Firestore: (datos de Aether, Nexus, Horarios)
└── Storage: Backups de índice Cortex (REQ-14)
    └── users/{uid}/cortex/backup_{timestamp}.zip
```

**Reglas de Storage para backups de Cortex:**
```javascript
// firestore.rules (Storage)
match /users/{uid}/cortex/{file} {
  allow read, write: if request.auth.uid == uid;
}
```

### **4.2 GitHub (distribución)**

```
GitHub Repository: carrera-lti
├── Releases: Binarios firmados por plataforma
├── Actions: CI/CD pipeline
└── Issues: Bug tracking
```

---

## **5. Gestión de Secretos**

| Secreto | Dónde se almacena | Rotación |
|---|---|---|
| API Key del LLM | electron-store (cifrado AES-256, local) | Manual por el usuario |
| Firebase credentials | electron-store (cifrado AES-256, local) | Nunca expira |
| GitHub token (backup) | electron-store (cifrado AES-256, local) | Manual por el usuario |
| Secrets de firma de código | GitHub Secrets | Anual o al vencer el certificado |

**Política:** Ningún secret aparece en logs, en el código fuente, ni en variables de entorno sin cifrar. Gitleaks verifica esto en cada commit.

---

## **6. Observabilidad (Local-First)**

Dado que Cortex procesa datos privados localmente, la observabilidad es local por diseño:

### **6.1 Logs Locales**

```
~/.carrera-lti/cortex/logs/
├── cortex-YYYY-MM-DD.log     # Log del día actual (rotación diaria)
└── cortex-YYYY-MM-DD.log.gz  # Logs comprimidos de días anteriores (retención: 30 días)
```

**Formato de log:**
```json
{"level":"info","ts":"2026-03-22T10:15:30.123Z","operation_id":"uuid","action":"index","status":"ok","duration_ms":340,"doc":"apuntes_redes.pdf"}
```

### **6.2 Métricas en la UI**

La pestaña dedicada de Cortex muestra métricas de salud del sistema:
- Documentos indexados / total en Aether
- Tiempo promedio de indexado (últimas 24h)
- Tasa de éxito de subprocesos
- Tamaño del índice RuVector

### **6.3 Telemetría Opt-In (Futuro)**

En versiones futuras, con consentimiento explícito del usuario:
- Métricas agregadas y anónimas de uso (sin contenido del usuario)
- Reportes de crash automáticos
- Estadísticas de performance por plataforma/hardware

Por defecto en v1.0: **sin telemetría**.

---

## **7. Protocolo de Rollback**

Para una app desktop, el "rollback" es diferente a una app web:

### **7.1 Rollback de Versión de App**

Si una nueva versión tiene bugs críticos:
1. El usuario puede descargar la versión anterior desde GitHub Releases
2. electron-updater tiene soporte para "versión mínima forzada" si se necesita rollback por seguridad
3. Las versiones anteriores se mantienen en GitHub Releases por 6 meses

### **7.2 Rollback del Índice de RuVector**

Si el índice de RuVector se corrompe tras una actualización:
1. Cortex detecta el index corrupto al iniciar y lo notifica al usuario
2. Opción A: "Reconstruir índice desde Aether" (re-indexar todos los documentos)
3. Opción B: "Restaurar desde backup" (si el usuario tiene backup en Firebase/GitHub)

### **7.3 Comunicación de Incidentes**

- Bug crítico (pérdida de datos, fallo de privacidad): GitHub Issue con label `critical` + notificación en el canal de releases
- Bug importante (funcionalidad degradada): GitHub Issue + fix en el próximo release
- Bug menor: GitHub Issue → fix en el release regular

---

## **8. Guía para Agent-DevOps**

Instrucciones para agentes de IA que trabajen en el pipeline:

1. **Idempotencia:** Todos los scripts de setup (`npm run setup:dev`) deben poder ejecutarse N veces sin efectos secundarios. Verificar existencia antes de instalar.

2. **Seguridad por defecto:**
   - `electron-store` con cifrado habilitado desde el primer uso
   - Ninguna credencial hardcodeada en `package.json`, `electron-builder.yml` ni archivos de config
   - CSP (Content Security Policy) estricta en el `BrowserWindow`

3. **Matrix builds:** Siempre validar que los cambios en el Main Process no rompen el build en Windows (diferencias de paths, `\` vs `/`)

4. **Firma de código:** Los scripts de firma NO deben ejecutarse en branches de feature. Solo en `main` y tags de release.

5. **Subprocesos en CI:** Los tests E2E que requieren subprocesos reales deben usar `timeout` explícito por job (máx. 10 minutos) para no gastar minutos de CI innecesariamente.
