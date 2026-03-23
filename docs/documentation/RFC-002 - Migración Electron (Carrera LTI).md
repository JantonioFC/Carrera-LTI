# **RFC-002: Migración Incremental a Electron — Procedimiento Técnico para Carrera LTI**

**Autor(es):** Juan

**Estado:** Borrador

**Fecha de Creación:** 2026-03-22

**Fecha de Última Actualización:** 2026-03-22

**Referencia a Épica:** ADR - Cortex (Carrera LTI).md (ADR-001)

**Nivel de Impacto:** Crítico

---

## **1. Resumen Ejecutivo**

Esta RFC documenta el procedimiento técnico paso a paso para migrar Carrera LTI de una SPA (Single Page Application) en React/Vite a una aplicación desktop Electron, de forma incremental y sin romper la funcionalidad existente.

**Estado actual:** Carrera LTI es una SPA web completamente funcional (React + Vite + TypeScript + Firebase). Cortex V2.0 tiene toda su lógica de negocio implementada en `src/cortex/` — orquestador, protocolo IPC, adaptadores de subprocesos, ConfigStore cifrado — pero corre "en vacío": los transportes son mocks, no existen binarios reales, y el `contextBridge` de Electron no está conectado.

**Estado objetivo:** Carrera LTI empaquetada como aplicación Electron nativa, con el proceso principal orquestando subprocesos reales (RuVector, Docling, Whisper, Observer AI) mediante el protocolo IPC ya definido, y el proceso renderer (la React app existente) comunicándose con el main a través de `contextBridge`. Toda la funcionalidad actual (Aether, Nexus, Horarios) debe mantenerse sin ningún cambio.

**¿Qué cambia técnicamente?**

| Capa | Estado actual | Estado objetivo |
|---|---|---|
| Empaquetado | `vite build` → SPA estática | `electron-builder` → instalador nativo |
| Proceso principal | No existe | `electron/main.ts` — orquestador de subprocesos |
| Preload | No existe | `electron/preload.ts` — contextBridge seguro |
| ConfigStore | `Map<string, string>` en memoria con cifrado AES-256-GCM | `electron-store` persistido en disco, cifrado |
| Variables de entorno | `.env` (plano) | `electron-store` cifrado + OS keychain |
| Subprocesos | `SubprocessAdapter` con mocks | `spawn()` real en Main Process |
| Tests existentes (168) | Pasan con mocks | Siguen pasando sin modificación |

---

## **2. Contexto y Motivación**

**La SPA existe y funciona.** Aether (notas), Nexus (kanban) y Horarios son módulos estables con cobertura de tests. El riesgo principal de esta migración no es implementar lo nuevo, sino no romper lo que ya funciona.

**Cortex V2.0 está implementado pero bloqueado.** La arquitectura de `src/cortex/` es sólida: `IPCProtocol`, `SubprocessAdapter`, `CortexOrchestrator` con anti-bucle de crashes (`shouldRestart`), `ConfigStore` con AES-256-GCM, `RuVectorAdapter`, `ConferencePipeline`, `QueueManager`, `HealthMetrics`. Todo compila, todos los tests unitarios pasan. El bloqueo es estructural: Node.js APIs (`child_process.spawn`, `fs`) no están disponibles en el renderer de un browser ni en `vite dev`, y el `contextBridge` que debería conectar renderer con main no existe todavía.

**Por qué Electron y no otra alternativa.** El ADR-001 ya resolvió esta decisión. Esta RFC asume Electron como la plataforma elegida y se enfoca exclusivamente en el "cómo" de la migración.

**Deuda técnica mínima.** El diseño de `src/cortex/` anticipó exactamente esta migración: `SubprocessTransport` es una interfaz inyectable, lo que significa que en producción se sustituye el mock por el transporte real de stdio sin tocar ninguna lógica de negocio. La migración es un ejercicio de cableado, no de reescritura.

---

## **3. Objetivos y No-Metas**

