# API IPC — Referencia de canales

## Arquitectura IPC

Carrera LTI usa el patron **contextBridge / preload** de Electron para comunicar el Renderer Process con el Main Process de forma segura.

La ventana de Electron se crea con `contextIsolation: true` y `nodeIntegration: false`, lo que impide que el codigo del renderer acceda directamente a las APIs de Node.js. El archivo `electron/preload.ts` actua como puente: se ejecuta en un contexto privilegiado y expone un objeto controlado (`window.cortexAPI`) al renderer mediante `contextBridge.exposeInMainWorld`.

```
Renderer (React)
    │
    │  window.cortexAPI.cortex.index(path)
    ▼
electron/preload.ts  →  ipcRenderer.invoke("cortex:index", path)
    │
    │  canal IPC serializado
    ▼
electron/main.ts  →  ipcMain.handle("cortex:index", handler)
    │
    ▼
SubprocessAdapter / electron-store
```

Todas las llamadas son **unidireccionales Renderer → Main** y retornan una `Promise`. No se usan `ipcRenderer.send` ni eventos de vuelta (`ipcMain.emit`).

La API esta disponible en el renderer como `window.cortexAPI` con los siguientes grupos:

- `window.cortexAPI.config` — Configuracion cifrada
- `window.cortexAPI.cortex` — RuVector, Docling y Whisper
- `window.cortexAPI.observer` — Observer AI (grabacion de audio)

---

## Config

Gestiona pares clave-valor cifrados mediante `electron-store` con la clave del keychain del SO. Las claves permitidas son: `gemini_api_key`, `gmail_client_id`, `gmail_api_key`, `cortex_update_channel` y `llm_api_key`. Cualquier otra clave es rechazada con un error.

| Canal | Metodo JS | Parametros | Retorno | Descripcion |
|---|---|---|---|---|
| `config:set` | `cortexAPI.config.set` | `key: string, value: string` | `Promise<void>` | Almacena un valor en el store cifrado |
| `config:get` | `cortexAPI.config.get` | `key: string` | `Promise<string \| null>` | Recupera un valor; devuelve `null` si no existe |

### Ejemplos

```typescript
// Guardar una API key
await window.cortexAPI.config.set("gemini_api_key", "AIza...");

// Leer una API key
const key = await window.cortexAPI.config.get("gemini_api_key");
if (key) {
  console.log("API key configurada");
}
```

---

## RuVector

Motor de busqueda vectorial semantica implementado como binario Rust (`~/.carrera-lti/bin/ruvector`). Comunicacion via stdio con `SubprocessAdapter`.

| Canal | Metodo JS | Parametros | Retorno | Descripcion |
|---|---|---|---|---|
| `cortex:index` | `cortexAPI.cortex.index` | `docPath: string` | `Promise<{ chunks: number }>` | Indexa un documento (PDF, DOCX, TXT, MD) en el motor vectorial. El mimeType se detecta automáticamente por extensión. |
| `cortex:query` | `cortexAPI.cortex.query` | `text: string, topK?: number` | `Promise<unknown[]>` | Ejecuta una consulta semantica; `topK` por defecto es 5 |

### Ejemplos

```typescript
// Indexar un PDF
const result = await window.cortexAPI.cortex.index("/home/juan/apuntes.pdf");
console.log(`Indexados ${result.chunks} fragmentos`);

// Consultar los 3 fragmentos mas relevantes
const chunks = await window.cortexAPI.cortex.query("aprendizaje supervisado", 3);
console.log(chunks);
```

---

## Docling

Procesador de documentos (PDF, DOCX) y OCR de imagenes implementado como script Python (`scripts/docling_runner.py`) ejecutado dentro del venv de Python.

| Canal | Metodo JS | Parametros | Retorno | Descripcion |
|---|---|---|---|---|
| `cortex:process-document` | `cortexAPI.cortex.processDocument` | `docPath: string` | `Promise<{ chunks: number; text: string }>` | Convierte un PDF o DOCX a texto estructurado |
| `cortex:ocr` | `cortexAPI.cortex.ocr` | `imagePath: string` | `Promise<{ text: string }>` | Extrae texto de una imagen mediante OCR |

### Ejemplos

```typescript
// Procesar un documento PDF
const doc = await window.cortexAPI.cortex.processDocument("/home/juan/libro.pdf");
console.log(`${doc.chunks} fragmentos extraidos`);
console.log(doc.text.slice(0, 200));

// OCR sobre una captura de pantalla
const ocr = await window.cortexAPI.cortex.ocr("/tmp/captura.png");
console.log(ocr.text);
```

