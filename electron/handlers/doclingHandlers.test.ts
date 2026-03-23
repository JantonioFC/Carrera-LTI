import { describe, expect, it, vi } from "vitest";
import type { SubprocessAdapter } from "../../src/cortex/subprocess/SubprocessAdapter";
import { makeDoclingHandlers } from "./doclingHandlers";

/**
 * Tests unitarios de makeDoclingHandlers.
 * Se inyecta un mock de SubprocessAdapter para aislar la lógica de mapeo.
 * Ref: Issue #55 — Fase D
 */

function makeMockAdapter(responseData: Record<string, unknown>) {
	return {
		request: vi
			.fn()
			.mockResolvedValue({ id: "x", status: "ok", data: responseData }),
	} as unknown as SubprocessAdapter;
}

describe("doclingHandlers — processDocument", () => {
	it("should_send_process_document_action", async () => {
		const adapter = makeMockAdapter({ chunks: 3, text: "contenido del PDF" });
		const handlers = makeDoclingHandlers(adapter);

		await handlers.processDocument("/docs/tesis.pdf");

		const call = (adapter.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.action).toBe("process_document");
		expect(call.payload.path).toBe("/docs/tesis.pdf");
	});

	it("should_return_chunks_count", async () => {
		const adapter = makeMockAdapter({ chunks: 7, text: "texto largo" });
		const handlers = makeDoclingHandlers(adapter);

		const result = await handlers.processDocument("/docs/tesis.pdf");
		expect(result.chunks).toBe(7);
	});

	it("should_return_extracted_text", async () => {
		const adapter = makeMockAdapter({
			chunks: 1,
			text: "texto extraído del documento",
		});
		const handlers = makeDoclingHandlers(adapter);

		const result = await handlers.processDocument("/docs/doc.pdf");
		expect(result.text).toBe("texto extraído del documento");
	});
});

describe("doclingHandlers — ocr", () => {
	it("should_send_ocr_action", async () => {
		const adapter = makeMockAdapter({ text: "texto de imagen" });
		const handlers = makeDoclingHandlers(adapter);

		await handlers.ocr("/imgs/captura.png");

		const call = (adapter.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.action).toBe("ocr");
		expect(call.payload.path).toBe("/imgs/captura.png");
	});

	it("should_return_ocr_text", async () => {
		const adapter = makeMockAdapter({ text: "texto extraído por OCR" });
		const handlers = makeDoclingHandlers(adapter);

		const result = await handlers.ocr("/imgs/slide.png");
		expect(result.text).toBe("texto extraído por OCR");
	});
});
