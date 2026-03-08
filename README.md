# Carrera LTI — UTEC Uruguay 🎓

Una aplicación web de gestión académica y organización personal, diseñada específicamente para estudiantes de la **Licenciatura en Tecnologías de la Información (Plan 2024)** de la **Universidad Tecnológica (UTEC) de Uruguay**.

Desarrollada bajo la marca corporativa **URU/IA.LABS**.

## ✨ Características Principales

- 📊 **Dashboard Interactivo:** Vista general del semestre, cuenta regresiva hacia el inicio de clases y período de exámenes. Visualización rápida de tus créditos actuales y próximos eventos.
- 📆 **Calendario de Instancias Presenciales:** Visualización mensual con las fechas exactas de las jornadas obligatorias para la Sede Minas (Res. 127-24). ¡Podés editar las fechas, actividades y sedes en caso de cambios oficiales!
- 🗺️ **Malla Curricular Visual:** Explorá los 8 semestres de la carrera, con un contador detallado de créditos (obtenidos, en curso y pendientes). Incluye la barra de progreso especial para el título intermedio de **Tecnicatura** (Semestres 1-4).
- ✅ **Kanban de Tareas:** Organizá tus entregas, prácticas y estudios con un tablero ágil (Por Hacer, En Progreso, Terminado). Podés asignar prioridad y etiquetar cada tarea con la U.C. correspondiente. Las tareas persisten entre sesiones.

## 🛠️ Stack Tecnológico

- **Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Estilos:** [Tailwind CSS 3](https://tailwindcss.com/)
- **Iconos:** [Lucide React](https://lucide.dev/)
- **Gestión de Estado:** React Hooks nativos + persistencia en `localStorage`.

## 🚀 Instalación y Uso Local

Asegurate de tener [Node.js](https://nodejs.org/) (versión 18 o superior) instalado en tu sistema.

1. **Cloná el repositorio y entrá a la carpeta**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd "Carrera LTI"
   ```

2. **Instalá las dependencias**
   ```bash
   npm install
   ```

3. **Iniciá el servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrí la app en tu navegador**
   Navegá a `http://localhost:5173` para empezar a usarla.

## 📁 Estructura del Proyecto

```text
src/
├── components/          # Componentes UI reutilizables (ej. Sidebar)
├── data/
│   └── lti.ts           # 🧠 La "base de datos" local: Fechas, Currícula y datos oficiales de UTEC
├── pages/               # Vistas principales de la app
│   ├── Calendario.tsx   # Vista mensual de eventos
│   ├── Dashboard.tsx    # Resumen y cuenta regresiva
│   ├── MallaCurricular.tsx # Grid de 8 semestres y créditos
│   ├── Materias.tsx     # Vista detallada de las U.C. actuales
│   └── Tareas.tsx       # Tablero Kanban
├── index.css            # Estilos globales y paleta de colores premium (dark theme)
└── App.tsx              # Enrutador principal y layout general
public/
└── logo.jpg             # Imagen de marca URU/IA.LABS
```

## 📝 Personalización de Datos Académicos

Toda la información académica estática se encuentra centralizada en `src/data/lti.ts`.
Si la UTEC publica actualizaciones del **Plan 2024** o el calendario de la **Generación 2026** cambia, podés modificar constantes críticas ahí:

- `SEMESTER_START`: Fecha de inicio de cursos.
- `EXAM_START` / `EXAM_END`: Períodos de examen.
- `CURRICULUM`: Array con los 8 semestres, sus Unidades Curriculares, créditos y requerimientos.
- `DEFAULT_PRESENCIALES`: Fechas base de las jornadas. **Nota:** Al usar la app, si editás una fecha, tus cambios privan sobre este archivo base ya que se guardan en tu navegador local.
