# **Plan de Pruebas Unitarias y Estrategia TDD — Fase Electron (Carrera LTI)**

**Proyecto:** Cortex — Carrera LTI
**Referencia FSD:** FSD - Cortex (Carrera LTI).md
**Referencia Plan TDD base:** Plan TDD - Cortex (Carrera LTI).md
**Estado:** Borrador
**Fecha:** 2026-03-22
**Arquitecto de Pruebas:** Juan

---

## **1. Filosofía y Relación con el Plan TDD V2.0**

### **1.1 Este Documento es una Extensión, no un Reemplazo**

El **Plan TDD V2.0** (168 tests unitarios existentes) cubre la lógica de negocio pura de Cortex: `CortexOrchestrator`, `GroundingValidator`, `QueueManager`, `FeedbackStore`, `IPCProtocol`, `WavManager`, y `ConfigStore`. Esos tests no cambian, no se mueven, y siguen siendo la base de la pirámide de calidad.

La migración a **Electron** introduce capas nuevas que el Plan V2.0 no contempla:

- Un **Main Process** que ejecuta Node.js, lanza subprocesos y registra handlers en `ipcMain`.
- Un **Renderer Process** que ejecuta React y solo puede comunicarse con el Main Process a través del `contextBridge`.
- Un **preload script** (`preload.ts`) que es la única superficie de contacto permitida entre ambos mundos.
- Subprocesos externos reales (RuVector, Docling, Whisper) que se comunican por stdio NDJSON.

Este documento define la estrategia TDD para esas tres capas nuevas.

### **1.2 El Ciclo Red-Green-Refactor en el Contexto Electron**

El mismo ciclo se aplica, pero el "aislamiento" ahora tiene una dimensión adicional: **aislar el proceso de Electron del código bajo prueba**.

1. **Red:** Escribir el test que falla para el handler de `ipcMain` sin lanzar Electron real.
2. **Green:** Implementar el handler usando el mock de `ipcMain` hasta que el test pase.
3. **Refactor:** Limpiar el handler asegurando que el mock sigue siendo válido.

### **1.3 Principio de Aislamiento — Reglas para la Fase Electron**

Las pruebas unitarias y de integración ligera en la fase Electron NO deben depender de:

- Una instancia real de Electron ejecutándose.
- El módulo `electron` nativo (siempre mockeado en tests unitarios y de bridge).
- Un `BrowserWindow` real (mockear el constructor completo).
- Binarios externos reales (RuVector, Docling, Whisper) salvo en tests E2E marcados con `E2E=true`.
- El filesystem real salvo en tests de integración con `memfs` o directorios temporales.

**Excepción explícita:** Los tests E2E del pipeline completo SÍ usan los binarios reales, pero solo cuando la variable de entorno `E2E=true` está activa y los binarios están instalados en el entorno de ejecución.

---

## **2. Nuevas Categorías de Tests que Introduce la Fase Electron**

La migración agrega **cuatro categorías** por encima de los 168 tests existentes:

| Categoría | Qué cubre | Entorno Vitest | Requiere binarios |
|---|---|---|---|
| **Main Process** | `ipcMain` handlers, spawn de subprocesos | `node` | No |
| **contextBridge / Preload** | APIs expuestas al Renderer, contrato de seguridad | `node` | No |
| **E2E con binarios reales** | Pipeline completo RuVector, Docling, Whisper | `node` | Sí (`E2E=true`) |
| **Setup e instalación** | `scripts/setup.mjs`, detección de binarios, cifrado | `node` | Parcialmente |

---

## **3. Categoría 2.1 — Tests del Main Process**

### **3.1 Alcance**

El Main Process en Cortex hace tres cosas que necesitan cobertura de tests propia:

- Registrar handlers en `ipcMain.handle()` que responden a invocaciones del Renderer.
- Lanzar subprocesos externos via `child_process.spawn()` y gestionar su ciclo de vida.
- Exponer rutas del sistema (`app.getPath('userData')`) y configurar la ventana principal.

### **3.2 Entorno de Vitest**

Los tests del Main Process corren en entorno `node`. No usar `jsdom` — no existe `window` en el Main Process y su presencia contamina los tests.

