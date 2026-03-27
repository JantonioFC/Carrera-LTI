import { describe, expect, it, vi } from "vitest";
import {
	ALLOWED_CONFIG_KEYS,
	initConfig,
	makeConfigHandlers,
} from "./configHandlers";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStore(initial: Record<string, string> = {}) {
	const data: Record<string, string> = { ...initial };
	return {
		set: vi.fn((key: string, value: string) => {
			data[key] = value;
		}),
		get: vi.fn((key: string) => data[key]),
		_data: data,
	};
}

const VALID_KEY = "gemini_api_key";
const INVALID_KEY = "not_a_real_key";

// ── makeConfigHandlers ────────────────────────────────────────────────────────

describe("makeConfigHandlers", () => {
	describe("configSet", () => {
		it("guarda el valor cuando la clave está en la allowlist", () => {
			const store = makeStore();
			const h = makeConfigHandlers(store);
			h.configSet(VALID_KEY, "abc123");
			expect(store.set).toHaveBeenCalledWith(VALID_KEY, "abc123");
		});

		it("lanza error si la clave no está en la allowlist", () => {
			const store = makeStore();
			const h = makeConfigHandlers(store);
			expect(() => h.configSet(INVALID_KEY, "x")).toThrow(/clave no permitida/);
			expect(store.set).not.toHaveBeenCalled();
		});

		it("acepta todas las claves definidas en ALLOWED_CONFIG_KEYS", () => {
			const store = makeStore();
			const h = makeConfigHandlers(store);
			for (const key of ALLOWED_CONFIG_KEYS) {
				expect(() => h.configSet(key, "val")).not.toThrow();
			}
		});
	});

	describe("configGet", () => {
		it("devuelve el valor almacenado para una clave válida", () => {
			const store = makeStore({ [VALID_KEY]: "stored_value" });
			const h = makeConfigHandlers(store);
			expect(h.configGet(VALID_KEY)).toBe("stored_value");
		});

		it("devuelve null si la clave válida no tiene valor", () => {
			const store = makeStore();
			const h = makeConfigHandlers(store);
			expect(h.configGet(VALID_KEY)).toBeNull();
		});

		it("lanza error si la clave no está en la allowlist", () => {
			const store = makeStore();
			const h = makeConfigHandlers(store);
			expect(() => h.configGet(INVALID_KEY)).toThrow(/clave no permitida/);
			expect(store.get).not.toHaveBeenCalled();
		});
	});
});

// ── initConfig con validación Zod ─────────────────────────────────────────────

describe("initConfig", () => {
	function makeIpcMain() {
		const handlers: Record<string, (...args: unknown[]) => unknown> = {};
		return {
			handle: vi.fn((channel: string, fn: (...args: unknown[]) => unknown) => {
				handlers[channel] = fn;
			}),
			_call: (channel: string, ...args: unknown[]) =>
				handlers[channel]?.(...args),
		};
	}

	it("registra los canales config:set y config:get", () => {
		const store = makeStore();
		const ipc = makeIpcMain();
		initConfig(store, ipc);
		expect(ipc.handle).toHaveBeenCalledWith("config:set", expect.any(Function));
		expect(ipc.handle).toHaveBeenCalledWith("config:get", expect.any(Function));
	});

	it("config:set invoca store.set con tipos válidos", () => {
		const store = makeStore();
		const ipc = makeIpcMain();
		initConfig(store, ipc);
		ipc._call("config:set", null, VALID_KEY, "api_value");
		expect(store.set).toHaveBeenCalledWith(VALID_KEY, "api_value");
	});

	it("config:set lanza ZodError si el tipo de clave no es string", () => {
		const store = makeStore();
		const ipc = makeIpcMain();
		initConfig(store, ipc);
		expect(() => ipc._call("config:set", null, 42, "val")).toThrow();
		expect(store.set).not.toHaveBeenCalled();
	});

	it("config:set lanza ZodError si la clave es string vacío", () => {
		const store = makeStore();
		const ipc = makeIpcMain();
		initConfig(store, ipc);
		expect(() => ipc._call("config:set", null, "", "val")).toThrow();
	});

	it("config:get devuelve valor correcto con tipos válidos", () => {
		const store = makeStore({ [VALID_KEY]: "secret" });
		const ipc = makeIpcMain();
		initConfig(store, ipc);
		expect(ipc._call("config:get", null, VALID_KEY)).toBe("secret");
	});

	it("config:get lanza ZodError si el tipo de clave no es string", () => {
		const store = makeStore();
		const ipc = makeIpcMain();
		initConfig(store, ipc);
		expect(() => ipc._call("config:get", null, null)).toThrow();
	});

	// Error-path: clave válida para Zod (string no vacío) pero no en la allowlist
	it("config:set lanza error si la clave pasa Zod pero no está en la allowlist", () => {
		const store = makeStore();
		const ipc = makeIpcMain();
		initConfig(store, ipc);
		expect(() =>
			ipc._call("config:set", null, "valid_string_not_in_allowlist", "val"),
		).toThrow(/clave no permitida/);
		expect(store.set).not.toHaveBeenCalled();
	});

	it("config:get lanza error si la clave pasa Zod pero no está en la allowlist", () => {
		const store = makeStore();
		const ipc = makeIpcMain();
		initConfig(store, ipc);
		expect(() =>
			ipc._call("config:get", null, "valid_string_not_in_allowlist"),
		).toThrow(/clave no permitida/);
		expect(store.get).not.toHaveBeenCalled();
	});
});
