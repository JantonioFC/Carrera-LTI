import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import type { SubprocessAdapter } from "../subprocess/SubprocessAdapter";
import { assertSafePath } from "./pathSecurity";

const QueryInputSchema = z.object({
	text: z.string().min(1).max(4096),
	topK: z.number().int().min(1).max(50).optional(),
});

/** Deriva un docId determinista del path del documento (SHA-256). */
function docIdFromPath(docPath: string): string {
	return createHash("sha256").update(docPath).digest("hex");
}

/** Detecta el mimeType a partir de la extensión del archivo. (#126) */
function mimeTypeFromPath(docPath: string): string {
	const ext = docPath.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "pdf":
			return "application/pdf";
		case "docx":
			return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
		case "txt":
			return "text/plain";
		case "md":
			return "text/markdown";
		default:
			return "application/octet-stream";
	}
}

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
			assertSafePath(docPath);
			const response = await adapter.request({
				id: randomUUID(),
				action: "index_document",
				payload: {
					docId: docIdFromPath(docPath),
					path: docPath,
					mimeType: mimeTypeFromPath(docPath),
				},
			});
			const data = response.data as Record<string, number>;
			return { chunks: data.chunks ?? 0 };
		},

		async cortexQuery(text: string, topK = 5): Promise<unknown[]> {
			const input = QueryInputSchema.parse({ text, topK });
			const response = await adapter.request({
				id: randomUUID(),
				action: "query",
				payload: { text: input.text, topK: input.topK ?? 5 },
			});
			const data = response.data as Record<string, unknown>;
			return (data.results as unknown[]) ?? [];
		},
	};
}
