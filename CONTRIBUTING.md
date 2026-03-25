# Guia de contribucion

## Prerequisitos

| Herramienta | Version minima | Notas |
|---|---|---|
| Node.js | 20 LTS | Requerido para Vite y Electron |
| npm | 10+ | Incluido con Node 20 |
| Python | 3.10+ | Necesario para los subprocesos (Docling, Whisper, Observer) |

Asegurate de que `python3` y `node` esten disponibles en el PATH antes de continuar.

---

## Configuracion inicial

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd carrera-lti

# 2. Instalar dependencias JavaScript
npm install

# 3. Preparar entorno Python (venv + binarios)
npm run setup
```

El script `setup` realiza las siguientes acciones:

- Crea un virtualenv en `~/.carrera-lti/venv/`.
- Instala las dependencias Python (Docling, Whisper, etc.) dentro del venv.
- Descarga el binario `ruvector` en `~/.carrera-lti/bin/`.

Si el setup falla, verifica que Python 3.10+ este instalado y que tengas conexion a internet.

---

## Desarrollo

Para arrancar Vite + Electron juntos en modo desarrollo:

```bash
npm run dev:electron
```

Este comando usa `vite-plugin-electron` para levantar Vite y compilar/lanzar Electron en un solo proceso. Los cambios en el renderer se aplican en caliente (HMR). Los cambios en el proceso principal de Electron requieren reiniciar el comando.

> Si solo quieres el modo web (PWA, sin Electron), usa `npm run dev`.

---

## Pruebas y calidad de codigo

```bash
# Ejecutar todos los tests (Vitest)
npm test

# Modo watch
npm run test:watch

# Linting y formato (Biome)
npm run lint
npm run format
```

El linting usa **Biome**. No se usa ESLint ni Prettier. Todos los tests deben pasar y el linter no debe reportar errores antes de abrir una pull request.

---

## Convencion de ramas

Usa el formato `tipo/descripcion-breve-vX.Y.Z`:

| Prefijo | Uso |
|---|---|
| `feat/` | Nueva funcionalidad |
| `fix/` | Correccion de error |
| `perf/` | Mejora de rendimiento |
| `arch/` | Refactorizacion de arquitectura |
| `test/` | Nuevos tests o mejoras de tests |
| `docs/` | Solo documentacion |

El sufijo `vX.Y.Z` es opcional pero recomendado cuando el cambio esta asociado a una version especifica. Ejemplos:

```
feat/observer-ai-v1.2.0
fix/ruvector-timeout-v1.1.3
docs/api-ipc
```

---

## Estilo de commits

Formato: `tipo(scope): descripcion en minusculas`

```
feat(observer): agregar permiso de microfono en macOS
fix(ruvector): corregir timeout en consultas largas
perf(docling): reducir memoria en procesamiento de PDFs grandes
arch(subprocess): mover SubprocessAdapter a electron/subprocess/
test(config): agregar tests para configHandlers
docs(ipc): documentar canales IPC en API_IPC.md
```

Scopes habituales: `config`, `ruvector`, `docling`, `whisper`, `observer`, `subprocess`, `store`, `renderer`.

Incluye siempre el trailer de Co-Authored-By cuando el commit fue asistido por Claude:

```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Proceso de pull request

1. Abre un PR por issue. No acumules cambios no relacionados en una misma rama.
2. El titulo del PR debe seguir el mismo formato de commit: `tipo(scope): descripcion`.
3. La CI debe pasar completamente antes de mergear. Los jobs requeridos son:
   - `build-and-test`: compila TypeScript, ejecuta Vitest y el linter.
   - `e2e`: pruebas end-to-end de la aplicacion Electron.
4. No se requiere revision obligatoria de otro colaborador, pero se recomienda solicitar una cuando el cambio afecte a `electron/main.ts` o al protocolo IPC.
5. No hagas force push a `main`.

---

## Arquitectura general

La aplicacion esta dividida en tres capas:

```
┌─────────────────────────────────┐
│  Renderer Process  (src/)       │  React + Vite + Zustand
│  - Interfaz de usuario          │
│  - Estado local (stores)        │
└──────────────┬──────────────────┘
               │  IPC (contextBridge / ipcRenderer.invoke)
┌──────────────▼──────────────────┐
│  Main Process  (electron/)      │  Node.js + Electron
│  - Handlers IPC                 │
│  - electron-store cifrado       │
│  - Gestion de subprocesos       │
└──────────────┬──────────────────┘
               │  stdio (JSON-RPC)
┌──────────────▼──────────────────┐
│  Subprocesos Python (scripts/)  │
│  - docling_runner.py            │
│  - whisper_runner.py            │
│  - observer_runner.py           │
│  - ruvector (binario Rust)      │
└─────────────────────────────────┘
```

El proceso principal no tiene acceso a la UI; el renderer no tiene acceso a Node.js directamente. Toda comunicacion pasa por el preload (`electron/preload.ts`) que expone `window.cortexAPI`.

### Directorios clave

| Directorio | Contenido |
|---|---|
| `electron/subprocess/` | `SubprocessAdapter` y `StdioTransport`: gestion del protocolo stdio con subprocesos |
| `electron/handlers/` | Handlers IPC agrupados por servicio (config, ruvector, docling, whisper, observer) |
| `src/cortex/` | Capa de abstraccion del renderer para comunicarse con el proceso principal |
| `src/store/` | Stores de Zustand (estado global de la UI) |
| `src/utils/` | Utilidades compartidas (`logger`, helpers) |

---

## Como agregar un nuevo handler IPC

1. **Crear el archivo de handlers** en `electron/handlers/miServicioHandlers.ts`. Exporta una funcion `makeMiServicioHandlers(adapter)` y la interfaz correspondiente.

2. **Registrar el handler** en `electron/main.ts`:
   - Instancia el transport y el `SubprocessAdapter` si el servicio usa un subproceso.
   - Llama a `ipcMain.handle("mi-servicio:accion", ...)` dentro de una funcion `initMiServicio()`.
   - Invoca `initMiServicio()` en el bloque `app.whenReady()`.

3. **Exponer en el preload** (`electron/preload.ts`): agrega el wrapper en el objeto pasado a `contextBridge.exposeInMainWorld`.

4. **Agregar tests unitarios** en `src/__tests__/` o junto al archivo del handler. Inyecta un transport mock en lugar del real.

5. Verifica que `npm test` y `npm run lint` pasen sin errores antes de abrir el PR.