**Metas:**
- Envolver la SPA existente en un shell Electron sin regresiones en Aether, Nexus ni Horarios
- Conectar `CortexOrchestrator` con subprocesos reales mediante `child_process.spawn()`
- Migrar `ConfigStore` de Map en memoria a `electron-store` persistido y cifrado en disco
- Establecer `contextBridge` como única interfaz de comunicación Main↔Renderer
- Mantener el modo web funcional (mock degradado) para desarrollo sin Electron
- Los 168 tests Vitest existentes deben pasar sin ninguna modificación tras la Fase A
- Empaquetado multiplataforma (Windows/macOS/Linux) mediante `electron-builder`

**No-Metas:**
- No se rediseña ninguna UI existente en esta RFC
- No se migra la autenticación Firebase (se mantiene tal cual en el renderer)
- No se implementa distribución por tiendas de aplicaciones (App Store, Microsoft Store)
- No se contempla auto-update en esta RFC (ya está en `release.yml` con `electron-updater`, se documenta en Preguntas Abiertas)
- El fine-tuning de modelos locales queda fuera del alcance
- No se contempla modo colaborativo multi-usuario en Cortex

---

## **4. Propuesta de Solución Detallada**

### **4.1 Estructura de Archivos Meta**

La incorporación de Electron requiere una nueva carpeta `electron/` en la raíz del proyecto. El directorio `src/` no se toca.

```
carrera-lti/
├── electron/                        ← NUEVO
│   ├── main.ts                      ← Proceso principal: ventana, IPC handlers, spawn
│   ├── preload.ts                   ← contextBridge: expone APIs seguras al renderer
│   └── types.d.ts                   ← Tipos compartidos para la API del bridge
│
├── src/                             ← SIN CAMBIOS (toda la React app)
│   ├── cortex/                      ← Lógica de negocio ya implementada
│   │   ├── orchestrator/            ← CortexOrchestrator (ya existe)
│   │   ├── subprocess/              ← SubprocessAdapter (ya existe)
│   │   ├── ipc/                     ← IPCProtocol (ya existe)
│   │   ├── config/                  ← ConfigStore (ya existe, se adapta en Fase B)
│   │   └── ...
│   └── ...
│
├── scripts/
│   └── setup.mjs                    ← Extender para instalar binarios (Fase C+)
│
├── vite.config.ts                   ← Agregar plugin de electron (Fase A)
├── package.json                     ← Nuevas devDependencies (Fase A)
└── tsconfig.json                    ← Agregar paths para electron/
```

### **4.2 Herramientas Seleccionadas**

| Herramienta | Rol | Justificación |
|---|---|---|
| `electron` | Runtime de la aplicación desktop | Plataforma elegida en ADR-001 |
| `vite-plugin-electron` | Compila `electron/main.ts` y `electron/preload.ts` junto con Vite en `dev` y `build` | Integración nativa con el dev workflow existente, sin configuración manual de webpack |
| `electron-builder` | Empaquetado e instaladores (`.exe`, `.dmg`, `.AppImage`) | Ya referenciado en `release.yml` del proyecto — no hay que agregarlo |
| `electron-store` | Persistencia cifrada de configuración en disco | Reemplaza el `Map<string, string>` en memoria del `ConfigStore` actual. AES-256-GCM ya implementado en la capa de cifrado |

**Por qué `vite-plugin-electron` sobre configuración manual:** El proyecto ya usa Vite 8 con overrides para peer deps. `vite-plugin-electron` observa los archivos de `electron/` y los recompila automáticamente en `dev`, eliminando la necesidad de dos procesos separados (`vite dev` + `tsc --watch electron/`). En `build`, produce los archivos compilados en `dist-electron/` que `electron-builder` consume.

### **4.3 Arquitectura Main / Renderer / Preload**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        PROCESO PRINCIPAL (Main)                           │
│                         electron/main.ts                                  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    CortexOrchestrator                             │    │
│  │  (importado desde src/cortex/orchestrator — lógica sin cambios)  │    │
│  │                                                                   │    │
│  │  SubprocessTransport REAL   ←→   child_process.spawn()           │    │
│  │  ├── spawn(ruvector-binary)                                       │    │
│  │  ├── spawn(docling-runner)                                        │    │
│  │  ├── spawn(whisper-binary)                                        │    │
│  │  └── spawn(observer-ai)     ← solo cuando el usuario lo activa   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ipcMain.handle("cortex:query", ...)                                     │
│  ipcMain.handle("config:set", ...)                                       │
│  ipcMain.handle("config:get", ...)                                       │
│  ipcMain.handle("observer:toggle", ...)                                  │
│                                                                          │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │
              contextBridge (capa de aislamiento)
              electron/preload.ts
              window.cortexAPI = { query, config, observer }
                           │
