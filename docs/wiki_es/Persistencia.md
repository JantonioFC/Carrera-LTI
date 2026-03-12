# Persistencia de Datos (Local-First)

Carrera LTI sigue los principios de una aplicación **Local-First**, donde el navegador es la fuente de verdad y la nube es un espejo opcional.

## 💾 Estrategia de Almacenamiento Multinivel

| Tecnología | Dominios | Características |
| :--- | :--- | :--- |
| **IndexedDB (Dexie)** | Aether (Notas), Nexus (Base de Datos) | Gran capacidad, transacciones seguras, asíncrono. |
| **Yjs + IndexedDB** | Nexus (Documentos) | CRDT para edición sin conflictos y multi-pestaña. |
| **localStorage** | Tareas, Horarios, Configuración | Síncrono, persistente, ideal para datos ligeros. |

## 🏗️ Adaptador Personalizado (idbStorage)
Para que Zustand pudiera escribir en IndexedDB (que es asíncrono), implementamos un adaptador personalizado en `src/utils/idbStorage.ts`. Esto permite:
- **Serialización Automática**: Manejo de objetos complejos y vectores de IA.
- **Tolerancia a Fallos**: Si IndexedDB falla (ej. navegación privada), el sistema cae con gracia a un modo de solo memoria.

## 🤝 Resolución de Conflictos (CRDT)
Los documentos de Nexus utilizan **Yjs**. Esto significa que aunque abras la aplicación en cuatro pestañas diferentes, todos los cambios se fusionan matemáticamente sin borrar el trabajo de los demás, incluso sin internet.

---
[[Estado|Estado]] | [[Seguridad y Privacidad|Seguridad]]
