# ADR-004: Uso de Web Workers para Procesamiento de Datos

## Estatus
Propuesto

## Contexto
El cálculo del grafo de conocimiento en `Aether Vault` y la búsqueda semántica entre cientos de vectores de alta dimensión pueden bloquear el hilo principal de la UI (Main Thread), degradando la experiencia premium de la aplicación.

## Decisión
Delegaremos tareas intensivas a **Web Workers**:
1. **Cálculo del Grafo**: La lógica de extracción de links (`[[link]]`) y construcción del objeto `graphData` se moverá gradualmente a un worker.
2. **Vector Search**: La comparación de similitud de coseno entre el vector de consulta y todos los vectores de notas se ejecutará en un worker para asegurar que la UI permanezca a 60fps.
3. **Lazy Ingestion**: Los embeddings se generarán en background para no interrumpir el flujo de escritura del usuario.

## Consecuencias
- **Positivas**: Interfaz fluida (流畅), mejor aprovechamiento de núcleos del CPU.
- **Neutras**: Complejidad en la comunicación vía `postMessage`.
- **Negativas**: Ninguna significativa.
