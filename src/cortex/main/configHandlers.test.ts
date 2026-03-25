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

	it("should_reject_key_not_in_allowlist", () => {
		expect(() => handlers.configSet("__proto__", "evil")).toThrow(
			/clave no permitida/,
		);
	});

	it("should_reject_another_unknown_key", () => {
		expect(() => handlers.configSet("admin_password", "hunter2")).toThrow(
			/clave no permitida/,
		);
	});

	it("should_not_call_store_set_for_disallowed_key", () => {
		try {
			handlers.configSet("unknown_key", "value");
		} catch {
			// expected
		}
		expect(store.set).not.toHaveBeenCalled();
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
		// gemini_api_key está en la allowlist pero no en el store mock
		const result = handlers.configGet("gemini_api_key");
		expect(result).toBeNull();
	});

	it("should_return_null_not_undefined_for_missing_key", () => {
		// gmail_client_id está en la allowlist pero no en el store mock
		const result = handlers.configGet("gmail_client_id");
		expect(result).not.toBeUndefined();
		expect(result).toBeNull();
	});

	it("should_reject_key_not_in_allowlist", () => {
		expect(() => handlers.configGet("../../etc/passwd")).toThrow(
			/clave no permitida/,
		);
	});

	it("should_reject_another_unknown_key", () => {
		expect(() => handlers.configGet("secret_token")).toThrow(
			/clave no permitida/,
		);
	});

	it("should_not_call_store_get_for_disallowed_key", () => {
		try {
			handlers.configGet("injected_key");
		} catch {
			// expected
		}
		expect(store.get).not.toHaveBeenCalled();
	});
});
