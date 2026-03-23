# **Plan de Pruebas Unitarias y Estrategia TDD — Cortex (Carrera LTI)**

**Proyecto:** Cortex — Carrera LTI
**Referencia FSD:** FSD - Cortex (Carrera LTI).md
**Referencia BDD:** BDD Gherkin - Cortex (Carrera LTI).md
**Estado:** Borrador
**Arquitecto de Pruebas:** Juan

---

## **1. Filosofía de Pruebas y Metodología TDD**

### **1.1 El Ciclo Red-Green-Refactor**

Cortex es un sistema con subprocesos externos y efectos de lado (filesystem, IPC, LLM). La estrategia TDD se aplica con énfasis en **aislar la lógica de negocio de la infraestructura**:

1. **Red:** Escribir el test que falla para la unidad lógica mínima (ej. `SubprocessManager.shouldRestart()`)
2. **Green:** Implementar el mínimo código para que pase (sin tocar subprocesos reales)
3. **Refactor:** Limpiar preservando los tests en verde

### **1.2 Las Tres Leyes del TDD (Uncle Bob)**

- No se escribe código de producción sin un test unitario fallando primero
- No se escribe más de un test unitario del que sea suficiente para fallar
- No se escribe más código de producción del necesario para pasar el test actual

### **1.3 Principio de Aislamiento**

Las pruebas unitarias en Cortex NO deben depender de:
- Subprocesos reales (Whisper, Docling, RuVector, Observer AI)
- Llamadas a internet (LLM, AutoResearchClaw)
- Sistema de archivos real (solo mocks de filesystem)
- Estado global de Electron (usar mocks de ipcMain/ipcRenderer)
- Firebase real (usar emuladores o mocks)

**Excepción explícita:** Los tests de integración E2E SÍ usan los subprocesos reales (pero en un entorno controlado, con datos de prueba predefinidos).

---

## **2. Objetivos de Cobertura y Calidad**

| Métrica | Objetivo | Crítico (bloquea release) |
|---|---|---|
| Cobertura de líneas | ≥ 85% | < 70% |
| Cobertura de ramas | ≥ 90% en módulos críticos | < 80% en módulos P0 |
| Complejidad ciclomática | ≤ 10 por función | > 15 |
| Tiempo de suite unitaria | < 30 segundos | > 2 minutos |
| Tests "flaky" | 0 | > 0 (bloquea merge) |

**Módulos críticos (cobertura ≥ 90% obligatoria):**
- `CortexOrchestrator` (gestión de subprocesos)
- `GroundingValidator` (verificación REQ-22)
- `QueueManager` (cola de procesamiento)
- `FeedbackStore` (señales de relevancia)
- `IPCProtocol` (serialización de mensajes)

---

## **3. Identificación de Unidades Críticas a Probar**

| Módulo | Función / Clase | Tipo de Prueba | Impacto | Prioridad |
|---|---|---|---|---|
| CortexOrchestrator | `shouldRestart(crashCount, lastStableAt)` | Unitaria / Lógica | Crítico (resiliencia) | P0 |
| CortexOrchestrator | `parseIPCMessage(rawLine)` | Unitaria / Seguridad | Crítico (protocolo) | P0 |
| QueueManager | `enqueue(operation)` / `dequeue()` | Unitaria / FIFO | Alto (pipeline) | P0 |
| QueueManager | `persistQueue()` / `restoreQueue()` | Unitaria / Persistencia | Alto (recovery) | P0 |
| GroundingValidator | `hasExternalKnowledge(response, chunks)` | Unitaria / Seguridad | Crítico (REQ-22) | P0 |
| FeedbackStore | `applyPenalty(results, feedbackHistory)` | Unitaria / Lógica | Medio (calidad) | P1 |
| FeedbackStore | `pruneExpired(retentionDays)` | Unitaria / Datos | Medio | P1 |
| WavManager | `deleteAfterTranscription(path)` | Unitaria / Privacidad | Crítico (privacidad) | P0 |
| ConfigStore | `encryptKey(rawKey)` / `decryptKey(encrypted)` | Unitaria / Seguridad | Crítico | P0 |
| OCRProcessor | `shouldWarnLowConfidence(score)` | Unitaria / UX | Bajo | P1 |
| AetherIndexBridge | `onDocumentSaved(event)` | Unitaria / Integración | Alto | P0 |

---

## **4. Estrategia de Mocking**

### **4.1 Mocks de Subprocesos (Stubs IPC)**

```typescript
// Mock de subproceso que simula RuVector
class MockSubprocess {
  private handlers: Map<string, (payload: unknown) => unknown> = new Map();

  // Registrar respuesta para una action específica
  mockAction(action: string, response: unknown) {
    this.handlers.set(action, () => response);
  }

  // Simular mensaje entrante
  simulateMessage(raw: string) {
    const msg = JSON.parse(raw);
    const handler = this.handlers.get(msg.action);
    return handler ? handler(msg.payload) : { status: 'error', error: 'unknown action' };
  }

  // Simular crash
  simulateCrash() {
    this.emit('exit', 1);
  }
}
```

