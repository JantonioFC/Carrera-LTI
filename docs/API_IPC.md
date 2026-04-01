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
- `window.cortexAPI.cortex` — RuVector y Docling

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
| `cortex:query` | `cortexAPI.cortex.query` | `text: string, topK?: number` | `Promise<CortexChunk[]>` | Ejecuta una consulta semantica; `topK` por defecto es 5 |

### Ejemplos

```typescript
// Indexar un PDF
const result = await window.cortexAPI.cortex.index("/home/juan/apuntes.pdf");
console.log(`Indexados ${result.chunks} fragmentos`);

// Consultar los 3 fragmentos mas relevantes
const chunks = await window.cortexAPI.cortex.query("aprendizaje supervisado", 3);
// chunks: CortexChunk[] — cada elemento tiene { chunkId, score, content, docId }
console.log(chunks[0].content);
```

### Tipo CortexChunk

```typescript
interface CortexChunk {
  chunkId: string;  // ID único del fragmento
  score: number;    // Similitud semántica (0-1, mayor = más relevante)
  content: string;  // Texto del fragmento
  docId: string;    // ID del documento de origen
}
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

## Manejo de errores

Todos los canales devuelven una `Promise` que puede rechazarse en los siguientes casos:

- El subproceso no fue inicializado (binario o venv no encontrado tras `npm run setup`).
- El subproceso supera el timeout (30 segundos por defecto).
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
interface CortexChunk {
  chunkId: string;
  score: number;
  content: string;
  docId: string;
}

interface CortexAPI {
  config: {
    set(key: string, value: string): Promise<void>;
    get(key: string): Promise<string | null>;
  };
  cortex: {
    index(docPath: string): Promise<{ chunks: number }>;
    query(text: string, topK?: number): Promise<CortexChunk[]>;
    processDocument(docPath: string): Promise<{ chunks: number; text: string }>;
    ocr(imagePath: string): Promise<{ text: string }>;
  };
}

declare global {
  interface Window {
    cortexAPI: CortexAPI;
  }
}
```