```typescript
// vitest.config.ts — pool separado para Main Process
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    workspace: [
      {
        // Tests unitarios del Renderer (jsdom)
        test: {
          name: 'renderer',
          include: ['src/cortex/**/*.test.ts'],
          exclude: ['src/cortex/main/**', 'src/cortex/bridge/**', 'src/cortex/e2e/**'],
          environment: 'jsdom',
        },
      },
      {
        // Tests del Main Process y bridge (node puro)
        test: {
          name: 'main',
          include: [
            'src/cortex/main/**/*.test.ts',
            'src/cortex/bridge/**/*.test.ts',
            'src/cortex/e2e/**/*.test.ts',
          ],
          environment: 'node',
        },
      },
    ],
  },
});
```

### **3.3 Casos de Prueba — ipcMain Handlers**

```typescript
// src/cortex/main/ipcHandlers.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerIpcHandlers } from '../main/ipcHandlers';

// El mock de electron se carga automáticamente desde src/cortex/__mocks__/electron.ts
vi.mock('electron');

describe('ipcHandlers — cortex:query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_register_cortex_query_handler_on_startup', () => {
    const { ipcMain } = await import('electron');
    registerIpcHandlers();
    expect(ipcMain.handle).toHaveBeenCalledWith('cortex:query', expect.any(Function));
  });

  it('should_return_grounded_result_when_index_has_matches', async () => {
    const { ipcMain } = await import('electron');
    registerIpcHandlers();

    // Extraer el handler registrado
    const handler = (ipcMain.handle as ReturnType<typeof vi.fn>).mock.calls
      .find(([channel]) => channel === 'cortex:query')?.[1];

    const result = await handler({} /* event */, { query: 'TCP handshake', topK: 5 });
    expect(result.status).toBe('ok');
    expect(result.sources).toBeDefined();
  });

  it('should_return_error_when_query_is_empty_string', async () => {
    const { ipcMain } = await import('electron');
    registerIpcHandlers();

    const handler = (ipcMain.handle as ReturnType<typeof vi.fn>).mock.calls
      .find(([channel]) => channel === 'cortex:query')?.[1];

    const result = await handler({}, { query: '', topK: 5 });
    expect(result.status).toBe('error');
    expect(result.error).toMatch(/query vacío/i);
  });

  it('should_not_expose_raw_api_key_in_ipc_response', async () => {
    const { ipcMain } = await import('electron');
    registerIpcHandlers();

    const handler = (ipcMain.handle as ReturnType<typeof vi.fn>).mock.calls
      .find(([channel]) => channel === 'cortex:query')?.[1];

    const result = await handler({}, { query: 'test', topK: 1 });
    expect(JSON.stringify(result)).not.toMatch(/sk-/);
  });
});
```

### **3.4 Casos de Prueba — Spawn de Subprocesos**

```typescript
// src/cortex/main/subprocessSpawn.test.ts
import { describe, it, expect, vi } from 'vitest';
import { spawnRuVector, shutdownSubprocess } from '../main/subprocessManager';

vi.mock('child_process', () => ({
  spawn: vi.fn().mockReturnValue({
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn(),
    pid: 12345,
    kill: vi.fn(),
  }),
}));

describe('SubprocessManager — RuVector spawn', () => {
  it('should_spawn_ruvector_with_correct_binary_path', async () => {
    const { spawn } = await import('child_process');
    await spawnRuVector({ indexPath: '/data/index' });
    expect(spawn).toHaveBeenCalledWith(
      expect.stringContaining('ru_vector'),
      expect.arrayContaining(['--index', '/data/index']),
      expect.objectContaining({ stdio: 'pipe' })
    );
  });

  it('should_send_ndjson_init_message_after_spawn', async () => {
    const process = await spawnRuVector({ indexPath: '/data/index' });
    expect(process.stdin?.write).toHaveBeenCalledWith(
      expect.stringContaining('"action":"init"')
    );
  });

  it('should_call_kill_on_shutdown', async () => {
    const { spawn } = await import('child_process');
    const mockProcess = (spawn as ReturnType<typeof vi.fn>).mock.results[0].value;
    await shutdownSubprocess(mockProcess);
    expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('should_not_throw_when_killing_already_dead_process', async () => {
    const deadProcess = {
      kill: vi.fn().mockImplementation(() => { throw new Error('ESRCH'); }),
      killed: true,
    };
    await expect(shutdownSubprocess(deadProcess as any)).resolves.not.toThrow();
  });
});
```