### **4.2 Mock de Filesystem (WavManager, QueueManager)**

Usar `memfs` (virtual in-memory filesystem) para todos los tests que involucran lectura/escritura de archivos. No escribir a disco real en tests unitarios.

```typescript
import { createFsFromVolume, Volume } from 'memfs';

const vol = new Volume();
const fs = createFsFromVolume(vol);
// Inyectar en WavManager, QueueManager, etc.
```

### **4.3 Mock de IPC Electron**

```typescript
// Mock de ipcMain para tests del Main Process
const mockIpcMain = {
  on: vi.fn(),
  emit: vi.fn(),
  handle: vi.fn(),
};

// Mock de ipcRenderer para tests del Renderer
const mockIpcRenderer = {
  send: vi.fn(),
  on: vi.fn(),
  invoke: vi.fn(),
};
```

### **4.4 Mock del LLM**

```typescript
const mockLLM = {
  chat: vi.fn().mockResolvedValue({
    content: "El three-way handshake es...",
    usage: { input_tokens: 100, output_tokens: 50 }
  })
};
```

### **4.5 TimeProvider (determinismo)**

```typescript
interface TimeProvider {
  now(): number;
  isoString(): string;
}

class MockTimeProvider implements TimeProvider {
  constructor(private fixedTime: number) {}
  now() { return this.fixedTime; }
  isoString() { return new Date(this.fixedTime).toISOString(); }
}
```

---

## **5. Casos de Prueba por Módulo**

### **5.1 CortexOrchestrator — Anti-bucle**

```typescript
describe('CortexOrchestrator.shouldRestart', () => {
  // Happy path
  it('should_return_true_when_crash_count_below_limit', () => {
    expect(shouldRestart({ crashCount: 2, lastStableAt: null })).toBe(true);
  });

  // Límite exacto
  it('should_return_false_when_crash_count_equals_limit', () => {
    expect(shouldRestart({ crashCount: 3, lastStableAt: null })).toBe(false);
  });

  // Reset tras estabilidad
  it('should_reset_counter_when_stable_for_60_seconds', () => {
    const lastStableAt = Date.now() - 61_000; // 61 segundos atrás
    expect(shouldRestart({ crashCount: 3, lastStableAt })).toBe(true);
  });

  // Valores límite
  it('should_return_false_when_crash_count_exceeds_limit', () => {
    expect(shouldRestart({ crashCount: 10, lastStableAt: null })).toBe(false);
  });

  // Null safety
  it('should_handle_null_crash_count_gracefully', () => {
    expect(() => shouldRestart({ crashCount: null, lastStableAt: null })).not.toThrow();
  });
});
```

### **5.2 IPCProtocol — Serialización**

```typescript
describe('parseIPCMessage', () => {
  it('should_parse_valid_json_line', () => {
    const result = parseIPCMessage('{"id":"abc","status":"ok","data":{}}\n');
    expect(result.id).toBe('abc');
    expect(result.status).toBe('ok');
  });

  it('should_throw_on_malformed_json', () => {
    expect(() => parseIPCMessage('not json')).toThrow('IPCParseError');
  });

  it('should_throw_on_missing_id_field', () => {
    expect(() => parseIPCMessage('{"status":"ok"}')).toThrow('IPCValidationError');
  });

  it('should_throw_on_missing_status_field', () => {
    expect(() => parseIPCMessage('{"id":"abc"}')).toThrow('IPCValidationError');
  });

  it('should_handle_empty_string', () => {
    expect(() => parseIPCMessage('')).toThrow('IPCParseError');
  });

  it('should_handle_extremely_large_payload', () => {
    const largePayload = { id: 'x', status: 'ok', data: { content: 'a'.repeat(1_000_000) } };
    expect(() => parseIPCMessage(JSON.stringify(largePayload) + '\n')).not.toThrow();
  });
});
```

### **5.3 GroundingValidator — Test Crítico REQ-22**

```typescript
describe('GroundingValidator', () => {
  it('should_detect_response_containing_only_indexed_content', () => {
    const chunks = [{ content: 'El three-way handshake tiene 3 pasos: SYN, SYN-ACK, ACK.' }];
    const response = 'Según tus apuntes, el three-way handshake tiene 3 pasos.';
    expect(isGrounded(response, chunks)).toBe(true);
  });

  it('should_detect_response_with_external_knowledge', () => {
    const chunks = []; // índice vacío
    const response = 'El three-way handshake es un proceso de establecimiento de conexión TCP...';
    expect(isGrounded(response, chunks)).toBe(false);
  });

  it('should_return_no_results_message_when_chunks_empty', () => {
    const result = buildGroundedResponse([], 'any query');
    expect(result.content).toBe('No encontré información sobre esto en tu índice.');
    expect(result.sources).toHaveLength(0);
  });

  it('should_include_source_citation_in_every_response', () => {
    const chunks = [{ content: '...', metadata: { title: 'Apuntes TCP' } }];
    const result = buildGroundedResponse(chunks, 'TCP');
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources[0].title).toBe('Apuntes TCP');
  });
});
```