┌──────────────────────────▼───────────────────────────────────────────────┐
│                      PROCESO RENDERER (React app)                         │
│                         src/ — SIN CAMBIOS DE UI                          │
│                                                                          │
│  En modo Electron:  window.cortexAPI.query(...)  → ipcRenderer.invoke()  │
│  En modo web/mock:  window.cortexAPI.query(...)  → mock local             │
│                                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────────────────┐   │
│  │  Aether  │   │  Nexus   │   │ Horarios │   │   Cortex UI        │   │
│  │ (notas)  │   │ (kanban) │   │          │   │ (CortexTab, Panel) │   │
│  └──────────┘   └──────────┘   └──────────┘   └────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Reglas de seguridad obligatorias (no negociables):**
- `nodeIntegration: false` — el renderer nunca tiene acceso directo a Node.js
- `contextIsolation: true` — el preload corre en un contexto aislado
- `contextBridge` es la única vía de comunicación entre renderer y main
- El preload expone solo las APIs explícitamente declaradas en `electron/types.d.ts`

#### **4.3.1 Main Process — electron/main.ts**

Responsabilidades:
- Crear la `BrowserWindow` y cargar la React app (en `dev`: `http://localhost:5173`; en `prod`: `dist/index.html`)
- Instanciar `CortexOrchestrator` y pasarle transportes `spawn()` reales
- Registrar handlers `ipcMain.handle()` para cada operación de Cortex
- Gestionar el ciclo de vida: `app.on('window-all-closed')`, shutdown limpio de subprocesos

#### **4.3.2 Preload — electron/preload.ts**

Responsabilidades:
- Exponer al renderer una API tipada mediante `contextBridge.exposeInMainWorld('cortexAPI', {...})`
- Nunca exponer `ipcRenderer` directamente — solo wrappers de `ipcRenderer.invoke()`
- Definir la forma exacta de la API en `electron/types.d.ts` para que TypeScript la vea en `src/`

#### **4.3.3 Renderer — src/ (sin cambios)**

La React app detecta si `window.cortexAPI` existe:
- Si existe (modo Electron) → usa las APIs reales del bridge
- Si no existe (modo web/`vite dev` sin Electron) → usa mocks locales

Este patrón garantiza que la app no rompe en ningún entorno.

### **4.4 Fases de Migración Incremental**

#### **Fase A — Electron Shell**

Envolver la SPA en Electron sin tocar ningún comportamiento de negocio.

**Cambios:**
- `package.json`: agregar `electron`, `vite-plugin-electron` como devDependencies; agregar campo `main: "dist-electron/main.js"`; agregar scripts `dev:electron` y `build:electron`
- `vite.config.ts`: importar y agregar el plugin `electron([{ entry: 'electron/main.ts' }, { entry: 'electron/preload.ts', onstart: ... }])`
- `electron/main.ts`: crear ventana, cargar app, sin ninguna integración de Cortex todavía
- `electron/preload.ts`: `contextBridge.exposeInMainWorld('cortexAPI', {})` — API vacía
- `electron/types.d.ts`: declarar `interface Window { cortexAPI: CortexAPI }`
- `tsconfig.json`: agregar path `"electron/*"` al include

**Criterio de done:**
- `npm run dev:electron` abre la app en ventana nativa
- Aether, Nexus y Horarios funcionan idénticamente a la SPA web
- Los 168 tests Vitest pasan sin modificación (`npm test`)
- `npm run build:electron` produce un instalador ejecutable

#### **Fase B — electron-store: Configuración Persistida**

Migrar el `ConfigStore` de `Map` en memoria a `electron-store` con cifrado en disco.

