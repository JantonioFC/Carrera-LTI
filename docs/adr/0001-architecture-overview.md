# 0001: Arquitectura Unificada (Aether + Nexus)

## Estado
Aceptado

## Contexto
El sistema "Carrera LTI" comenzó como un dashboard para un estudiante, pero creció para incluir módulos avanzados como Aether (Segundo Cerebro) y Nexus (Editor de Bloques y Base de Datos). Necesitábamos una forma de organizar estas herramientas que fuera escalable y fácil de mantener.

## Decisión
- **Enfoque Modular**: Separamos el proyecto en áreas claramente diferenciadas (Dashboard, Calendario, Tareas, Aether, Nexus).
- **Gestión de Estado**: Usamos Zustand o Contextos nativos de React (para Aether y Nexus) con un `useReducer` interno planeado para manejar actualizaciones complejas sin side effects.
- **Sincronización Cloud**: Se usa Firebase Firestore para respaldos incrementales/manuales, en lugar de sincronización en tiempo real, priorizando el rendimiento offline y offline-first architecture con `localStorage` y local IndexedDB + Yjs (para Nexus).
- **IA**: Integración local de Gemini (`@google/genai`) usando la API key del usuario guardada en cliente para no incurrir en costos de servidor.

## Consecuencias
- **Positivas**: La app puede correr 100% offline y de forma gratuita para el usuario. Es altamente responsiva ya que todo está en memoria/localStorage.
- **Negativas**: Si el usuario no sincroniza manualmente o borra el caché del navegador sin un respaldo en la nube, podría perder los datos de Aether o la configuración local de Firebase. El límite de tamaño de localStorage (~5MB) restringe la cantidad de notas de texto simple.

## Notas
Las bases de datos avanzadas como Nexus usan IndexedDB para sortear las limitaciones de `localStorage`, permitiendo gran almacenamiento.
