# ADR-004: Seguridad de Paths en Handlers IPC

## Estatus
Implementado — v3.5.0

## Contexto
Los handlers IPC reciben rutas de archivos desde el renderer. Un renderer comprometido podría enviar rutas maliciosas (path traversal, symlinks) para acceder a archivos del sistema fuera del directorio del usuario (p. ej. `/etc/passwd`).

## Decisión
Toda ruta recibida del renderer es validada en `electron/handlers/pathSecurity.ts` mediante `assertSafePath()` antes de pasarla a cualquier subproceso. La función aplica tres reglas en orden:

1. **Ruta absoluta** — rechaza rutas relativas.
2. **Resolución de symlinks** — usa `realpathSync()` para resolver enlaces simbólicos; si el archivo no existe aún, usa `resolve()` como fallback (#150).
3. **Allowlist de directorios** — el path resuelto debe ser igual a una raíz permitida o comenzar con `root + sep` para evitar bypasses de prefijo (#177). Las raíces permitidas son: `homedir()`, `userData`, `documents` y `temp`.

Los handlers de docling y ruvector llaman a `assertSafePath()` al inicio de cada invocación.

## Consecuencias

- **Positivas**: Prevención de path traversal y de acceso a archivos del sistema vía symlinks manipulados.
- **Neutras**: Overhead mínimo (una llamada a `realpathSync` por invocación IPC).
- **Negativas**: Archivos en rutas no cubiertas por la allowlist (p. ej. `/media/`) son rechazados aunque sean legítimos.

## Notas
- Tests unitarios en `electron/handlers/pathSecurity.test.ts`.
- Issue de origen: #118 (path traversal), refinado en #150 y #177.