**Contexto del estado actual:** `ConfigStore` ya tiene cifrado AES-256-GCM implementado (`encryptKey`/`decryptKey` con scrypt). El problema es que el store es un `Map<string, string>` volátil — se pierde al cerrar la app. `electron-store` provee la persistencia en disco; la capa de cifrado existente se conserva.

**Cambios:**
- `package.json`: agregar `electron-store` como dependencia de producción
- `electron/main.ts`: instanciar `new Store({ encryptionKey: masterSecret })` donde `masterSecret` viene de OS keychain (en primera iteración: variable de entorno `CORTEX_MASTER_SECRET` → en iteración siguiente: `keytar` para OS keychain nativo)
- `ipcMain.handle('config:set', ...)` y `ipcMain.handle('config:get', ...)` delegando a `electron-store`
- `electron/preload.ts`: exponer `cortexAPI.config.set()` y `cortexAPI.config.get()`
- Variables de entorno `.env` con API keys → migrar a `electron-store` cifrado en primer uso
- `src/cortex/config/ConfigStore.ts`: sin cambios de código — el store se inyecta desde main

**Criterio de done:**
- Las API keys sobreviven reinicios de la app
- `npm test` sigue pasando (ConfigStore tiene su propio test con mock — no se toca)
- Las keys no aparecen en texto plano en el directorio de datos de la app

#### **Fase C — CortexOrchestrator Real: RuVector**

Conectar el orquestador ya implementado con `spawn()` real del binario RuVector.

**Contexto:** `SubprocessAdapter` ya existe con `SubprocessTransport` como interfaz inyectable. En los tests unitarios, se inyecta un mock. En producción (Fase C), se inyecta un `StdioTransport` real que envuelve el `ChildProcess` de Node.js.

**Cambios:**
- Nuevo archivo `electron/transports/StdioTransport.ts`: implementación de `SubprocessTransport` sobre `child_process.spawn()` y `readline` para parsear NDJSON (usando `parseIPCMessage` de `src/cortex/ipc/IPCProtocol.ts`)
- `electron/main.ts`: instanciar `CortexOrchestrator` con `StdioTransport` real para RuVector
- Registrar handlers IPC para operaciones de RuVector: `cortex:index`, `cortex:query`
- `scripts/setup.mjs`: extender para descargar/verificar el binario de RuVector según la plataforma
- `electron/preload.ts`: exponer `cortexAPI.index()` y `cortexAPI.query()`

**Criterio de done:**
- `npm run dev:electron`: la app puede indexar un documento y ejecutar una query semántica real
- El heartbeat de `CortexOrchestrator` detecta si RuVector cae y lo reinicia (máx. 3 intentos, según `shouldRestart()` ya implementado)
- `npm test` sigue pasando

#### **Fase D — Docling y Whisper**

Agregar los subprocesos de OCR/PDF (Docling, Python) y transcripción (Whisper, binario).

**Cambios:**
- `electron/transports/StdioTransport.ts`: ya reutilizable — instanciar una vez por subproceso
- `electron/main.ts`: spawn de Docling (Python runner) y Whisper (binario Rust/C++)
- Handlers IPC: `cortex:process-document`, `cortex:transcribe`
- `scripts/setup.mjs`: descargar/verificar Whisper binario; verificar entorno Python para Docling
- `electron/preload.ts`: exponer `cortexAPI.processDocument()` y `cortexAPI.transcribe()`

**Consideración sobre Docling:** Ver sección 10 (Preguntas Abiertas) — la estrategia de empaquetado del entorno Python aún no está resuelta.

**Criterio de done:**
- Un PDF puede ser procesado por Docling y sus chunks indexados en RuVector
- Un audio `.wav` puede ser transcrito por Whisper y la nota creada en Aether
- Los subprocesos que caen son reiniciados automáticamente con el anti-bucle existente

#### **Fase E — Observer AI y UI Final**

Activar la captura de audio de conferencias y el panel flotante de Cortex.

**Cambios:**
- `electron/main.ts`: spawn de Observer AI solo cuando el usuario activa el toggle (ya modelado en `ObserverAIToggle.tsx` y `observerStore.ts`)
- `WavManager.ts` (ya existe): conectar con el directorio real de la app (`app.getPath('userData')`)
- `ConferencePipeline.ts` (ya existe): conectar con los transportes reales de Whisper y Docling
- `CortexFloatingPanel.tsx` (ya existe): conectar con `cortexAPI` real en lugar del mock
- Política de retención de `.wav`: implementar limpieza automática a las 24h

