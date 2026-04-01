import { describe, expect, it, vi } from "vitest";
import type { SubprocessAdapter } from "../subprocess/SubprocessAdapter";
import { makeRuVectorHandlers } from "./ruVectorHandlers";

// assertSafePath llama app.getPath() de Electron, que no existe en jsdom.
// El test valida el handler, no la seguridad de paths.
vi.mock("./pathSecurity", () => ({ assertSafePath: vi.fn() }));

/**
 * Tests unitarios de makeRuVectorHandlers.
 * Se inyecta un mock de SubprocessAdapter para aislar la lógica de mapeo.
 * Ref: Issue #86 — v3.3.0 Testing Coverage
 */

function makeMockAdapter(responseData: Record<string, unknown>) {
	return {
		request: vi
			.fn()
			.mockResolvedValue({ id: "x", status: "ok", data: responseData }),
	} as unknown as SubprocessAdapter;
}

describe("ruVectorHandlers — cortexIndex", () => {
	it("envía la acción index_document al adapter", async () => {
		const adapter = makeMockAdapter({ chunks: 5 });
		const handlers = makeRuVectorHandlers(adapter);

		await handlers.cortexIndex("/docs/apunte.pdf");

		const call = (adapter.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.action).toBe("index_document");
	});

	it("incluye el path del documento en el payload", async () => {
		const adapter = makeMockAdapter({ chunks: 3 });
		const handlers = makeRuVectorHandlers(adapter);

		await handlers.cortexIndex("/docs/tesis.pdf");

		const call = (adapter.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.payload.path).toBe("/docs/tesis.pdf");
	});

	it("incluye mimeType application/pdf en el payload", async () => {
		const adapter = makeMockAdapter({ chunks: 2 });
		const handlers = makeRuVectorHandlers(adapter);

		await handlers.cortexIndex("/docs/lectura.pdf");

		const call = (adapter.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.payload.mimeType).toBe("application/pdf");
	});

	it("retorna el número de chunks de la respuesta", async () => {
		const adapter = makeMockAdapter({ chunks: 42 });
		const handlers = makeRuVectorHandlers(adapter);

		const result = await handlers.cortexIndex("/docs/apunte.pdf");
		expect(result.chunks).toBe(42);
	});

	it("retorna chunks=0 si la respuesta no contiene chunks", async () => {
		const adapter = makeMockAdapter({});
		const handlers = makeRuVectorHandlers(adapter);

		const result = await handlers.cortexIndex("/docs/vacio.pdf");
		expect(result.chunks).toBe(0);
	});
});

describe("ruVectorHandlers — cortexQuery", () => {
	it("envía la acción query al adapter", async () => {
		const adapter = makeMockAdapter({ results: [] });
		const handlers = makeRuVectorHandlers(adapter);

		await handlers.cortexQuery("álgebra lineal");

		const call = (adapter.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.action).toBe("query");
	});

	it("incluye el texto de consulta en el payload", async () => {
		const adapter = makeMockAdapter({ results: [] });
		const handlers = makeRuVectorHandlers(adapter);

		await handlers.cortexQuery("derivadas parciales");

		const call = (adapter.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.payload.text).toBe("derivadas parciales");
	});

	it("usa topK=5 por defecto", async () => {
		const adapter = makeMockAdapter({ results: [] });
		const handlers = makeRuVectorHandlers(adapter);

		await handlers.cortexQuery("integrales");

		const call = (adapter.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.payload.topK).toBe(5);
	});

	it("respeta el topK personalizado", async () => {
		const adapter = makeMockAdapter({ results: [] });
		const handlers = makeRuVectorHandlers(adapter);

		await handlers.cortexQuery("vectores", 10);

		const call = (adapter.request as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.payload.topK).toBe(10);
	});

	it("retorna los resultados de la respuesta", async () => {
		const chunks = [{ text: "chunk A" }, { text: "chunk B" }];
		const adapter = makeMockAdapter({ results: chunks });
		const handlers = makeRuVectorHandlers(adapter);

		const result = await handlers.cortexQuery("matrices");
		expect(result).toEqual(chunks);
	});

	it("retorna [] si la respuesta no contiene results", async () => {
		const adapter = makeMockAdapter({});
		const handlers = makeRuVectorHandlers(adapter);

		const result = await handlers.cortexQuery("sin resultados");
		expect(result).toEqual([]);
	});
});

describe("ruVectorHandlers — validación de inputs (TS-03)", () => {
	it("cortexQuery_rechaza_texto_vacio", async () => {
		const adapter = makeMockAdapter({ results: [] });
		const handlers = makeRuVectorHandlers(adapter);

		await expect(handlers.cortexQuery("")).rejects.toThrow();
	});

	it("cortexQuery_rechaza_topK_cero", async () => {
		const adapter = makeMockAdapter({ results: [] });
		const handlers = makeRuVectorHandlers(adapter);

		await expect(handlers.cortexQuery("integrales", 0)).rejects.toThrow();
	});

	it("cortexQuery_rechaza_topK_mayor_50", async () => {
		const adapter = makeMockAdapter({ results: [] });
		const handlers = makeRuVectorHandlers(adapter);

		await expect(handlers.cortexQuery("integrales", 51)).rejects.toThrow();
	});

	it("cortexIndex_rechaza_path_vacio", async () => {
		const adapter = makeMockAdapter({ chunks: 0 });
		const handlers = makeRuVectorHandlers(adapter);

		await expect(handlers.cortexIndex("")).rejects.toThrow();
	});

	it("cortexIndex_rechaza_path_mayor_4096_chars", async () => {
		const adapter = makeMockAdapter({ chunks: 0 });
		const handlers = makeRuVectorHandlers(adapter);
		const longPath = `/docs/${"a".repeat(4092)}`;

		await expect(handlers.cortexIndex(longPath)).rejects.toThrow();
	});

	it("cortexQuery_lanza_si_respuesta_no_es_objeto", async () => {
		const adapter = {
			request: vi.fn().mockResolvedValue({ id: "x", status: "ok", data: null }),
		} as unknown as SubprocessAdapter;
		const handlers = makeRuVectorHandlers(adapter);

		await expect(handlers.cortexQuery("test")).rejects.toThrow();
	});
});
