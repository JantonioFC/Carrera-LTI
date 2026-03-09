# ADR-003: Estrategia de RAG Local y Embeddings

## Estatus
Propuesto

## Contexto
Para mejorar las capacidades de la IA en **Aether Vault**, necesitamos que el asistente tenga contexto sobre las notas del usuario. Dado que las notas pueden ser extensas y numerosas, no es eficiente enviar todas las notas en cada prompt (problema de ventana de contexto y tokens).

## Decisión
Implementaremos un sistema de **RAG (Retrieval Augmented Generation)** con las siguientes características:
1. **Generación de Embeddings**: Utilizaremos el modelo `text-embedding-004` de Gemini para convertir el contenido de las notas en vectores de 768 dimensiones.
2. **Almacenamiento**: Los vectores se guardarán directamente en el objeto `AetherNote` dentro de `IndexedDB` (vía Zustand persist).
3. **Búsqueda Semántica**: Se implementará búsqueda por similitud de coseno (cosine similarity) en el frontend para recuperar las $k$ notas más relevantes según el prompt del usuario.
4. **Contexto Dinámico**: El `AetherChat` inyectará automáticamente los fragmentos de las notas recuperadas en el "System Instruction" antes de enviar la consulta al LLM.

## Consecuencias
- **Positivas**: Respuestas mucho más precisas y personalizadas, ahorro de tokens, mayor privacidad (la búsqueda ocurre localmente).
- **Neutras**: Necesidad de regenerar embeddings cuando una nota es editada (se hará de forma asíncrona).
- **Negativas**: Mayor uso de almacenamiento local (mínimo, ~3KB por nota para el vector).