**Criterio de done:**
- El usuario puede activar Observer AI, capturar una conferencia, y ver la transcripción en Aether
- El panel flotante muestra resultados de queries en tiempo real
- Los archivos `.wav` se eliminan automáticamente tras la transcripción

### **4.5 Plan de Coexistencia Web / Desktop**

La app debe funcionar en ambos contextos sin bifurcar el código de React.

```
// Patrón de detección — un único helper en src/cortex/bridge/
export function getCortexAPI(): CortexAPI {
  if (typeof window !== 'undefined' && window.cortexAPI) {
    // Modo Electron — API real del contextBridge
    return window.cortexAPI;
  }
  // Modo web / vite dev sin Electron — mock local
  return mockCortexAPI;
}
```

**Comportamiento por modo:**

| Capacidad | Modo web (`vite dev`) | Modo Electron |
|---|---|---|
| Aether, Nexus, Horarios | Funcional (Firebase) | Funcional (Firebase) |
| Cortex query semántica | Mock — respuestas simuladas | RuVector real |
| Indexado de documentos | No-op silencioso | Docling + RuVector real |
| Transcripción de conferencias | No disponible (UI desactivada) | Whisper real |
| ConfigStore | Map en memoria (volátil) | electron-store cifrado |
| Tests Vitest | Pasan (mocks inyectados) | No aplica (CI) |

El mock nunca lanza errores — degrada silenciosamente. El usuario web ve los componentes de Cortex en estado "no disponible en versión web" en lugar de una pantalla de error.

### **4.6 Cambios en package.json**

```jsonc
{
  "main": "dist-electron/main.js",
  "scripts": {
    "dev:electron": "vite",       // vite-plugin-electron arranca electron automáticamente
    "build:electron": "vite build && electron-builder"
  },
  "devDependencies": {
    "electron": "^32.0.0",        // NUEVO
    "vite-plugin-electron": "^0.29.0"  // NUEVO
    // electron-builder ya está en release.yml — verificar si ya está en devDeps
  },
  "dependencies": {
    "electron-store": "^10.0.0"   // NUEVO — dependencia de producción (empaquetada)
  }
}
```

**Nota sobre peer deps:** El proyecto ya usa `overrides` en package.json para resolver conflictos de peer deps de Vite 8. Agregar `electron` puede introducir conflictos adicionales — resolver con el mismo mecanismo de overrides existente.

### **4.7 Cambios en vite.config.ts**

```typescript
// Agregar al bloque de imports:
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

// Agregar al array plugins[]:
electron([
  {
    entry: 'electron/main.ts',
    vite: {
      build: { outDir: 'dist-electron' }
    }
  },
  {
    entry: 'electron/preload.ts',
    onstart(options) {
      options.reload(); // recarga el renderer cuando preload cambia
    },
    vite: {
      build: { outDir: 'dist-electron' }
    }
  }
]),
renderer(), // permite usar módulos Node.js en el renderer si es necesario (usar con precaución)
```

**El resto de `vite.config.ts` no cambia:** `tailwindcss`, `react`, `VitePWA` y toda la configuración de `test` se mantienen idénticos.

**Nota sobre VitePWA:** En modo Electron, el Service Worker no aplica. `vite-plugin-pwa` debe configurarse para no registrarse cuando `window.cortexAPI` está presente. Esto evita conflictos entre el SW y el proceso renderer de Electron.

### **4.8 Cambios en tsconfig.json**

```jsonc
{
  "include": [
    "src",
    "electron"   // NUEVO — para que tsc compile electron/
  ],
  "compilerOptions": {
    "paths": {
      // Existentes...
    }
  }
}
```

Se necesita un `tsconfig.electron.json` separado para el proceso main (target `ES2022`, module `CommonJS` o `ESNext` según `vite-plugin-electron`), para no contaminar la configuración del renderer (que apunta a `ESNext` para el browser).

### **4.9 Extensión de scripts/setup.mjs**