---

## **4. Categoría 2.2 — Tests del contextBridge / Preload**

### **4.1 Alcance y Principio de Seguridad**

El `preload.ts` es la única superficie de contacto entre el Main Process (con acceso total a Node.js) y el Renderer Process (que corre código web sin privilegios elevados). Los tests de esta capa verifican **contratos de seguridad**, no implementación:

- Las APIs expuestas tienen la firma correcta.
- `nodeIntegration` está desactivado en la configuración de `BrowserWindow`.
- El objeto `electron` completo nunca se expone al Renderer.
- Solo las funciones explícitamente listadas en `contextBridge.exposeInMainWorld` son accesibles.

### **4.2 Estrategia — Tests de Contrato**

```typescript
// src/cortex/bridge/contextBridge.test.ts
import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn(),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
}));

describe('preload — contrato de contextBridge', () => {
  let exposedApi: Record<string, unknown>;

  beforeAll(async () => {
    const { contextBridge } = await import('electron');
    // Ejecutar el preload — esto llama a exposeInMainWorld
    await import('../bridge/preload');

    // Capturar el objeto expuesto
    const call = (contextBridge.exposeInMainWorld as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('cortex'); // namespace en window
    exposedApi = call[1] as Record<string, unknown>;
  });

  it('should_expose_api_under_window_cortex_namespace', () => {
    expect(exposedApi).toBeDefined();
  });

  it('should_expose_query_function', () => {
    expect(typeof exposedApi.query).toBe('function');
  });

  it('should_expose_indexDocument_function', () => {
    expect(typeof exposedApi.indexDocument).toBe('function');
  });

  it('should_expose_onTranscriptionReady_listener', () => {
    expect(typeof exposedApi.onTranscriptionReady).toBe('function');
  });

  it('should_NOT_expose_raw_ipcRenderer_object', () => {
    // Seguridad: el Renderer no debe obtener ipcRenderer directamente
    expect(exposedApi).not.toHaveProperty('ipcRenderer');
  });

  it('should_NOT_expose_electron_object_directly', () => {
    expect(exposedApi).not.toHaveProperty('electron');
    expect(exposedApi).not.toHaveProperty('require');
    expect(exposedApi).not.toHaveProperty('process');
  });

  it('should_call_ipcRenderer_invoke_when_query_is_called', async () => {
    const { ipcRenderer } = await import('electron');
    await (exposedApi.query as Function)({ query: 'test', topK: 5 });
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('cortex:query', { query: 'test', topK: 5 });
  });

  it('should_validate_query_input_before_invoking_ipc', async () => {
    await expect(
      (exposedApi.query as Function)({ query: '', topK: 5 })
    ).rejects.toThrow();
  });
});
```

### **4.3 Tests del Renderer que Usan la API del Preload**

Cuando los tests de componentes React del Renderer necesitan usar `window.cortex`, se mockea el objeto global, no se importa electron:

```typescript
// Setup en vitest.setup.ts o en el propio describe block
Object.defineProperty(window, 'cortex', {
  value: {
    query: vi.fn().mockResolvedValue({ status: 'ok', results: [], sources: [] }),
    indexDocument: vi.fn().mockResolvedValue({ status: 'ok', chunks: 0 }),
    onTranscriptionReady: vi.fn(),
    offTranscriptionReady: vi.fn(),
  },
  writable: true,
});
```

---

## **5. Categoría 2.3 — Tests E2E con Binarios Reales**

### **5.1 Alcance**

Los tests E2E con binarios reales verifican que el protocolo NDJSON de Cortex funciona de extremo a extremo con los binarios compilados de producción. Son los únicos tests que requieren instalación previa de dependencias.

**Guard obligatorio en todos los tests E2E:**