### **5.4 WavManager — Privacidad**

```typescript
describe('WavManager', () => {
  it('should_delete_wav_file_after_successful_transcription', async () => {
    const fs = createMockFs({ '/tmp/recording.wav': 'audio data' });
    const manager = new WavManager({ fs });
    await manager.deleteAfterTranscription('/tmp/recording.wav');
    expect(fs.existsSync('/tmp/recording.wav')).toBe(false);
  });

  it('should_not_delete_wav_if_transcription_failed', async () => {
    const fs = createMockFs({ '/tmp/recording.wav': 'audio data' });
    const manager = new WavManager({ fs });
    // Transcripción fallida — el archivo debe sobrevivir para re-intentos
    await manager.handleTranscriptionFailed('/tmp/recording.wav');
    expect(fs.existsSync('/tmp/recording.wav')).toBe(true);
  });

  it('should_auto_delete_wav_files_older_than_24_hours', async () => {
    const time = new MockTimeProvider(Date.now());
    const fs = createMockFs({ '/tmp/old.wav': 'data' });
    // Simular que el archivo tiene 25 horas
    vi.spyOn(fs, 'statSync').mockReturnValue({ mtimeMs: time.now() - 90_000_000 } as any);
    const manager = new WavManager({ fs, time });
    await manager.pruneExpiredRecordings();
    expect(fs.existsSync('/tmp/old.wav')).toBe(false);
  });
});
```

### **5.5 FeedbackStore**

```typescript
describe('FeedbackStore.applyPenalty', () => {
  it('should_reduce_score_of_negatively_rated_result', () => {
    const results = [{ id: 'doc-1', score: 0.9 }, { id: 'doc-2', score: 0.8 }];
    const feedback = [{ result_id: 'doc-1', signal: 'negative' }];
    const penalized = applyPenalty(results, feedback);
    expect(penalized.find(r => r.id === 'doc-1').score).toBeLessThan(0.9);
    expect(penalized.find(r => r.id === 'doc-2').score).toBe(0.8); // sin cambios
  });

  it('should_prune_feedback_older_than_retention_days', () => {
    const time = new MockTimeProvider(Date.now());
    const oldFeedback = [{ result_id: 'x', signal: 'negative', created_at: time.now() - (91 * 86400 * 1000) }];
    const pruned = pruneExpiredFeedback(oldFeedback, { retentionDays: 90, time });
    expect(pruned).toHaveLength(0);
  });
});
```

---

## **6. Herramientas y Ecosistema**

| Herramienta | Rol | Versión |
|---|---|---|
| **Vitest** | Framework de testing principal | latest |
| **@vitest/coverage-v8** | Cobertura de código | latest |
| **memfs** | Filesystem virtual para tests | latest |
| **Biome** | Linting estático | latest |
| **zod** | Validación de schemas IPC | latest |
| **vi.fn() / vi.spyOn()** | Mocking nativo de Vitest | — |

---

## **7. Automatización del Pipeline**

* **Pre-commit hook (husky):** Ejecutar tests de los archivos modificados antes de permitir el commit. Si algún test falla → bloquear.
* **CI (GitHub Actions):** Suite completa en cada PR. Un test fallido bloquea el merge.
* **Tiempo objetivo:** Suite unitaria completa en < 30 segundos (actualmente sin subprocesos reales, esto es alcanzable).
* **Tests E2E:** Corren en un job separado con los subprocesos reales. Tiempo aceptable: < 5 minutos.
* **Flaky tests:** Cualquier test que falle aleatoriamente en 3 ejecuciones consecutivas de CI debe ser marcado como `skip` e investigado en la semana.
* **Cobertura:** El reporte de cobertura se publica como comentario en cada PR con delta vs. la rama principal.

---

## **8. Guía para IA — Generación Automática de Tests**

Instrucciones para agentes de codificación que generen tests de Cortex:

1. **Patrón AAA:**
   ```typescript
   it('description', () => {
     // Arrange — configurar mocks y estado inicial
     const mockSubprocess = new MockSubprocess();
     mockSubprocess.mockAction('index', { status: 'ok', chunks: 5 });

     // Act — ejecutar la función bajo prueba
     const result = await orchestrator.indexDocument({ path: '/doc.pdf' }, mockSubprocess);

     // Assert — verificar resultados
     expect(result.status).toBe('ok');
     expect(result.chunks).toBe(5);
   });
   ```

2. **Nombres semánticos:** `should_[comportamiento]_when_[condición]()`

3. **Un solo concepto por test:** No agrupar múltiples assertions en un solo it() a menos que sean inseparables lógicamente

4. **Datos propios en cada test:** No asumir estado previo. Crear los mocks dentro del bloque `// Arrange` de cada test.

5. **Tests de seguridad obligatorios para:**
   - Inputs nulos, undefined, string vacío en funciones de parsing IPC
   - Payloads de tamaño extremo (>1MB) en el protocolo IPC
   - API keys en logs o salidas (verificar que NO aparecen)
   - Archivos WAV que persisten tras transcripción exitosa (verificar que NO existen)
