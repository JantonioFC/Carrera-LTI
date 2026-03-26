/**
 * Tipos canónicos de Cortex compartidos entre src/ y electron/.
 *
 * AR-11 (#236): fuente única de verdad para CortexChunk.
 * Antes existían 3 definiciones idénticas:
 *   - RuVectorChunk  en src/cortex/ruvector/RuVectorAdapter.ts
 *   - CortexQueryResult en src/cortex/ui/cortexStore.ts
 *   - CortexChunk   en docs/API_IPC.md (declaración de tipos global)
 */

/** Fragmento de documento retornado por el motor de búsqueda vectorial (RuVector). */
export interface CortexChunk {
	chunkId: string;
	score: number;
	content: string;
	docId: string;
}