El script de setup ya existe. Se extiende para:

```
scripts/setup.mjs (fases adicionales):

Fase C+:
  1. Detectar plataforma (process.platform: win32 / darwin / linux)
  2. Descargar binario RuVector desde GitHub Releases (URL versionada)
  3. Verificar hash SHA-256 del binario
  4. Marcar como ejecutable (chmod +x en Unix)
  5. Descargar modelo Whisper por defecto (base.en o small)
  6. Verificar entorno Python ≥ 3.10 para Docling
     └── Si no existe → instrucciones de instalación, no abortar

El setup no es un pre-requisito de `npm install` — es un paso explícito:
  npm run setup   →   node scripts/setup.mjs
```

---

## **5. Alternativas Consideradas**

Esta RFC asume Electron como decisión ya tomada (ADR-001). Se resume brevemente para completitud:

- **Tauri:** Bundle más liviano, mejor rendimiento nativo. Rechazado por alto costo de migración del frontend React existente y curva de aprendizaje del bridge en Rust.
- **Servidor Express local + navegador:** Sin migración de frontend. Rechazado porque no resuelve captura de audio del sistema ni gestión de subprocesos, y la experiencia del usuario es fragmentada.
- **Cortex en la nube:** Sin migración. Rechazado porque elimina el diferenciador de privacidad local (REQ-11 del PRD).

Para el análisis completo de alternativas, ver ADR-001.

---

## **6. Impacto Técnico**

### **6.1 Archivos Nuevos**

| Archivo | Descripción |
|---|---|
| `electron/main.ts` | Proceso principal: ventana, spawn de subprocesos, ipcMain handlers |
| `electron/preload.ts` | contextBridge: API segura expuesta al renderer |
| `electron/types.d.ts` | Tipos TypeScript de `window.cortexAPI` compartidos con `src/` |
| `electron/transports/StdioTransport.ts` | Implementación real de `SubprocessTransport` sobre stdio |

### **6.2 Archivos Modificados**

| Archivo | Cambio |
|---|---|
| `vite.config.ts` | Agregar `vite-plugin-electron` al array de plugins |
| `package.json` | Nuevas devDependencies (`electron`, `vite-plugin-electron`), dependencia de producción (`electron-store`), campos `main` y scripts nuevos |
| `tsconfig.json` | Agregar `electron/` al include; agregar `tsconfig.electron.json` para el proceso main |
| `scripts/setup.mjs` | Extender para descarga de binarios (Fase C+) |

### **6.3 Archivos Sin Cambios**

```
src/                          — TODA la app React se mantiene intacta
src/cortex/                   — Toda la lógica de negocio de Cortex
src/cortex/ipc/               — IPCProtocol (parseIPCMessage, etc.)
src/cortex/orchestrator/      — CortexOrchestrator (shouldRestart, etc.)
src/cortex/subprocess/        — SubprocessAdapter (interfaz inyectable)
src/cortex/config/            — ConfigStore (cifrado AES-256-GCM)
src/cortex/ui/                — Todos los componentes React de Cortex
src/test/                     — Setup de tests
vitest.config.ts (embebido)   — Configuración de tests (dentro de vite.config.ts)
.github/workflows/            — CI se actualiza solo para agregar matriz multiplataforma
```

---

## **7. Plan de Implementación por Fases**

| Fase | Descripción | Prerrequisito | Criterio de Done |
|---|---|---|---|
| **A** | Electron Shell | — | App abre en ventana nativa; Aether/Nexus/Horarios idénticos; 168 tests pasan; build produce instalador |
| **B** | electron-store | Fase A | API keys persisten entre reinicios; keys no visibles en texto plano; tests pasan |
| **C** | CortexOrchestrator + RuVector real | Fase B | Indexado y query semántica funcionales en desktop; anti-bucle de crashes activo |
| **D** | Docling + Whisper | Fase C | PDF procesado end-to-end; audio transcrito y nota creada en Aether |
| **E** | Observer AI + UI final | Fase D | Toggle de conferencias funcional; panel flotante con resultados reales; retención .wav aplicada |

