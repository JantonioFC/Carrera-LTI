# Guía de resolución de problemas — Carrera LTI

## Índice

1. [Problemas de instalación](#instalación)
2. [Subprocesos Python (Docling)](#subprocesos-python)
3. [RuVector (búsqueda vectorial)](#ruvector)
4. [Configuración y API Keys](#configuración-y-api-keys)
5. [CI / Tests](#ci--tests)
6. [Electron / ventana en blanco](#electron--ventana-en-blanco)

---

## Instalación

### Error: `npm run setup` falla con "Python no encontrado"

**Causa**: Python 3.10+ no está en el PATH.

```bash
# Verificar versión
python3 --version   # debe ser 3.10 o superior
which python3       # debe devolver una ruta válida
```

**Solución en Ubuntu/Debian**:
```bash
sudo apt install python3.11 python3.11-venv python3-pip
```

**Solución en macOS**:
```bash
brew install python@3.11
```

---

### Error: `venv` no se crea / `pip install` falla

El entorno virtual se crea en `~/.carrera-lti/venv/`. Si falla:

```bash
# Crear manualmente
python3 -m venv ~/.carrera-lti/venv
~/.carrera-lti/venv/bin/pip install docling
```

Si el disco tiene poco espacio, Docling requiere ~2 GB libres para los modelos.

---

### Error: `ruvector` binario no encontrado

```
[RuVector] binario no encontrado en ~/.carrera-lti/bin/ruvector
```

**Causa**: `npm run setup` no descargó el binario o la plataforma no está soportada.

**Solución**:
```bash
npm run setup   # volver a ejecutar setup
ls -la ~/.carrera-lti/bin/   # verificar que existe ruvector
```

En Linux asegurarse de que tiene permisos de ejecución:
```bash
chmod +x ~/.carrera-lti/bin/ruvector
```

---

## Subprocesos Python

### Los subprocesos crashean al iniciar la app

**Síntoma**: En los logs aparece `[CircuitBreaker:docling] circuito abierto`.

**Causa más común**: El entorno virtual no tiene las dependencias instaladas.

**Diagnóstico**:
```bash
# Probar manualmente el runner
~/.carrera-lti/venv/bin/python scripts/docling_runner.py
```

**Solución**: Reinstalar dependencias Python:
```bash
~/.carrera-lti/venv/bin/pip install -r scripts/requirements.txt
```

---

### El CircuitBreaker abre el circuito repetidamente

Después de 3 crasheos consecutivos, el subproceso entra en estado `OPEN` y las llamadas fallan rápido por 30 segundos. Esto es intencional para proteger el proceso principal.

Para reiniciar manualmente: **cerrar y reabrir la aplicación**. El CircuitBreaker se resetea en cada arranque.

---

## RuVector

### `cortex:index` no indexa documentos PDF

**Causa probable**: Docling no procesó el PDF correctamente antes de enviarlo a RuVector.

**Verificar en la Cortex Tab**: La actividad debe mostrar `Indexando: nombre_archivo` durante el proceso. Si se queda en `Inactivo` sin cambios, el subproceso Docling puede haber fallado silenciosamente.

**Diagnóstico**:
```bash
~/.carrera-lti/venv/bin/python -c "import docling; print('OK')"
```

Si falla, reinstalar:
```bash
~/.carrera-lti/venv/bin/pip install docling --upgrade
```

---

### Las consultas a Cortex no devuelven resultados

1. Verificar que hay documentos indexados (Cortex Tab → "Documentos indexados" > 0).
2. Verificar que `ruvector` está corriendo:
   - En macOS Activity Monitor / Linux `htop`, buscar el proceso `ruvector`.
3. Si `ruvector` no aparece, revisar los logs de la app (DevTools → Console en modo dev).

---

## Configuración y API Keys

### "Configura CORTEX_MASTER_SECRET" en los logs

En entornos sin Keychain del OS (p.ej. servidores headless, CI), `safeStorage` de Electron no está disponible. Configurar la variable de entorno:

```bash
# En .env.local (nunca commitear)
CORTEX_MASTER_SECRET=una_clave_aleatoria_de_64_caracteres
```

Generar una clave segura:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Las API Keys no se guardan entre sesiones

En modo Electron, las API Keys se guardan cifradas en `electron-store` (archivo `cortex-config` en el directorio de datos del OS). No se leen de `.env` en producción (solo en la migración inicial del primer arranque).

Usar la UI de Configuración de la app para actualizar las claves, no el archivo `.env`.

---

### Firebase: "Missing or insufficient permissions"

La app usa Firebase en modo anónimo. Si aparece este error:
1. Verificar que el proyecto Firebase tiene **Autenticación anónima habilitada**.
2. Verificar que las reglas de Firestore permiten acceso al documento del usuario anónimo.
3. Ejecutar `npm run setup` y configurar la Firebase API Key correctamente.

---

## CI / Tests

### Tests fallan con "Cannot find module 'idb-keyval'"

```bash
npm ci   # reinstalar todas las dependencias
```

---

### Biome falla en CI con errores de formato

Ejecutar localmente antes de hacer push:

```bash
npx biome check --write .
```

Los archivos que Biome modifica con más frecuencia: llamadas encadenadas largas, imports sin ordenar, condiciones `if` que superan el límite de línea.

---

### CI falla en `python3 -m py_compile`

El step de CI verifica la sintaxis de los scripts Python. Si falla:

```bash
python3 -m py_compile scripts/docling_runner.py
```

Corregir los errores de sintaxis Python antes de hacer push.

---

### Tests de integración E2E fallan en CI

Los tests E2E en `src/cortex/e2e/` requieren los binarios instalados. En CI corren con `E2E=false` (describe.skipIf) para evitar fallos de entorno. Para correr localmente con binarios reales:

```bash
E2E=true npx vitest run src/cortex/e2e/
```

---

## Electron / ventana en blanco

### La ventana queda en blanco al iniciar en desarrollo

**Causa más común**: Vite dev server no está corriendo.

Usa el comando unificado que arranca ambos en un solo proceso:

```bash
npm run dev:electron
```

Este comando usa `vite-plugin-electron` para iniciar Vite y Electron juntos. No es necesario abrir dos terminales.

---

### Electron abre pero muestra "Not found" o error de red

En desarrollo, Electron espera que Vite esté en `http://localhost:5173`. Si el puerto está ocupado:

```bash
# Verificar qué usa el puerto
lsof -i :5173
```

Cambiar el puerto en `vite.config.ts` y en `electron/main.ts` (`DEV_URL`).

---

### La app crashea al abrir un PDF grande

Los PDFs muy grandes pueden agotar la memoria del subproceso Docling. Límite recomendado: < 50 MB por documento. Dividir PDFs grandes antes de indexar.

---

## Obtener ayuda

Si el problema persiste después de seguir estos pasos:

1. Abrir la app en modo dev y revisar la consola de DevTools (Ctrl+Shift+I).
2. Revisar los logs del Main Process en la terminal donde se ejecutó `npm run electron:dev`.
3. Abrir un issue en el repositorio con los logs relevantes.