```typescript
const RUN_E2E = process.env.E2E === 'true';

describe.skipIf(!RUN_E2E)('E2E — RuVector pipeline completo', () => {
  // ...
});
```

### **5.2 Casos de Prueba — Pipeline RuVector**

```typescript
// src/cortex/e2e/cortex.e2e.test.ts (extensión del archivo existente)
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnRuVector, shutdownSubprocess } from '../main/subprocessManager';
import { sendIpc, readIpcResponse } from '../main/ipcProtocol';

const RUN_E2E = process.env.E2E === 'true';

describe.skipIf(!RUN_E2E)('E2E — RuVector index → query → delete', () => {
  let ruVectorProcess: ReturnType<typeof spawnRuVector> extends Promise<infer T> ? T : never;
  const testIndexPath = '/tmp/cortex-e2e-test-index';
  const testDocId = 'e2e-doc-001';

  beforeAll(async () => {
    ruVectorProcess = await spawnRuVector({ indexPath: testIndexPath });
  }, 30_000); // timeout 30s para inicialización del binario

  afterAll(async () => {
    await shutdownSubprocess(ruVectorProcess);
  });

  it('should_index_test_document_and_return_chunk_count', async () => {
    const response = await sendIpc(ruVectorProcess, {
      id: 'e2e-index-001',
      action: 'index',
      payload: {
        doc_id: testDocId,
        content: 'El three-way handshake de TCP consiste en SYN, SYN-ACK y ACK.',
        metadata: { title: 'Apuntes Redes' },
      },
    });
    expect(response.status).toBe('ok');
    expect(response.data.chunks).toBeGreaterThan(0);
  }, 30_000);

  it('should_query_and_return_indexed_document', async () => {
    const response = await sendIpc(ruVectorProcess, {
      id: 'e2e-query-001',
      action: 'query',
      payload: { query: 'TCP handshake', top_k: 3 },
    });
    expect(response.status).toBe('ok');
    expect(response.data.results.some((r: any) => r.doc_id === testDocId)).toBe(true);
  }, 30_000);

  it('should_delete_indexed_document_and_confirm_removal', async () => {
    const deleteResponse = await sendIpc(ruVectorProcess, {
      id: 'e2e-delete-001',
      action: 'delete',
      payload: { doc_id: testDocId },
    });
    expect(deleteResponse.status).toBe('ok');

    // Verificar que ya no aparece en búsqueda
    const queryResponse = await sendIpc(ruVectorProcess, {
      id: 'e2e-query-002',
      action: 'query',
      payload: { query: 'TCP handshake', top_k: 3 },
    });
    expect(queryResponse.data.results.every((r: any) => r.doc_id !== testDocId)).toBe(true);
  }, 30_000);

  it('should_return_error_for_unknown_action', async () => {
    const response = await sendIpc(ruVectorProcess, {
      id: 'e2e-err-001',
      action: 'unknown_action_xyz',
      payload: {},
    });
    expect(response.status).toBe('error');
  }, 10_000);
}, { timeout: 30_000 });
```

### **5.3 Criterios de Aceptación E2E**

| Pipeline | Test mínimo aceptable | Timeout |
|---|---|---|
| RuVector init | El proceso arranca sin error en stderr | 30s |
| RuVector index → query | `query` retorna el documento recién indexado | 30s |
| RuVector delete | El documento no aparece tras `delete` | 30s |
| Docling PDF | Retorna chunks con texto extraído | 60s |
| Whisper audio | Retorna transcripción en < 2× duración del audio | 120s |

---

## **6. Categoría 2.4 — Tests de Instalación y Setup**

### **6.1 Alcance**

El script `scripts/setup.mjs` y la integración con `electron-store` son infraestructura de instalación que también necesita cobertura.

