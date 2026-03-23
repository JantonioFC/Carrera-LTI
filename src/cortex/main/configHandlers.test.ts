import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeConfigHandlers } from "../../../electron/handlers/configHandlers";

// Mock de electron-store: interfaz mínima que usan los handlers
function makeMockStore(initialData: Record<string, string> = {}) {
	const data = { ...initialData };
	return {
		set: vi.fn((key: string, value: string) => {
			data[key] = value;
		}),
		get: vi.fn((key: string) => data[key]),
		has: vi.fn((key: string) => key in data),
		delete: vi.fn((key: string) => {
			delete data[key];
		}),
	};
}

describe("configHandlers — config:set", () => {
	let store: ReturnType<typeof makeMockStore>;
	let handlers: ReturnType<typeof makeConfigHandlers>;

	beforeEach(() => {
		store = makeMockStore();
		handlers = makeConfigHandlers(store);
	});

	it("should_store_key_value_pair", () => {
		handlers.configSet("llm_api_key", "sk-test-123");
		expect(store.set).toHaveBeenCalledWith("llm_api_key", "sk-test-123");
	});

	it("should_overwrite_existing_key", () => {
		handlers.configSet("llm_api_key", "sk-old");
		handlers.configSet("llm_api_key", "sk-new");
		expect(store.set).toHaveBeenLastCalledWith("llm_api_key", "sk-new");
	});

	it("should_not_log_value_to_avoid_key_leak", () => {
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		handlers.configSet("llm_api_key", "sk-secret");
		const calls = consoleSpy.mock.calls.join(" ");
		expect(calls).not.toContain("sk-secret");
		consoleSpy.mockRestore();
	});
});

describe("configHandlers — config:get", () => {
	let store: ReturnType<typeof makeMockStore>;
	let handlers: ReturnType<typeof makeConfigHandlers>;

	beforeEach(() => {
		store = makeMockStore({ llm_api_key: "sk-test-123" });
		handlers = makeConfigHandlers(store);
	});

	it("should_return_stored_value", () => {
		const result = handlers.configGet("llm_api_key");
		expect(result).toBe("sk-test-123");
	});

	it("should_return_null_for_missing_key", () => {
		const result = handlers.configGet("nonexistent");
		expect(result).toBeNull();
	});

	it("should_return_null_not_undefined_for_missing_key", () => {
		const result = handlers.configGet("missing");
		expect(result).not.toBeUndefined();
		expect(result).toBeNull();
	});
});
