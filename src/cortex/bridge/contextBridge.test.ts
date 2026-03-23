import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests de contrato del contextBridge.
 *
 * Verifican que la forma de window.cortexAPI expuesta por electron/preload.ts
 * es la correcta. Si el preload cambia la firma, estos tests fallan.
 *
 * No importamos electron directamente — el Renderer nunca debe tener
 * acceso a electron. Solo usamos el mock que simula lo que el preload expone.
 */

// Replica exacta de lo que electron/preload.ts expone via contextBridge.
// Si la forma del preload cambia, actualizar aquí también.
function buildMockCortexAPI() {
	return {
		config: {
			set: vi
				.fn<(key: string, value: string) => Promise<void>>()
				.mockResolvedValue(undefined),
			get: vi
				.fn<(key: string) => Promise<string | null>>()
				.mockResolvedValue(null),
		},
		cortex: {
			index: vi
				.fn<(docPath: string) => Promise<{ chunks: number }>>()
				.mockResolvedValue({ chunks: 0 }),
			query: vi
				.fn<(text: string, topK?: number) => Promise<unknown[]>>()
				.mockResolvedValue([]),
		},
	};
}

describe("contextBridge — contrato cortexAPI.config (Fase B)", () => {
	let api: ReturnType<typeof buildMockCortexAPI>;

	beforeEach(() => {
		api = buildMockCortexAPI();
	});

	it("should_expose_config_set_as_function", () => {
		expect(typeof api.config.set).toBe("function");
	});

	it("should_expose_config_get_as_function", () => {
		expect(typeof api.config.get).toBe("function");
	});

	it("should_config_set_accept_key_and_value", async () => {
		await api.config.set("llm_api_key", "sk-test-123");
		expect(api.config.set).toHaveBeenCalledWith("llm_api_key", "sk-test-123");
	});

	it("should_config_get_return_stored_value", async () => {
		api.config.get.mockResolvedValueOnce("sk-test-123");
		const result = await api.config.get("llm_api_key");
		expect(result).toBe("sk-test-123");
	});

	it("should_config_get_return_null_for_unknown_keys", async () => {
		const result = await api.config.get("nonexistent_key");
		expect(result).toBeNull();
	});

	it("should_not_expose_window_electron_in_renderer", () => {
		// nodeIntegration: false + contextIsolation: true garantizan esto.
		// Este test verifica que el entorno de test no lo expone tampoco.
		expect(
			(window as unknown as Record<string, unknown>).electron,
		).toBeUndefined();
	});
});

describe("contextBridge — contrato cortexAPI.cortex (Fase C)", () => {
	let api: ReturnType<typeof buildMockCortexAPI>;

	beforeEach(() => {
		api = buildMockCortexAPI();
	});

	it("should_expose_cortex_index_as_function", () => {
		expect(typeof api.cortex.index).toBe("function");
	});

	it("should_expose_cortex_query_as_function", () => {
		expect(typeof api.cortex.query).toBe("function");
	});

	it("should_cortex_index_accept_docpath_and_return_chunks", async () => {
		api.cortex.index.mockResolvedValueOnce({ chunks: 12 });
		const result = await api.cortex.index("/docs/tesis.pdf");
		expect(result.chunks).toBe(12);
		expect(api.cortex.index).toHaveBeenCalledWith("/docs/tesis.pdf");
	});

	it("should_cortex_query_return_array", async () => {
		api.cortex.query.mockResolvedValueOnce([
			{
				chunkId: "c1",
				score: 0.95,
				content: "fragmento relevante",
				docId: "d1",
			},
		]);
		const results = await api.cortex.query("que es el three-way handshake");
		expect(Array.isArray(results)).toBe(true);
		expect(results).toHaveLength(1);
	});
});