```typescript
// src/cortex/main/setup.test.ts
import { describe, it, expect, vi } from 'vitest';
import { detectMissingBinaries, downloadBinary } from '../../scripts/setup';

vi.mock('node:fs');
vi.mock('node:https');

describe('setup — detección de binarios', () => {
  it('should_detect_ruvector_binary_as_missing_when_not_on_disk', async () => {
    const { existsSync } = await import('node:fs');
    (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const missing = await detectMissingBinaries();
    expect(missing).toContain('ru_vector');
  });

  it('should_not_flag_binary_as_missing_when_present', async () => {
    const { existsSync } = await import('node:fs');
    (existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const missing = await detectMissingBinaries();
    expect(missing).toHaveLength(0);
  });

  it('should_report_download_progress_via_callback', async () => {
    const onProgress = vi.fn();
    await downloadBinary('ru_vector', { onProgress });
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({
      percent: expect.any(Number),
    }));
  });
});

describe('setup — ConfigStore con electron-store real', () => {
  it('should_encrypt_api_key_and_not_store_plaintext', () => {
    // Este test verifica la integración real con electron-store
    // Solo corre si electron-store está disponible en el entorno de test
    const store = new ConfigStore({ encryptionKey: 'test-key-32-chars-long-padding!!' });
    store.setApiKey('anthropic', 'sk-ant-test-key');
    const raw = store.getRawStore(); // acceso directo al archivo JSON
    expect(JSON.stringify(raw)).not.toContain('sk-ant-test-key');
  });
});
```

---

## **7. Estrategia de Mocking para Electron APIs**

### **7.1 Mock Centralizado de Electron**

Crear un único archivo de mock que todos los tests del Main Process y del bridge reutilizan:

```typescript
// src/cortex/__mocks__/electron.ts
import { vi } from 'vitest';

export const ipcMain = {
  handle: vi.fn(),
  on: vi.fn(),
  removeHandler: vi.fn(),
  emit: vi.fn(),
};

export const ipcRenderer = {
  invoke: vi.fn(),
  on: vi.fn(),
  send: vi.fn(),
  removeListener: vi.fn(),
};

export const app = {
  getPath: vi.fn().mockImplementation((key: string) => `/mock-path/${key}`),
  getVersion: vi.fn().mockReturnValue('1.0.0-test'),
  isPackaged: false,
};

export const BrowserWindow = vi.fn().mockImplementation(() => ({
  loadURL: vi.fn(),
  loadFile: vi.fn(),
  webContents: {
    send: vi.fn(),
    openDevTools: vi.fn(),
  },
  on: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  close: vi.fn(),
}));

export const dialog = {
  showOpenDialog: vi.fn().mockResolvedValue({ canceled: false, filePaths: ['/mock/file.pdf'] }),
  showMessageBox: vi.fn().mockResolvedValue({ response: 0 }),
};

export const contextBridge = {
  exposeInMainWorld: vi.fn(),
};
```

### **7.2 Activar el Mock Automáticamente**

Vitest detecta automáticamente los mocks en la carpeta `__mocks__` si se declaran con `vi.mock('electron')` en el test. El archivo `src/cortex/__mocks__/electron.ts` es el mock estándar del proyecto y no debe duplicarse en cada test.

```typescript
// Patrón estándar al inicio de cada test de Main Process o bridge
vi.mock('electron'); // Vitest cargará src/cortex/__mocks__/electron.ts automáticamente
```

### **7.3 Patrón de Mock para Tests del Renderer**

En tests de componentes React, el objeto `window.cortex` (expuesto por el preload) se mockea directamente sin involucrar el módulo de electron:

```typescript
// En vitest.setup.ts o en el bloque describe del componente
beforeEach(() => {
  Object.defineProperty(window, 'cortex', {
    value: {
      query: vi.fn().mockResolvedValue({
        status: 'ok',
        results: [{ id: 'doc-1', content: 'TCP handshake', score: 0.95 }],
        sources: [{ title: 'Apuntes Redes', path: '/docs/redes.md' }],
      }),
      indexDocument: vi.fn().mockResolvedValue({ status: 'ok', chunks: 3 }),
      onTranscriptionReady: vi.fn(),
      offTranscriptionReady: vi.fn(),
    },
    writable: true,
    configurable: true,
  });
});
```

---

## **8. Estructura de Archivos de Test**