**Política de rollback:** Cada fase es un conjunto de commits atómicos en una rama separada (`feat/electron-phase-a`, etc.). Si una fase introduce regresiones, se puede revertir sin afectar las fases anteriores.

**Paralelización posible:**
- La documentación de `electron/types.d.ts` puede escribirse en paralelo con la Fase A
- Los mocks del `StdioTransport` para tests de integración pueden prepararse en paralelo con la Fase B
- La extensión de `scripts/setup.mjs` puede desarrollarse en paralelo con la Fase B

---

## **8. Estrategia de Testing**

### **8.1 Tests Unitarios Existentes (Vitest)**

Los 168 tests en `src/**/*.test.{ts,tsx}` no deben ser modificados. Corren en `jsdom` sin Electron. Esto es posible porque `SubprocessAdapter` usa la interfaz `SubprocessTransport` inyectable — los tests siguen usando mocks.

**Verificación en cada fase:** `npm test` debe pasar antes de hacer merge de cualquier rama de fase.

### **8.2 Nuevos Tests de Integración — contextBridge**

Se agregan tests de integración que verifican el contrato entre preload y main:

```
src/cortex/bridge/           ← AetherIndexBridge.ts ya existe
electron/tests/
  ├── preload.test.ts         ← Verifica que cortexAPI está correctamente expuesto
  ├── ipc-handlers.test.ts    ← Verifica que ipcMain handlers responden correctamente
  └── config-store.test.ts    ← Verifica persistencia de electron-store
```

Estos tests usan `spectron` o el helper oficial de testing de Electron. No corren en `jsdom` — corren en un entorno Electron headless.

### **8.3 Tests E2E con Binarios Reales**

El archivo `src/cortex/e2e/cortex.e2e.test.ts` ya existe con tests desactivados (guard por variable de entorno `E2E=true`). En Fase C+ se habilitan en CI con la condición:

```yaml
# .github/workflows/ci.yml — añadir job de E2E
e2e:
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  env:
    E2E: 'true'
  steps:
    - run: node scripts/setup.mjs   # descarga binarios
    - run: npm run test:e2e
```

Los E2E solo corren en `main` (no en cada PR) para no bloquear el feedback rápido.

### **8.4 Matriz Multiplataforma en CI**

```yaml
# .github/workflows/ci.yml — matrix para tests en las 3 plataformas
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
```

La Fase A activa esta matriz. Si un test falla solo en Windows o solo en macOS, se detecta antes de llegar a producción.

---

## **9. Seguridad**

**Modelo de amenaza para el bridge Main↔Renderer:**

```
RENDERER (no confiable)
    │
    │   Solo puede llamar métodos explícitamente
    │   declarados en contextBridge
    │
    ▼
contextBridge  ← ÚNICO PUNTO DE ENTRADA
    │
    │   ipcRenderer.invoke() → IPC seguro
    │
    ▼
MAIN PROCESS (confiable)
    │
    │   Valida y sanitiza cada argumento
    │   antes de pasarlo a subprocesos
    │
    ▼
Subprocesos (spawn aislado)
```

**Configuraciones de seguridad obligatorias en `BrowserWindow`:**

```typescript
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,          // El renderer NO tiene acceso a Node.js
    contextIsolation: true,          // El preload corre aislado
    sandbox: true,                   // Sandbox del proceso renderer activado
    preload: path.join(__dirname, 'preload.js'),
    webSecurity: true,               // No deshabilitar — nunca
  }
})
```

**Almacenamiento de secrets:**
- `electron-store` cifra el archivo de configuración en disco (Fase B)
- El `masterSecret` para derivar la clave AES viene de variable de entorno en Fase B → OS keychain nativo (`keytar`) en iteraciones posteriores
- Las API keys nunca se loguean ni aparecen en stack traces

**Permisos de sistema:**
- El micrófono se solicita mediante `systemPreferences.askForMediaAccess('microphone')` — diálogo nativo del OS
- No se accede al micrófono sin consentimiento explícito del usuario

**Subprocesos:**
- Se spawnean sin `shell: true` para evitar shell injection
- Los argumentos se pasan como array, nunca como string concatenado
- Los subprocesos no tienen acceso a internet excepto los explícitamente diseñados para ello (AutoResearchClaw)

