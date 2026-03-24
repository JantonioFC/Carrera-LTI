import { randomUUID } from "node:crypto";
import type { SubprocessAdapter } from "../subprocess/SubprocessAdapter";

/**
 * Handlers de Docling para ipcMain.
 *
 * Traducen las llamadas IPC del renderer a operaciones del
 * SubprocessAdapter (process_document, ocr). Se inyecta el adapter
 * para facilitar testing sin dependencia de Electron.
 *
 * Ref: RFC-002 §4.4 Fase D — Issue #55
 */

export interface DoclingHandlers {
	/** Convierte un PDF/DOCX a texto estructurado. */
	processDocument(docPath: string): Promise<{ chunks: number; text: string }>;
	/** Extrae texto de una imagen via OCR. */
	ocr(imagePath: string): Promise<{ text: string }>;
}

export function makeDoclingHandlers(
	adapter: SubprocessAdapter,
): DoclingHandlers {
	return {
		async processDocument(
			docPath: string,
		): Promise<{ chunks: number; text: string }> {
			const response = await adapter.request({
				id: randomUUID(),
				action: "process_document",
				payload: { path: docPath },
			});
			const data = response.data as Record<string, unknown>;
			return {
				chunks: (data.chunks as number) ?? 0,
				text: (data.text as string) ?? "",
			};
		},

		async ocr(imagePath: string): Promise<{ text: string }> {
			const response = await adapter.request({
				id: randomUUID(),
				action: "ocr",
				payload: { path: imagePath },
			});
			const data = response.data as Record<string, unknown>;
			return { text: (data.text as string) ?? "" };
		},
	};
}
