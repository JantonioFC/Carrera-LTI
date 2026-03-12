# Nexus Workspace

Nexus es el entorno de productividad inteligente de Carrera LTI, diseñado para la creación de documentos y el análisis de datos.

## 📝 Editor de Bloques (NexusWorkspace)
Implementado con **BlockNote**, ofrece una experiencia similar a Notion:
- **Estructura jerárquica**: Títulos, listas, bloques de código y tablas.
- **Localización**: Totalmente traducido al castellano para una experiencia nativa.
- **Persistencia CRDT**: Cada documento se guarda como un `Y.Doc`, permitiendo la edición concurrente sin pérdida de datos.

## 📊 Bases de Datos (NexusDB)
Permite crear tablas relacionales personalizadas dentro de la aplicación.
- **Tipos de Campo**: Texto, números, fechas y selectores.
- **Integración**: Los datos de las bases de datos pueden ser utilizados como contexto por la IA.

## 🤖 NexusAI: Análisis Multifuente
NexusAI es la herramienta definitiva para entender tu propio ecosistema de datos.
- **Sistema de Contexto**: Puede "leer" simultáneamente tus notas de Aether y tus documentos de Nexus.
- **Límite de Contexto**: Optimizado para manejar hasta 40,000 caracteres de contexto local para alimentar a Gemini.

---
[[Aether: Segundo Cerebro|Aether]] | [[Sincronización en la Nube|Sincronizacion]]
