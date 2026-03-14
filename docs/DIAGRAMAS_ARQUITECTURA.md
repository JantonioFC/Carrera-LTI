# Diagramas de Arquitectura - Carrera LTI

Este documento detalla visualmente los procesos críticos de seguridad y flujo de datos dentro del ecosistema Carrera LTI.

## 1. Seguridad de Datos (Local-First AES-256)
Carrera LTI utiliza cifrado simétrico AES-256 para asegurar que los datos sensibles del estudiante nunca salgan del dispositivo en texto plano.

```mermaid
sequenceDiagram
    participant U as Usuario
    participant S as Store (Aether)
    participant K as Key Manager
    participant L as LocalStorage/SQLite
    participant F as Firebase (Cloud Sync)

    U->>S: Ingresa datos sensibles (Notas/Materias)
    S->>K: Solicita Master Key (Derivada de Passphrase)
    K-->>S: Retorna clave AES-256
    S->>S: Cifra datos (Encrypt)
    S->>L: Guarda datos cifrados
    S->>F: Sincroniza datos cifrados (End-to-End Encrypted)
    F-->>U: Datos seguros en la nube
```

## 2. Flujo Nexus AI (RAG - Retrieval Augmented Generation)
Nexus utiliza un motor de recuperación para contextualizar las respuestas de la IA con la información académica del usuario.

```mermaid
graph TD
    A[Consulta del Usuario] --> B{Nexus AI Router}
    B --> C[Búsqueda Semántica en Aether]
    B --> D[Metadatos de Carrera - Malla Curricular]
    C --> E[Vector Retrieval]
    D --> E
    E --> F[Prompt Contextualizado]
    F --> G[Google Gemini API]
    G --> H[Respuesta Inteligente]
    H --> I[Usuario]
```

## 3. Flujo de Configuración (Setup Wizard)
El proceso automatizado de onboarding mediante el CLI.

```mermaid
graph LR
    Start([npm run setup]) --> NodeCheck{Versión Node >= 18?}
    NodeCheck -- No --> Exit([Error & Exit])
    NodeCheck -- Sí --> DepCheck{node_modules?}
    DepCheck -- No --> Install[npm install]
    DepCheck -- Sí --> EnvCheck{Existe .env?}
    EnvCheck -- Sí --> Backup[Backup .env]
    EnvCheck -- No --> NewEnv[Crear .env desde .example]
    Backup --> Prompts[Solicitar Keys: Gemini, Gmail, Firebase]
    NewEnv --> Prompts
    Prompts --> Save[Guardar .env & .gitignore]
    Save --> Dev([npm run dev])
```