---

## **10. Preguntas Abiertas**

### **10.1 Empaquetado del Entorno Python de Docling**

Docling requiere Python ≥ 3.10 y sus dependencias. Hay tres estrategias:

| Estrategia | Pros | Contras |
|---|---|---|
| **PyInstaller** — compilar Docling como binario standalone | El usuario no necesita Python instalado; un único ejecutable | Bundle grande (~200MB adicionales); actualizaciones de Docling requieren recompilar |
| **Bundled venv** — incluir un venv en el instalador | Más flexible para actualizaciones de dependencias Python | El instalador incluye el venv completo (~150-300MB según modelos) |
| **Require Python** — el setup.mjs verifica Python y hace `pip install` | Bundle pequeño; siempre usa la versión más reciente | Experiencia de instalación más frágil; falla si el usuario no tiene Python |

**Decisión pendiente.** La opción recomendada es PyInstaller para la Fase D inicial por la experiencia de usuario más simple. Se revisará basándose en el tamaño real del bundle.

### **10.2 Firma de Código en macOS**

`electron-builder` requiere un Apple Developer ID para firmar y notarizar el bundle en macOS. Sin firma:
- macOS Gatekeeper bloquea la app la primera vez (el usuario puede bypassearlo manualmente)
- En Catalina+ con Gatekeeper activado, la experiencia es degradada

**Opciones:**
- Fase A-D: distribuir sin firma (para desarrollo y early adopters que aceptan el bypass)
- Antes del release público: obtener Apple Developer ID ($99 USD/año)

El `release.yml` ya tiene el scaffolding para firma — solo falta el certificado.

### **10.3 Auto-Update**

`electron-updater` ya está referenciado en `release.yml`. El mecanismo está configurado pero no se conecta con el código de la app todavía. Se necesita:
- Un endpoint de GitHub Releases (ya existe el workflow) que sirva los metadatos de update
- `autoUpdater.checkForUpdatesAndNotify()` en `electron/main.ts`
- UI de notificación de update disponible (componente a agregar en Fase E)

**Decisión pendiente:** ¿Updates silenciosos automáticos o notificación + confirmación del usuario? Se recomienda notificación + confirmación para una app que maneja datos locales sensibles.

### **10.4 Modelo de Whisper por Defecto**

| Modelo | Velocidad | Precisión | Tamaño | Recomendación |
|---|---|---|---|---|
| `tiny` | Muy rápido | Baja | 75MB | No recomendado para acento rioplatense |
| `base` | Rápido | Media | 145MB | Default inicial — buen balance |
| `small` | Moderado | Alta | 483MB | Recomendado si el hardware lo permite |

**Decisión pendiente.** Default: `base`. El usuario puede cambiar en configuración. Evaluar `small` tras pruebas con muestras de audio reales en español rioplatense.

---

## **11. Apéndices y Referencias**

**Documentos del proyecto:**
- ADR - Cortex (Carrera LTI).md (ADR-001) — decisión de usar Electron
- RFC-001 - Arquitectura Cortex (Carrera LTI).md — arquitectura del sistema Cortex

**Código fuente relevante:**
- `src/cortex/ipc/IPCProtocol.ts` — protocolo NDJSON ya implementado
- `src/cortex/subprocess/SubprocessAdapter.ts` — adaptador con interfaz inyectable
- `src/cortex/orchestrator/CortexOrchestrator.ts` — lógica anti-bucle de crashes
- `src/cortex/config/ConfigStore.ts` — cifrado AES-256-GCM ya implementado
- `src/cortex/e2e/cortex.e2e.test.ts` — tests E2E listos para activar

**Referencias externas:**
- [Electron Security Docs](https://www.electronjs.org/docs/latest/tutorial/security)
- [vite-plugin-electron GitHub](https://github.com/electron-vite/vite-plugin-electron)
- [electron-store GitHub](https://github.com/sindresorhus/electron-store)
- [electron-builder Docs](https://www.electron.build/)
- [Whisper GitHub](https://github.com/openai/whisper)
- [Docling GitHub](https://github.com/docling-project/docling)
- [RuVector GitHub](https://github.com/ruvnet/RuVector)
