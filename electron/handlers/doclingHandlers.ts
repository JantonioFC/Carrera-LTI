import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { SubprocessAdapter } from "../subprocess/SubprocessAdapter";
import { assertSafePath } from "./pathSecurity";

// SC-02 (#237): validación Zod de inputs IPC antes de assertSafePath
const PathInputSchema = z.string().min(1, "path must not be empty");

// AR-02 (#316): schemas para validar response.data del subproceso
const ProcessDocumentResponseSchema = z.object({
	chunks: z.number().optional().default(0),
	text: z.string().optional().default(""),
});
const OcrResponseSchema = z.object({
	text: z.string().optional().default(""),
});

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
			const validatedPath = PathInputSchema.parse(docPath);
			assertSafePath(validatedPath);
			const response = await adapter.request({
				id: randomUUID(),
				action: "process_document",
				payload: { path: validatedPath },
			});
			const data = ProcessDocumentResponseSchema.parse(response.data);
			return { chunks: data.chunks, text: data.text };
		},

		async ocr(imagePath: string): Promise<{ text: string }> {
			const validatedPath = PathInputSchema.parse(imagePath);
			assertSafePath(validatedPath);
			const response = await adapter.request({
				id: randomUUID(),
				action: "ocr",
				payload: { path: validatedPath },
			});
			const data = OcrResponseSchema.parse(response.data);
			return { text: data.text };
		},
	};
}
