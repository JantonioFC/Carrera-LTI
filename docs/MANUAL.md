# 📖 Manual de Usuario — Carrera LTI

**Versión:** 3.0 · Marzo 2026
**Plataforma:** Web (PWA) y App de Escritorio (Electron) — Compatible con Windows, macOS, Linux, Android e iOS
**Marca:** URU/IA.LABS · UTEC Uruguay

---

## Índice

1. [Primeros Pasos](#1-primeros-pasos)
2. [Dashboard](#2-dashboard)
3. [Unidades Curriculares (U.C.)](#3-unidades-curriculares)
4. [Calendario](#4-calendario)
5. [Malla Curricular](#5-malla-curricular)
6. [Tareas (Kanban)](#6-tareas)
7. [Generador de Horarios](#7-generador-de-horarios)
8. [Aether — Segundo Cerebro](#8-aether--segundo-cerebro)
9. [Nexus — Espacio de Trabajo Unificado](#9-nexus--espacio-de-trabajo-unificado)
10. [Cortex — Asistente de IA Local (Electron)](#10-cortex--asistente-de-ia-local)
11. [Herramientas Globales](#11-herramientas-globales)
12. [Configuración de IA](#12-configuración-de-ia)
13. [Atajos de Teclado](#13-atajos-de-teclado)

---

## 1. Primeros Pasos

### Instalación
```bash
# 1. Clonar el repositorio
git clone https://github.com/JantonioFC/Carrera-LTI.git
cd "Carrera LTI"

# 2. Ejecutar el asistente de configuración
# El wizard instalará las dependencias y configurará tu entorno (.env)
npm run setup

# 3. Iniciar el servidor de desarrollo
npm run dev
```
Abrí tu navegador en `http://localhost:5173`.

### Instalación como App (PWA)
En Chrome/Edge, hacé clic en el ícono de **instalar** que aparece en la barra de direcciones. Esto te permite usar la app desde tu escritorio o celular sin necesidad de conexión a internet.

### Navegación
La barra lateral izquierda contiene los **13 módulos** de la aplicación. Hacé clic en cualquiera para cambiar de vista.

---

## 2. Dashboard

![Dashboard](docs/img/01-dashboard.png)

La pantalla principal te ofrece un **resumen completo** de tu estado académico:

- **Cuenta Regresiva:** Indica cuántos días faltan para el inicio de clases o el período de exámenes.
- **Créditos Cursados:** Barra de progreso visual con la cantidad de créditos aprobados vs. pendientes.
- **Promedio General:** Calculado automáticamente a partir de las calificaciones que ingreses en cada U.C.
- **Gráfico de Dona:** Porcentaje de avance en la carrera.
- **Gráfico de Barras:** Promedio por semestre para identificar tendencias.
- **Próximas Presenciales:** Las fechas más cercanas de eventos presenciales.

---

## 3. Unidades Curriculares

![Unidades Curriculares](docs/img/02-aether-editor.png)

Gestión detallada de tus materias del semestre actual:

- **Ver detalles:** Hacé clic en cualquier materia para abrir su modal de edición.
- **Estado:** Cambiá entre *Pendiente*, *En Curso* y *Aprobada*.
- **Nota Final:** Asigná tu calificación (escala 1-12) para que se refleje en el promedio.
- **Recursos:** Añadí enlaces útiles (Drive, Zoom, GitHub, WebAulas) dentro de cada materia para tener todo centralizado.

---

## 4. Calendario

![Calendario](docs/img/08-calendario-anual.png)

Vista mensual y semanal del calendario académico:

- **Eventos Presenciales:** Las jornadas obligatorias aparecen marcadas con puntos de color.
- **Navegación:** Usá las flechas `←` `→` para moverte entre meses/semanas.
- **Edición:** Hacé clic en un evento para modificar fecha, actividad o sede.
- **Exportar (.ics):** El botón de descarga genera un archivo compatible con Google Calendar, Outlook y Apple Calendar.

---

## 5. Malla Curricular

![Malla Curricular](docs/img/09-malla-curricular.png)

Mapa visual completo de los **8 semestres** de la carrera:

- **Semestres 1-4:** Resaltados con barra de progreso especial para el título intermedio de *Tecnicatura*.
- **Código de colores:** Verde (aprobada), azul (en curso), gris (pendiente).
- **Créditos:** Cada materia muestra sus créditos y prerrequisitos.
- **Resumen:** Tarjeta superior con el total de créditos obtenidos, en curso y pendientes.

---

## 6. Tareas

![Tareas](docs/img/05-nexus-editor.png)

Tablero Kanban para organizar tus entregas y estudios:

- **Columnas:** Por Hacer → En Progreso → Terminado.
- **Crear tarea:** Botón `+` en cualquier columna. Asigná título, prioridad (Baja/Media/Alta), fecha límite y U.C.
- **Subtareas:** Dentro de cada tarjeta, agregá items que vas tachando a medida que avanzás.
- **Notificaciones:** Si una tarea vence en 24 horas, recibirás una **notificación push** nativa.
- **Drag & Drop:** Arrastrá las tarjetas entre columnas para actualizar su estado.

---

## 7. Generador de Horarios

![Horarios](docs/img/01-dashboard.png)

Creá tu rutina semanal ideal de forma visual:

- **Lista de materias:** A la izquierda aparecen las U.C. disponibles para tu semestre.
- **Grilla semanal:** Arrastrá (drag & drop) cada materia al día/bloque horario que prefieras.
- **Visualización:** Cada materia tiene un color identificable para ver rápidamente la distribución de tu semana.

---

## 8. Aether — Segundo Cerebro

### 8.1 Bóveda de Conocimiento

![Aether Vault](docs/img/02-aether-editor.png)

Tu sistema personal de gestión de conocimiento:

- **Crear Nota:** Botón `+` en la barra superior. Escribí en **Markdown** con renderizado en tiempo real.
- **Enlaces bidireccionales:** Usá la sintaxis `[[Nombre de Nota]]` para crear hipervínculos entre notas. El sistema los detecta automáticamente.
- **Búsqueda:** Escribí en la barra de búsqueda para filtrar notas por título o contenido.
- **Backlinks:** El panel derecho muestra todas las notas que enlazan *hacia* la nota actual.
- **Grafo de Conocimiento:** La pestaña de red muestra una visualización 2D interactiva de todas tus notas y sus conexiones. Podés arrastrar nodos y hacer zoom.

### 8.2 Canvas Espacial

![Canvas Espacial](docs/img/03-canvas-espacial.png)

Tablero infinito para organización espacial libre:

- **Agregar nodos:** Cada nota puede posicionarse libremente en el lienzo 2D.
- **Conectar:** Trazá líneas entre nodos para visualizar relaciones.
- **Zoom y Pan:** Usá la rueda del ratón para acercar/alejar y arrastrá el fondo para moverte.

### 8.3 Asistente Aether (Chat IA)

![Asistente Aether](docs/img/04-aether-gemini-setup.png)

Chat inteligente que **lee tus notas** para darte respuestas contextualizadas:

- **Primer uso:** Ingresá tu API Key de Google AI Studio (ver [Configuración de IA](#11-configuración-de-ia)).
- **RAG Integrado:** El asistente inyecta automáticamente el contenido de tus notas como contexto antes de enviar tu pregunta a Gemini.
- **Ejemplos de uso:** *"Resumime lo que tengo sobre Bases de Datos"*, *"¿Qué relación hay entre mis notas de redes y seguridad?"*

---

## 9. Nexus — Espacio de Trabajo Unificado

### 9.1 Editor de Bloques

![Nexus Editor](docs/img/05-nexus-editor.png)

Editor de texto basado en **bloques atómicos** (estilo Notion):

- **Crear documento:** Botón `+` en la barra lateral de Nexus.
- **Comando `/`:** Escribí `/` en cualquier línea para abrir el menú de tipos de bloque (párrafo, encabezado, lista, tabla, código, imagen, etc.).
- **CRDT Offline:** Cada documento se guarda automáticamente en **IndexedDB** usando tecnología CRDT (Yjs), lo que garantiza que nunca pierdas trabajo incluso sin conexión.

### 9.2 Bases de Datos

![Nexus Tables](docs/img/06-nexus-tables.png)

Tablas relacionales de alta velocidad:

- **Crear Base de Datos:** Botón `+` en el panel lateral.
- **Agregar columnas:** Hacé clic en `+` en el encabezado de la tabla. Tipos: texto, número, fecha, selección, relación.
- **Edición inline:** Hacé clic en cualquier celda para editarla directamente.
- **Agregar filas:** Botón "Nueva Fila" al final de la tabla.
- **Renombrar:** Hacé clic en el nombre de la base de datos o de cualquier columna para editarlo.

### 9.3 Nexus AI

![Nexus AI](docs/img/07-nexus-ai-setup.png)

El asistente de inteligencia más avanzado de la aplicación:

- **RAG Multi-fuente:** Nexus AI lee simultáneamente de **tres fuentes**: tus notas de Aether, tus documentos de Nexus y tus bases de datos.
- **Indicadores:** En la barra superior podés ver cuántos documentos y tablas están conectados como contexto.
- **Seguridad:** El badge "AES-256" confirma que el módulo de cifrado está disponible.
- **Ejemplos de uso:** *"¿Qué tengo registrado sobre programación?"*, *"Generame un resumen de todas mis fuentes"*

---

## 10. Cortex — Asistente de IA Local

> **Requiere la app de escritorio (Electron).** No disponible en la versión PWA.

Cortex es el módulo de inteligencia artificial que corre **completamente en tu dispositivo**, sin enviar datos a ningún servicio externo.

### Observer AI
El Observer captura audio de tu micrófono y convierte lo que escuchás (clase, reunión, explicación) en notas automáticas:

1. Abrí la pestaña **Cortex** en el sidebar.
2. Hacé clic en el toggle **Observer AI** para activarlo. Verás el banner "Grabando…".
3. Al desactivarlo, el sistema transcribe el audio capturado y crea una nota en Aether automáticamente.

> En macOS se solicita permiso de micrófono al primer uso.

### Docling — Procesamiento de Documentos
Procesá PDFs, DOCX e imágenes directamente desde Nexus:

- **processDocument**: Extrae el texto estructurado de un archivo.
- **ocr**: Reconocimiento óptico de caracteres sobre imágenes o PDFs escaneados.

### Whisper — Transcripción Offline
Transcribí archivos de audio sin conexión a internet usando el modelo Whisper (por defecto `small`):

- Disponible desde Nexus AI o vía Observer al cerrar la grabación.
- El archivo WAV temporal se elimina automáticamente tras la transcripción.

### Requisitos de Cortex
El wizard `npm run setup` instala automáticamente el entorno Python necesario en `~/.carrera-lti/venv/`:
- `docling`
- `openai-whisper`
- `sounddevice`

---

## 11. Herramientas Globales

### ⏱️ Pomodoro Timer
El temporizador Pomodoro aparece como un **widget flotante** en la esquina inferior derecha, accesible desde cualquier vista:
- **Focus:** 25 minutos de concentración.
- **Break:** 5 minutos de descanso.
- Al terminar cada ciclo, recibirás una alerta visual y sonora.

### 🎯 Paleta de Comandos (Ctrl + K)
Presioná `Ctrl + K` (o `Cmd + K` en Mac) desde cualquier pantalla para abrir la **búsqueda universal**:
- Buscá documentos de Nexus, notas de Aether o bases de datos.
- Acciones rápidas: crear documentos, abrir el chat de IA, navegar a cualquier módulo.

### ☁️ Sincronización Cloud
En la parte inferior del sidebar:
- **Subir:** Respalda tus datos a Firebase.
- **Bajar:** Restaura desde la nube.
- **Offline:** Si perdés conexión, los cambios se almacenan en una cola local y se sincronizan automáticamente al reconectarse.

---

## 12. Configuración de IA

Tanto **Asistente Aether** como **Nexus AI** requieren una API Key gratuita de Google:

1. Visitá [aistudio.google.com](https://aistudio.google.com)
2. Iniciá sesión con tu cuenta de Google.
3. Hacé clic en **"Get API Key"** → **"Create API Key"**.
4. Copiá la clave generada (formato `AIza...`).
5. Pegala en el campo de API Key dentro de la app.

> 🔒 **Privacidad:** La clave se almacena **únicamente en tu navegador** (localStorage). Nunca se envía a ningún servidor propio. La comunicación es directa entre tu navegador y Google.

---

## 13. Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl/Cmd + K` | Abrir Paleta de Comandos |
| `/` | Menú de bloques (dentro del editor Nexus) |
| `Esc` | Cerrar modales y la paleta |

---

*Manual actualizado el 23 de marzo de 2026 · URU/IA.LABS · Carrera LTI v3.0*