```
src/cortex/
├── __mocks__/
│   ├── MockTimeProvider.ts          ← existente (sin cambios)
│   └── electron.ts                  ← nuevo — mock centralizado de APIs de Electron
│
├── main/
│   ├── ipcHandlers.test.ts          ← nuevo — handlers de ipcMain
│   └── subprocessSpawn.test.ts      ← nuevo — spawn/shutdown de subprocesos externos
│
├── bridge/
│   └── contextBridge.test.ts        ← nuevo — contrato de seguridad del preload
│
└── e2e/
    └── cortex.e2e.test.ts           ← existente — extender con pipeline de binarios reales
```

Los 168 tests existentes en `src/cortex/**/*.test.ts` (fuera de `main/`, `bridge/`, y `e2e/`) no se mueven ni modifican.

---

## **9. Configuración de Vitest para la Fase Electron**

### **9.1 Pool Separado para Main Process**

La configuración más importante: los tests del Main Process y del bridge necesitan `environment: 'node'` porque no existe `window` ni DOM en esas capas. Mezclarlos con los tests del Renderer (que usan `jsdom`) produce falsos positivos o errores de entorno.

```typescript
// vitest.config.ts (actualización)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    workspace: [
      {
        test: {
          name: 'renderer-unit',
          include: ['src/cortex/**/*.test.ts'],
          exclude: [
            'src/cortex/main/**',
            'src/cortex/bridge/**',
            'src/cortex/e2e/**',
          ],
          environment: 'jsdom',
          globals: true,
          setupFiles: ['src/cortex/vitest.setup.ts'],
        },
      },
      {
        test: {
          name: 'main-and-bridge',
          include: [
            'src/cortex/main/**/*.test.ts',
            'src/cortex/bridge/**/*.test.ts',
          ],
          environment: 'node',
          globals: true,
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['src/cortex/e2e/**/*.test.ts'],
          environment: 'node',
          globals: true,
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/cortex/**/*.ts'],
      exclude: ['src/cortex/**/*.test.ts', 'src/cortex/__mocks__/**'],
    },
  },
});
```

---

## **10. Cobertura por Módulo — Tabla Completa**

| Módulo | Unit (existente) | Main Process | Bridge | E2E |
|---|---|---|---|---|
| `CortexOrchestrator` | ✅ 90% | `ipcHandlers.test.ts` | — | Pipeline completo |
| `GroundingValidator` | ✅ 95% | — | — | — |
| `QueueManager` | ✅ 90% | — | — | — |
| `FeedbackStore` | ✅ 85% | — | — | — |
| `IPCProtocol` | ✅ 90% | `subprocessSpawn.test.ts` | — | Protocolo NDJSON real |
| `WavManager` | ✅ 90% | — | — | Whisper real |
| `ConfigStore` | ✅ 90% | `setup.test.ts` | — | — |
| `ipcHandlers` | — | `ipcHandlers.test.ts` ← nuevo | — | — |
| `subprocessManager` | — | `subprocessSpawn.test.ts` ← nuevo | — | Spawn real |
| `preload/contextBridge` | — | — | `contextBridge.test.ts` ← nuevo | — |
| `scripts/setup.mjs` | — | `setup.test.ts` ← nuevo | — | — |

**Objetivo de cobertura para módulos nuevos:**

| Módulo nuevo | Objetivo líneas | Objetivo ramas | Crítico si < |
|---|---|---|---|
| `ipcHandlers` | ≥ 90% | ≥ 90% | 80% |
| `subprocessManager` | ≥ 85% | ≥ 85% | 75% |
| `preload/contextBridge` | ≥ 95% | ≥ 95% | 90% |
| `scripts/setup.mjs` | ≥ 80% | ≥ 75% | 65% |

---

## **11. Criterios de "Done" para la Fase Electron**

Un pull request de la fase Electron solo puede mergearse cuando:

1. **Los 168 tests existentes siguen en verde.** Ningún refactor de la capa Electron puede romper los tests del Plan V2.0.

2. **Tests de Main Process:** `ipcHandlers.test.ts` y `subprocessSpawn.test.ts` cubren al menos el **90% de líneas** de sus módulos respectivos.

3. **Tests de contextBridge:** `contextBridge.test.ts` pasa en los **tres sistemas operativos** en CI (Ubuntu, macOS, Windows) y verifica explícitamente que `ipcRenderer` y `electron` no se exponen al Renderer.

