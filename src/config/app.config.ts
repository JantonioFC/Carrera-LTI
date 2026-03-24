/**
 * Constantes de configuración de la app — fuente de verdad para magic numbers (#77).
 * Importar desde aquí en lugar de hardcodear valores.
 */

/** IPC / Subprocesos */
export const IPC_TIMEOUT_MS = 30_000;
export const IPC_MAX_PENDING = 100;

/** AI / LLM */
export const AI_CONTEXT_MAX_CHARS = 30_000;
export const AI_RETRY_BASE_MS = 1_000;
export const AI_SEMANTIC_TOP_K = 5;

/** UI — debounce / timers */
export const SEARCH_DEBOUNCE_MS = 150;
export const GRAPH_RESIZE_DELAY_MS = 100;

/** Build / chunks */
export const PWA_MAX_CACHE_BYTES = 3 * 1024 * 1024; // 3 MB

/** Datos académicos */
export const DOCLING_CHUNK_SIZE_WORDS = 500;
