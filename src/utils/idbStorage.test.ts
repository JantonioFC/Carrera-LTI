import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Mock idb-keyval ---
const idbStore = new Map<string, unknown>();

vi.mock("idb-keyval", () => ({
	get: vi.fn(async (key: string) => idbStore.get(key) ?? undefined),
	set: vi.fn(async (key: string, value: unknown) => {
		idbStore.set(key, value);
	}),
	del: vi.fn(async (key: string) => {
		idbStore.delete(key);
	}),
}));

// --- Mock security ---
vi.mock("./security", () => ({
	obfuscate: vi.fn(async (str: string) => `obf:${str}`),
	deobfuscate: vi.fn(async (str: string) => {
		if (!str) return str;
		if (str.startsWith("obf:")) return str.slice(4);
		return str;
	}),
}));

// --- Mock logger ---
vi.mock("./logger", () => ({
	logger: {
		error: vi.fn(),
		warn: vi.fn(),
		info: vi.fn(),
	},
}));

// Import AFTER mocks are declared
import { idbStorage } from "./idbStorage";

describe("idbStorage", () => {
	beforeEach(() => {
		idbStore.clear();
		localStorage.clear();
		sessionStorage.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		localStorage.clear();
		sessionStorage.clear();
	});

	describe("setItem", () => {
		it("guarda el valor obfuscado en IDB", async () => {
			const { set } = await import("idb-keyval");
			const { obfuscate } = await import("./security");

			await idbStorage.setItem("my-key", "my-value");

			expect(obfuscate).toHaveBeenCalledWith("my-value");
			expect(set).toHaveBeenCalledWith("my-key", "obf:my-value");
			expect(idbStore.get("my-key")).toBe("obf:my-value");
		});
	});

	describe("getItem", () => {
		it("recupera y deobfusca el valor correcto", async () => {
			idbStore.set("my-key", "obf:hello-world");

			const result = await idbStorage.getItem("my-key");

			expect(result).toBe("hello-world");
		});

		it("retorna null para una clave inexistente", async () => {
			const result = await idbStorage.getItem("clave-que-no-existe");

			expect(result).toBeNull();
		});
	});

	describe("removeItem", () => {
		it("elimina la clave de IDB", async () => {
			const { del } = await import("idb-keyval");
			idbStore.set("my-key", "obf:some-value");

			await idbStorage.removeItem("my-key");

			expect(del).toHaveBeenCalledWith("my-key");
			expect(idbStore.has("my-key")).toBe(false);
		});
	});

	describe("migración automática desde localStorage para aether-storage", () => {
		it("migra lti_aether_vault de localStorage a IDB y limpia las claves legacy", async () => {
			const notes = [{ id: "1", title: "Test note" }];
			localStorage.setItem("lti_aether_vault", JSON.stringify(notes));

			const result = await idbStorage.getItem("aether-storage");

			expect(result).not.toBeNull();
			const parsed = JSON.parse(result as string);
			expect(parsed.state.notes).toEqual(notes);
			expect(parsed.state.geminiApiKey).toBe("");
			expect(parsed.state.chatHistory).toEqual([]);
			expect(parsed.version).toBe(0);

			// Las claves legacy deben haber sido eliminadas
			expect(localStorage.getItem("lti_aether_vault")).toBeNull();
			expect(localStorage.getItem("lti_aether_chat")).toBeNull();
		});

		it("migra lti_aether_vault y lti_aether_chat juntas", async () => {
			const notes = [{ id: "1", title: "Nota" }];
			const chatHistory = [{ role: "user", content: "Hola" }];
			localStorage.setItem("lti_aether_vault", JSON.stringify(notes));
			localStorage.setItem("lti_aether_chat", JSON.stringify(chatHistory));

			const result = await idbStorage.getItem("aether-storage");

			expect(result).not.toBeNull();
			const parsed = JSON.parse(result as string);
			expect(parsed.state.notes).toEqual(notes);
			expect(parsed.state.chatHistory).toEqual(chatHistory);

			expect(localStorage.getItem("lti_aether_vault")).toBeNull();
			expect(localStorage.getItem("lti_aether_chat")).toBeNull();
		});

		it("no migra cuando no hay claves legacy en localStorage", async () => {
			const result = await idbStorage.getItem("aether-storage");

			expect(result).toBeNull();
		});

		it("no dispara migración para claves que no sean aether-storage", async () => {
			localStorage.setItem("lti_aether_vault", JSON.stringify(["data"]));

			const result = await idbStorage.getItem("otra-clave");

			expect(result).toBeNull();
			// Las claves legacy no deben tocarse
			expect(localStorage.getItem("lti_aether_vault")).not.toBeNull();
		});

		it("no migra si el valor ya existe en IDB para aether-storage", async () => {
			idbStore.set("aether-storage", 'obf:{"state":{},"version":1}');
			localStorage.setItem("lti_aether_vault", JSON.stringify([{ id: "old" }]));

			const result = await idbStorage.getItem("aether-storage");

			// Debe retornar el valor de IDB, no el migrado
			expect(result).toBe('{"state":{},"version":1}');
			// No debe haber limpiado localStorage si no migró
			expect(localStorage.getItem("lti_aether_vault")).not.toBeNull();
		});
	});
});
