import { randomUUID } from "node:crypto";
import type { SubprocessAdapter } from "../../src/cortex/subprocess/SubprocessAdapter";

/**
 * Handlers de RuVector para ipcMain.
 *
 * Traducen las llamadas IPC del renderer a operaciones del
 * SubprocessAdapter (index_document, query). Se inyecta el adapter
 * para facilitar testing sin dep de Electron.
 *
 * Ref: RFC-002 §4.4 Fase C — Issue #53
 */

export interface RuVectorHandlers {
	/** Indexa un documento en RuVector. Devuelve el número de chunks. */
	cortexIndex(docPath: string): Promise<{ chunks: number }>;
	/** Ejecuta una consulta semántica. Devuelve los chunks relevantes. */
	cortexQuery(text: string, topK?: number): Promise<unknown[]>;
}

export function makeRuVectorHandlers(
	adapter: SubprocessAdapter,
): RuVectorHandlers {
	return {
		async cortexIndex(docPath: string): Promise<{ chunks: number }> {
			const response = await adapter.request({
				id: randomUUID(),
				action: "index_document",
				payload: {
					docId: randomUUID(),
					path: docPath,
					mimeType: "application/pdf",
				},
			});
			const data = response.data as Record<string, number>;
			return { chunks: data.chunks ?? 0 };
		},

		async cortexQuery(text: string, topK = 5): Promise<unknown[]> {
			const response = await adapter.request({
				id: randomUUID(),
				action: "query",
				payload: { text, topK },
			});
			const data = response.data as Record<string, unknown>;
			return (data.results as unknown[]) ?? [];
		},
	};
}