---

## Whisper

Transcripcion de audio a texto mediante OpenAI Whisper ejecutado como script Python (`scripts/whisper_runner.py`). Espera archivos WAV en 16 kHz mono. El runner elimina el archivo WAV tras una transcripcion exitosa (ADR-003).

| Canal | Metodo JS | Parametros | Retorno | Descripcion |
|---|---|---|---|---|
| `cortex:transcribe` | `cortexAPI.cortex.transcribe` | `wavPath: string, model?: string` | `Promise<{ text: string; language: string }>` | Transcribe un archivo WAV; `model` por defecto es `"small"` |

Modelos disponibles (heredados de Whisper): `tiny`, `base`, `small`, `medium`, `large`. A mayor modelo, mayor calidad y mayor tiempo de procesamiento.

### Ejemplo

```typescript
// Transcribir con el modelo por defecto ("small")
const result = await window.cortexAPI.cortex.transcribe("/tmp/recording_123.wav");
console.log(`[${result.language}] ${result.text}`);

// Transcribir con el modelo "medium" para mayor precision
const resultHD = await window.cortexAPI.cortex.transcribe("/tmp/grabacion.wav", "medium");
```

---

## Observer

Observer es un servicio de grabacion de audio continuo implementado como script Python long-running (`scripts/observer_runner.py`). A diferencia de los demas servicios, no sigue el patron request-response: se activa y desactiva con `toggle`.

Al desactivarse, el runner Python recibe SIGTERM, flushea el buffer de audio y guarda el archivo WAV en `~/.carrera-lti/observer/recordings/`. El handler devuelve la ruta del WAV para que el renderer orqueste la transcripcion mediante `cortex:transcribe`.

En macOS, la primera activacion solicita permiso de microfono al sistema operativo.

| Canal | Metodo JS | Parametros | Retorno | Descripcion |
|---|---|---|---|---|
| `observer:toggle` | `cortexAPI.observer.toggle` | `active: boolean` | `Promise<{ active: boolean; wavPath?: string }>` | Activa o desactiva la grabacion. Al desactivar, `wavPath` contiene la ruta al WAV si se capturo audio |
| `observer:status` | `cortexAPI.observer.status` | _(ninguno)_ | `Promise<{ active: boolean }>` | Devuelve si la grabacion esta activa en este momento |

### Ejemplos

```typescript
// Iniciar grabacion
const started = await window.cortexAPI.observer.toggle(true);
console.log(started.active); // true

// Consultar estado
const status = await window.cortexAPI.observer.status();
console.log(status.active); // true

// Detener grabacion y transcribir si hay audio
const stopped = await window.cortexAPI.observer.toggle(false);
if (stopped.wavPath) {
  const transcription = await window.cortexAPI.cortex.transcribe(stopped.wavPath);
  console.log(transcription.text);
}
```

---

## Manejo de errores

Todos los canales devuelven una `Promise` que puede rechazarse en los siguientes casos:

- El subproceso no fue inicializado (binario o venv no encontrado tras `npm run setup`).
- El subproceso supera el timeout (30 segundos por defecto; 120 segundos para transcripcion).
- El subproceso retorna un mensaje con `status: "error"`.

Usa `try/catch` en todas las llamadas:

```typescript
try {
  const result = await window.cortexAPI.cortex.index(path);
} catch (err) {
  console.error("Error al indexar:", err);
}
```

---

## Declaracion de tipos global

Para usar `window.cortexAPI` con tipos en el renderer, agrega la siguiente declaracion en `src/types/electron.d.ts` o similar:

```typescript
interface CortexAPI {
  config: {
    set(key: string, value: string): Promise<void>;
    get(key: string): Promise<string | null>;
  };
  cortex: {
    index(docPath: string): Promise<{ chunks: number }>;
    query(text: string, topK?: number): Promise<unknown[]>;
    processDocument(docPath: string): Promise<{ chunks: number; text: string }>;
    ocr(imagePath: string): Promise<{ text: string }>;
    transcribe(wavPath: string, model?: string): Promise<{ text: string; language: string }>;
  };
  observer: {
    toggle(active: boolean): Promise<{ active: boolean; wavPath?: string }>;
    status(): Promise<{ active: boolean }>;
  };
}

declare global {
  interface Window {
    cortexAPI: CortexAPI;
  }
}
```
