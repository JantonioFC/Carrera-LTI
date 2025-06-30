
# 📚 StudyPlan - Calendario de Planificación de Estudios

Una aplicación web moderna y completa para la gestión y planificación de estudios, desarrollada con React, TypeScript y Tailwind CSS.

![StudyPlan Banner](https://img.shields.io/badge/StudyPlan-Calendario%20de%20Estudios-1E3A8A?style=for-the-badge&logo=calendar&logoColor=white)

## ✨ Características Principales

### 🎯 Gestión de Materias
- ✅ Agregar y eliminar asignaturas
- 🎨 Sistema de colores personalizables por materia
- ⏱️ Configuración de carga horaria semanal
- 📊 Seguimiento de progreso por materia

### 📅 Sistema de Calendario
- 📅 Vista semanal y mensual intercambiables
- 🖱️ Interfaz intuitiva con eventos clickeables
- 💾 Persistencia local con localStorage
- 📱 Diseño responsive mobile-first

### 📈 Métricas y Seguimiento
- 📊 Progreso acumulado semanal
- ⏰ Contador de horas estudiadas por día
- 🎯 Tasa de completación de objetivos
- 🔔 Sistema de recordatorios integrado

### 🎨 Diseño Profesional
- 🔵 Paleta de colores azul profesional (#1E3A8A)
- 🟠 Acentos en naranja vibrante (#F97316)
- 📱 Interfaz móvil optimizada
- ⚡ Animaciones y transiciones suaves

## 🚀 Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado**: React Hooks + localStorage
- **Iconos**: Lucide React
- **Build**: Vite
- **PWA**: Service Worker + Web App Manifest

## 📦 Instalación y Configuración

### Prerrequisitos
- Node.js 18.0.0 o superior
- npm o yarn

### Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/studyplan-calendar.git
cd studyplan-calendar

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en el navegador
# http://localhost:8080
```

### Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo con hot reload
npm run build        # Build de producción
npm run preview      # Preview del build de producción
npm run lint         # Linter ESLint
npm run type-check   # Verificación de tipos TypeScript
```

## 🌐 Despliegue en GitHub Pages

### Configuración Automática

1. **Fork del repositorio**
```bash
# Hacer fork desde GitHub UI o clonar
git clone https://github.com/TU-USUARIO/studyplan-calendar.git
cd studyplan-calendar
```

2. **Configurar GitHub Pages**
```bash
# Crear rama gh-pages
git checkout -b gh-pages

# Build del proyecto
npm run build

# Copiar archivos de dist/ a root
cp -r dist/* .

# Commit y push
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
```

3. **Activar GitHub Pages**
- Ve a Settings → Pages en tu repositorio
- Selecciona `gh-pages` branch como source
- Tu app estará disponible en: `https://tu-usuario.github.io/studyplan-calendar`

### Script de Despliegue Automático

```bash
# Crear script deploy.sh
#!/bin/bash
npm run build
git add dist -f
git commit -m "Build for deployment"
git subtree push --prefix dist origin gh-pages
```

## 📱 Funcionalidades Detalladas

### Gestión de Materias
- **Agregar materia**: Nombre, horas semanales, color personalizado
- **Visualización**: Lista con progreso individual por materia
- **Colores**: 8 colores predefinidos para categorización visual

### Sistema de Eventos
- **Crear evento**: Vinculado a materia, fecha, hora inicio/fin
- **Completar sesión**: Marcar como completado para sumar horas
- **Vista calendario**: Eventos organizados por fecha y hora

### Métricas Inteligentes
- **Progreso semanal**: Porcentaje basado en horas objetivo vs. completadas
- **Horas diarias**: Contador de sesiones completadas por día
- **Alertas**: Notificaciones de procrastinación (próxima versión)

## 🎨 Guía de Estilos

### Paleta de Colores
```css
/* Colores Principales */
--study-primary: #1E3A8A;      /* Azul principal */
--study-primary-light: #3B82F6; /* Azul claro */
--study-accent: #F97316;        /* Naranja acento */
--study-accent-light: #EA580C;  /* Naranja oscuro */

/* Colores de Materias */
--subject-red: #EF4444;
--subject-orange: #F97316;
--subject-yellow: #EAB308;
--subject-green: #22C55E;
--subject-cyan: #06B6D4;
--subject-blue: #3B82F6;
--subject-purple: #8B5CF6;
--subject-pink: #EC4899;
```

### Tipografía
- **Fuente primaria**: Inter (Google Fonts)
- **Pesos**: 300, 400, 500, 600, 700
- **Tamaños**: Sistema responsivo con Tailwind

## 📂 Estructura del Proyecto

```
studyplan-calendar/
├── public/
│   ├── manifest.json          # PWA Manifest
│   ├── sw.js                 # Service Worker
│   └── favicon.ico
├── src/
│   ├── components/
│   │   └── ui/              # Componentes shadcn/ui
│   ├── hooks/
│   │   └── use-toast.ts     # Hook para notificaciones
│   ├── lib/
│   │   └── utils.ts         # Utilidades generales
│   ├── pages/
│   │   ├── Index.tsx        # Componente principal
│   │   └── NotFound.tsx     # Página 404
│   ├── App.tsx              # App root
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globales
├── README.md
├── package.json
└── vite.config.ts
```

## 🔧 Configuración de Desarrollo

### Variables de Entorno
```env
# .env.local
VITE_APP_NAME="StudyPlan"
VITE_APP_VERSION="1.0.0"
VITE_BASE_URL="/"
```

### Configuración de Vite
```typescript
// vite.config.ts personalizado para GitHub Pages
export default defineConfig({
  base: '/studyplan-calendar/', // Nombre del repo
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
```

## 🚧 Roadmap y Próximas Funcionalidades

- [ ] 🔔 Notificaciones push para recordatorios
- [ ] 📊 Dashboard avanzado con gráficos
- [ ] 🌙 Modo oscuro/claro toggle
- [ ] 📤 Exportar calendario a PDF/iCal
- [ ] 🔄 Sincronización en la nube
- [ ] 👥 Modo colaborativo para grupos de estudio
- [ ] 🎯 Gamificación con logros y streaks
- [ ] 📝 Notas y recursos por materia

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🙏 Reconocimientos

- **shadcn/ui** - Componentes de UI
- **Lucide React** - Iconografía
- **Tailwind CSS** - Framework de CSS
- **Vite** - Build tool moderno

## 📞 Soporte

¿Tienes preguntas o encontraste un bug?

- 🐛 [Reportar Bug](https://github.com/tu-usuario/studyplan-calendar/issues)
- 💡 [Solicitar Feature](https://github.com/tu-usuario/studyplan-calendar/issues)
- 📧 Email: soporte@studyplan.com

---

<div align="center">

**Hecho con ❤️ para estudiantes que buscan organizar mejor su tiempo**

[![Deployed on GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-blue?style=flat-square&logo=github)](https://tu-usuario.github.io/studyplan-calendar)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://choosealicense.com/licenses/mit/)
[![React](https://img.shields.io/badge/React-18.0-blue?style=flat-square&logo=react)](https://reactjs.org/)

</div>
```

Let me also update the title in the HTML to match the application:

<lov-write file_path="index.html">
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>StudyPlan - Calendario de Planificación de Estudios</title>
    <meta name="description" content="Organiza tu tiempo de estudio con nuestro calendario inteligente. Gestiona materias, programa sesiones y realiza seguimiento de tu progreso académico." />
    <meta name="author" content="StudyPlan Team" />
    <meta name="keywords" content="calendario estudios, planificación académica, organización escolar, gestión tiempo, estudiantes" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="StudyPlan - Calendario de Planificación de Estudios" />
    <meta property="og:description" content="Organiza tu tiempo de estudio con nuestro calendario inteligente. Gestiona materias, programa sesiones y realiza seguimiento de tu progreso académico." />
    <meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="StudyPlan - Calendario de Planificación de Estudios" />
    <meta name="twitter:description" content="Organiza tu tiempo de estudio con nuestro calendario inteligente." />
    <meta name="twitter:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />

    <!-- Theme Colors -->
    <meta name="theme-color" content="#1E3A8A" />
    <meta name="msapplication-TileColor" content="#1E3A8A" />
    
    <!-- Apple Touch Icon -->
    <link rel="apple-touch-icon" href="/favicon.ico" />
    
    <!-- Manifest for PWA -->
    <link rel="manifest" href="/manifest.json" />

    <!-- Preconnect to Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    
    <!-- Google Fonts - Inter for clean, readable UI -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    
    <!-- Service Worker Registration -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
              console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
              console.log('SW registration failed: ', registrationError);
            });
        });
      }
    </script>
  </body>
</html>
