# Guía de Desarrollo y Workflow

Este documento describe cómo trabajar en el código de Carrera LTI.

## 🛠️ Stack Tecnológico
- **Frontend**: React 19, TypeScript, Vite 6.
- **Estilos**: Tailwind CSS v4 para un diseño moderno y rápido.
- **Calidad de Código**: Biome.js para linting y formateo ultrarrápido.

## 🏃 Comandos del Proyecto

- `npm run dev`: Inicia el servidor de desarrollo con HMR.
- `npm run build`: Genera el bundle de producción optimizado.
- `npm run preview`: Previsualiza la build de producción.
- `npm run test`: Ejecuta la suite de pruebas con Vitest.

## 📁 Estructura de Archivos
- `src/components`: Componentes UI reutilizables.
- `src/hooks`: Lógica de negocio y hooks de estado.
- `src/pages`: Componentes de página (Lazy loaded).
- `src/store`: Definiciones de stores de Zustand.
- `src/utils`: Utilidades, esquemas de Zod y adaptadores de almacenamiento.

## 🚀 Despliegue
La aplicación está preparada para ser desplegada en **Firebase Hosting** como una **PWA (Progressive Web App)**, lo que permite su instalación en PC y móviles como si fuera una app nativa.

---
[[Sincronización en la Nube|Sincronizacion]] | [[Registro de Decisiones (ADRs)|ADRs]]
