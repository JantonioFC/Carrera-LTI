import { beforeEach, describe, expect, it, vi } from "vitest";
// Importamos el tipo del preload para que TypeScript detecte divergencias
// en compilación si el contrato de cortexAPI cambia. (#124)
import type { CortexAPI } from "../../../electron/types.d.ts";

/**
 * Tests de contrato del contextBridge.
 *
 * Verifican que la forma de window.cortexAPI expuesta por electron/preload.ts
 * es la correcta. Si el preload cambia la firma, estos tests fallan.
 *
 * No importamos electron directamente — el Renderer nunca debe tener
 * acceso a electron. Solo usamos el mock que simula lo que el preload expone.
 */

// Tipado contra CortexAPI garantiza que el mock siempre coincide con el preload.
function buildMockCortexAPI(): CortexAPI {
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
			processDocument: vi
				.fn<(docPath: string) => Promise<{ chunks: number; text: string }>>()
				.mockResolvedValue({ chunks: 0, text: "" }),
			ocr: vi
				.fn<(imagePath: string) => Promise<{ text: string }>>()
				.mockResolvedValue({ text: "" }),
			transcribe: vi
				.fn<
					(
						wavPath: string,
						model?: string,
					) => Promise<{ text: string; language: string }>
				>()
				.mockResolvedValue({ text: "", language: "unknown" }),
		},
		observer: {
			toggle: vi
				.fn<
					(active: boolean) => Promise<{ active: boolean; wavPath?: string }>
				>()
				.mockResolvedValue({ active: false }),
			status: vi
				.fn<() => Promise<{ active: boolean }>>()
				.mockResolvedValue({ active: false }),
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

describe("contextBridge — contrato cortexAPI.cortex (Fase D)", () => {
	let api: ReturnType<typeof buildMockCortexAPI>;

	beforeEach(() => {
		api = buildMockCortexAPI();
	});

	it("should_expose_process_document_as_function", () => {
		expect(typeof api.cortex.processDocument).toBe("function");
	});

	it("should_expose_ocr_as_function", () => {
		expect(typeof api.cortex.ocr).toBe("function");
	});

	it("should_expose_transcribe_as_function", () => {
		expect(typeof api.cortex.transcribe).toBe("function");
	});

	it("should_process_document_return_chunks_and_text", async () => {
		api.cortex.processDocument.mockResolvedValueOnce({
			chunks: 5,
			text: "contenido extraído del PDF",
		});
		const result = await api.cortex.processDocument("/docs/tesis.pdf");
		expect(result.chunks).toBe(5);
		expect(result.text).toBe("contenido extraído del PDF");
		expect(api.cortex.processDocument).toHaveBeenCalledWith("/docs/tesis.pdf");
	});

	it("should_ocr_return_extracted_text", async () => {
		api.cortex.ocr.mockResolvedValueOnce({ text: "texto de la imagen" });
		const result = await api.cortex.ocr("/imgs/captura.png");
		expect(result.text).toBe("texto de la imagen");
		expect(api.cortex.ocr).toHaveBeenCalledWith("/imgs/captura.png");
	});

	it("should_transcribe_return_text_and_language", async () => {
		api.cortex.transcribe.mockResolvedValueOnce({
			text: "hola mundo",
			language: "es",
		});
		const result = await api.cortex.transcribe("/audio/clase.wav");
		expect(result.text).toBe("hola mundo");
		expect(result.language).toBe("es");
		expect(api.cortex.transcribe).toHaveBeenCalledWith("/audio/clase.wav");
	});

	it("should_transcribe_accept_optional_model_parameter", async () => {
		await api.cortex.transcribe("/audio/clase.wav", "medium");
		expect(api.cortex.transcribe).toHaveBeenCalledWith(
			"/audio/clase.wav",
			"medium",
		);
	});
});

describe("contextBridge — contrato cortexAPI.observer (Fase E)", () => {
	let api: ReturnType<typeof buildMockCortexAPI>;

	beforeEach(() => {
		api = buildMockCortexAPI();
	});

	it("should_expose_observer_toggle_as_function", () => {
		expect(typeof api.observer.toggle).toBe("function");
	});

	it("should_expose_observer_status_as_function", () => {
		expect(typeof api.observer.status).toBe("function");
	});

	it("should_observer_toggle_true_returns_active_true", async () => {
		api.observer.toggle.mockResolvedValueOnce({ active: true });
		const result = await api.observer.toggle(true);
		expect(result.active).toBe(true);
		expect(api.observer.toggle).toHaveBeenCalledWith(true);
	});

	it("should_observer_toggle_false_returns_active_false_with_wav_path", async () => {
		api.observer.toggle.mockResolvedValueOnce({
			active: false,
			wavPath: "/recordings/recording_1234567890.wav",
		});
		const result = await api.observer.toggle(false);
		expect(result.active).toBe(false);
		expect(result.wavPath).toMatch(/\.wav$/);
	});

	it("should_observer_status_return_active_state", async () => {
		api.observer.status.mockResolvedValueOnce({ active: true });
		const result = await api.observer.status();
		expect(result.active).toBe(true);
	});
});