4. **Tests E2E con RuVector real:** Al menos el pipeline `init → index → query → delete` pasa con `E2E=true` en el entorno de CI dedicado a E2E.

5. **Sin tests flaky:** Ningún test nuevo falla aleatoriamente en 3 ejecuciones consecutivas de CI.

6. **Cobertura global no retrocede:** El porcentaje de cobertura total del proyecto no puede bajar del porcentaje registrado antes de la fase Electron.

---

## **12. Automatización del Pipeline — Cambios Respecto al Plan V2.0**

El pipeline de CI existente (GitHub Actions) se extiende con un nuevo job, sin modificar los jobs existentes:

* **Job existente `unit-tests`:** Sigue corriendo los 168 tests en `environment: jsdom`. Sin cambios.
* **Job nuevo `main-and-bridge-tests`:** Corre los tests de Main Process y bridge en `environment: node`. Sin binarios. Tiempo objetivo: < 30 segundos.
* **Job nuevo `e2e-tests`:** Corre con `E2E=true` y los binarios instalados. Se ejecuta solo en ramas `main` y `release/*`, no en cada PR de feature. Tiempo aceptable: < 10 minutos.
* **Matrix de OS para bridge tests:** `contextBridge.test.ts` corre en la matriz `[ubuntu-latest, macos-latest, windows-latest]` para garantizar portabilidad del preload.
* **Cobertura:** El reporte de cobertura consolida los tres pools y se publica como comentario en el PR con delta respecto a la rama principal.

---

## **13. Guía para IA — Generación de Tests de la Fase Electron**

Instrucciones para agentes de codificación que generen tests de la fase Electron de Cortex:

1. **Mockear electron antes de cualquier import del Main Process:**
   ```typescript
   // SIEMPRE la primera línea del archivo de test, antes de cualquier import del módulo bajo prueba
   vi.mock('electron');
   import { registerIpcHandlers } from '../main/ipcHandlers';
   ```

2. **No usar `window` en tests de Main Process.** El entorno es `node`. Si un módulo del Main Process accede a `window`, ese es un bug de arquitectura que el test debe exponer, no silenciar.

3. **Para tests de Renderer que usan el contextBridge:** Mockear `window.cortex` como objeto con las mismas firmas que expone el preload. No importar `electron` en tests del Renderer.

4. **Patrón de verificación de handler de ipcMain:**
   ```typescript
   // Registrar los handlers
   registerIpcHandlers();

   // Extraer el handler por nombre de canal
   const { ipcMain } = await import('electron');
   const handler = (ipcMain.handle as ReturnType<typeof vi.fn>).mock.calls
     .find(([channel]) => channel === 'cortex:query')?.[1];

   // Invocar el handler directamente (no pasar por IPC real)
   const result = await handler(mockEvent, payload);
   expect(result.status).toBe('ok');
   ```

5. **Patrón AAA con contexto Electron:**
   ```typescript
   it('should_return_grounded_result_when_handler_invoked', async () => {
     // Arrange
     vi.mock('electron');
     registerIpcHandlers();
     const handler = extractHandler('cortex:query');
     const payload = { query: 'TCP handshake', topK: 5 };

     // Act
     const result = await handler({} /* mockEvent */, payload);

     // Assert
     expect(result.status).toBe('ok');
     expect(result.sources.length).toBeGreaterThan(0);
   });
   ```

6. **Tests de seguridad obligatorios en la capa bridge:**
   - Verificar que `window.cortex` no contiene `ipcRenderer`, `require`, ni `process`.
   - Verificar que la API expuesta rechaza inputs inválidos antes de invocar `ipcRenderer.invoke`.
   - Verificar que las respuestas del Main Process no incluyen API keys en texto plano.

7. **Nombres semánticos:** Mismo estándar que el Plan V2.0 — `should_[comportamiento]_when_[condición]()`.

8. **Timeout en tests E2E:** Todo test en `src/cortex/e2e/` debe declarar `{ timeout: 30_000 }` explícitamente. No asumir el timeout por defecto de Vitest.
