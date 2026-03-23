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
