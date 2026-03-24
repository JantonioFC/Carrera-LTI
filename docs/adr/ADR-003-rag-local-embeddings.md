# ADR-003: Estrategia de RAG Local y Embeddings

## Estatus
Implementado — v3.x

## Contexto
Para que el asistente IA en **Aether Vault** tenga contexto sobre las notas del usuario, se necesita un mecanismo eficiente de recuperación. Enviar todas las notas en cada prompt no escala (ventana de contexto + costo de tokens).

## Decisión
Sistema de **RAG (Retrieval Augmented Generation)** completamente local:

### Implementación actual

| Componente | Archivo | Descripción |
|---|---|---|
| Generación de embeddings | `src/utils/embeddings.ts` | `text-embedding-004` de Gemini, 768 dimensiones |
| Almacenamiento | `src/store/aetherStore.ts` (`AetherNote.embedding`) | Vector guardado en el objeto nota en IDB |
| Búsqueda semántica | `src/utils/embeddings.ts` — `findSimilarNotes()` | Cosine similarity en el frontend |
| Ingesta | `aetherStore.ingestNote()` | Genera embedding y lo persiste |
| Contexto dinámico | `src/utils/aiUtils.ts` — `buildRagContext()` | Inyecta fragmentos en el System Instruction |

### Flujo completo

```
Usuario escribe nota
  → ingestNote(id) → embeddings.ts → Gemini API → vector[768]
  → AetherNote.embedding guardado en IDB

Usuario escribe mensaje en AetherChat
  → buildRagContext(query, notes) → findSimilarNotes() → top-K notas
  → System Instruction += fragmentos recuperados
  → Gemini LLM responde con contexto personalizado
```

### Integración con Cortex (v3.x)

`cortex:index` (RuVector) indexa también documentos externos (PDF, DOCX via Docling) en un índice vectorial separado. El contexto RAG de Aether (notas personales) y el de Cortex (documentos) son complementarios.

## Consecuencias

- **Positivas**: Respuestas personalizadas con contexto del usuario, ahorro de tokens, privacidad (búsqueda 100% local).
- **Neutras**: Embedding se regenera asincrónicamente al editar una nota.
- **Negativas**: ~3KB extra por nota en IDB para el vector (despreciable a escala actual).

## Notas
- Tests completos en `src/utils/embeddings.test.ts`.
- La búsqueda vectorial de Cortex (documentos) corre en el subproceso `ruvector` (proceso separado), no en el renderer.
