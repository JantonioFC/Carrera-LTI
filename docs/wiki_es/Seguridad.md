# Seguridad, Validación y Privacidad de IA

La integridad de los datos y la privacidad del usuario son pilares innegociables en Carrera LTI.

## 🛡️ Validación con Zod
Utilizamos **Zod** para crear una "Capa de Validación" en todas las fronteras de confianza del sistema.

### ¿Por qué validamos?
- **Recuperación de Datos**: Para evitar que datos corruptos en el almacenamiento local rompan la aplicación.
- **Sincronización en la Nube**: Para garantizar que lo que subimos a Firebase cumple estrictamente con el esquema esperado.
- **Tipado Fuerte**: Casi todos nuestros esquemas de Zod generan automáticamente tipos de TypeScript (`z.infer<typeof schema>`).

## 🧠 Privacidad en Inteligencia Artificial
A diferencia de otras apps, Carrera LTI protege tu privacidad mediante **RAG Local**.

### El proceso de "Fuga Zero":
1.  **Embeddings Locales**: Tus notas se convierten en vectores numéricos dentro de tu navegador.
2.  **Búsqueda Semántica**: La búsqueda de "contexto" ocurre en tu dispositivo.
3.  **Prompt Enriquecido**: Solo los fragmentos de texto relevantes se envían a la API remota. Tus documentos completos nunca salen de tu control.

---
[[Persistencia de Datos|Persistencia]] | [[Dominio Académico|Academico]]
