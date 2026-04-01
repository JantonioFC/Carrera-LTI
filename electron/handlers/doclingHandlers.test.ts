import { describe, expect, it, vi } from "vitest";
import type { SubprocessAdapter } from "../subprocess/SubprocessAdapter";
import { makeDoclingHandlers } from "./doclingHandlers";

// assertSafePath llama app.getPath() de Electron que no existe en jsdom.
// El test valida el handler, no la seguridad de paths.
vi.mock("./pathSecurity", () => ({ assertSafePath: vi.fn() }));

import { assertSafePath } from "./pathSecurity";

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

describe("doclingHandlers — validación de inputs (TS-03)", () => {
	it("processDocument_rechaza_path_vacio", async () => {
		const adapter = makeMockAdapter({});
		const handlers = makeDoclingHandlers(adapter);

		await expect(handlers.processDocument("")).rejects.toThrow();
	});

	it("ocr_rechaza_path_vacio", async () => {
		const adapter = makeMockAdapter({});
		const handlers = makeDoclingHandlers(adapter);

		await expect(handlers.ocr("")).rejects.toThrow();
	});

	it("processDocument_propagates_assertSafePath_error", async () => {
		vi.mocked(assertSafePath).mockImplementationOnce(() => {
			throw new Error("path traversal detectado");
		});
		const adapter = makeMockAdapter({});
		const handlers = makeDoclingHandlers(adapter);

		await expect(handlers.processDocument("/etc/passwd")).rejects.toThrow(
			/path traversal/i,
		);
	});

	it("processDocument_usa_defaults_si_faltan_campos_en_respuesta", async () => {
		const adapter = makeMockAdapter({});
		const handlers = makeDoclingHandlers(adapter);

		const result = await handlers.processDocument("/docs/test.pdf");
		expect(result.chunks).toBe(0);
		expect(result.text).toBe("");
	});

	it("processDocument_lanza_si_respuesta_no_es_objeto", async () => {
		const adapter = {
			request: vi.fn().mockResolvedValue({ id: "x", status: "ok", data: null }),
		} as unknown as SubprocessAdapter;
		const handlers = makeDoclingHandlers(adapter);

		await expect(handlers.processDocument("/docs/test.pdf")).rejects.toThrow();
	});
});
