# Registro de Decisiones de Arquitectura (ADRs)

Aquí documentamos el "por qué" de nuestras decisiones técnicas más importantes.

## ADR-001: Local-First como Prioridad 1
- **Decisión**: El almacenamiento primario debe ser IndexedDB.
- **Razón**: Privacidad total y funcionamiento garantizado sin internet (especialmente importante en entornos educativos).

## ADR-002: Validación con Zod en Sincronización
- **Decisión**: Usar esquemas estrictos de Zod antes de enviar datos a la nube.
- **Razón**: Evitar "veneno de estado" donde un dispositivo sube datos corruptos que rompen los demás.

## ADR-003: Estrategia de IA con RAG Local
- **Decisión**: Generar embeddings en el cliente y solo enviar contexto filtrado.
- **Razón**: Privacidad absoluta del conocimiento del estudiante y reducción de costos de API.

## ADR-004: Widget de Gmail Flotante
- **Decisión**: Implementar un monitor de correo global que no dependa de la ruta actual.
- **Razón**: Permitir que el estudiante esté atento a comunicaciones académicas críticas mientras toma notas o edita documentos.

---
[[Guía de Desarrollo|Desarrollo]] | [[Empezando|Empezando]]
